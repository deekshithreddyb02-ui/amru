import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCrmWorkspaces } from "@/hooks/useCrmWorkspaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Range = "7" | "30" | "90" | "365";

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const toCsv = (rows: any[]): string => {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
};

const downloadCsv = (filename: string, rows: any[]) => {
  if (!rows.length) {
    toast.error("Nothing to export");
    return;
  }
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function CrmReportingHub() {
  const { slug } = useParams();
  const { workspaces } = useCrmWorkspaces();
  const ws = workspaces.find((w) => w.slug === slug);

  const [range, setRange] = useState<Range>("30");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const sinceIso = useMemo(
    () => new Date(Date.now() - Number(range) * 86400000).toISOString(),
    [range],
  );

  useEffect(() => {
    if (!ws?.id) return;
    setLoading(true);
    Promise.all([
      supabase.from("crm_leads").select("id, full_name, email, phone, status, stage, ai_hot_score, lead_source, created_at, assigned_to, city, state").eq("workspace_id", ws.id).gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(1000),
      supabase.from("crm_deals").select("id, title, amount, currency, stage, probability, expected_close, owner_id, created_at").eq("workspace_id", ws.id).gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(1000),
      supabase.from("crm_invoices").select("id, invoice_number, customer_name, total, paid_amount, status, issue_date, due_date").eq("workspace_id", ws.id).gte("issue_date", sinceIso.slice(0, 10)).order("issue_date", { ascending: false }).limit(1000),
      supabase.from("crm_support_tickets").select("id, ticket_number, subject, priority, status, created_at, due_at, assigned_to").eq("workspace_id", ws.id).gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(1000),
      supabase.from("crm_activities").select("id, subject, activity_type, status, priority, due_at, assigned_to, created_at").eq("workspace_id", ws.id).gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(1000),
    ]).then(([l, d, i, t, a]) => {
      setLeads(l.data || []);
      setDeals(d.data || []);
      setInvoices(i.data || []);
      setTickets(t.data || []);
      setActivities(a.data || []);
    }).finally(() => setLoading(false));
  }, [ws?.id, sinceIso]);

  // KPIs
  const totalRevenue = invoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const outstanding = invoices.reduce((s, i) => s + Math.max(0, Number(i.total || 0) - Number(i.paid_amount || 0)), 0);
  const overdueInv = invoices.filter((i) => i.status === "overdue").length;
  const wonDeals = deals.filter((d) => d.stage === "won");
  const wonValue = wonDeals.reduce((s, d) => s + Number(d.amount || 0), 0);
  const pipeline = deals.filter((d) => !["won", "lost"].includes(d.stage)).reduce((s, d) => s + Number(d.amount || 0), 0);
  const winRate = deals.length ? Math.round((wonDeals.length / deals.length) * 100) : 0;
  const openTickets = tickets.filter((t) => !["resolved", "closed"].includes(t.status)).length;
  const overdueTasks = activities.filter((a) => a.due_at && new Date(a.due_at) < new Date() && !["done", "cancelled"].includes(a.status)).length;

  // Group helpers
  const groupBy = <T,>(rows: T[], key: (r: T) => string) =>
    rows.reduce<Record<string, number>>((acc, r) => {
      const k = key(r) || "—";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

  const leadsBySource = groupBy(leads, (l: any) => l.lead_source || "Direct");
  const leadsByStage = groupBy(leads, (l: any) => l.stage);
  const dealsByStage = groupBy(deals, (d: any) => d.stage);
  const ticketsByPriority = groupBy(tickets, (t: any) => t.priority);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Reporting Hub</h1>
          <p className="text-sm text-muted-foreground">Pre-built dashboards across sales, support, and revenue. Export anything to CSV.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as Range)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Revenue collected" value={inr(totalRevenue)} />
        <Kpi label="Outstanding" value={inr(outstanding)} sub={`${overdueInv} overdue`} />
        <Kpi label="Pipeline" value={inr(pipeline)} sub={`${deals.length} deals`} />
        <Kpi label="Won value" value={inr(wonValue)} sub={`${winRate}% win rate`} />
        <Kpi label="New leads" value={String(leads.length)} />
        <Kpi label="Open tickets" value={String(openTickets)} />
        <Kpi label="Overdue tasks" value={String(overdueTasks)} />
        <Kpi label="Activities" value={String(activities.length)} />
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-3 mt-3">
          <div className="grid md:grid-cols-2 gap-3">
            <BreakdownCard title="Leads by source" rows={leadsBySource} />
            <BreakdownCard title="Leads by stage" rows={leadsByStage} />
            <BreakdownCard title="Deals by stage" rows={dealsByStage} />
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm">Top deals</CardTitle>
                <Button size="sm" variant="outline" onClick={() => downloadCsv(`deals-${range}d.csv`, deals)}><Download className="w-3.5 h-3.5 mr-1" />CSV</Button>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {[...deals].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 6).map((d) => (
                    <li key={d.id} className="flex justify-between border-b pb-1 last:border-0">
                      <span className="truncate mr-2">{d.title}</span>
                      <span className="font-medium whitespace-nowrap">{inr(Number(d.amount))} <Badge variant="secondary" className="ml-1">{d.stage}</Badge></span>
                    </li>
                  ))}
                  {!deals.length && <p className="text-xs text-muted-foreground">No deals in range.</p>}
                </ul>
              </CardContent>
            </Card>
          </div>
          <ExportRow label="Leads" count={leads.length} onExport={() => downloadCsv(`leads-${range}d.csv`, leads)} />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-3 mt-3">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm">Invoices</CardTitle>
              <Button size="sm" variant="outline" onClick={() => downloadCsv(`invoices-${range}d.csv`, invoices)}><Download className="w-3.5 h-3.5 mr-1" />CSV</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b"><tr><th className="py-2 pr-3">#</th><th>Customer</th><th>Status</th><th>Issue</th><th>Due</th><th className="text-right">Total</th><th className="text-right">Paid</th></tr></thead>
                  <tbody>
                    {invoices.slice(0, 12).map((i) => (
                      <tr key={i.id} className="border-b last:border-0">
                        <td className="py-1.5 pr-3 font-mono text-xs">{i.invoice_number}</td>
                        <td className="truncate max-w-[180px]">{i.customer_name}</td>
                        <td><Badge variant={i.status === "paid" ? "default" : i.status === "overdue" ? "destructive" : "secondary"}>{i.status}</Badge></td>
                        <td className="text-xs">{i.issue_date}</td>
                        <td className="text-xs">{i.due_date || "—"}</td>
                        <td className="text-right">{inr(Number(i.total))}</td>
                        <td className="text-right">{inr(Number(i.paid_amount))}</td>
                      </tr>
                    ))}
                    {!invoices.length && <tr><td colSpan={7} className="py-3 text-center text-muted-foreground text-xs">No invoices in range.</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-3 mt-3">
          <div className="grid md:grid-cols-2 gap-3">
            <BreakdownCard title="Tickets by priority" rows={ticketsByPriority} />
            <BreakdownCard title="Tickets by status" rows={groupBy(tickets, (t: any) => t.status)} />
          </div>
          <ExportRow label="Tickets" count={tickets.length} onExport={() => downloadCsv(`tickets-${range}d.csv`, tickets)} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-3 mt-3">
          <div className="grid md:grid-cols-2 gap-3">
            <BreakdownCard title="By type" rows={groupBy(activities, (a: any) => a.activity_type)} />
            <BreakdownCard title="By status" rows={groupBy(activities, (a: any) => a.status)} />
          </div>
          <ExportRow label="Activities" count={activities.length} onExport={() => downloadCsv(`activities-${range}d.csv`, activities)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-xl font-bold mt-1">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function BreakdownCard({ title, rows }: { title: string; rows: Record<string, number> }) {
  const entries = Object.entries(rows).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {entries.map(([k, n]) => (
              <li key={k}>
                <div className="flex justify-between text-xs"><span className="capitalize">{k}</span><span className="font-medium">{n}</span></div>
                <div className="h-1.5 bg-muted rounded mt-0.5 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(n / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ExportRow({ label, count, onExport }: { label: string; count: number; onExport: () => void }) {
  return (
    <div className="flex items-center justify-between text-sm bg-muted/30 border rounded-md px-3 py-2">
      <span>{count} {label.toLowerCase()} loaded for the selected range.</span>
      <Button size="sm" variant="outline" onClick={onExport}><Download className="w-3.5 h-3.5 mr-1" />Export {label} CSV</Button>
    </div>
  );
}
