import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SavedView = {
  id: string;
  workspace_id: string;
  user_id: string;
  module: string;
  name: string;
  filters: any;
  columns: string[];
  sort: any;
  is_default: boolean;
  is_shared: boolean;
};

export function useSavedViews(workspaceId: string | undefined, module: string) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    const { data } = await supabase
      .from("crm_saved_views")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("module", module)
      .order("created_at", { ascending: true });
    setViews((data as any) || []);
    setLoading(false);
  }, [workspaceId, module]);

  useEffect(() => { load(); }, [load]);

  const create = async (input: {
    name: string;
    filters?: any;
    columns?: string[];
    sort?: any;
    is_shared?: boolean;
    is_default?: boolean;
  }) => {
    if (!workspaceId) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("crm_saved_views")
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        module,
        name: input.name,
        filters: input.filters ?? [],
        columns: input.columns ?? [],
        sort: input.sort ?? {},
        is_shared: !!input.is_shared,
        is_default: !!input.is_default,
      })
      .select()
      .single();
    if (!error && data) setViews((v) => [...v, data as any]);
    return data;
  };

  const remove = async (id: string) => {
    await supabase.from("crm_saved_views").delete().eq("id", id);
    setViews((v) => v.filter((x) => x.id !== id));
  };

  return { views, loading, reload: load, create, remove };
}
