-- =====================================================
-- Phase 5: Reports, Audit, Meeting Summaries, Scoring
-- =====================================================

-- ---------- crm_reports ----------
CREATE TABLE IF NOT EXISTS public.crm_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  created_by UUID,
  approved_by UUID,
  template_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_markdown TEXT,
  content_data JSONB,
  approval_status TEXT NOT NULL DEFAULT 'draft', -- draft | pending | approved | rejected
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_reports_workspace ON public.crm_reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_reports_status ON public.crm_reports(approval_status);
ALTER TABLE public.crm_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view reports" ON public.crm_reports FOR SELECT
  USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create reports" ON public.crm_reports FOR INSERT
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update own draft reports" ON public.crm_reports FOR UPDATE
  USING (public.is_crm_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete reports" ON public.crm_reports FOR DELETE
  USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

CREATE TRIGGER trg_crm_reports_updated_at
  BEFORE UPDATE ON public.crm_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- crm_audit_log ----------
CREATE TABLE IF NOT EXISTS public.crm_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  actor_id UUID,
  actor_email TEXT,
  action TEXT NOT NULL, -- created | updated | deleted | approved | rejected | sent
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_label TEXT,
  changes JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_audit_workspace ON public.crm_audit_log(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_audit_entity ON public.crm_audit_log(entity_type, entity_id);
ALTER TABLE public.crm_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view audit log" ON public.crm_audit_log FOR SELECT
  USING (
    workspace_id IS NULL AND public.is_super_admin(auth.uid())
    OR public.is_crm_member(auth.uid(), workspace_id)
  );
CREATE POLICY "Authenticated insert audit log" ON public.crm_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND (workspace_id IS NULL OR public.is_crm_member(auth.uid(), workspace_id))
  );
-- No update/delete policies — audit log is append-only.

-- ---------- crm_meeting_summaries ----------
CREATE TABLE IF NOT EXISTS public.crm_meeting_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  created_by UUID,
  activity_id UUID REFERENCES public.crm_activities(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  meeting_date DATE,
  source_type TEXT NOT NULL DEFAULT 'paste', -- paste | audio
  source_audio_path TEXT,
  transcript TEXT,
  summary TEXT,
  action_items JSONB,
  follow_ups JSONB,
  participants JSONB,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | ready | failed
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_meet_ws ON public.crm_meeting_summaries(workspace_id, created_at DESC);
ALTER TABLE public.crm_meeting_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view summaries" ON public.crm_meeting_summaries FOR SELECT
  USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create summaries" ON public.crm_meeting_summaries FOR INSERT
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update summaries" ON public.crm_meeting_summaries FOR UPDATE
  USING (public.is_crm_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete summaries" ON public.crm_meeting_summaries FOR DELETE
  USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

CREATE TRIGGER trg_crm_meet_updated_at
  BEFORE UPDATE ON public.crm_meeting_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- crm_lead_scoring_history ----------
CREATE TABLE IF NOT EXISTS public.crm_lead_scoring_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  rule_score NUMERIC,
  ai_score NUMERIC,
  final_score NUMERIC,
  reasoning TEXT,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_scoring_lead ON public.crm_lead_scoring_history(lead_id, computed_at DESC);
ALTER TABLE public.crm_lead_scoring_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view scoring history" ON public.crm_lead_scoring_history FOR SELECT
  USING (public.is_crm_member(auth.uid(), workspace_id));
-- Inserts done by service role from edge function — no client policy needed.

-- ---------- Extend crm_leads ----------
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS score_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ;

-- ---------- Extend crm_quotations approval ----------
ALTER TABLE public.crm_quotations
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ---------- Extend crm_invoices approval ----------
ALTER TABLE public.crm_invoices
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;