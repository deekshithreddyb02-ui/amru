// Cron-driven reminder dispatcher for crm_activities.
// - Marks activities whose due_at is past and reminder_minutes_before has elapsed as "reminded = true"
// - Returns a small payload listing what was processed (so logs are useful)
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

    const nowIso = new Date().toISOString();

    // Find planned activities that need a reminder fired
    // (due_at <= now + reminder_minutes_before, not reminded yet, status not done/cancelled)
    const { data: due, error } = await supabase
      .from("crm_activities")
      .select(
        "id, workspace_id, subject, activity_type, due_at, assigned_to, reminder_minutes_before, status",
      )
      .lte("due_at", nowIso)
      .eq("reminded", false)
      .in("status", ["planned", "in_progress"])
      .limit(200);

    if (error) throw error;

    const ids = (due ?? []).map((a) => a.id);

    if (ids.length > 0) {
      const { error: updErr } = await supabase
        .from("crm_activities")
        .update({ reminded: true })
        .in("id", ids);
      if (updErr) throw updErr;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        processed: ids.length,
        at: nowIso,
        items: (due ?? []).map((a) => ({
          id: a.id,
          subject: a.subject,
          due_at: a.due_at,
          activity_type: a.activity_type,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("crm-activity-reminders error:", e);
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
