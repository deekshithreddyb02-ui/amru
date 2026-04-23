
-- =========================================================
-- CRM DOCUMENTS
-- =========================================================
CREATE TABLE public.crm_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  uploaded_by UUID,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  parent_document_id UUID REFERENCES public.crm_documents(id) ON DELETE SET NULL,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  share_token TEXT UNIQUE,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.crm_support_tickets(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.crm_organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view documents" ON public.crm_documents FOR SELECT
  USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create documents" ON public.crm_documents FOR INSERT
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update documents" ON public.crm_documents FOR UPDATE
  USING (public.is_crm_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete documents" ON public.crm_documents FOR DELETE
  USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));

CREATE INDEX idx_crm_documents_ws ON public.crm_documents(workspace_id);
CREATE INDEX idx_crm_documents_lead ON public.crm_documents(lead_id);
CREATE INDEX idx_crm_documents_deal ON public.crm_documents(deal_id);
CREATE INDEX idx_crm_documents_ticket ON public.crm_documents(ticket_id);
CREATE INDEX idx_crm_documents_parent ON public.crm_documents(parent_document_id);

CREATE TRIGGER trg_crm_documents_updated
  BEFORE UPDATE ON public.crm_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- STORAGE BUCKET FOR DOCUMENTS
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-documents', 'crm-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: file path must start with workspace_id/
CREATE POLICY "CRM members read workspace docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'crm-documents'
    AND public.is_crm_member(
      auth.uid(),
      ((storage.foldername(name))[1])::uuid
    )
  );

CREATE POLICY "CRM members upload workspace docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'crm-documents'
    AND public.is_crm_member(
      auth.uid(),
      ((storage.foldername(name))[1])::uuid
    )
  );

CREATE POLICY "CRM members update workspace docs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'crm-documents'
    AND public.is_crm_member(
      auth.uid(),
      ((storage.foldername(name))[1])::uuid
    )
  );

CREATE POLICY "CRM admins delete workspace docs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'crm-documents'
    AND (
      public.is_super_admin(auth.uid())
      OR public.has_crm_role(
        auth.uid(),
        ((storage.foldername(name))[1])::uuid,
        'crm_admin'
      )
    )
  );

-- =========================================================
-- QUOTATIONS
-- =========================================================
CREATE TABLE public.crm_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  created_by UUID,
  quotation_number TEXT NOT NULL,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.crm_organizations(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  customer_gstin TEXT,
  customer_state TEXT,
  gst_type TEXT NOT NULL DEFAULT 'intra' CHECK (gst_type IN ('intra','inter','none')),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  cgst NUMERIC NOT NULL DEFAULT 0,
  sgst NUMERIC NOT NULL DEFAULT 0,
  igst NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  valid_until DATE,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, quotation_number)
);

ALTER TABLE public.crm_quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view quotations" ON public.crm_quotations FOR SELECT
  USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create quotations" ON public.crm_quotations FOR INSERT
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update quotations" ON public.crm_quotations FOR UPDATE
  USING (public.is_crm_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete quotations" ON public.crm_quotations FOR DELETE
  USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));

CREATE INDEX idx_quotations_ws ON public.crm_quotations(workspace_id);
CREATE INDEX idx_quotations_lead ON public.crm_quotations(lead_id);
CREATE INDEX idx_quotations_deal ON public.crm_quotations(deal_id);

CREATE TRIGGER trg_quotations_updated
  BEFORE UPDATE ON public.crm_quotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.crm_quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.crm_quotations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  hsn_sac TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT,
  rate NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 18,
  amount NUMERIC NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view quotation items" ON public.crm_quotation_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.crm_quotations q
    WHERE q.id = quotation_id AND public.is_crm_member(auth.uid(), q.workspace_id)
  ));
CREATE POLICY "Members manage quotation items" ON public.crm_quotation_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.crm_quotations q
    WHERE q.id = quotation_id AND public.is_crm_member(auth.uid(), q.workspace_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.crm_quotations q
    WHERE q.id = quotation_id AND public.is_crm_member(auth.uid(), q.workspace_id)
  ));

