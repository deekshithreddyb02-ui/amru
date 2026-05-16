
CREATE TABLE IF NOT EXISTS public.crm_saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  module TEXT NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '[]'::jsonb,
  columns TEXT[] NOT NULL DEFAULT '{}',
  sort JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_csv_ws_module ON public.crm_saved_views(workspace_id, module);
CREATE INDEX IF NOT EXISTS idx_csv_user ON public.crm_saved_views(user_id);

ALTER TABLE public.crm_saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "csv_select" ON public.crm_saved_views FOR SELECT
  USING (public.is_crm_member(auth.uid(), workspace_id) AND (is_shared OR user_id = auth.uid()));
CREATE POLICY "csv_insert" ON public.crm_saved_views FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "csv_update" ON public.crm_saved_views FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "csv_delete" ON public.crm_saved_views FOR DELETE
  USING (user_id = auth.uid());

CREATE TRIGGER trg_csv_updated_at BEFORE UPDATE ON public.crm_saved_views
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE IF NOT EXISTS public.crm_user_column_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module TEXT NOT NULL,
  columns TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, module)
);

ALTER TABLE public.crm_user_column_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cucp_select" ON public.crm_user_column_prefs FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "cucp_insert" ON public.crm_user_column_prefs FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "cucp_update" ON public.crm_user_column_prefs FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "cucp_delete" ON public.crm_user_column_prefs FOR DELETE
  USING (user_id = auth.uid());

CREATE TRIGGER trg_cucp_updated_at BEFORE UPDATE ON public.crm_user_column_prefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
