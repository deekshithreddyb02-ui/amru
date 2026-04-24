import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Building2, Users, Briefcase, Receipt, LifeBuoy } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface WsStats {
  id: string; name: string; slug: string;
  leads: number; deals: number; deal_value: number;
  invoices_outstanding: number; tickets_open: number; reports: number;
}

export default function CrmCrossAnalytics() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<WsStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roleLoading) return;
    if (!isSuperAdmin) { navigate("/crm"); return; }
    (async () => {
      setLoading(true);
      const { data: workspaces } = await (supabase as any).from("crm_workspaces").select("id, name, slug").eq("is_active", true);
      const out: WsStats[] = [];
      for (const ws of workspaces || []) {
        const [l, d, i, t, r] = await Promise.all([
          (supabase as any).from("crm_leads").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id),
          (supabase as any).from("crm_deals").select("amount", { count: "exact" }).eq("workspace_id", ws.id),
          (supabase as any).from("crm_invoices").select("total, paid_amount").eq("workspace_id", ws.id).in("status", ["unpaid", "partial", "overdue"]),
          (supabase as any).from("crm_support_tickets").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id).eq("status", "open"),
          (supabase as any).from("crm_reports").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id),
        ]);
        const dealValue = (d.data || []).reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
        const outstanding = (i.data || []).reduce((s: number, x: any) => s + (Number(x.total || 0) - Number(x.paid_amount || 0)), 0);
        out.push({
          id: ws.id, name: ws.name, slug: ws.slug,
          leads: l.count || 0, deals: d.count || 0, deal_value: dealValue,
          invoices_outstanding: outstanding, tickets_open: t.count || 0, reports: r.count || 0,
        });
      }
      setStats(out); setLoading(false);
    })();
  }, [isSuperAdmin, roleLoading, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const totals = stats.reduce((acc, s) => ({
    leads: acc.leads + s.leads, deals: acc.deals + s.deals, deal_value: acc.deal_value + s.deal_value,
    outstanding: acc.outstanding + s.invoices_outstanding, tickets: acc.tickets + s.tickets_open,
  }), { leads: 0, deals: 0, deal_value: 0, outstanding: 0, tickets: 0 });

  const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/crm")} className="gap-2 mb-2"><ArrowLeft className="h-4 w-4" />Back to CRM</Button>
            <h1 className="text-3xl font-serif">Cross-CRM analytics</h1>
            <p className="text-sm text-muted-foreground">Aggregate view across all {stats.length} workspaces</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{totals.leads}</p><p className="text-xs text-muted-foreground">Total leads</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Briefcase className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{totals.deals}</p><p className="text-xs text-muted-foreground">Open deals</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Briefcase className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-lg font-bold">{inr(totals.deal_value)}</p><p className="text-xs text-muted-foreground">Pipeline value</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Receipt className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-lg font-bold">{inr(totals.outstanding)}</p><p className="text-xs text-muted-foreground">Outstanding</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><LifeBuoy className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{totals.tickets}</p><p className="text-xs text-muted-foreground">Open tickets</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Leads by workspace</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ leads: { label: "Leads", color: "hsl(var(--primary))" } }} className="h-[260px] w-full">
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Workspace breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 cursor-pointer" onClick={() => navigate(`/crm/${s.slug}/dashboard`)}>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">/{s.slug}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{s.leads} leads</Badge>
                  <Badge variant="outline">{s.deals} deals</Badge>
                  <Badge variant="outline">{inr(s.invoices_outstanding)} due</Badge>
                  <Badge variant={s.tickets_open > 0 ? "destructive" : "outline"}>{s.tickets_open} tickets</Badge>
                  <Badge variant="outline">{s.reports} reports</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
