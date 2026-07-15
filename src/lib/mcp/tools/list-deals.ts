import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, errorResult, jsonResult } from "./_supabase";

export default defineTool({
  name: "list_deals",
  title: "List deals",
  description: "List CRM deals in a workspace, most recent first.",
  inputSchema: {
    workspace_id: z.string().uuid(),
    limit: z.number().int().min(1).max(100).default(25),
    stage: z.string().optional().describe("Optional stage filter."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ workspace_id, limit, stage }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const sb = supabaseForUser(ctx);
    let q = sb
      .from("crm_deals")
      .select("id, title, amount, currency, stage, probability, expected_close, created_at")
      .eq("workspace_id", workspace_id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (stage) q = q.eq("stage", stage);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return jsonResult({ deals: data ?? [] });
  },
});
