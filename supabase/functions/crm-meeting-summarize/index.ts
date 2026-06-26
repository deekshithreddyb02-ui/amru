// Meeting summarizer: accepts pasted transcript or audio file (storage path)
// Returns summary, action items, follow-ups, persists to crm_meeting_summaries.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  workspace_id: string;
  title: string;
  meeting_date?: string;
  source_type: "paste" | "audio";
  transcript?: string;
  audio_path?: string; // path inside crm-documents bucket
  lead_id?: string;
  deal_id?: string;
  contact_id?: string;
  activity_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body: Body = await req.json();
    if (!body.workspace_id || !body.title || !body.source_type) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const MAX_TRANSCRIPT_LEN = 100_000;
    if (body.transcript && body.transcript.length > MAX_TRANSCRIPT_LEN) {
      return new Response(JSON.stringify({ error: `Transcript too long (max ${MAX_TRANSCRIPT_LEN} chars)` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify membership
    const { data: member } = await supabase
      .from("crm_workspace_members")
      .select("id")
      .eq("workspace_id", body.workspace_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member) return new Response(JSON.stringify({ error: "Not a member" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Insert pending row
    const { data: row, error: insErr } = await supabase
      .from("crm_meeting_summaries")
      .insert({
        workspace_id: body.workspace_id,
        created_by: user.id,
        title: body.title,
        meeting_date: body.meeting_date || null,
        source_type: body.source_type,
        source_audio_path: body.audio_path || null,
        transcript: body.source_type === "paste" ? body.transcript : null,
        lead_id: body.lead_id || null,
        deal_id: body.deal_id || null,
        contact_id: body.contact_id || null,
        activity_id: body.activity_id || null,
        status: "processing",
      })
      .select()
      .single();
    if (insErr) throw insErr;

    let transcript = body.transcript || "";

    // For audio: download from storage, send to AI for transcription via inline base64
    if (body.source_type === "audio" && body.audio_path) {
      const { data: file, error: dlErr } = await supabase.storage.from("crm-documents").download(body.audio_path);
      if (dlErr || !file) throw new Error("Failed to download audio: " + (dlErr?.message ?? "unknown"));

      const buf = new Uint8Array(await file.arrayBuffer());
      // Inline base64 to gemini multimodal
      let bin = "";
      for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      const b64 = btoa(bin);
      const mime = file.type || "audio/mpeg";

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      const tResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: "Transcribe this meeting audio verbatim. Include speaker labels if distinguishable. Output only the transcript." },
              { type: "input_audio", input_audio: { data: b64, format: mime.includes("wav") ? "wav" : "mp3" } },
            ],
          }],
        }),
      });
      if (!tResp.ok) throw new Error(`Transcription failed: ${tResp.status}`);
      const tData = await tResp.json();
      transcript = tData.choices?.[0]?.message?.content || "";
      await supabase.from("crm_meeting_summaries").update({ transcript }).eq("id", row.id);
    }

    if (!transcript || transcript.length < 20) {
      await supabase.from("crm_meeting_summaries").update({ status: "failed", error_message: "Transcript too short" }).eq("id", row.id);
      return new Response(JSON.stringify({ error: "Transcript too short" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Summarize with structured output
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const sResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Extract structured meeting insights. Be concise and specific." },
          { role: "user", content: `Meeting title: ${body.title}\n\nTranscript:\n${transcript.slice(0, 30000)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_summary",
            description: "Submit meeting summary",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "3-6 sentence executive summary" },
                participants: { type: "array", items: { type: "string" } },
                action_items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      task: { type: "string" },
                      owner: { type: "string" },
                      due: { type: "string" },
                    },
                    required: ["task"],
                  },
                },
                follow_ups: { type: "array", items: { type: "string" } },
              },
              required: ["summary", "action_items", "follow_ups"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_summary" } },
      }),
    });

    if (!sResp.ok) {
      if (sResp.status === 429 || sResp.status === 402) {
        await supabase.from("crm_meeting_summaries").update({ status: "failed", error_message: `AI ${sResp.status}` }).eq("id", row.id);
        return new Response(JSON.stringify({ error: sResp.status === 429 ? "Rate limit" : "Credits exhausted" }), { status: sResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`Summarize failed: ${sResp.status}`);
    }
    const sData = await sResp.json();
    const tc = sData.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = tc ? JSON.parse(tc.function.arguments) : { summary: "", action_items: [], follow_ups: [], participants: [] };

    const { data: updated } = await supabase
      .from("crm_meeting_summaries")
      .update({
        summary: parsed.summary,
        action_items: parsed.action_items,
        follow_ups: parsed.follow_ups,
        participants: parsed.participants,
        status: "ready",
      })
      .eq("id", row.id)
      .select()
      .single();

    await supabase.from("crm_audit_log").insert({
      workspace_id: body.workspace_id,
      actor_id: user.id,
      actor_email: user.email,
      action: "created",
      entity_type: "meeting_summary",
      entity_id: row.id,
      entity_label: body.title,
    });

    return new Response(JSON.stringify({ ok: true, summary: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("crm-meeting-summarize error:", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
