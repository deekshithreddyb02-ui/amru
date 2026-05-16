// Cron-driven reminder dispatcher for crm_activities.
// - Finds planned/in-progress activities whose due_at has passed (with reminder lead time)
// - Inserts in-app notifications (crm_notifications) for the assigned user
// - Marks them as reminded = true so they're not processed again
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

    // 1. Activity reminders
    const { data: due, error } = await supabase
      .from("crm_activities")
      .select(
        "id, workspace_id, subject, activity_type, due_at, assigned_to, created_by, reminder_minutes_before, status",
      )
      .lte("due_at", nowIso)
      .eq("reminded", false)
      .in("status", ["planned", "in_progress"])
      .limit(200);

    if (error) throw error;

    let activityNotifs = 0;
    if (due && due.length > 0) {
      // Create notifications for assignee (or creator if no assignee)
      const notifications = due
        .map((a) => {
          const userId = a.assigned_to || a.created_by;
          if (!userId) return null;
          return {
            user_id: userId,
            workspace_id: a.workspace_id,
            type: "activity_reminder",
            title: `Reminder: ${a.subject}`,
            body: `Your ${a.activity_type} was due ${new Date(a.due_at).toLocaleString("en-IN")}`,
            link: `/crm/__SLUG__/activities`,
            related_entity_type: "activity",
            related_entity_id: a.id,
          };
        })
        .filter(Boolean);

      if (notifications.length > 0) {
        const { error: nErr } = await supabase
          .from("crm_notifications")
          .insert(notifications);
        if (nErr) console.error("Notification insert error:", nErr);
        else activityNotifs = notifications.length;
      }

      const ids = due.map((a) => a.id);
      const { error: updErr } = await supabase
        .from("crm_activities")
        .update({ reminded: true })
        .in("id", ids);
      if (updErr) throw updErr;
    }

    // 2. Overdue invoice reminders (run once per day per invoice — rough check)
    const today = new Date().toISOString().split("T")[0];
    const { data: overdueInvoices } = await supabase
      .from("crm_invoices")
      .select("id, workspace_id, invoice_number, total, paid_amount, due_date, created_by, customer_name")
      .lt("due_date", today)
      .in("status", ["unpaid", "partial", "overdue"])
      .limit(50);

    let invoiceNotifs = 0;
    if (overdueInvoices && overdueInvoices.length > 0) {
      // Mark as overdue + notify creator
      const ids = overdueInvoices.map((i) => i.id);
      await supabase
        .from("crm_invoices")
        .update({ status: "overdue" })
        .in("id", ids)
        .neq("status", "paid");

      const notifs = overdueInvoices
        .filter((i) => i.created_by)
        .map((i) => ({
          user_id: i.created_by!,
          workspace_id: i.workspace_id,
          type: "invoice_overdue",
          title: `Invoice ${i.invoice_number} overdue`,
          body: `${i.customer_name} — ₹${(i.total - i.paid_amount).toLocaleString("en-IN")} pending since ${i.due_date}`,
          link: `/crm/__SLUG__/invoices`,
          related_entity_type: "invoice",
          related_entity_id: i.id,
        }));

      if (notifs.length > 0) {
        await supabase.from("crm_notifications").insert(notifs);
        invoiceNotifs = notifs.length;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        at: nowIso,
        activity_reminders: activityNotifs,
        invoice_reminders: invoiceNotifs,
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
