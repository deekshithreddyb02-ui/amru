import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const PRIMARY_URL = Deno.env.get("SUPABASE_URL")!;
const PRIMARY_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EXT_URL = Deno.env.get("EXTERNAL_SUPABASE_URL")!;
const EXT_KEY = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;

const SKIP = new Set(["_mirror_config"]);

async function countExternal(ext: any, table: string): Promise<number | null> {
  try {
    const { count, error } = await ext.from(table).select("*", { count: "exact", head: true });
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const primary = createClient(PRIMARY_URL, PRIMARY_KEY, { auth: { persistSession: false } });
    const ext = createClient(EXT_URL, EXT_KEY, { auth: { persistSession: false } });

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const op = body.op || new URL(req.url).searchParams.get("op") || "stats";

    // Get primary table counts via SECURITY DEFINER RPC
    const { data: counts, error: countsErr } = await primary.rpc("get_public_table_counts_unrestricted");
    if (countsErr) throw countsErr;

    const tables = (counts || []).filter((c: any) => !SKIP.has(c.table_name));

    if (op === "stats") {
      const rows = await Promise.all(
        tables.map(async (c: any) => ({
          table: c.table_name,
          lovable: Number(c.row_count),
          external: await countExternal(ext, c.table_name),
        })),
      );
      return new Response(JSON.stringify({ ok: true, rows }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (op === "sync") {
      const results: any[] = [];
      for (const c of tables) {
        const table = c.table_name;
        try {
          // fetch all rows from primary in batches
          const batchSize = 500;
          let from = 0;
          let synced = 0;
          while (true) {
            const { data, error } = await primary
              .from(table)
              .select("*")
              .range(from, from + batchSize - 1);
            if (error) throw error;
            if (!data || data.length === 0) break;
            // upsert to external; tables without `id` column will fail — skip those
            const { error: upErr } = await ext.from(table).upsert(data, { onConflict: "id" });
            if (upErr) {
              results.push({ table, ok: false, error: upErr.message, synced });
              break;
            }
            synced += data.length;
            if (data.length < batchSize) break;
            from += batchSize;
          }
          if (!results.find((r) => r.table === table)) {
            results.push({ table, ok: true, synced });
          }
        } catch (e: any) {
          results.push({ table, ok: false, error: String(e?.message ?? e) });
        }
      }
      return new Response(JSON.stringify({ ok: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown op" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("db-analytics error:", e?.message ?? e);
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
