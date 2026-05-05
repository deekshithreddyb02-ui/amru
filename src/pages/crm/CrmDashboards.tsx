import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Plus, Save, Trash2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

type Widget = { id: string; title: string; metric: string; chart: "kpi" | "bar" | "pie" | "line" };
type Dash = { id: string; name: string; layout: Widget[]; is_shared: boolean };

const METRICS = [
  { id: "leads_total", label: "Leads (total)" },
  { id: "leads_open", label: "Open leads" },
  { id: "deals_pipeline", label: "Pipeline value" },
  { id: "deals_won_month", label: "Deals won (this month)" },
  { id: "tickets_open", label: "Open tickets" },
  { id: "invoices_outstanding", label: "Outstanding invoices ₹" },
  { id: "deals_by_stage", label: "Deals by stage (chart)" },
  { id: "leads_by_status", label: "Leads by status (chart)" },
  { id: "revenue_last_6m", label: "Revenue last 6 months (chart)" },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "#9CA3AF", "#F59E0B", "#10B981"];

export default function CrmDashboards() {
  const { workspace } = useOutletContext<{ workspace: { id: string } }>();
  const [dashboards, setDashboards] = useState<Dash[]>([]);
  const [active, setActive] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, any>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, [workspace.id]);

  const load = async () => {
    setLoading(true);
    const { data: rows } = await (supabase as any)
      .from("crm_saved_dashboards").select("*").eq("workspace_id", workspace.id).order("created_at");
    const list = (rows ?? []).map((r: any) => ({ id: r.id, name: r.name, layout: r.layout, is_shared: r.is_shared })) as Dash[];
    setDashboards(list);
    setActive(list[0] ?? null);
    setLoading(false);
  };

  useEffect(() => { if (active) refresh(); }, [active?.id]);

  const refresh = async () => {
    if (!active) return;
    setRefreshing(true);
    const result: Record<string, any> = {};
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    await Promise.all(active.layout.map(async (w) => {
      try {
        if (w.metric === "leads_total") {
          const { count } = await supabase.from("crm_leads").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id);
          result[w.id] = count ?? 0;
        } else if (w.metric === "leads_open") {
          const { count } = await supabase.from("crm_leads").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id).eq("status", "open");
          result[w.id] = count ?? 0;
        } else if (w.metric === "deals_pipeline") {
          const { data: d } = await supabase.from("crm_deals").select("amount").eq("workspace_id", workspace.id);
          result[w.id] = (d ?? []).reduce((s, x: any) => s + Number(x.amount || 0), 0);
        } else if (w.metric === "deals_won_month") {
          const { count } = await supabase.from("crm_deals").select("id", { count: "exact", head: true })
            .eq("workspace_id", workspace.id).eq("stage", "won").gte("updated_at", monthStart.toISOString());
          result[w.id] = count ?? 0;
        } else if (w.metric === "tickets_open") {
          const { count } = await supabase.from("crm_support_tickets").select("id", { count: "exact", head: true })
            .eq("workspace_id", workspace.id).neq("status", "closed").neq("status", "resolved");
          result[w.id] = count ?? 0;
        } else if (w.metric === "invoices_outstanding") {
          const { data: d } = await supabase.from("crm_invoices").select("total,paid_amount").eq("workspace_id", workspace.id).in("status", ["unpaid", "partial", "overdue"]);
          result[w.id] = (d ?? []).reduce((s, x: any) => s + (Number(x.total || 0) - Number(x.paid_amount || 0)), 0);
        } else if (w.metric === "deals_by_stage") {
          const { data: d } = await supabase.from("crm_deals").select("stage,amount").eq("workspace_id", workspace.id);
          const map: Record<string, number> = {};
          (d ?? []).forEach((x: any) => { map[x.stage || "—"] = (map[x.stage || "—"] || 0) + Number(x.amount || 0); });
          result[w.id] = Object.entries(map).map(([name, value]) => ({ name, value }));
        } else if (w.metric === "leads_by_status") {
          const { data: d } = await supabase.from("crm_leads").select("status").eq("workspace_id", workspace.id);
          const map: Record<string, number> = {};
          (d ?? []).forEach((x: any) => { map[x.status || "—"] = (map[x.status || "—"] || 0) + 1; });
          result[w.id] = Object.entries(map).map(([name, value]) => ({ name, value }));
        } else if (w.metric === "revenue_last_6m") {
          const since = new Date(); since.setMonth(since.getMonth() - 5); since.setDate(1);
          const { data: d } = await supabase.from("crm_payments").select("amount,paid_on").eq("workspace_id", workspace.id).gte("paid_on", since.toISOString());
          const buckets: Record<string, number> = {};
          for (let i = 0; i < 6; i++) {
            const dt = new Date(since); dt.setMonth(since.getMonth() + i);
            buckets[dt.toLocaleString("default", { month: "short" })] = 0;
          }
          (d ?? []).forEach((x: any) => {
            const k = new Date(x.paid_on).toLocaleString("default", { month: "short" });
            if (k in buckets) buckets[k] += Number(x.amount || 0);
          });
          result[w.id] = Object.entries(buckets).map(([name, value]) => ({ name, value }));
        }
      } catch (e) { result[w.id] = null; }
    }));
    setData(result);
    setRefreshing(false);
  };

  const createDash = async () => {
    const name = prompt("Dashboard name?")?.trim();
    if (!name) return;
    const u = (await supabase.auth.getUser()).data.user;
    const { data: row, error } = await (supabase as any).from("crm_saved_dashboards").insert({
      workspace_id: workspace.id, user_id: u?.id, name, layout: [],
    }).select().single();
    if (error) return toast.error(error.message);
    setDashboards([...dashboards, row]); setActive(row); toast.success("Dashboard created");
  };

  const addWidget = () => {
    if (!active) return;
    const w: Widget = { id: crypto.randomUUID(), title: "New widget", metric: "leads_total", chart: "kpi" };
    setActive({ ...active, layout: [...active.layout, w] });
  };

  const updateWidget = (id: string, patch: Partial<Widget>) => {
    if (!active) return;
    setActive({ ...active, layout: active.layout.map(w => w.id === id ? { ...w, ...patch } : w) });
  };

  const removeWidget = (id: string) => {
    if (!active) return;
    setActive({ ...active, layout: active.layout.filter(w => w.id !== id) });
  };

  const save = async () => {
    if (!active) return;
    const { error } = await (supabase as any).from("crm_saved_dashboards")
      .update({ layout: active.layout, is_shared: active.is_shared }).eq("id", active.id);
    if (error) return toast.error(error.message);
    toast.success("Saved"); refresh();
  };

  const remove = async () => {
    if (!active || !confirm("Delete this dashboard?")) return;
    await (supabase as any).from("crm_saved_dashboards").delete().eq("id", active.id);
    setDashboards(dashboards.filter(d => d.id !== active.id));
    setActive(dashboards[0] ?? null);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div>
          <h1 className="text-2xl font-serif flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Custom Dashboards</h1>
          <p className="text-sm text-muted-foreground">Build your own KPI views and chart pivots.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {dashboards.length > 0 && (
            <Select value={active?.id} onValueChange={(v) => setActive(dashboards.find(d => d.id === v) ?? null)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover">
                {dashboards.map(d => <SelectItem key={d.id} value={d.id}>{d.name}{d.is_shared ? " (shared)" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button onClick={createDash} variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />New</Button>
          {active && <>
            <Button onClick={addWidget} variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Widget</Button>
            <Button onClick={refresh} variant="outline" size="sm" disabled={refreshing}><RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />Refresh</Button>
            <Button onClick={save} size="sm"><Save className="h-4 w-4 mr-1" />Save</Button>
            <Button onClick={remove} variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
          </>}
        </div>
      </div>

      {!active ? (
        <Card className="p-10 text-center text-muted-foreground">
          No dashboard yet. Click <strong>New</strong> to start building.
        </Card>
      ) : (
        <>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active.is_shared} onChange={(e) => setActive({ ...active, is_shared: e.target.checked })} />
            Share with workspace
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.layout.map(w => {
              const v = data[w.id];
              return (
                <Card key={w.id} className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <Input value={w.title} onChange={(e) => updateWidget(w.id, { title: e.target.value })} className="text-sm" />
                    <Button size="icon" variant="ghost" onClick={() => removeWidget(w.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={w.metric} onValueChange={(val) => updateWidget(w.id, { metric: val })}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover">
                        {METRICS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={w.chart} onValueChange={(val: any) => updateWidget(w.id, { chart: val })}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="kpi">KPI tile</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="pie">Pie</SelectItem>
                        <SelectItem value="line">Line</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="h-48 flex items-center justify-center">
                    {v == null ? <Badge variant="outline">No data</Badge> : w.chart === "kpi" ? (
                      <div className="text-3xl font-bold text-primary">
                        {typeof v === "number" ? v.toLocaleString() : Array.isArray(v) ? v.length : "—"}
                      </div>
                    ) : w.chart === "bar" && Array.isArray(v) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={v}><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" /></BarChart>
                      </ResponsiveContainer>
                    ) : w.chart === "pie" && Array.isArray(v) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart><Pie data={v} dataKey="value" nameKey="name" outerRadius={60} label>
                          {v.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie><Tooltip /></PieChart>
                      </ResponsiveContainer>
                    ) : w.chart === "line" && Array.isArray(v) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={v}><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" /></LineChart>
                      </ResponsiveContainer>
                    ) : <span className="text-xs text-muted-foreground">Pick a chart-friendly metric</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
