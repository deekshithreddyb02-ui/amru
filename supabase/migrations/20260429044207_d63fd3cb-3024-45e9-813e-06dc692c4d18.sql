CREATE TABLE public.crm_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  expense_number TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  amount NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  vendor_id UUID,
  vendor_name TEXT,
  purchase_order_id UUID,
  field_visit_id UUID,
  project_id UUID,
  description TEXT,
  receipt_path TEXT,
  reimbursable BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected','reimbursed')),
  submitted_by UUID,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  reimbursed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_workspace ON public.crm_expenses(workspace_id, expense_date DESC);
CREATE INDEX idx_expenses_creator ON public.crm_expenses(created_by);
CREATE INDEX idx_expenses_status ON public.crm_expenses(workspace_id, status);

ALTER TABLE public.crm_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view expenses" ON public.crm_expenses
  FOR SELECT USING (is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members create expenses" ON public.crm_expenses
  FOR INSERT WITH CHECK (is_crm_member(auth.uid(), workspace_id) AND (created_by = auth.uid() OR created_by IS NULL));

CREATE POLICY "Members update own expenses or admins update any" ON public.crm_expenses
  FOR UPDATE USING (
    is_super_admin(auth.uid())
    OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role)
    OR (is_crm_member(auth.uid(), workspace_id) AND created_by = auth.uid())
  ) WITH CHECK (is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members delete own drafts or admins delete any" ON public.crm_expenses
  FOR DELETE USING (
    is_super_admin(auth.uid())
    OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role)
    OR (created_by = auth.uid() AND status = 'draft')
  );

-- Auto-number expenses
CREATE OR REPLACE FUNCTION public.crm_expense_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _seq int;
  _prefix text := 'EXP-' || to_char(now(), 'YYYYMM') || '-';
BEGIN
  IF NEW.expense_number IS NULL THEN
    SELECT COUNT(*) + 1 INTO _seq
    FROM public.crm_expenses
    WHERE workspace_id = NEW.workspace_id
      AND expense_number LIKE _prefix || '%';
    NEW.expense_number := _prefix || lpad(_seq::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_crm_expense_number
BEFORE INSERT ON public.crm_expenses
FOR EACH ROW EXECUTE FUNCTION public.crm_expense_number();

CREATE TRIGGER trg_crm_expenses_updated
BEFORE UPDATE ON public.crm_expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policy for receipts in crm-documents bucket (workspace-scoped path "expenses/<workspace_id>/...")
CREATE POLICY "CRM members upload expense receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'crm-documents'
  AND (storage.foldername(name))[1] = 'expenses'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "CRM members read expense receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'crm-documents'
  AND (storage.foldername(name))[1] = 'expenses'
  AND auth.uid() IS NOT NULL
);