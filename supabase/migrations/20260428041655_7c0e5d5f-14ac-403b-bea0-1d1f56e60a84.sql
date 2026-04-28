CREATE TABLE IF NOT EXISTS public.crm_field_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  visit_number text,
  title text NOT NULL,
  visit_type text NOT NULL DEFAULT 'site_survey',
  status text NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz,
  assigned_to uuid,
  created_by uuid,
  lead_id uuid,
  ticket_id uuid,
  hydrogeo_id uuid,
  contact_id uuid,
  organization_id uuid,
  customer_name text,
  customer_phone text,
  site_address text,
  site_city text,
  site_state text,
  checkin_lat numeric,
  checkin_lng numeric,
  checkin_at timestamptz,
  checkout_lat numeric,
  checkout_lng numeric,
  checkout_at timestamptz,
  findings text,
  recommendations text,
  next_action text,
  photo_paths jsonb DEFAULT '[]'::jsonb,
  signature_path text,
  customer_rating int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_field_visits_ws ON public.crm_field_visits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_field_visits_assignee ON public.crm_field_visits(assigned_to);
CREATE INDEX IF NOT EXISTS idx_field_visits_status ON public.crm_field_visits(status);

ALTER TABLE public.crm_field_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view field visits"
  ON public.crm_field_visits FOR SELECT
  USING (is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members create field visits"
  ON public.crm_field_visits FOR INSERT
  WITH CHECK (is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members update field visits"
  ON public.crm_field_visits FOR UPDATE
  USING (is_crm_member(auth.uid(), workspace_id))
  WITH CHECK (is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "CRM admins delete field visits"
  ON public.crm_field_visits FOR DELETE
  USING (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

CREATE TRIGGER trg_field_visits_updated
  BEFORE UPDATE ON public.crm_field_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-numbering: FV-YYYYMM-#### per workspace
CREATE OR REPLACE FUNCTION public.crm_field_visit_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _seq int;
  _prefix text := 'FV-' || to_char(now(), 'YYYYMM') || '-';
BEGIN
  IF NEW.visit_number IS NULL THEN
    SELECT COUNT(*) + 1 INTO _seq
    FROM public.crm_field_visits
    WHERE workspace_id = NEW.workspace_id
      AND visit_number LIKE _prefix || '%';
    NEW.visit_number := _prefix || lpad(_seq::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_field_visit_number
  BEFORE INSERT ON public.crm_field_visits
  FOR EACH ROW EXECUTE FUNCTION public.crm_field_visit_number();