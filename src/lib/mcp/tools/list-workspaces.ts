import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser, errorResult, jsonResult } from "./_supabase";

export default defineTool({
  name: "list_workspaces",
  title: "List my CRM workspaces",
  description: "List CRM workspaces the signed-in user is a member of.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("crm_workspace_members")
      .select("workspace_id, role, crm_workspaces(id, name, slug)")
      .eq("user_id", ctx.getUserId());
    if (error) return errorResult(error.message);
    return jsonResult({ workspaces: data ?? [] });
  },
});
