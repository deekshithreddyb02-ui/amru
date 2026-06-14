import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCrmPermissions } from "@/hooks/useCrmPermissions";

export type LabelOverride = {
  key: string;
  label: string | null;
  extra: Record<string, any>;
};

export type LabelMap = Record<string, LabelOverride>;

/**
 * Workspace-scoped editable label overrides.
 * scope = e.g. "deals_columns", "deals_summary", "deals_stages", "deals_detail_tabs", "deals_detail_fields".
 */
export const useCrmLabels = (workspaceId: string | undefined, scope: string) => {
  const [labels, setLabels] = useState<LabelMap>({});
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin, myRole } = useCrmPermissions(workspaceId);
  const canEdit = isSuperAdmin || myRole === "crm_admin";

  const load = useCallback(async () => {
    if (!workspaceId) {
      setLabels({});
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("crm_label_overrides")
      .select("key,label,extra")
      .eq("workspace_id", workspaceId)
      .eq("scope", scope);
    const m: LabelMap = {};
    (data || []).forEach((r: any) => {
      m[r.key] = { key: r.key, label: r.label, extra: (r.extra as any) || {} };
    });
    setLabels(m);
    setLoading(false);
  }, [workspaceId, scope]);

  useEffect(() => {
    load();
  }, [load]);

  const setLabel = useCallback(
    async (key: string, label: string | null, extra?: Record<string, any>) => {
      if (!workspaceId) return;
      const merged = { ...(labels[key]?.extra || {}), ...(extra || {}) };
      const { error } = await supabase
        .from("crm_label_overrides")
        .upsert(
          {
            workspace_id: workspaceId,
            scope,
            key,
            label,
            extra: merged,
          },
          { onConflict: "workspace_id,scope,key" }
        );
      if (!error) {
        setLabels((prev) => ({ ...prev, [key]: { key, label, extra: merged } }));
      }
      return error;
    },
    [workspaceId, scope, labels]
  );

  const get = useCallback(
    (key: string, fallback: string) => labels[key]?.label || fallback,
    [labels]
  );
  const getExtra = useCallback(
    (key: string) => labels[key]?.extra || {},
    [labels]
  );

  return useMemo(
    () => ({ labels, loading, canEdit, setLabel, get, getExtra, reload: load }),
    [labels, loading, canEdit, setLabel, get, getExtra, load]
  );
};
