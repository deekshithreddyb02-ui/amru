import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStageConfig, STAGE_COLOR_CLASSES } from "@/hooks/useStageConfig";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, History as HistoryIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  previous_stage: string | null;
  new_stage: string;
  changed_by: string | null;
  changed_at: string;
  remarks: string | null;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
  });

export default function DealStageHistory({
  dealId, workspaceId,
}: { dealId: string; workspaceId: string }) {
  const { get } = useStageConfig(workspaceId);
  const [rows, setRows] = useState<Row[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("crm_deal_stage_history")
      .select("id,previous_stage,new_stage,changed_by,changed_at,remarks")
      .eq("deal_id", dealId)
      .order("changed_at", { ascending: false });
    const list = (data as Row[]) || [];
    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.changed_by).filter(Boolean) as string[]));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles").select("user_id,full_name,username").in("user_id", ids);
      const m: Record<string, string> = {};
      (profs || []).forEach((p: any) => { m[p.user_id] = p.full_name || p.username || ""; });
      setNames(m);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`deal-stage-history-${dealId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "crm_deal_stage_history", filter: `deal_id=eq.${dealId}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  return (
    <div className="bg-white border rounded">
      <div className="px-4 py-2 font-semibold text-[13px] border-b flex items-center gap-2">
        <HistoryIcon className="h-3.5 w-3.5 text-primary" />
        Stage History
      </div>
      {loading ? (
        <div className="p-6 text-center text-[12px] text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-center text-[12px] text-muted-foreground">No stage changes yet.</div>
      ) : (
        <ul className="divide-y">
          {rows.map((r) => {
            const prev = r.previous_stage ? get(r.previous_stage) : null;
            const next = get(r.new_stage);
            const prevTone = prev ? STAGE_COLOR_CLASSES[prev.color] || STAGE_COLOR_CLASSES.gray : "";
            const nextTone = STAGE_COLOR_CLASSES[next.color] || STAGE_COLOR_CLASSES.gray;
            return (
              <li key={r.id} className="px-4 py-2.5 text-[12.5px]">
                <div className="flex items-center gap-2 flex-wrap">
                  {prev ? (
                    <Badge variant="secondary" className={cn(prevTone, "border")}>{prev.label}</Badge>
                  ) : (
                    <span className="text-muted-foreground">(initial)</span>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <Badge variant="secondary" className={cn(nextTone, "border")}>{next.label}</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {names[r.changed_by || ""] || "System"} · {fmt(r.changed_at)}
                </div>
                {r.remarks && <div className="text-[12px] mt-1">{r.remarks}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
