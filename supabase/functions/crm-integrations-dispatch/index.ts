// Dispatch CRM events to Slack / Gmail via Lovable connector gateway.
// No-ops gracefully when corresponding connector secret is missing.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  const raw = btoa(
    [`To: ${to}`, `Subject: ${subject}`, 'Content-Type: text/html; charset="UTF-8"', "", body].join("\r\n")
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
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
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
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
