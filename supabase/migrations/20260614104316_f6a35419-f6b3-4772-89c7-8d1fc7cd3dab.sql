
CREATE TABLE public.crm_label_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  scope text NOT NULL,
  key text NOT NULL,
  label text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  UNIQUE (workspace_id, scope, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_label_overrides TO authenticated;
GRANT ALL ON public.crm_label_overrides TO service_role;

ALTER TABLE public.crm_label_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View labels in workspace"
  ON public.crm_label_overrides FOR SELECT
  TO authenticated
  USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Admins manage labels"
  ON public.crm_label_overrides FOR ALL
  TO authenticated
  USING (public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'))
  WITH CHECK (public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));

CREATE TRIGGER trg_crm_label_overrides_updated_at
  BEFORE UPDATE ON public.crm_label_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_crm_label_overrides_ws_scope ON public.crm_label_overrides(workspace_id, scope);
