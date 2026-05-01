-- Phase 17: Contracts & AMC Renewals

CREATE TABLE public.crm_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  contract_number text NOT NULL,
  title text NOT NULL,
  contract_type text NOT NULL DEFAULT 'amc', -- amc, service, support, maintenance, lease, other
  status text NOT NULL DEFAULT 'draft', -- draft, active, expiring, expired, renewed, cancelled, terminated
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.crm_organizations(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  renewal_date date,
  auto_renew boolean NOT NULL DEFAULT false,
  renewal_period_months int DEFAULT 12,
  notice_period_days int DEFAULT 30,
  contract_value numeric(14,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'INR',
  billing_frequency text DEFAULT 'annually', -- monthly, quarterly, half_yearly, annually, one_time
  payment_terms text,
  scope_of_work text,
  service_level text,
  visits_per_year int,
  visits_completed int DEFAULT 0,
  document_url text,
  signed_by_customer_at timestamptz,
  signed_by_company_at timestamptz,
  cancelled_at timestamptz,
  cancelled_reason text,
  notes text,
  tags text[],
  owner_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, contract_number)
);

CREATE INDEX idx_crm_contracts_ws ON public.crm_contracts(workspace_id);
CREATE INDEX idx_crm_contracts_status ON public.crm_contracts(workspace_id, status);
CREATE INDEX idx_crm_contracts_end_date ON public.crm_contracts(end_date);
CREATE INDEX idx_crm_contracts_owner ON public.crm_contracts(owner_id);

CREATE TABLE public.crm_contract_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.crm_contracts(id) ON DELETE CASCADE,
  previous_end_date date,
  new_start_date date NOT NULL,
  new_end_date date NOT NULL,
  new_value numeric(14,2),
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected, completed
  notes text,
  renewed_by uuid,
  renewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_contract_renewals_contract ON public.crm_contract_renewals(contract_id);

-- Auto contract number
CREATE OR REPLACE FUNCTION public.crm_contract_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  _seq int;
  _prefix text := 'CON-' || to_char(now(), 'YYYY') || '-';
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    SELECT COUNT(*) + 1 INTO _seq FROM public.crm_contracts
    WHERE workspace_id = NEW.workspace_id AND contract_number LIKE _prefix || '%';
    NEW.contract_number := _prefix || lpad(_seq::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_crm_contract_number
BEFORE INSERT ON public.crm_contracts
FOR EACH ROW EXECUTE FUNCTION public.crm_contract_number();

-- Auto-update status based on dates
CREATE OR REPLACE FUNCTION public.crm_contract_update_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('cancelled','terminated','renewed','draft') THEN
    IF NEW.end_date < CURRENT_DATE THEN
      NEW.status := 'expired';
    ELSIF NEW.end_date <= CURRENT_DATE + (COALESCE(NEW.notice_period_days,30) || ' days')::interval THEN
      NEW.status := 'expiring';
    ELSE
      NEW.status := 'active';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_crm_contract_status
BEFORE INSERT OR UPDATE ON public.crm_contracts
FOR EACH ROW EXECUTE FUNCTION public.crm_contract_update_status();

ALTER TABLE public.crm_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contract_renewals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view contracts" ON public.crm_contracts
AS PERMISSIVE FOR SELECT TO authenticated
USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members create contracts" ON public.crm_contracts
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members update contracts" ON public.crm_contracts
AS PERMISSIVE FOR UPDATE TO authenticated
USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Admins delete contracts" ON public.crm_contracts
AS PERMISSIVE FOR DELETE TO authenticated
USING (public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));

CREATE POLICY "Members view renewals" ON public.crm_contract_renewals
AS PERMISSIVE FOR SELECT TO authenticated
USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members manage renewals" ON public.crm_contract_renewals
AS PERMISSIVE FOR ALL TO authenticated
USING (public.is_crm_member(auth.uid(), workspace_id))
WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));