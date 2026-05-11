import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CrmWorkspace = {
  id: string;
  slug: string;
  name: string;
  region_key: string;
  is_active: boolean;
};

export type CrmMembership = {
  workspace_id: string;
  crm_role: string;
};

/**
 * Loads all CRM workspaces visible to the current user (RLS-filtered)
 * along with their membership rows. Super admins see all 4 by default.
 */
export const useCrmWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState<CrmWorkspace[]>([]);
  const [memberships, setMemberships] = useState<CrmMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setWorkspaces([]);
        setMemberships([]);
        setLoading(false);
        return;
      }

      const [{ data: ws, error: wsErr }, { data: mem, error: memErr }] = await Promise.all([
        supabase.from("crm_workspaces").select("*").eq("is_active", true).order("name"),
        supabase
          .from("crm_workspace_members")
          .select("workspace_id, crm_role")
          .eq("user_id", session.user.id),
      ]);

      if (wsErr) throw wsErr;
      if (memErr) throw memErr;

      setWorkspaces((ws as CrmWorkspace[]) || []);
      setMemberships((mem as CrmMembership[]) || []);
      setError(null);
    } catch (e) {
      console.error("useCrmWorkspaces error:", e);
      setError(e instanceof Error ? e.message : "Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Avoid refetch on TOKEN_REFRESHED / INITIAL_SESSION which fire frequently.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  const roleInWorkspace = useCallback(
    (workspaceId: string): string | null => {
      const m = memberships.find((x) => x.workspace_id === workspaceId);
      return m?.crm_role || null;
    },
    [memberships]
  );

  return { workspaces, memberships, loading, error, refresh, roleInWorkspace };
};
