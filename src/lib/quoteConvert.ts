import { supabase } from "@/integrations/supabase/client";

const BASE_FIELDS = [
  "customer_name","customer_email","customer_phone","customer_address",
  "customer_gstin","customer_state","gst_type","currency","subtotal",
  "cgst","sgst","igst","discount","total","notes","terms",
  "contact_id","organization_id","deal_id","workspace_id",
] as const;

async function fetchQuoteAndItems(quotationId: string) {
  const [{ data: q, error: qe }, { data: items, error: ie }] = await Promise.all([
    supabase.from("crm_quotations").select("*").eq("id", quotationId).maybeSingle(),
    supabase
      .from("crm_quotation_items")
      .select("description,hsn_sac,unit,quantity,rate,tax_rate,amount,position")
      .eq("quotation_id", quotationId)
      .order("position"),
  ]);
  if (qe) throw qe;
  if (ie) throw ie;
  if (!q) throw new Error("Quotation not found");
  return { q, items: items || [] };
}

function pick(q: any) {
  const out: Record<string, any> = {};
  for (const k of BASE_FIELDS) out[k] = q[k];
  return out;
}

export async function convertQuotationToSalesOrder(quotationId: string) {
  const { q, items } = await fetchQuoteAndItems(quotationId);
  const { data: { session } } = await supabase.auth.getSession();
  const so_number = `SO-${Date.now().toString().slice(-8)}`;
  const { data: so, error } = await supabase
    .from("crm_sales_orders" as any)
    .insert({
      ...pick(q),
      so_number,
      quotation_id: q.id,
      status: "draft",
      created_by: session?.user.id,
    })
    .select("id, so_number")
    .single();
  if (error) throw error;
  if (items.length) {
    const { error: ierr } = await supabase
      .from("crm_sales_order_items")
      .insert(items.map((it) => ({ ...it, sales_order_id: so.id })));
    if (ierr) throw ierr;
  }
  return so;
}

export async function convertQuotationToInvoice(quotationId: string) {
  const { q, items } = await fetchQuoteAndItems(quotationId);
  const { data: { session } } = await supabase.auth.getSession();
  const invoice_number = `INV-${Date.now().toString().slice(-8)}`;
  const { data: inv, error } = await supabase
    .from("crm_invoices" as any)
    .insert({
      ...pick(q),
      invoice_number,
      quotation_id: q.id,
      status: "unpaid",
      created_by: session?.user.id,
    })
    .select("id, invoice_number")
    .single();
  if (error) throw error;
  if (items.length) {
    const { error: ierr } = await supabase
      .from("crm_invoice_items")
      .insert(items.map((it) => ({
        description: it.description,
        hsn_sac: it.hsn_sac,
        unit: it.unit,
        quantity: it.quantity,
        rate: it.rate,
        tax_rate: it.tax_rate,
        amount: it.amount,
        position: it.position,
        invoice_id: inv.id,
      })));
    if (ierr) throw ierr;
  }
  return inv;
}
