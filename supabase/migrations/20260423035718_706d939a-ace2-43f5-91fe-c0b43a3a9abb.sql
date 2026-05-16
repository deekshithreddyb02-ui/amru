
-- Replace FOR ALL with explicit per-command policies (linter compliance)
DROP POLICY IF EXISTS "Members manage quotation items" ON public.crm_quotation_items;
DROP POLICY IF EXISTS "Members manage invoice items" ON public.crm_invoice_items;

CREATE POLICY "Members insert quotation items" ON public.crm_quotation_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.crm_quotations q
    WHERE q.id = quotation_id AND public.is_crm_member(auth.uid(), q.workspace_id)
  ));
CREATE POLICY "Members update quotation items" ON public.crm_quotation_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.crm_quotations q
    WHERE q.id = quotation_id AND public.is_crm_member(auth.uid(), q.workspace_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.crm_quotations q
    WHERE q.id = quotation_id AND public.is_crm_member(auth.uid(), q.workspace_id)
  ));
CREATE POLICY "Members delete quotation items" ON public.crm_quotation_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.crm_quotations q
    WHERE q.id = quotation_id AND public.is_crm_member(auth.uid(), q.workspace_id)
  ));

CREATE POLICY "Members insert invoice items" ON public.crm_invoice_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.crm_invoices i
    WHERE i.id = invoice_id AND public.is_crm_member(auth.uid(), i.workspace_id)
  ));
CREATE POLICY "Members update invoice items" ON public.crm_invoice_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.crm_invoices i
    WHERE i.id = invoice_id AND public.is_crm_member(auth.uid(), i.workspace_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.crm_invoices i
    WHERE i.id = invoice_id AND public.is_crm_member(auth.uid(), i.workspace_id)
  ));
CREATE POLICY "Members delete invoice items" ON public.crm_invoice_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.crm_invoices i
    WHERE i.id = invoice_id AND public.is_crm_member(auth.uid(), i.workspace_id)
  ));
