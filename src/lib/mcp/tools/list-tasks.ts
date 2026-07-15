import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, errorResult, jsonResult } from "./_supabase";

export default defineTool({
  name: "list_tasks",
  title: "List tasks",
  description: "List CRM tasks in a workspace, most recent first.",
  inputSchema: {
    workspace_id: z.string().uuid(),
    limit: z.number().int().min(1).max(100).default(25),
    status: z.string().optional().describe("Optional status filter (e.g. open, done)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ workspace_id, limit, status }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const sb = supabaseForUser(ctx);
    let q = sb
      .from("crm_tasks")
      .select("id, title, status, priority, due_date, assigned_to, created_at")
      .eq("workspace_id", workspace_id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return jsonResult({ tasks: data ?? [] });
  },
});
