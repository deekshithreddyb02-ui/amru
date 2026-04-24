// Hybrid lead scoring: deterministic rules pre-filter -> AI re-rank top N.
// Run hourly via cron. Updates crm_leads.ai_hot_score + score_reasoning.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Lead {
  id: string;
  workspace_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  service_needed: string | null;
  biz_area: string | null;
  biz_cost: number | null;
  expected_close: string | null;
  notes: string | null;
  stage: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const ruleScore = (l: Lead): { score: number; reasons: string[] } => {
  let s = 0;
  const reasons: string[] = [];
  // Recency (max 20)
  const ageHours = (Date.now() - new Date(l.created_at).getTime()) / 36e5;
  if (ageHours < 24) { s += 20; reasons.push("Created in last 24h"); }
  else if (ageHours < 72) { s += 12; reasons.push("Created in last 3 days"); }
  else if (ageHours < 168) { s += 6; reasons.push("Created in last week"); }

  // Completeness (max 25)
  let comp = 0;
  if (l.email) comp += 5;
  if (l.phone || l.whatsapp) comp += 8;
  if (l.city && l.state) comp += 5;
  if (l.service_needed) comp += 4;
  if (l.notes && l.notes.length > 30) comp += 3;
  s += comp;
  if (comp >= 20) reasons.push("Highly complete profile");

  // Budget signal (max 25)
  if (l.biz_cost) {
    if (l.biz_cost >= 500000) { s += 25; reasons.push("Budget ≥ ₹5L"); }
    else if (l.biz_cost >= 100000) { s += 18; reasons.push("Budget ≥ ₹1L"); }
    else if (l.biz_cost >= 25000) { s += 10; reasons.push("Budget ≥ ₹25k"); }
    else { s += 4; }
  }

  // Stage progression (max 15)
  const stageScore: Record<string, number> = { new: 5, contacted: 8, qualified: 12, proposal: 15, negotiation: 15 };
  s += stageScore[l.stage] ?? 0;

  // Expected close near (max 15)
  if (l.expected_close) {
    const days = (new Date(l.expected_close).getTime() - Date.now()) / 864e5;
    if (days >= 0 && days <= 14) { s += 15; reasons.push("Closing within 2 weeks"); }
    else if (days > 14 && days <= 45) { s += 8; reasons.push("Closing within 45 days"); }
  }

  return { score: Math.min(100, Math.round(s)), reasons };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // 1. Pull recently updated, open leads
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const { data: leads, error } = await supabase
      .from("crm_leads")
      .select("*")
      .eq("status", "open")
      .gte("updated_at", since)
      .limit(500);
    if (error) throw error;
    if (!leads || leads.length === 0) {
      return new Response(JSON.stringify({ ok: true, scored: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Rule-based scoring
    const scored = (leads as Lead[]).map((l) => ({ lead: l, ...ruleScore(l) }));

    // 3. Top N go to AI re-rank
    scored.sort((a, b) => b.score - a.score);
    const topN = scored.slice(0, Math.min(20, scored.length));

    let aiResults: Record<string, { ai_score: number; reasoning: string }> = {};

    if (LOVABLE_API_KEY && topN.length > 0) {
      const aiPayload = topN.map((s) => ({
        id: s.lead.id,
        full_name: s.lead.full_name,
        service: s.lead.service_needed,
        budget: s.lead.biz_cost,
        stage: s.lead.stage,
        location: [s.lead.city, s.lead.state].filter(Boolean).join(", "),
        notes: s.lead.notes?.slice(0, 300),
        rule_score: s.score,
      }));

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a sales-qualification assistant for a hydrogeology / borewell services company. Re-rank leads on intent strength. Return only the requested JSON via the tool." },
            { role: "user", content: `Re-rank these leads on intent and likelihood to convert in the next 30 days. For each, provide ai_score 0-100 and a 1-sentence reasoning.\n\nLeads:\n${JSON.stringify(aiPayload)}` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "submit_scores",
              description: "Submit lead scores",
              parameters: {
                type: "object",
                properties: {
                  scores: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        ai_score: { type: "number" },
                        reasoning: { type: "string" },
                      },
                      required: ["id", "ai_score", "reasoning"],
                    },
                  },
                },
                required: ["scores"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "submit_scores" } },
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const tc = data.choices?.[0]?.message?.tool_calls?.[0];
        if (tc) {
          try {
            const parsed = JSON.parse(tc.function.arguments);
            for (const r of parsed.scores ?? []) aiResults[r.id] = { ai_score: r.ai_score, reasoning: r.reasoning };
          } catch (e) { console.error("AI parse fail:", e); }
        }
      } else {
        console.error("AI rerank failed:", resp.status, await resp.text());
      }
    }

    // 4. Persist
    const nowIso = new Date().toISOString();
    let updated = 0;
    for (const s of scored) {
      const ai = aiResults[s.lead.id];
      const final = ai ? Math.round(0.4 * s.score + 0.6 * ai.ai_score) : s.score;
      const reasoning = ai ? ai.reasoning : s.reasons.join("; ");

      const { error: uErr } = await supabase
        .from("crm_leads")
        .update({ ai_hot_score: final, score_reasoning: reasoning, score_updated_at: nowIso })
        .eq("id", s.lead.id);
      if (!uErr) {
        updated++;
        await supabase.from("crm_lead_scoring_history").insert({
          workspace_id: s.lead.workspace_id,
          lead_id: s.lead.id,
          rule_score: s.score,
          ai_score: ai?.ai_score ?? null,
          final_score: final,
          reasoning,
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, scored: updated, ai_reranked: Object.keys(aiResults).length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("crm-lead-scoring error:", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
