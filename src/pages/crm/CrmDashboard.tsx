import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";
import DashboardHistory from "@/components/crm/DashboardHistory";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Stats = {
  total: number;
  open: number;
  won: number;
  newThisWeek: number;
};

const CrmDashboard = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [stats, setStats] = useState<Stats>({ total: 0, open: 0, won: 0, newThisWeek: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [tot, open, won, week] = await Promise.all([
        supabase.from("crm_leads").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id),
        supabase.from("crm_leads").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id).eq("status", "open"),
        supabase.from("crm_leads").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id).eq("stage", "won"),
        supabase.from("crm_leads").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id).gte("created_at", weekAgo),
      ]);
      setStats({
        total: tot.count || 0,
        open: open.count || 0,
        won: won.count || 0,
        newThisWeek: week.count || 0,
      });
      setLoading(false);
    };
    load();
  }, [workspace.id]);

  const cards = [
    { label: "Total leads", value: stats.total, icon: Users, color: "text-primary" },
    { label: "Open", value: stats.open, icon: Clock, color: "text-secondary" },
    { label: "Won", value: stats.won, icon: CheckCircle2, color: "text-[hsl(var(--teal))]" },
    { label: "New this week", value: stats.newThisWeek, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif">{workspace.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">CRM workspace dashboard</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-serif">{loading ? "—" : value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to {workspace.name}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Phase 1 foundation is live. New website enquiries from this region now mirror here automatically.</p>
          <p>Use the sidebar to view <strong>Leads</strong>. Deals, Reports and AI features arrive in Phase 2+.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CrmDashboard;
