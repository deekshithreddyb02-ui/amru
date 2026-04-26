import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Full set of CRM roles stored in app_role enum (broader than useUserRole's narrow union)
export type CrmRole =
  | "super_admin"
  | "admin"
  | "employee"
  | "user"
  | "crm_admin"
  | "crm_ceo"
  | "crm_sales_mgr"
  | "crm_sales_rep"
  | "crm_support_mgr"
  | "crm_support"
  | "crm_marketing_mgr"
  | "crm_marketing"
  | "crm_ops_mgr"
  | "crm_accountant"
  | "crm_technician"
  | "crm_field_staff"
  | "crm_viewer";

export const CRM_ROLE_LABELS: Record<CrmRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  employee: "Employee",
  user: "User",
  crm_admin: "CRM Admin",
  crm_ceo: "CEO",
  crm_sales_mgr: "Sales Manager",
  crm_sales_rep: "Sales Executive",
  crm_support_mgr: "Support Manager",
  crm_support: "Support Executive",
  crm_marketing_mgr: "Marketing Manager",
  crm_marketing: "Marketing Executive",
  crm_ops_mgr: "Operations Manager",
  crm_accountant: "Accountant",
  crm_technician: "Technician",
  crm_field_staff: "Field Staff",
  crm_viewer: "Viewer",
};

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
  role: CrmRole;
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
  const [myRole, setMyRole] = useState<CrmRole | null>(null);
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
          : Promise.resolve({ data: [] as { role: CrmRole }[] }),
        uid
          ? supabase
              .from("crm_workspace_members")
              .select("crm_role")
              .eq("workspace_id", workspaceId)
              .eq("user_id", uid)
              .maybeSingle()
          : Promise.resolve({ data: null as { crm_role: CrmRole } | null }),
      ]);

      setRows((perms as CrmPermissionRow[]) || []);
      setIsSuperAdmin(
        (roles || []).some((r) => (r as { role: CrmRole }).role === "super_admin")
      );
      setMyRole(((member as { crm_role: CrmRole } | null)?.crm_role) || null);
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
