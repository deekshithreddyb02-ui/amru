import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoami from "./tools/whoami";
import listWorkspaces from "./tools/list-workspaces";
import listLeads from "./tools/list-leads";
import listDeals from "./tools/list-deals";
import listTasks from "./tools/list-tasks";
import createLead from "./tools/create-lead";
import createTask from "./tools/create-task";

// Direct supabase.co host for the OAuth issuer (never the .lovable.cloud proxy).
// Vite inlines VITE_SUPABASE_PROJECT_ID at build time, so this stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "amruta-crm-mcp",
  title: "Amruta CRM",
  version: "0.1.0",
  instructions:
    "Tools to read and manage Amruta CRM data (workspaces, leads, deals, tasks) as the signed-in user. Call `list_workspaces` first to get a `workspace_id` for the other tools.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoami, listWorkspaces, listLeads, listDeals, listTasks, createLead, createTask],
});
