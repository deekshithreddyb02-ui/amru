import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "./useUserRole";

export type CrmModule =
  | "leads"
  | "contacts"
  | "organizations"
  | "deals"
  | "activities"
  | "tickets"
  | "hydrogeo"
  | "documents"
  | "quotations"
  | "invoices"
  | "payments"
  | "reports"
  | "project_reports"
  | "performance";

export const CRM_MODULES: CrmModule[] = [
  "leads",
  "contacts",
  "organizations",
  "deals",
  "activities",
  "tickets",
  "hydrogeo",
  "documents",
  "quotations",
  "invoices",
  "payments",
  "reports",
  "project_reports",
  "performance",
];

export type CrmPerm = "view" | "create" | "edit" | "delete" | "approve";

export type CrmPermissionRow = {
  id: string;
  workspace_id: string;
  role: AppRole;
  module: CrmModule;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
};

/**
 * Loads the permission matrix for a workspace and exposes a `can(module, perm)`
 * helper for the current user (resolved via their workspace membership role).
 * Super admins and crm_admin always pass.
 */
export const useCrmPermissions = (workspaceId: string | undefined) => {
  const [rows, setRows] = useState<CrmPermissionRow[]>([]);
  const [myRole, setMyRole] = useState<AppRole | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;

      const [{ data: perms }, { data: roles }, { data: member }] = await Promise.all([
        supabase
          .from("crm_role_permissions")
          .select("*")
          .eq("workspace_id", workspaceId),
        uid
          ? supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", uid)
          : Promise.resolve({ data: [] as { role: AppRole }[] }),
        uid
          ? supabase
              .from("crm_workspace_members")
              .select("crm_role")
              .eq("workspace_id", workspaceId)
              .eq("user_id", uid)
              .maybeSingle()
          : Promise.resolve({ data: null as { crm_role: AppRole } | null }),
      ]);

      setRows((perms as CrmPermissionRow[]) || []);
      setIsSuperAdmin(
        (roles || []).some((r) => (r as { role: AppRole }).role === "super_admin")
      );
      setMyRole(((member as { crm_role: AppRole } | null)?.crm_role) || null);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const can = useCallback(
    (module: CrmModule, perm: CrmPerm): boolean => {
      if (isSuperAdmin) return true;
      if (myRole === "crm_admin") return true;
      if (!myRole) return false;
      const row = rows.find((r) => r.role === myRole && r.module === module);
      if (!row) return false;
      switch (perm) {
        case "view":
          return row.can_view;
        case "create":
          return row.can_create;
        case "edit":
          return row.can_edit;
        case "delete":
          return row.can_delete;
        case "approve":
          return row.can_approve;
        default:
          return false;
      }
    },
    [rows, myRole, isSuperAdmin]
  );

  return { rows, myRole, isSuperAdmin, loading, refresh, can };
};
