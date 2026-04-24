// AI report generator. 4 default templates + custom prompt.
// Aggregates workspace data, sends to Lovable AI, stores result in crm_reports.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEMPLATES: Record<string, { title: string; description: string; prompt: string }> = {
  pipeline_revenue: {
    title: "Weekly Pipeline & Revenue",
    description: "Sales pipeline health and revenue forecast",
    prompt: "Analyze the sales pipeline. Highlight: (1) total open pipeline value by stage, (2) deals likely to close in next 30 days, (3) revenue trend vs prior week, (4) risks or stuck deals. Use bullet points and short tables. End with 3 prioritized actions.",
  },
  conversion_funnel: {
    title: "Lead Conversion Funnel",
    description: "Funnel metrics from new lead to closed-won",
    prompt: "Build a funnel report. Show: (1) lead-to-qualified rate, (2) qualified-to-proposal rate, (3) proposal-to-won rate, (4) average time spent in each stage, (5) top 3 drop-off points with hypotheses. Recommend funnel improvements.",
  },
  hydrogeo_status: {
    title: "HydroGeo Survey Status",
    description: "Active borewell surveys, completion rate, recommendations",
    prompt: "Summarize active hydrogeology surveys: (1) status counts, (2) average days from request to scan, (3) recommendations summary by terrain/soil, (4) sites awaiting site visit. Flag delayed surveys (> 14 days pending).",
  },
  support_invoice_health: {
    title: "Support & Invoice Health",
    description: "Open tickets and invoice/payment standing",
    prompt: "Combined support & finance snapshot: (1) open tickets by priority and SLA breach risk, (2) outstanding invoice total and overdue amount, (3) top customers by outstanding balance, (4) recent payments collected. Recommend collection priorities.",
  },
};

interface Body {
  workspace_id: string;
  template_key?: string;
  custom_title?: string;
  custom_prompt?: string;
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
    if (!body.workspace_id) return new Response(JSON.stringify({ error: "workspace_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Verify membership
    const { data: member } = await supabase
      .from("crm_workspace_members")
      .select("id")
      .eq("workspace_id", body.workspace_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member) return new Response(JSON.stringify({ error: "Not a member" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const tmpl = body.template_key ? TEMPLATES[body.template_key] : null;
    const title = tmpl?.title || body.custom_title || "Custom Report";
    const promptInstructions = tmpl?.prompt || body.custom_prompt || "Provide a concise CRM analytics summary.";

    // Aggregate data
    const ws = body.workspace_id;
    const [leadsRes, dealsRes, invRes, payRes, ticketsRes, hydroRes] = await Promise.all([
      supabase.from("crm_leads").select("stage, status, biz_cost, ai_hot_score, created_at").eq("workspace_id", ws).limit(500),
      supabase.from("crm_deals").select("stage, amount, probability, expected_close, created_at").eq("workspace_id", ws).limit(500),
      supabase.from("crm_invoices").select("status, total, paid_amount, due_date, customer_name, created_at").eq("workspace_id", ws).limit(500),
      supabase.from("crm_payments").select("amount, paid_at").eq("workspace_id", ws).limit(500),
      supabase.from("crm_support_tickets").select("status, priority, category, created_at, resolved_at").eq("workspace_id", ws).limit(500),
      supabase.from("crm_hydrogeo_enquiries").select("survey_status, recommendation, terrain_type, created_at, preferred_visit_date").eq("workspace_id", ws).limit(500),
    ]);

    const dataset = {
      generated_at: new Date().toISOString(),
      leads: leadsRes.data || [],
      deals: dealsRes.data || [],
      invoices: invRes.data || [],
      payments: payRes.data || [],
      tickets: ticketsRes.data || [],
      hydrogeo: hydroRes.data || [],
    };

    // 1. Insert draft row
    const { data: report, error: insErr } = await supabase
      .from("crm_reports")
      .insert({
        workspace_id: ws,
        created_by: user.id,
        template_key: body.template_key || "custom",
        title,
        description: tmpl?.description || null,
        parameters: { prompt: promptInstructions },
        approval_status: "draft",
      })
      .select()
      .single();
    if (insErr) throw insErr;

    // 2. Call AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a CRM analytics writer. Use clear markdown with headings, bullets, and small tables. All currency in INR. Be concise (under 800 words)." },
          { role: "user", content: `${promptInstructions}\n\nDATA (JSON):\n${JSON.stringify(dataset).slice(0, 60000)}` },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      await supabase.from("crm_reports").update({ approval_status: "draft", content_markdown: `*AI generation failed: ${errText.slice(0, 300)}*` }).eq("id", report.id);
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Try later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error ${resp.status}`);
    }

    const aiData = await resp.json();
    const md = aiData.choices?.[0]?.message?.content || "*No content returned*";

    const { data: updated } = await supabase
      .from("crm_reports")
      .update({ content_markdown: md, generated_at: new Date().toISOString() })
      .eq("id", report.id)
      .select()
      .single();

    // 3. Audit
    await supabase.from("crm_audit_log").insert({
      workspace_id: ws,
      actor_id: user.id,
      actor_email: user.email,
      action: "created",
      entity_type: "report",
      entity_id: report.id,
      entity_label: title,
    });

    return new Response(JSON.stringify({ ok: true, report: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("crm-generate-report error:", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
