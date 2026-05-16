// CRM AI Copilot — answers questions about CRM data using Lovable AI Gateway.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "");
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: u } = await sb.auth.getUser(token);
    if (!u?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, workspace_id } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull lightweight context summary scoped to workspace
    let context = "";
    if (workspace_id) {
      const [{ count: leads }, { count: deals }, { count: tickets }, { data: pipeline }] = await Promise.all([
        sb.from("crm_leads").select("id", { count: "exact", head: true }).eq("workspace_id", workspace_id),
        sb.from("crm_deals").select("id", { count: "exact", head: true }).eq("workspace_id", workspace_id),
        sb.from("crm_support_tickets").select("id", { count: "exact", head: true }).eq("workspace_id", workspace_id).neq("status", "closed"),
        sb.from("crm_deals").select("stage,amount").eq("workspace_id", workspace_id).limit(500),
      ]);
      const byStage: Record<string, { count: number; value: number }> = {};
      (pipeline ?? []).forEach((d: any) => {
        const k = d.stage ?? "unknown";
        byStage[k] ??= { count: 0, value: 0 };
        byStage[k].count++;
        byStage[k].value += Number(d.amount || 0);
      });
      context = `CRM workspace summary:
- Total leads: ${leads ?? 0}
- Total deals: ${deals ?? 0}
- Open tickets: ${tickets ?? 0}
- Pipeline by stage: ${JSON.stringify(byStage)}`;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          {
            role: "system",
            content: `You are an expert CRM copilot for Amruta Hydrogeo Services. Be concise, action-oriented and cite numbers from the workspace context. Suggest next actions when helpful. Never invent records.

${context}`,
          },
          ...messages,
        ],
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached, try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable workspace settings." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok || !resp.body) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(resp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("copilot error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
