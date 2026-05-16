// Heuristic duplicate finder for leads / contacts / organizations.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Row = Record<string, any>;

function norm(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function groupBy<T>(rows: T[], keyFn: (r: T) => string | null): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = keyFn(r);
    if (!k) continue;
    const arr = m.get(k) ?? [];
    arr.push(r);
    m.set(k, arr);
  }
  return m;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") || "";
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { workspace_id, entity = "crm_leads" } = await req.json();
    if (!workspace_id) {
      return new Response(JSON.stringify({ error: "workspace_id required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const sel = entity === "crm_organizations"
      ? "id, name, email, phone, website, gst_number, created_at"
      : entity === "crm_contacts"
      ? "id, full_name, email, phone, mobile, organization_id, created_at"
      : "id, full_name, email, phone, whatsapp, city, created_at";

    const { data, error } = await sb.from(entity).select(sel).eq("workspace_id", workspace_id).limit(2000);
    if (error) throw error;
    const rows = (data ?? []) as Row[];

    const groups: { key: string; reason: string; rows: Row[] }[] = [];

    const byEmail = groupBy(rows, (r) => norm(r.email));
    byEmail.forEach((arr, k) => { if (arr.length > 1) groups.push({ key: k, reason: "Same email", rows: arr }); });

    const byPhone = groupBy(rows, (r) => norm(r.phone || r.mobile || r.whatsapp));
    byPhone.forEach((arr, k) => { if (arr.length > 1 && k.length >= 8) groups.push({ key: k, reason: "Same phone", rows: arr }); });

    const byName = groupBy(rows, (r) => norm(r.full_name || r.name));
    byName.forEach((arr, k) => { if (arr.length > 1 && k.length >= 4) groups.push({ key: k, reason: "Same name", rows: arr }); });

    // Dedup groups by sorted-id signature
    const seen = new Set<string>();
    const unique = groups.filter((g) => {
      const sig = g.rows.map((r) => r.id).sort().join("|") + "::" + g.reason;
      if (seen.has(sig)) return false;
      seen.add(sig); return true;
    });

    return new Response(JSON.stringify({ ok: true, entity, total: rows.length, groups: unique }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
