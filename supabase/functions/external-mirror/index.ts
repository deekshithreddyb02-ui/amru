import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EXT_URL = Deno.env.get("EXTERNAL_SUPABASE_URL")!;
const EXT_KEY = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!EXT_URL || !EXT_KEY) {
      return new Response(JSON.stringify({ error: "External Supabase secrets not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { table, op, record, old_record } = await req.json();
    if (!table || !op) {
      return new Response(JSON.stringify({ error: "table and op required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ext = createClient(EXT_URL, EXT_KEY, { auth: { persistSession: false } });

    let result;
    if (op === "INSERT" || op === "UPDATE") {
      // upsert by id (covers both)
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
