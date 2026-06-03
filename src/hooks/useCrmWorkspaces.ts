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

type CrmWorkspaceSnapshot = {
  workspaces: CrmWorkspace[];
  memberships: CrmMembership[];
};

let crmWorkspaceCache: CrmWorkspaceSnapshot | null = null;
let crmWorkspacePromise: Promise<CrmWorkspaceSnapshot> | null = null;

/**
 * Loads all CRM workspaces visible to the current user (RLS-filtered)
 * along with their membership rows. Super admins see all 4 by default.
 */
export const useCrmWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState<CrmWorkspace[]>(() => crmWorkspaceCache?.workspaces ?? []);
  const [memberships, setMemberships] = useState<CrmMembership[]>(() => crmWorkspaceCache?.memberships ?? []);
  const [loading, setLoading] = useState(() => !crmWorkspaceCache);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (crmWorkspaceCache) {
        setWorkspaces(crmWorkspaceCache.workspaces);
        setMemberships(crmWorkspaceCache.memberships);
        setError(null);
        return;
      }

      if (!crmWorkspacePromise) {
        crmWorkspacePromise = (async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            return { workspaces: [], memberships: [] };
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

          return {
            workspaces: (ws as CrmWorkspace[]) || [],
            memberships: (mem as CrmMembership[]) || [],
          };
        })();
      }

      const snapshot = await crmWorkspacePromise;
      crmWorkspaceCache = snapshot;
      crmWorkspacePromise = null;

      if (snapshot.workspaces.length === 0 && snapshot.memberships.length === 0) {
        setWorkspaces([]);
        setMemberships([]);
        return;
      }

      setWorkspaces(snapshot.workspaces);
      setMemberships(snapshot.memberships);
      setError(null);
    } catch (e) {
      crmWorkspacePromise = null;
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
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        crmWorkspaceCache = null;
        refresh();
      }
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
