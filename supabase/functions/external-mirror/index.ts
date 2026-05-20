import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, adminClient } from "../_shared/auth.ts";

const EXT_URL = Deno.env.get("EXTERNAL_SUPABASE_URL")!;
const EXT_KEY = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;

// Allowlist of tables we are willing to mirror to the external project.
// Anything not in this list is silently ignored.
const TABLE_ALLOWLIST = new Set([
  "crm_leads", "crm_contacts", "crm_organizations", "crm_deals", "crm_activities",
  "crm_quotations", "crm_invoices", "crm_payments", "crm_support_tickets",
  "crm_feedback_surveys", "crm_tasks", "crm_documents", "crm_field_visits",
  "crm_expenses", "crm_products", "crm_hydrogeo_enquiries",
  "contact_messages", "profiles", "site_settings",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!EXT_URL || !EXT_KEY) {
      return new Response(JSON.stringify({ error: "External Supabase secrets not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller has the mirror webhook secret stored in _mirror_config.secret.
    const provided = req.headers.get("x-mirror-secret") ?? "";
    if (!provided) {
      return new Response(JSON.stringify({ error: "Missing mirror secret" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = adminClient();
    const { data: cfg } = await sb.from("_mirror_config").select("secret").eq("id", 1).maybeSingle();
    if (!cfg?.secret || cfg.secret !== provided) {
      return new Response(JSON.stringify({ error: "Invalid mirror secret" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { table, op, record, old_record } = await req.json();
    if (!table || !op) {
      return new Response(JSON.stringify({ error: "table and op required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!TABLE_ALLOWLIST.has(table)) {
      return new Response(JSON.stringify({ ok: true, skipped: "table not allowed" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ext = createClient(EXT_URL, EXT_KEY, { auth: { persistSession: false } });

    let result;
    if (op === "INSERT" || op === "UPDATE") {
      result = await ext.from(table).upsert(record, { onConflict: "id" });
    } else if (op === "DELETE") {
      const id = (old_record ?? record)?.id;
      if (!id) throw new Error("DELETE requires id");
      result = await ext.from(table).delete().eq("id", id);
    } else {
      throw new Error(`Unknown op: ${op}`);
    }

    if (result.error) {
      console.error(`mirror ${op} ${table} failed:`, result.error.message);
      return new Response(JSON.stringify({ ok: false, error: result.error.message }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("external-mirror error:", e?.message ?? e);
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
