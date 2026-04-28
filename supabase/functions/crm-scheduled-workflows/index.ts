// Cron-driven scheduled workflow + SLA breach dispatcher.
// Calls the SQL function crm_run_scheduled_workflows() which:
//  - Notifies assignees of SLA-breached tickets (once)
//  - Runs scheduled workflow rules against overdue activities, overdue invoices,
//    and stale leads, executing their configured actions.
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("crm_run_scheduled_workflows");
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, result: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("crm-scheduled-workflows error:", e);
    return new Response(
      JSON.stringify({
        ok: false,
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
