-- Phase 19: Bulk Import / Data Migration
CREATE TABLE IF NOT EXISTS public.crm_import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('leads','contacts','organizations')),
  file_name TEXT,
  total_rows INTEGER NOT NULL DEFAULT 0,
  success_rows INTEGER NOT NULL DEFAULT 0,
  failed_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('processing','completed','failed','partial')),
  field_mapping JSONB,
  errors JSONB DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_import_jobs_ws ON public.crm_import_jobs(workspace_id, created_at DESC);

ALTER TABLE public.crm_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view import jobs"
  ON public.crm_import_jobs FOR SELECT
  USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create import jobs"
  ON public.crm_import_jobs FOR INSERT
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete import jobs"
  ON public.crm_import_jobs FOR DELETE
  USING (public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));

CREATE TRIGGER trg_crm_import_jobs_updated
  BEFORE UPDATE ON public.crm_import_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();