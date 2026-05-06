import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, Target } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Workspace = { id: string };
type Row = { workspace_id: string; owner_id: string | null; stage: string; deal_count: number; total_amount: number; weighted_amount: number; month: string };
type Quota = { user_id: string; period_start: string; period_end: string; target_amount: number; target_deals: number };

export default function CrmForecast() {
  const { workspace } = useOutletContext<{ workspace: Workspace }>();
  const [rows, setRows] = useState<Row[]>([]);
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: f }, { data: q }] = await Promise.all([
        supabase.from("crm_forecast_summary" as any).select("*").eq("workspace_id", workspace.id),
        supabase.from("crm_user_quotas" as any).select("*").eq("workspace_id", workspace.id),
      ]);
      setRows((f as any) ?? []);
      setQuotas((q as any) ?? []);
      setLoading(false);
    })();
  }, [workspace.id]);

  const byStage = useMemo(() => {
    const m: Record<string, { stage: string; weighted: number; total: number; count: number }> = {};
    rows.forEach((r) => {
      m[r.stage] ??= { stage: r.stage, weighted: 0, total: 0, count: 0 };
      m[r.stage].weighted += Number(r.weighted_amount);
      m[r.stage].total += Number(r.total_amount);
      m[r.stage].count += Number(r.deal_count);
    });
    return Object.values(m);
  }, [rows]);

  const totals = useMemo(() => byStage.reduce(
    (acc, r) => ({ weighted: acc.weighted + r.weighted, total: acc.total + r.total, count: acc.count + r.count }),
    { weighted: 0, total: 0, count: 0 }
  ), [byStage]);

  const totalQuota = quotas.reduce((s, q) => s + Number(q.target_amount), 0);
  const attainment = totalQuota > 0 ? Math.round((totals.weighted / totalQuota) * 100) : 0;

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary" />Forecast & Quotas</h1>
        <p className="text-sm text-muted-foreground">Weighted pipeline projection and quota attainment.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Open deals</div><div className="text-2xl font-semibold">{totals.count}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Pipeline value</div><div className="text-2xl font-semibold">₹{Math.round(totals.total).toLocaleString()}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Weighted forecast</div><div className="text-2xl font-semibold">₹{Math.round(totals.weighted).toLocaleString()}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" />Quota attainment</div><div className="text-2xl font-semibold">{attainment}%</div></Card>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Pipeline by stage</h2>
        {byStage.length === 0 ? <div className="text-sm text-muted-foreground py-8 text-center">No deals yet.</div> : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={byStage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip formatter={(v: number) => `₹${Math.round(v).toLocaleString()}`} />
              <Bar dataKey="total" fill="hsl(var(--muted-foreground))" name="Total" />
              <Bar dataKey="weighted" fill="hsl(var(--primary))" name="Weighted" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Active quotas</h2>
        {quotas.length === 0 ? (
          <div className="text-sm text-muted-foreground">No quotas configured. Admins can add them via the database.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground"><tr><th className="py-2">Period</th><th>Target ₹</th><th>Target deals</th></tr></thead>
              <tbody>
                {quotas.map((q, i) => (
                  <tr key={i} className="border-t"><td className="py-2">{q.period_start} → {q.period_end}</td><td>₹{Number(q.target_amount).toLocaleString()}</td><td>{q.target_deals}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
