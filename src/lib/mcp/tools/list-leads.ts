import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, errorResult, jsonResult } from "./_supabase";

export default defineTool({
  name: "list_leads",
  title: "List leads",
  description: "List CRM leads in a workspace. Results honor the signed-in user's access.",
  inputSchema: {
    workspace_id: z.string().uuid().describe("Workspace ID (from list_workspaces)."),
    limit: z.number().int().min(1).max(100).default(25).describe("Maximum number of leads to return."),
    status: z.string().optional().describe("Optional status filter (e.g. new, qualified)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ workspace_id, limit, status }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const sb = supabaseForUser(ctx);
    let q = sb
      .from("crm_leads")
      .select("id, name, email, phone, status, source, created_at")
      .eq("workspace_id", workspace_id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return jsonResult({ leads: data ?? [] });
  },
});
