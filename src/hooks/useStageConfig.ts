import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StageConfig = {
  id: string;
  workspace_id: string;
  key: string;
  label: string;
  color: string;
  probability: number;
  position: number;
  is_won: boolean;
  is_lost: boolean;
  is_active: boolean;
};

// Tailwind classes per color token. Used for badges.
export const STAGE_COLOR_CLASSES: Record<string, string> = {
  amber:   "bg-amber-100 text-amber-800 border-amber-200",
  yellow:  "bg-yellow-100 text-yellow-800 border-yellow-200",
  orange:  "bg-orange-100 text-orange-800 border-orange-200",
  red:     "bg-red-100 text-red-700 border-red-200",
  rose:    "bg-rose-100 text-rose-700 border-rose-200",
  pink:    "bg-pink-100 text-pink-700 border-pink-200",
  purple:  "bg-purple-100 text-purple-800 border-purple-200",
  indigo:  "bg-indigo-100 text-indigo-800 border-indigo-200",
  blue:    "bg-blue-100 text-blue-800 border-blue-200",
  sky:     "bg-sky-100 text-sky-800 border-sky-200",
  cyan:    "bg-cyan-100 text-cyan-800 border-cyan-200",
  teal:    "bg-teal-100 text-teal-800 border-teal-200",
  emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
  green:   "bg-green-100 text-green-800 border-green-200",
  lime:    "bg-lime-100 text-lime-800 border-lime-200",
  gray:    "bg-gray-100 text-gray-700 border-gray-200",
  slate:   "bg-slate-100 text-slate-700 border-slate-200",
};

export const STAGE_BORDER_CLASSES: Record<string, string> = {
  amber: "border-t-amber-400", yellow: "border-t-yellow-400", orange: "border-t-orange-400",
  red: "border-t-red-400", rose: "border-t-rose-400", pink: "border-t-pink-400",
  purple: "border-t-purple-400", indigo: "border-t-indigo-400", blue: "border-t-blue-400",
  sky: "border-t-sky-400", cyan: "border-t-cyan-400", teal: "border-t-teal-400",
  emerald: "border-t-emerald-400", green: "border-t-green-500", lime: "border-t-lime-400",
  gray: "border-t-gray-300", slate: "border-t-slate-300",
};

const FALLBACK_STAGES: Omit<StageConfig, "id" | "workspace_id">[] = [
  { key: "prospecting", label: "Prospecting", color: "amber", probability: 10, position: 1, is_won: false, is_lost: false, is_active: true },
  { key: "qualification", label: "Qualification", color: "blue", probability: 20, position: 2, is_won: false, is_lost: false, is_active: true },
  { key: "site_visit", label: "Site Visit", color: "purple", probability: 30, position: 3, is_won: false, is_lost: false, is_active: true },
  { key: "technical_review", label: "Technical Review", color: "indigo", probability: 40, position: 4, is_won: false, is_lost: false, is_active: true },
  { key: "design_prep", label: "Design Preparation", color: "sky", probability: 50, position: 5, is_won: false, is_lost: false, is_active: true },
  { key: "proposal_sent", label: "Proposal Sent", color: "cyan", probability: 60, position: 6, is_won: false, is_lost: false, is_active: true },
  { key: "negotiation", label: "Negotiation", color: "orange", probability: 70, position: 7, is_won: false, is_lost: false, is_active: true },
  { key: "approved", label: "Approved", color: "lime", probability: 80, position: 8, is_won: false, is_lost: false, is_active: true },
  { key: "work_order", label: "Work Order", color: "teal", probability: 85, position: 9, is_won: false, is_lost: false, is_active: true },
  { key: "execution", label: "Execution", color: "emerald", probability: 90, position: 10, is_won: false, is_lost: false, is_active: true },
  { key: "completed", label: "Completed", color: "green", probability: 100, position: 11, is_won: true, is_lost: false, is_active: true },
  { key: "lost", label: "Lost", color: "red", probability: 0, position: 12, is_won: false, is_lost: true, is_active: true },
];

export function useStageConfig(workspaceId: string | undefined) {
  const [stages, setStages] = useState<StageConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    const { data } = await supabase
      .from("crm_stage_configs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("position");
    setStages(((data as StageConfig[]) || []));
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!workspaceId) return;
    const ch = supabase
      .channel(`stage-config-${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "crm_stage_configs", filter: `workspace_id=eq.${workspaceId}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [workspaceId, load]);

  const effective = useMemo<StageConfig[]>(() => {
    if (stages.length > 0) return stages.filter((s) => s.is_active);
    return FALLBACK_STAGES.map((s, i) => ({
      ...s,
      id: `fallback-${s.key}`,
      workspace_id: workspaceId || "",
    }));
  }, [stages, workspaceId]);

  const byKey = useMemo(() => {
    const m = new Map<string, StageConfig>();
    effective.forEach((s) => m.set(s.key, s));
    return m;
  }, [effective]);

  const get = useCallback((key: string | null | undefined): StageConfig => {
    if (key && byKey.has(key)) return byKey.get(key)!;
    // unknown: synthesize a neutral entry so UI never breaks
    return {
      id: `unknown-${key || "none"}`,
      workspace_id: workspaceId || "",
      key: key || "",
      label: key || "—",
      color: "gray",
      probability: 0,
      position: 999,
      is_won: false,
      is_lost: false,
      is_active: true,
    };
  }, [byKey, workspaceId]);

  return { stages: effective, loading, reload: load, get, byKey };
}
