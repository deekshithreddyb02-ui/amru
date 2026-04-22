-- Phase 3: Activities
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'task' CHECK (activity_type IN ('task','call','meeting','note','email')),
  subject text NOT NULL,
  description text,
  location text,
  meeting_url text,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','done','cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  due_at timestamptz,
  duration_minutes integer DEFAULT 30,
  reminder_minutes_before integer,
  reminded boolean NOT NULL DEFAULT false,
  assigned_to uuid,
  created_by uuid,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.crm_organizations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_ws_due ON public.crm_activities(workspace_id, due_at);
CREATE INDEX IF NOT EXISTS idx_crm_activities_assignee ON public.crm_activities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON public.crm_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON public.crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_deal ON public.crm_activities(deal_id);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view activities"
ON public.crm_activities FOR SELECT
USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members create activities"
ON public.crm_activities FOR INSERT
WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members update activities"
ON public.crm_activities FOR UPDATE
USING (public.is_crm_member(auth.uid(), workspace_id))
WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "CRM admins delete activities"
ON public.crm_activities FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role)
);

CREATE TRIGGER trg_crm_activities_updated_at
BEFORE UPDATE ON public.crm_activities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();