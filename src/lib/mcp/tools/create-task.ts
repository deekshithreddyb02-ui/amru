import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, errorResult, jsonResult } from "./_supabase";

export default defineTool({
  name: "create_task",
  title: "Create task",
  description: "Create a new CRM task in a workspace for the signed-in user.",
  inputSchema: {
    workspace_id: z.string().uuid(),
    title: z.string().trim().min(1),
    description: z.string().max(4000).optional(),
    due_date: z.string().optional().describe("Due date (ISO date or datetime)."),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ workspace_id, title, description, due_date, priority }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("crm_tasks")
      .insert({
        workspace_id,
        title,
        description: description ?? null,
        due_date: due_date ?? null,
        priority,
        status: "open",
        created_by: ctx.getUserId(),
        assigned_to: ctx.getUserId(),
      })
      .select("id, title, status, priority, due_date, created_at")
      .single();
    if (error) return errorResult(error.message);
    return jsonResult({ task: data });
  },
});