CREATE INDEX idx_quotation_items_q ON public.crm_quotation_items(quotation_id);

-- =========================================================
-- INVOICES
-- =========================================================
CREATE TABLE public.crm_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  created_by UUID,
  invoice_number TEXT NOT NULL,
  quotation_id UUID REFERENCES public.crm_quotations(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.crm_organizations(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  customer_gstin TEXT,
  customer_state TEXT,
  gst_type TEXT NOT NULL DEFAULT 'intra' CHECK (gst_type IN ('intra','inter','none')),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  cgst NUMERIC NOT NULL DEFAULT 0,
  sgst NUMERIC NOT NULL DEFAULT 0,
  igst NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('draft','unpaid','partial','paid','overdue','cancelled')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, invoice_number)
);

ALTER TABLE public.crm_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view invoices" ON public.crm_invoices FOR SELECT
  USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create invoices" ON public.crm_invoices FOR INSERT
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update invoices" ON public.crm_invoices FOR UPDATE
  USING (public.is_crm_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete invoices" ON public.crm_invoices FOR DELETE
  USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));

CREATE INDEX idx_invoices_ws ON public.crm_invoices(workspace_id);
CREATE INDEX idx_invoices_status ON public.crm_invoices(status);
CREATE INDEX idx_invoices_due ON public.crm_invoices(due_date);

CREATE TRIGGER trg_invoices_updated
  BEFORE UPDATE ON public.crm_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.crm_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.crm_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  hsn_sac TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT,
  rate NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 18,
  amount NUMERIC NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view invoice items" ON public.crm_invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.crm_invoices i
    WHERE i.id = invoice_id AND public.is_crm_member(auth.uid(), i.workspace_id)
  ));
CREATE POLICY "Members manage invoice items" ON public.crm_invoice_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.crm_invoices i
    WHERE i.id = invoice_id AND public.is_crm_member(auth.uid(), i.workspace_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.crm_invoices i
    WHERE i.id = invoice_id AND public.is_crm_member(auth.uid(), i.workspace_id)
  ));

CREATE INDEX idx_invoice_items_inv ON public.crm_invoice_items(invoice_id);

-- =========================================================
-- PAYMENTS
-- =========================================================
CREATE TABLE public.crm_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.crm_invoices(id) ON DELETE CASCADE,
  recorded_by UUID,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash','bank_transfer','upi','cheque','card','other')),
  reference TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view payments" ON public.crm_payments FOR SELECT
  USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create payments" ON public.crm_payments FOR INSERT
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update payments" ON public.crm_payments FOR UPDATE
  USING (public.is_crm_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete payments" ON public.crm_payments FOR DELETE
  USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));

CREATE INDEX idx_payments_inv ON public.crm_payments(invoice_id);
CREATE INDEX idx_payments_ws ON public.crm_payments(workspace_id);

-- Trigger: keep invoice paid_amount + status in sync with payments
CREATE OR REPLACE FUNCTION public.sync_invoice_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv_id UUID;
  _total NUMERIC;
  _paid NUMERIC;
  _due DATE;
  _status TEXT;
BEGIN
  _inv_id := COALESCE(NEW.invoice_id, OLD.invoice_id);

  SELECT COALESCE(SUM(amount), 0) INTO _paid
  FROM public.crm_payments
  WHERE invoice_id = _inv_id;

  SELECT total, due_date INTO _total, _due
  FROM public.crm_invoices WHERE id = _inv_id;

  IF _paid >= _total AND _total > 0 THEN
    _status := 'paid';
  ELSIF _paid > 0 THEN
    _status := 'partial';
  ELSIF _due IS NOT NULL AND _due < CURRENT_DATE THEN
    _status := 'overdue';
  ELSE
    _status := 'unpaid';
  END IF;

  UPDATE public.crm_invoices
  SET paid_amount = _paid, status = _status
  WHERE id = _inv_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_invoice_payment
  AFTER INSERT OR UPDATE OR DELETE ON public.crm_payments
  FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_payment_status();

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE public.crm_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'reminder',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.crm_notifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.crm_notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.crm_notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_unread ON public.crm_notifications(user_id, is_read, created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_notifications;
