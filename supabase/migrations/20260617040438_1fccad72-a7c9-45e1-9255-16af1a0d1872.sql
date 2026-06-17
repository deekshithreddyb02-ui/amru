
CREATE TABLE public.crm_lead_conversion_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_lead_conversion_mappings TO authenticated;
GRANT ALL ON public.crm_lead_conversion_mappings TO service_role;

ALTER TABLE public.crm_lead_conversion_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view lead conversion mappings"
  ON public.crm_lead_conversion_mappings FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.crm_workspace_members m
      WHERE m.workspace_id = crm_lead_conversion_mappings.workspace_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "CRM admins manage lead conversion mappings"
  ON public.crm_lead_conversion_mappings FOR ALL TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role)
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role)
  );

CREATE TABLE public.crm_lead_conversion_mapping_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  version INT NOT NULL,
  mappings JSONB NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lcm_history_workspace ON public.crm_lead_conversion_mapping_history(workspace_id, changed_at DESC);

GRANT SELECT, INSERT ON public.crm_lead_conversion_mapping_history TO authenticated;
GRANT ALL ON public.crm_lead_conversion_mapping_history TO service_role;

ALTER TABLE public.crm_lead_conversion_mapping_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view mapping history"
  ON public.crm_lead_conversion_mapping_history FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.crm_workspace_members m
      WHERE m.workspace_id = crm_lead_conversion_mapping_history.workspace_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "CRM admins insert mapping history"
  ON public.crm_lead_conversion_mapping_history FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role)
  );

CREATE OR REPLACE FUNCTION public.tg_lcm_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lcm_updated_at
  BEFORE UPDATE ON public.crm_lead_conversion_mappings
  FOR EACH ROW EXECUTE FUNCTION public.tg_lcm_updated_at();
