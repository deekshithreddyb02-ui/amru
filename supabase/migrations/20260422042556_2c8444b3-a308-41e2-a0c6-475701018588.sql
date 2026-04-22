
-- ============================================================
-- Phase 4: Support tickets + HydroGeo enquiries + auto-creation
-- ============================================================

-- 1) Add enquiry_type to contact_messages so public form can flag 'support' / 'hydrogeo'
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS enquiry_type text NOT NULL DEFAULT 'lead';

-- 2) Support tickets table
CREATE TABLE IF NOT EXISTS public.crm_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  source_enquiry_id uuid REFERENCES public.contact_messages(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.crm_organizations(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  assigned_to uuid,
  created_by uuid,
  subject text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',           -- general | technical | billing | warranty | hydrogeo | other
  priority text NOT NULL DEFAULT 'medium',            -- low | medium | high | urgent
  status text NOT NULL DEFAULT 'open',                -- open | in_progress | waiting_customer | resolved | closed
  resolution_notes text,
  customer_name text,
  customer_email text,
  customer_phone text,
  due_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_workspace ON public.crm_support_tickets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status    ON public.crm_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned  ON public.crm_support_tickets(assigned_to);

ALTER TABLE public.crm_support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view tickets"
  ON public.crm_support_tickets FOR SELECT
  USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members create tickets"
  ON public.crm_support_tickets FOR INSERT
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members update tickets"
  ON public.crm_support_tickets FOR UPDATE
  USING (public.is_crm_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "CRM admins delete tickets"
  ON public.crm_support_tickets FOR DELETE
  USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));

CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.crm_support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) HydroGeo enquiries table (borewell-specific data)
CREATE TABLE IF NOT EXISTS public.crm_hydrogeo_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  source_enquiry_id uuid REFERENCES public.contact_messages(id) ON DELETE SET NULL,
  created_by uuid,
  site_name text,
  site_address text,
  site_city text,
  site_state text,
  site_pincode text,
  latitude numeric,
  longitude numeric,
  area_size text,                  -- e.g. "5 acres", "1200 sqft"
  terrain_type text,               -- rocky | hilly | plain | coastal | urban | other
  soil_type text,                  -- sandy | clay | loam | rocky | mixed | unknown
  expected_depth_ft numeric,
  num_scans integer,
  water_source_type text,          -- borewell | open_well | recharge_pit | other
  estimated_cost numeric,
  preferred_visit_date date,
  survey_status text NOT NULL DEFAULT 'pending',   -- pending | scheduled | in_progress | completed | cancelled
  survey_findings text,
  recommendation text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hydrogeo_workspace ON public.crm_hydrogeo_enquiries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_hydrogeo_lead      ON public.crm_hydrogeo_enquiries(lead_id);
CREATE INDEX IF NOT EXISTS idx_hydrogeo_status    ON public.crm_hydrogeo_enquiries(survey_status);

ALTER TABLE public.crm_hydrogeo_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view hydrogeo"
  ON public.crm_hydrogeo_enquiries FOR SELECT
  USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members create hydrogeo"
  ON public.crm_hydrogeo_enquiries FOR INSERT
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members update hydrogeo"
  ON public.crm_hydrogeo_enquiries FOR UPDATE
  USING (public.is_crm_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "CRM admins delete hydrogeo"
  ON public.crm_hydrogeo_enquiries FOR DELETE
  USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));

CREATE TRIGGER trg_hydrogeo_updated_at
  BEFORE UPDATE ON public.crm_hydrogeo_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Replace mirror_enquiry_to_crm so it routes by enquiry_type
CREATE OR REPLACE FUNCTION public.mirror_enquiry_to_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _ws_id uuid;
  _new_lead_id uuid;
  _etype text;
BEGIN
  _ws_id := public.resolve_crm_workspace(NEW.country, NEW.mailing_state);
  IF _ws_id IS NULL THEN RETURN NEW; END IF;

  _etype := COALESCE(NEW.enquiry_type, 'lead');

  -- ---- SUPPORT enquiries -> create a support ticket only ----
  IF _etype = 'support' THEN
    INSERT INTO public.crm_support_tickets (
      workspace_id, source_enquiry_id, assigned_to,
      subject, description, category, priority, status,
      customer_name, customer_email, customer_phone
    ) VALUES (
      _ws_id, NEW.id, NEW.assigned_to,
      COALESCE(NULLIF(NEW.service_needed, ''), 'Customer support request'),
      NEW.message,
      'general',
      'medium',
      'open',
      NEW.name, NEW.email,
      COALESCE(NEW.primary_phone, NEW.mobile_phone, NEW.phone)
    );
    RETURN NEW;
  END IF;

  -- ---- LEAD or HYDROGEO enquiries -> create lead first ----
  INSERT INTO public.crm_leads (
    workspace_id, source_enquiry_id, assigned_to,
    full_name, email, phone, whatsapp,
    street, city, state, pincode, country,
    latitude, longitude,
    service_needed, biz_area, biz_cost, expected_close,
    stage, status, notes
  ) VALUES (
    _ws_id, NEW.id, NEW.assigned_to,
    NEW.name, NEW.email,
    COALESCE(NEW.primary_phone, NEW.mobile_phone, NEW.phone),
    NEW.whatsapp,
    NEW.mailing_street, NEW.mailing_city, NEW.mailing_state, NEW.mailing_pincode,
    COALESCE(NEW.country, 'India'),
    NULLIF(NEW.latitude,'')::numeric, NULLIF(NEW.longitude,'')::numeric,
    COALESCE(NEW.service_needed, NEW.service), NEW.biz_area,
    NULLIF(NEW.biz_cost,'')::numeric,
    NULLIF(NEW.expected_close,'')::date,
    'new', 'open', NEW.message
  )
  RETURNING id INTO _new_lead_id;

  -- ---- HYDROGEO -> also create a hydrogeo enquiry tied to the lead ----
  IF _etype = 'hydrogeo' THEN
    INSERT INTO public.crm_hydrogeo_enquiries (
      workspace_id, lead_id, source_enquiry_id,
      site_name, site_address, site_city, site_state, site_pincode,
      latitude, longitude,
      area_size, num_scans, estimated_cost,
      notes, survey_status
    ) VALUES (
      _ws_id, _new_lead_id, NEW.id,
      NEW.name, NEW.mailing_street, NEW.mailing_city, NEW.mailing_state, NEW.mailing_pincode,
      NULLIF(NEW.latitude,'')::numeric, NULLIF(NEW.longitude,'')::numeric,
      COALESCE(NEW.area_value, NEW.biz_area),
      NULLIF(NEW.num_scans,'')::integer,
      NULLIF(NEW.biz_cost,'')::numeric,
      NEW.message,
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Re-attach trigger (drop+create to be idempotent)
DROP TRIGGER IF EXISTS trg_mirror_enquiry_to_crm ON public.contact_messages;
CREATE TRIGGER trg_mirror_enquiry_to_crm
  AFTER INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.mirror_enquiry_to_crm();
