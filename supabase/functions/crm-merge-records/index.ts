// Merge duplicate CRM records — supports leads, contacts, organizations.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FK_MAP: Record<string, { table: string; column: string }[]> = {
  crm_leads: [
    { table: "crm_deals", column: "lead_id" },
    { table: "crm_activities", column: "lead_id" },
    { table: "crm_documents", column: "lead_id" },
  ],
  crm_contacts: [
    { table: "crm_deals", column: "contact_id" },
    { table: "crm_activities", column: "contact_id" },
  ],
  crm_organizations: [
    { table: "crm_deals", column: "organization_id" },
    { table: "crm_contacts", column: "organization_id" },
    { table: "crm_activities", column: "organization_id" },
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") || "";
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { workspace_id, entity, primary_id, merged_id } = await req.json();
    if (!workspace_id || !entity || !primary_id || !merged_id || primary_id === merged_id) {
      return new Response(JSON.stringify({ error: "invalid payload" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const fks = FK_MAP[entity];
    if (!fks) {
      return new Response(JSON.stringify({ error: "unsupported entity" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: snap } = await sb.from(entity).select("*").eq("id", merged_id).maybeSingle();

    for (const fk of fks) {
      await sb.from(fk.table).update({ [fk.column]: primary_id }).eq(fk.column, merged_id);
    }

    const { error: delErr } = await sb.from(entity).delete().eq("id", merged_id).eq("workspace_id", workspace_id);
    if (delErr) throw delErr;

    await sb.from("crm_dedupe_merges").insert({
      workspace_id, entity_type: entity, primary_id, merged_id, merged_snapshot: snap ?? null,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
