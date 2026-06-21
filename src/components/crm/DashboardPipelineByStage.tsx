import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStageConfig, STAGE_COLOR_CLASSES } from "@/hooks/useStageConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

type Deal = { id: string; stage: string; amount: number; probability: number };

export default function DashboardPipelineByStage({ workspaceId }: { workspaceId: string }) {
  const { stages, get } = useStageConfig(workspaceId);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("crm_deals")
      .select("id,stage,amount,probability")
      .eq("workspace_id", workspaceId);
    setDeals((data as Deal[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`dash-pipeline-${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "crm_deals", filter: `workspace_id=eq.${workspaceId}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const maxCount = Math.max(1, ...stages.map((s) => deals.filter((d) => d.stage === s.key).length));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Opportunities by Stage</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-xs text-muted-foreground">Loading…</div>
        ) : (
          <ul className="space-y-1.5">
            {stages.map((s) => {
              const rows = deals.filter((d) => d.stage === s.key);
              const total = rows.reduce((sum, d) => sum + Number(d.amount || 0), 0);
              const tone = STAGE_COLOR_CLASSES[s.color] || STAGE_COLOR_CLASSES.gray;
              const pct = (rows.length / maxCount) * 100;
              return (
                <li key={s.key} className="text-xs">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={cn("px-1.5 py-0.5 rounded border text-[11px]", tone)}>{s.label}</span>
                    <span className="tabular-nums text-muted-foreground">{rows.length} · {fmtINR(total)}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded overflow-hidden">
                    <div className={cn("h-full", tone.split(" ")[0])} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
