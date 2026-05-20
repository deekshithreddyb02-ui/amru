// Builds a per-user in-app digest of unread notifications.
// Respects user preferences (digest_frequency, quiet_hours, in_app_enabled).
// Designed to be called on a schedule (hourly) or manually.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders, requireAdmin } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const _auth = await requireAdmin(req);
  if (!_auth.ok) return _auth.response;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";
    const now = new Date();
    const nowHHMM = now.toTimeString().slice(0, 5);

    // Pull all preferences (small table; per-user)
    const { data: prefs, error: prefsErr } = await supabase
      .from("crm_notification_preferences")
      .select("user_id, workspace_id, in_app_enabled, digest_frequency, quiet_hours_start, quiet_hours_end, muted_types");
    if (prefsErr) throw prefsErr;

    let created = 0;
    let skipped = 0;

    for (const p of prefs || []) {
      if (!p.in_app_enabled) { skipped++; continue; }
      if (p.digest_frequency === "off" || p.digest_frequency === "instant") { skipped++; continue; }

      // Quiet hours
      if (p.quiet_hours_start && p.quiet_hours_end && !force) {
        const s = String(p.quiet_hours_start).slice(0, 5);
        const e = String(p.quiet_hours_end).slice(0, 5);
        const inQuiet = s < e ? (nowHHMM >= s && nowHHMM < e) : (nowHHMM >= s || nowHHMM < e);
        if (inQuiet) { skipped++; continue; }
      }

      const sinceMs = p.digest_frequency === "weekly" ? 7 * 86400000 : 86400000;
      const sinceIso = new Date(Date.now() - sinceMs).toISOString();

      let q = supabase
        .from("crm_notifications")
        .select("id, type, title, created_at", { count: "exact" })
        .eq("user_id", p.user_id)
        .eq("is_read", false)
        .gte("created_at", sinceIso);
      if (p.workspace_id) q = q.eq("workspace_id", p.workspace_id);

      const { data: items, count } = await q.order("created_at", { ascending: false }).limit(50);
      const total = count || items?.length || 0;
      if (total === 0) { skipped++; continue; }

      // Skip muted types in summary count
      const muted = new Set<string>(p.muted_types || []);
      const visible = (items || []).filter((i) => !muted.has(i.type));
      if (visible.length === 0) { skipped++; continue; }

      const topTypes = Array.from(new Set(visible.map((i) => i.type))).slice(0, 3).join(", ");
      const periodLabel = p.digest_frequency === "weekly" ? "this week" : "today";

      // De-dup: skip if a digest already created in the window
      const { data: existing } = await supabase
        .from("crm_notifications")
        .select("id")
        .eq("user_id", p.user_id)
        .eq("type", "digest")
        .gte("created_at", sinceIso)
        .limit(1);
      if (existing && existing.length > 0 && !force) { skipped++; continue; }

      const { error: insErr } = await supabase.from("crm_notifications").insert({
        user_id: p.user_id,
        workspace_id: p.workspace_id,
        type: "digest",
        title: `${visible.length} new updates ${periodLabel}`,
        body: `Recent activity: ${topTypes}`,
        link: "/notifications",
      });
      if (insErr) { skipped++; continue; }
      created++;
    }

    return new Response(JSON.stringify({ ok: true, created, skipped, at: now.toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
