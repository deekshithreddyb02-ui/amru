
CREATE TABLE public.crm_territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  region_keys TEXT[] NOT NULL DEFAULT '{}',
  states TEXT[] NOT NULL DEFAULT '{}',
  countries TEXT[] NOT NULL DEFAULT '{}',
  owner_user_id UUID,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_territories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members view territories" ON public.crm_territories FOR SELECT TO authenticated
USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "admins manage territories" ON public.crm_territories FOR ALL TO authenticated
USING (public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'))
WITH CHECK (public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));
CREATE TRIGGER trg_terr_updated BEFORE UPDATE ON public.crm_territories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.crm_user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  target_deals INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id, period_start, period_end)
);
ALTER TABLE public.crm_user_quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members view own quotas" ON public.crm_user_quotas FOR SELECT TO authenticated
USING (public.is_crm_member(auth.uid(), workspace_id) AND (user_id = auth.uid() OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin')));
CREATE POLICY "admins manage quotas" ON public.crm_user_quotas FOR ALL TO authenticated
USING (public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'))
WITH CHECK (public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));
CREATE TRIGGER trg_quota_updated BEFORE UPDATE ON public.crm_user_quotas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.crm_signing_tokens (
  token TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  quotation_id UUID NOT NULL REFERENCES public.crm_quotations(id) ON DELETE CASCADE,
  signer_email TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  used_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_signing_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members manage tokens" ON public.crm_signing_tokens FOR ALL TO authenticated
USING (public.is_crm_member(auth.uid(), workspace_id))
WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "anon read token" ON public.crm_signing_tokens FOR SELECT TO anon USING (true);

CREATE TABLE public.crm_quotation_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  quotation_id UUID NOT NULL REFERENCES public.crm_quotations(id) ON DELETE CASCADE,
  token TEXT REFERENCES public.crm_signing_tokens(token) ON DELETE SET NULL,
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signer_company TEXT,
  signature_data_url TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_quotation_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read signatures" ON public.crm_quotation_signatures FOR SELECT TO authenticated
USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "anon insert signature" ON public.crm_quotation_signatures FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "auth insert signature" ON public.crm_quotation_signatures FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.crm_dedupe_merges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  primary_id UUID NOT NULL,
  merged_id UUID NOT NULL,
  merged_snapshot JSONB,
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_dedupe_merges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read merges" ON public.crm_dedupe_merges FOR SELECT TO authenticated
USING (public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));
CREATE POLICY "admins write merges" ON public.crm_dedupe_merges FOR INSERT TO authenticated
WITH CHECK (public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));

CREATE OR REPLACE VIEW public.crm_forecast_summary
WITH (security_invoker = true) AS
SELECT
  d.workspace_id,
  d.owner_id,
  d.stage,
  COUNT(*)::int AS deal_count,
  COALESCE(SUM(d.amount), 0)::numeric AS total_amount,
  COALESCE(SUM(d.amount * COALESCE(d.probability,0) / 100.0), 0)::numeric AS weighted_amount,
  date_trunc('month', COALESCE(d.expected_close, d.updated_at))::date AS month
FROM public.crm_deals d
WHERE d.stage <> 'lost'
GROUP BY d.workspace_id, d.owner_id, d.stage, month;
