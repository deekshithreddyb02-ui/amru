// Project Report AI generator (multimodal: entity data + free text + photos)
// Creates a new version on every call. Uses workspace template + Lovable AI Gateway.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  workspace_id: string;
  report_id?: string;          // if present → regenerate (new version)
  template_id?: string;        // required when creating
  title?: string;              // required when creating
  description?: string;
  related_to_type?: string;    // 'lead' | 'deal' | 'hydrogeo' | 'contact' | 'organization'
  related_to_id?: string;
  customer_contact_id?: string;
  customer_org_id?: string;
  user_inputs?: Record<string, unknown>; // free-text scope/notes/etc.
  photo_paths?: string[];      // storage paths in crm-report-photos bucket
  model_override?: string;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Unauthorized" });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json(401, { error: "Unauthorized" });

    const body: Body = await req.json();
    if (!body.workspace_id) return json(400, { error: "workspace_id required" });

    // membership check
    const { data: member } = await supabase
      .from("crm_workspace_members")
      .select("id")
      .eq("workspace_id", body.workspace_id)
      .eq("user_id", user.id)
      .maybeSingle();
    const { data: superAdmin } = await supabase.rpc("is_super_admin", { _user_id: user.id });
    if (!member && !superAdmin) return json(403, { error: "Not a workspace member" });

    // Resolve report (existing or new)
    let reportId = body.report_id;
    let report: any = null;

    if (reportId) {
      const r = await supabase.from("crm_ai_reports").select("*").eq("id", reportId).eq("workspace_id", body.workspace_id).maybeSingle();
      if (!r.data) return json(404, { error: "Report not found" });
      report = r.data;
    } else {
      if (!body.template_id || !body.title) return json(400, { error: "template_id and title required for new report" });
      const ins = await supabase.from("crm_ai_reports").insert({
        workspace_id: body.workspace_id,
        template_id: body.template_id,
        title: body.title,
        description: body.description ?? null,
        related_to_type: body.related_to_type ?? null,
        related_to_id: body.related_to_id ?? null,
        customer_contact_id: body.customer_contact_id ?? null,
        customer_org_id: body.customer_org_id ?? null,
        primary_owner_user_id: user.id,
        created_by: user.id,
        status: "draft",
      }).select("*").single();
      if (ins.error) return json(500, { error: ins.error.message });
      report = ins.data;
      reportId = report.id;
      // Auto-assign creator as owner
      await supabase.from("crm_ai_report_assignments").insert({
        workspace_id: body.workspace_id, report_id: reportId, user_id: user.id, role: "owner", assigned_by: user.id,
      });
    }

    // Load template
    const { data: tpl } = await supabase
      .from("crm_ai_report_templates")
      .select("*")
      .eq("id", report.template_id)
      .maybeSingle();
    if (!tpl) return json(400, { error: "Template not found" });

    // Gather linked entity data
    let entityContext = "";
    if (report.related_to_type && report.related_to_id) {
      const tableMap: Record<string, string> = {
        lead: "crm_leads",
        deal: "crm_deals",
        hydrogeo: "crm_hydrogeo_enquiries",
        contact: "crm_contacts",
        organization: "crm_organizations",
        ticket: "crm_support_tickets",
      };
      const tbl = tableMap[report.related_to_type];
      if (tbl) {
        const { data: ent } = await supabase.from(tbl).select("*").eq("id", report.related_to_id).maybeSingle();
        if (ent) entityContext = `\n\n## Linked ${report.related_to_type} data (JSON)\n\`\`\`json\n${JSON.stringify(ent, null, 2)}\n\`\`\``;
      }
    }
    if (report.customer_contact_id) {
      const { data: c } = await supabase.from("crm_contacts").select("*").eq("id", report.customer_contact_id).maybeSingle();
      if (c) entityContext += `\n\n## Customer contact\n\`\`\`json\n${JSON.stringify(c, null, 2)}\n\`\`\``;
    }
    if (report.customer_org_id) {
      const { data: o } = await supabase.from("crm_organizations").select("*").eq("id", report.customer_org_id).maybeSingle();
      if (o) entityContext += `\n\n## Customer organization\n\`\`\`json\n${JSON.stringify(o, null, 2)}\n\`\`\``;
    }

    // Build photo content (signed URLs → fetch → base64)
    const photoPaths = body.photo_paths ?? [];
    const photoParts: any[] = [];
    for (const path of photoPaths.slice(0, 6)) {
      try {
        const { data: signed } = await supabase.storage.from("crm-report-photos").createSignedUrl(path, 60);
        if (!signed?.signedUrl) continue;
        const resp = await fetch(signed.signedUrl);
        if (!resp.ok) continue;
        const buf = new Uint8Array(await resp.arrayBuffer());
        const b64 = btoa(String.fromCharCode(...buf));
        const mime = resp.headers.get("content-type") || "image/jpeg";
        photoParts.push({ type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } });
      } catch (e) {
        console.error("photo fetch failed", path, e);
      }
    }

    const userInputsBlock = body.user_inputs && Object.keys(body.user_inputs).length
      ? `\n\n## User-provided scope / notes\n\`\`\`json\n${JSON.stringify(body.user_inputs, null, 2)}\n\`\`\``
      : "";

    const systemPrompt = tpl.prompt_template;
    const userMessageText =
      `Title: ${report.title}\n` +
      (report.description ? `Description: ${report.description}\n` : "") +
      entityContext +
      userInputsBlock +
      (photoParts.length ? `\n\n${photoParts.length} site photo(s) attached for visual analysis.` : "") +
      `\n\nProduce the final report in clean Markdown only — no preamble, no code fences around the whole report.`;

    const userMessageContent: any = photoParts.length
      ? [{ type: "text", text: userMessageText }, ...photoParts]
      : userMessageText;

    const ALLOWED_MODELS = new Set([
      "google/gemini-2.5-flash",
      "google/gemini-2.5-pro",
      "google/gemini-2.5-flash-lite",
      "google/gemini-3-flash-preview",
      "google/gemini-3-pro-preview",
    ]);
    if (body.model_override && !ALLOWED_MODELS.has(body.model_override)) {
      return json(400, { error: "Model not permitted" });
    }
    const candidateModel = body.model_override || tpl.default_model || "google/gemini-2.5-flash";
    const model = ALLOWED_MODELS.has(candidateModel) ? candidateModel : "google/gemini-2.5-flash";
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessageContent },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errTxt = await aiResp.text();
      if (aiResp.status === 429) return json(429, { error: "AI rate limit, try again shortly" });
      if (aiResp.status === 402) return json(402, { error: "AI credits exhausted — top up Lovable AI" });
      return json(500, { error: `AI error: ${errTxt}` });
    }

    const aiJson = await aiResp.json();
    const markdown = aiJson?.choices?.[0]?.message?.content?.trim() || "*AI returned no content*";

    // Mark previous versions not current
    await supabase.from("crm_ai_report_versions")
      .update({ is_current: false })
      .eq("report_id", reportId);

    const nextVersion = (report.current_version || 0) + 1;
    const ver = await supabase.from("crm_ai_report_versions").insert({
      workspace_id: body.workspace_id,
      report_id: reportId,
      version_no: nextVersion,
      ai_model: model,
      ai_prompt: systemPrompt,
      user_inputs: body.user_inputs ?? null,
      photo_paths: photoPaths,
      rendered_markdown: markdown,
      ai_response: aiJson,
      is_current: true,
      created_by: user.id,
    }).select("*").single();
    if (ver.error) return json(500, { error: ver.error.message });

    await supabase.from("crm_ai_reports")
      .update({ current_version: nextVersion, status: report.status === "draft" ? "draft" : report.status })
      .eq("id", reportId);

    await supabase.from("crm_ai_report_status_log").insert({
      workspace_id: body.workspace_id,
      report_id: reportId,
      from_status: null,
      to_status: nextVersion === 1 ? "draft" : "regenerated",
      by_user_id: user.id,
      note: `Generated version ${nextVersion} via ${model}`,
    });

    return json(200, { ok: true, report_id: reportId, version_no: nextVersion, markdown });
  } catch (e: any) {
    console.error(e);
    return json(500, { error: e.message ?? "Unknown error" });
  }
});
