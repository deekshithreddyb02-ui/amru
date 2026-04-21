-- 1. CRM Workspaces
CREATE TABLE public.crm_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  region_key text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_workspaces ENABLE ROW LEVEL SECURITY;

-- 2. CRM Workspace Members
CREATE TABLE public.crm_workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  crm_role public.app_role NOT NULL DEFAULT 'crm_viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);
CREATE INDEX idx_crm_members_user ON public.crm_workspace_members(user_id);
CREATE INDEX idx_crm_members_workspace ON public.crm_workspace_members(workspace_id);
ALTER TABLE public.crm_workspace_members ENABLE ROW LEVEL SECURITY;

-- 3. Helpers
CREATE OR REPLACE FUNCTION public.is_crm_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  ) OR public.is_super_admin(_user_id)
$$;

CREATE OR REPLACE FUNCTION public.has_crm_role(_user_id uuid, _workspace_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id) OR EXISTS (
    SELECT 1 FROM public.crm_workspace_members
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
      AND (crm_role = _role OR crm_role = 'crm_admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.resolve_crm_workspace(_country text, _state text)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE _slug text; _id uuid;
BEGIN
  IF _country IS NOT NULL AND lower(trim(_country)) NOT IN ('india','in','') THEN
    _slug := 'others';
  ELSIF _state IS NOT NULL THEN
    _slug := CASE lower(trim(_state))
      WHEN 'telangana' THEN 'hyd'
      WHEN 'andhra pradesh' THEN 'hyd'
      WHEN 'karnataka' THEN 'blr'
      WHEN 'maharashtra' THEN 'mh'
      ELSE 'others' END;
  ELSE
    _slug := 'mh';
  END IF;
  SELECT id INTO _id FROM public.crm_workspaces WHERE slug = _slug LIMIT 1;
  RETURN _id;
END;
$$;

-- 4. CRM Leads
CREATE TABLE public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  source_enquiry_id uuid REFERENCES public.contact_messages(id) ON DELETE SET NULL,
  assigned_to uuid,
  full_name text NOT NULL,
  email text,
  phone text,
  whatsapp text,
  street text,
  city text,
  state text,
  pincode text,
  country text DEFAULT 'India',
  latitude numeric,
  longitude numeric,
  service_needed text,
  biz_area text,
  biz_cost numeric,
  expected_close date,
  stage text NOT NULL DEFAULT 'new',
  status text NOT NULL DEFAULT 'open',
  ai_hot_score numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX idx_crm_leads_workspace ON public.crm_leads(workspace_id);
CREATE INDEX idx_crm_leads_assigned ON public.crm_leads(assigned_to);
CREATE INDEX idx_crm_leads_stage ON public.crm_leads(workspace_id, stage);
CREATE INDEX idx_crm_leads_source ON public.crm_leads(source_enquiry_id);
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_crm_leads_updated BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_workspaces_updated BEFORE UPDATE ON public.crm_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. CRM Lead Activities
CREATE TABLE public.crm_lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  actor_id uuid,
  activity_type text NOT NULL,
  content text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_activities_lead ON public.crm_lead_activities(lead_id);
ALTER TABLE public.crm_lead_activities ENABLE ROW LEVEL SECURITY;

-- 6. Mirror trigger
CREATE OR REPLACE FUNCTION public.mirror_enquiry_to_crm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _ws_id uuid;
BEGIN
  _ws_id := public.resolve_crm_workspace(NEW.country, NEW.mailing_state);
  IF _ws_id IS NULL THEN RETURN NEW; END IF;

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
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mirror_enquiry_to_crm
  AFTER INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.mirror_enquiry_to_crm();

-- 7. Seed workspaces
INSERT INTO public.crm_workspaces (slug, name, region_key) VALUES
  ('hyd', 'Hyderabad (Telangana + AP)', 'telangana_ap'),
  ('blr', 'Bangalore (Karnataka)', 'karnataka'),
  ('mh',  'Maharashtra', 'maharashtra'),
  ('others', 'Others / International', 'others')
ON CONFLICT (slug) DO NOTHING;

-- 8. Auto-promote existing super_admins
INSERT INTO public.crm_workspace_members (workspace_id, user_id, crm_role)
SELECT w.id, ur.user_id, 'crm_admin'::public.app_role
FROM public.crm_workspaces w
CROSS JOIN public.user_roles ur
WHERE ur.role = 'super_admin'
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- 9. RLS Policies
CREATE POLICY "Members can view their workspaces" ON public.crm_workspaces
  FOR SELECT USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.crm_workspace_members m
               WHERE m.workspace_id = crm_workspaces.id AND m.user_id = auth.uid())
  );
CREATE POLICY "Super admins manage workspaces" ON public.crm_workspaces
  FOR ALL USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Members view membership rows" ON public.crm_workspace_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_super_admin(auth.uid())
    OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin')
  );
CREATE POLICY "Admins manage members" ON public.crm_workspace_members
  FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin')
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin')
  );

CREATE POLICY "Members view leads" ON public.crm_leads
  FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create leads" ON public.crm_leads
  FOR INSERT WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update leads" ON public.crm_leads
  FOR UPDATE USING (public.is_crm_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete leads" ON public.crm_leads
  FOR DELETE USING (
    public.is_super_admin(auth.uid())
    OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin')
  );

CREATE POLICY "Members view activities" ON public.crm_lead_activities
  FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members add activities" ON public.crm_lead_activities
  FOR INSERT WITH CHECK (
    public.is_crm_member(auth.uid(), workspace_id)
    AND (actor_id IS NULL OR actor_id = auth.uid())
  );