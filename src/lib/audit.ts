import { supabase } from "@/integrations/supabase/client";

export type AuditAction = "created" | "updated" | "deleted" | "approved" | "rejected" | "sent" | "submitted";

export interface AuditEntry {
  workspace_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  entity_label?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function logAudit(_entry: AuditEntry) {
  // No-op: audit log entries are written automatically by database triggers
  // (crm_audit_trigger) using SECURITY DEFINER. Direct client inserts are
  // disabled to prevent forgery of audit trail entries.
  return;
}

