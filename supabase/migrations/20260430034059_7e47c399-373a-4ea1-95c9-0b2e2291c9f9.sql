-- Commission rules: percentage of invoice/deal value paid to assignee
CREATE TABLE public.crm_commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL DEFAULT 'flat', -- flat | tiered
  flat_percentage NUMERIC NOT NULL DEFAULT 0,
  tiers JSONB DEFAULT '[]'::jsonb, -- [{min:0,max:100000,pct:5},{min:100000,max:null,pct:8}]
  applies_to TEXT NOT NULL DEFAULT 'all', -- all | category
  category TEXT, -- when applies_to=category
  min_deal_value NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  priority INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_commission_rules_ws ON public.crm_commission_rules(workspace_id, is_active);

ALTER TABLE public.crm_commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view rules"
ON public.crm_commission_rules FOR SELECT
USING (is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Admins create rules"
ON public.crm_commission_rules FOR INSERT
WITH CHECK (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

CREATE POLICY "Admins update rules"
ON public.crm_commission_rules FOR UPDATE
USING (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role))
WITH CHECK (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

CREATE POLICY "Admins delete rules"
ON public.crm_commission_rules FOR DELETE
USING (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

-- Earned commission records
CREATE TABLE public.crm_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL, -- the sales rep who earned it
  rule_id UUID,
  invoice_id UUID,
  deal_id UUID,
  source_type TEXT NOT NULL DEFAULT 'invoice', -- invoice | deal | manual
  base_amount NUMERIC NOT NULL DEFAULT 0,
  percentage NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  earned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | paid | cancelled
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payout_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_commissions_ws_user ON public.crm_commissions(workspace_id, user_id, earned_date DESC);
CREATE INDEX idx_commissions_status ON public.crm_commissions(workspace_id, status);
CREATE UNIQUE INDEX idx_commissions_invoice_user ON public.crm_commissions(invoice_id, user_id) WHERE invoice_id IS NOT NULL;

ALTER TABLE public.crm_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own or admins all"
ON public.crm_commissions FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role)
  OR (is_crm_member(auth.uid(), workspace_id) AND user_id = auth.uid())
);

CREATE POLICY "Admins create commissions"
ON public.crm_commissions FOR INSERT
WITH CHECK (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

CREATE POLICY "Admins update commissions"
ON public.crm_commissions FOR UPDATE
USING (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role))
WITH CHECK (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

CREATE POLICY "Admins delete commissions"
ON public.crm_commissions FOR DELETE
USING (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

-- Helper to compute commission amount from a rule + base
CREATE OR REPLACE FUNCTION public.crm_calc_commission(_rule_id uuid, _base numeric)
RETURNS numeric LANGUAGE plpgsql STABLE SET search_path TO 'public' AS $$
DECLARE
  _r record;
  _tier jsonb;
  _pct numeric := 0;
BEGIN
  SELECT * INTO _r FROM public.crm_commission_rules WHERE id = _rule_id;
  IF NOT FOUND OR _base < COALESCE(_r.min_deal_value, 0) THEN
    RETURN 0;
  END IF;

  IF _r.rule_type = 'flat' THEN
    _pct := COALESCE(_r.flat_percentage, 0);
  ELSE
    FOR _tier IN SELECT * FROM jsonb_array_elements(COALESCE(_r.tiers, '[]'::jsonb)) LOOP
      IF _base >= COALESCE((_tier->>'min')::numeric, 0)
         AND (_tier->>'max' IS NULL OR _base < (_tier->>'max')::numeric) THEN
        _pct := COALESCE((_tier->>'pct')::numeric, 0);
        EXIT;
      END IF;
    END LOOP;
  END IF;

  RETURN ROUND((_base * _pct) / 100.0, 2);
END;
$$;

-- Auto-create commission when invoice becomes paid
CREATE OR REPLACE FUNCTION public.crm_auto_commission_on_invoice_paid()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _rep uuid;
  _rule record;
  _base numeric;
  _pct numeric := 0;
  _amt numeric := 0;
  _tier jsonb;
BEGIN
  IF NEW.status <> 'paid' OR COALESCE(OLD.status,'') = 'paid' THEN
    RETURN NEW;
  END IF;

  -- Find rep: deal owner, else invoice creator
  IF NEW.deal_id IS NOT NULL THEN
    SELECT owner_id INTO _rep FROM public.crm_deals WHERE id = NEW.deal_id;
  END IF;
  _rep := COALESCE(_rep, NEW.created_by);
  IF _rep IS NULL THEN RETURN NEW; END IF;

  _base := COALESCE(NEW.total, 0);

  -- Pick first matching active rule (highest priority)
  SELECT * INTO _rule
  FROM public.crm_commission_rules
  WHERE workspace_id = NEW.workspace_id
    AND is_active = true
    AND effective_from <= CURRENT_DATE
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    AND _base >= COALESCE(min_deal_value, 0)
  ORDER BY priority DESC, created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN RETURN NEW; END IF;

  IF _rule.rule_type = 'flat' THEN
    _pct := COALESCE(_rule.flat_percentage, 0);
  ELSE
    FOR _tier IN SELECT * FROM jsonb_array_elements(COALESCE(_rule.tiers, '[]'::jsonb)) LOOP
      IF _base >= COALESCE((_tier->>'min')::numeric, 0)
         AND (_tier->>'max' IS NULL OR _base < (_tier->>'max')::numeric) THEN
        _pct := COALESCE((_tier->>'pct')::numeric, 0);
        EXIT;
      END IF;
    END LOOP;
  END IF;

  _amt := ROUND((_base * _pct) / 100.0, 2);
  IF _amt <= 0 THEN RETURN NEW; END IF;

  INSERT INTO public.crm_commissions(
    workspace_id, user_id, rule_id, invoice_id, deal_id,
    source_type, base_amount, percentage, commission_amount,
    currency, earned_date, status
  ) VALUES (
    NEW.workspace_id, _rep, _rule.id, NEW.id, NEW.deal_id,
    'invoice', _base, _pct, _amt,
    COALESCE(NEW.currency, 'INR'), CURRENT_DATE, 'pending'
  )
  ON CONFLICT (invoice_id, user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_commission_invoice_paid
AFTER UPDATE ON public.crm_invoices
FOR EACH ROW EXECUTE FUNCTION public.crm_auto_commission_on_invoice_paid();

-- updated_at triggers
CREATE TRIGGER trg_commission_rules_updated
BEFORE UPDATE ON public.crm_commission_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_commissions_updated
BEFORE UPDATE ON public.crm_commissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();