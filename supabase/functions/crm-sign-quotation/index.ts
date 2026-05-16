// Public quotation signing: validates token, records signature, marks quotation accepted.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const url = new URL(req.url);
    if (req.method === "GET") {
      const token = url.searchParams.get("token") ?? "";
      const { data: tk } = await sb.from("crm_signing_tokens").select("*").eq("token", token).maybeSingle();
      if (!tk) return new Response(JSON.stringify({ error: "invalid token" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
      if (new Date(tk.expires_at) < new Date()) return new Response(JSON.stringify({ error: "expired" }), { status: 410, headers: { ...cors, "Content-Type": "application/json" } });
      const { data: q } = await sb.from("crm_quotations").select("id, quotation_number, customer_name, customer_email, total, currency, line_items, status, valid_until, notes").eq("id", tk.quotation_id).maybeSingle();
      return new Response(JSON.stringify({ ok: true, token: tk, quotation: q }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { token, signer_name, signer_email, signer_company, signature_data_url } = await req.json();
    if (!token || !signer_name || !signature_data_url) {
      return new Response(JSON.stringify({ error: "missing fields" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const { data: tk } = await sb.from("crm_signing_tokens").select("*").eq("token", token).maybeSingle();
    if (!tk) return new Response(JSON.stringify({ error: "invalid token" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    if (tk.used_at) return new Response(JSON.stringify({ error: "already signed" }), { status: 409, headers: { ...cors, "Content-Type": "application/json" } });
    if (new Date(tk.expires_at) < new Date()) return new Response(JSON.stringify({ error: "expired" }), { status: 410, headers: { ...cors, "Content-Type": "application/json" } });

    const ip = req.headers.get("x-forwarded-for") ?? "";
    const ua = req.headers.get("user-agent") ?? "";

    await sb.from("crm_quotation_signatures").insert({
      workspace_id: tk.workspace_id, quotation_id: tk.quotation_id, token,
      signer_name, signer_email, signer_company, signature_data_url,
      ip_address: ip, user_agent: ua,
    });
    await sb.from("crm_signing_tokens").update({ used_at: new Date().toISOString() }).eq("token", token);
    await sb.from("crm_quotations").update({ status: "accepted" }).eq("id", tk.quotation_id);

    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
