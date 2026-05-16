CREATE TABLE IF NOT EXISTS public.crm_portal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  scope text NOT NULL DEFAULT 'all',
  entity_type text,
  entity_id uuid,
  contact_id uuid,
  organization_id uuid,
  customer_email text,
  customer_name text,
  expires_at timestamptz,
  revoked_at timestamptz,
  view_count int NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_tokens_token ON public.crm_portal_tokens(token);
CREATE INDEX IF NOT EXISTS idx_portal_tokens_workspace ON public.crm_portal_tokens(workspace_id);

ALTER TABLE public.crm_portal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view tokens"
  ON public.crm_portal_tokens FOR SELECT
  USING (is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members create tokens"
  ON public.crm_portal_tokens FOR INSERT
  WITH CHECK (is_crm_member(auth.uid(), workspace_id) AND created_by = auth.uid());

CREATE POLICY "Members update tokens"
  ON public.crm_portal_tokens FOR UPDATE
  USING (is_crm_member(auth.uid(), workspace_id))
  WITH CHECK (is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "CRM admins delete tokens"
  ON public.crm_portal_tokens FOR DELETE
  USING (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));