// Public endpoint: resolves a customer portal token and returns the
// invoices, quotations, and reports the customer is allowed to see.
// No JWT required — auth is the unguessable token in the URL.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token || token.length < 16) {
      return json({ ok: false, error: "Invalid token" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: tk } = await supabase
      .from("crm_portal_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (!tk) return json({ ok: false, error: "Token not found" }, 404);
    if (tk.revoked_at) return json({ ok: false, error: "Token revoked" }, 410);
    if (tk.expires_at && new Date(tk.expires_at) < new Date()) {
      return json({ ok: false, error: "Token expired" }, 410);
    }

    // Track view
    await supabase
      .from("crm_portal_tokens")
      .update({
        view_count: (tk.view_count ?? 0) + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq("id", tk.id);

    const wantsAll = tk.scope === "all";
    const wantsInvoice = wantsAll || tk.scope === "invoice";
    const wantsQuote = wantsAll || tk.scope === "quotation";
    const wantsReport = wantsAll || tk.scope === "report";

    const filterBy = (q: any) => {
      if (tk.entity_id) return q.eq("id", tk.entity_id);
      if (tk.contact_id) return q.eq("contact_id", tk.contact_id);
      if (tk.organization_id) return q.eq("organization_id", tk.organization_id);
      return q.eq("workspace_id", tk.workspace_id).limit(50);
    };

    const [invs, quotes, reports] = await Promise.all([
      wantsInvoice
        ? filterBy(
            supabase
              .from("crm_invoices")
              .select(
                "id, invoice_number, customer_name, total, paid_amount, status, issue_date, due_date, currency",
              )
              .eq("workspace_id", tk.workspace_id),
          )
        : Promise.resolve({ data: [] }),
      wantsQuote
        ? filterBy(
            supabase
              .from("crm_quotations")
              .select(
                "id, quotation_number, customer_name, total, status, issue_date, valid_until, currency",
              )
              .eq("workspace_id", tk.workspace_id),
          )
        : Promise.resolve({ data: [] }),
      wantsReport
        ? filterBy(
            supabase
              .from("crm_ai_reports")
              .select("id, title, status, sent_to_customer_at, current_version, updated_at")
              .eq("workspace_id", tk.workspace_id)
              .in("status", ["sent_to_customer", "acknowledged", "approved"]),
          )
        : Promise.resolve({ data: [] }),
    ]);

    return json({
      ok: true,
      customer: {
        name: tk.customer_name,
        email: tk.customer_email,
      },
      scope: tk.scope,
      expires_at: tk.expires_at,
      invoices: invs.data ?? [],
      quotations: quotes.data ?? [],
      reports: reports.data ?? [],
    });
  } catch (e) {
    console.error("crm-portal-resolve error:", e);
    return json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      500,
    );
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
