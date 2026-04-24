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

export async function logAudit(entry: AuditEntry) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase as any).from("crm_audit_log").insert({
      workspace_id: entry.workspace_id,
      actor_id: user.id,
      actor_email: user.email,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      entity_label: entry.entity_label,
      changes: entry.changes ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch (e) {
    console.warn("Audit log failed (non-blocking):", e);
  }
}
