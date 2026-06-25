// Dispatch CRM events to Slack / Gmail / Calendar via Lovable connector gateway.
// Requires an authenticated CRM user (workspace member).
import { corsHeaders, requireAuthenticated, adminClient } from "../_shared/auth.ts";

const GW = "https://connector-gateway.lovable.dev";

async function sendSlack(channel: string, text: string) {
  const lovKey = Deno.env.get("LOVABLE_API_KEY");
  const slackKey = Deno.env.get("SLACK_API_KEY");
  if (!lovKey || !slackKey) return { ok: false, skipped: "slack_not_connected" };
  const r = await fetch(`${GW}/slack/api/chat.postMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovKey}`,
      "X-Connection-Api-Key": slackKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel, text }),
  });
  const d = await r.json();
  return { ok: !!d.ok, response: d };
}

async function sendGmail(to: string, subject: string, body: string) {
  const lovKey = Deno.env.get("LOVABLE_API_KEY");
  const gmailKey = Deno.env.get("GOOGLE_MAIL_API_KEY");
  if (!lovKey || !gmailKey) return { ok: false, skipped: "gmail_not_connected" };
  // Strip CR/LF to prevent RFC 2822 header injection (e.g., injected Bcc).
  const sanitizeHeader = (v: string) => String(v ?? "").replace(/[\r\n]+/g, " ").trim();
  const safeTo = sanitizeHeader(to);
  const safeSubject = sanitizeHeader(subject);
  // Validate recipient as a single RFC 5321-ish address with no newlines.
  if (!safeTo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeTo)) {
    return { ok: false, error: "invalid_to_address" };
  }
  const raw = btoa(
    [`To: ${safeTo}`, `Subject: ${safeSubject}`, 'Content-Type: text/html; charset="UTF-8"', "", body].join("\r\n")
  ).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const r = await fetch(`${GW}/google_mail/gmail/v1/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovKey}`,
      "X-Connection-Api-Key": gmailKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  const d = await r.json();
  return { ok: r.ok, response: d };
}

async function createCalendarEvent(summary: string, description: string, start: string, end: string, attendees: string[] = []) {
  const lovKey = Deno.env.get("LOVABLE_API_KEY");
  const calKey = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
  if (!lovKey || !calKey) return { ok: false, skipped: "calendar_not_connected" };
  const r = await fetch(`${GW}/google_calendar/calendar/v3/calendars/primary/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovKey}`,
      "X-Connection-Api-Key": calKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary, description,
      start: { dateTime: start },
      end: { dateTime: end },
      attendees: attendees.map((email) => ({ email })),
    }),
  });
  const d = await r.json();
  return { ok: r.ok, response: d };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require an authenticated CRM user (or internal service caller).
  const auth = await requireAuthenticated(req);
  if (!auth.ok) return auth.response;

  // Caller must be a member of at least one CRM workspace (or service caller).
  if (!auth.isService) {
    const sb = adminClient();
    const { count } = await sb
      .from("crm_workspace_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", auth.userId);
    if (!count) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const body = await req.json();
    const { action, payload } = body ?? {};
    let result: unknown = { ok: false, error: "unknown action" };

    if (action === "slack_message") {
      result = await sendSlack(payload.channel, payload.text);
    } else if (action === "send_email") {
      result = await sendGmail(payload.to, payload.subject, payload.body);
    } else if (action === "create_event") {
      result = await createCalendarEvent(payload.summary, payload.description ?? "", payload.start, payload.end, payload.attendees ?? []);
    } else if (action === "status") {
      result = {
        ok: true,
        slack: !!Deno.env.get("SLACK_API_KEY"),
        gmail: !!Deno.env.get("GOOGLE_MAIL_API_KEY"),
        calendar: !!Deno.env.get("GOOGLE_CALENDAR_API_KEY"),
      };
    }
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
