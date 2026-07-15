import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, errorResult, jsonResult } from "./_supabase";

export default defineTool({
  name: "create_lead",
  title: "Create lead",
  description: "Create a new lead in a CRM workspace for the signed-in user.",
  inputSchema: {
    workspace_id: z.string().uuid(),
    name: z.string().trim().min(1),
    email: z.string().email().optional(),
    phone: z.string().trim().max(30).optional(),
    source: z.string().trim().max(60).optional(),
    notes: z.string().max(4000).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ workspace_id, name, email, phone, source, notes }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("crm_leads")
      .insert({
        workspace_id,
        name,
        email: email ?? null,
        phone: phone ?? null,
        source: source ?? "mcp",
        notes: notes ?? null,
        created_by: ctx.getUserId(),
      })
      .select("id, name, email, phone, status, source, created_at")
      .single();
    if (error) return errorResult(error.message);
    return jsonResult({ lead: data });
  },
});
