import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Trophy, Phone, LifeBuoy, IndianRupee, Target } from "lucide-react";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";
import { CRM_ROLE_LABELS, type CrmRole } from "@/hooks/useCrmPermissions";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type MemberKpi = {
  user_id: string;
  email: string;
  role: string;
  manager_user_id: string | null;
  department: string | null;
  leadsHandled: number;
  leadsWon: number;
  conversionRate: number;
  revenueClosed: number;
  activitiesDone: number;
  ticketsResolved: number;
  productivityScore: number;
};

const MANAGER_ROLES = new Set([
  "crm_admin", "crm_ceo", "crm_sales_mgr", "crm_support_mgr",
  "crm_marketing_mgr", "crm_ops_mgr",
]);

export default function CrmPerformance() {
  const { workspace, myRole } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<MemberKpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState<string | null>(null);

  const isManager = MANAGER_ROLES.has(myRole) || myRole === "super_admin";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id || null;
      setMeId(uid);

      const [
        { data: members },
        { data: emailRows },
        { data: leads },
        { data: deals },
        { data: activities },
        { data: tickets },
      ] = await Promise.all([
        supabase.from("crm_workspace_members")
          .select("user_id, crm_role, manager_user_id, department")
          .eq("workspace_id", workspace.id),
        supabase.rpc("get_users_with_emails"),
        supabase.from("crm_leads")
          .select("id, assigned_to, stage")
          .eq("workspace_id", workspace.id),
        supabase.from("crm_deals")
          .select("id, owner_id, stage, amount")
          .eq("workspace_id", workspace.id),
        supabase.from("crm_activities")
          .select("id, assigned_to, status")
          .eq("workspace_id", workspace.id)
          .eq("status", "completed"),
        supabase.from("crm_support_tickets")
          .select("id, assigned_to, status")
          .eq("workspace_id", workspace.id)
          .in("status", ["resolved", "closed"]),
      ]);

      const emailMap = new Map<string, string>();
      (emailRows || []).forEach((r: { user_id: string; email: string }) =>
        emailMap.set(r.user_id, r.email)
      );

      const out: MemberKpi[] = (members || []).map((m: any) => {
        const myLeads = (leads || []).filter((l: any) => l.assigned_to === m.user_id);
        const myWonLeads = myLeads.filter((l: any) => l.stage === "won");
        const myDeals = (deals || []).filter((d: any) => d.owner_id === m.user_id);
        const wonDeals = myDeals.filter((d: any) => d.stage === "won");
        const revenue = wonDeals.reduce((s: number, d: any) => s + Number(d.amount || 0), 0);
        const acts = (activities || []).filter((a: any) => a.assigned_to === m.user_id).length;
        const tix = (tickets || []).filter((t: any) => t.assigned_to === m.user_id).length;
        const conv = myLeads.length ? (myWonLeads.length / myLeads.length) * 100 : 0;
        const score = Math.round(
          Math.min(100, conv * 0.4 + Math.min(acts, 50) + Math.min(tix * 2, 30) + Math.min(revenue / 10000, 30))
        );
        return {
          user_id: m.user_id,
          email: emailMap.get(m.user_id) || m.user_id.slice(0, 8),
          role: m.crm_role,
          manager_user_id: m.manager_user_id,
          department: m.department,
          leadsHandled: myLeads.length,
          leadsWon: myWonLeads.length,
          conversionRate: Math.round(conv),
          revenueClosed: revenue,
          activitiesDone: acts,
          ticketsResolved: tix,
          productivityScore: score,
        };
      });

      // Non-managers only see themselves; managers see direct reports + self
      const visible = isManager
        ? out
        : out.filter((r) => r.user_id === uid);

      visible.sort((a, b) => b.productivityScore - a.productivityScore);
      setRows(visible);
      setLoading(false);
    };
    load();
  }, [workspace.id, isManager]);

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const totals = rows.reduce(
    (acc, r) => ({
      leads: acc.leads + r.leadsHandled,
      won: acc.won + r.leadsWon,
      revenue: acc.revenue + r.revenueClosed,
      activities: acc.activities + r.activitiesDone,
      tickets: acc.tickets + r.ticketsResolved,
    }),
    { leads: 0, won: 0, revenue: 0, activities: 0, tickets: 0 }
  );

  const topCards = [
    { label: "Team leads", value: totals.leads, icon: Users },
    { label: "Won", value: totals.won, icon: Trophy },
    { label: "Revenue (₹)", value: totals.revenue.toLocaleString("en-IN"), icon: IndianRupee },
    { label: "Activities", value: totals.activities, icon: Phone },
    { label: "Tickets resolved", value: totals.tickets, icon: LifeBuoy },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif">Performance</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isManager ? "Team KPIs across this workspace" : "Your personal KPIs"}
        </p>
      </div>

      {isManager && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {topCards.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
                <CardTitle className="text-xs text-muted-foreground font-normal">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" /> {isManager ? "Per-user KPIs" : "Your stats"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No data yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">User</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium text-right">Leads</th>
                  <th className="px-3 py-2 font-medium text-right">Won</th>
                  <th className="px-3 py-2 font-medium text-right">Conv %</th>
                  <th className="px-3 py-2 font-medium text-right">Revenue ₹</th>
                  <th className="px-3 py-2 font-medium text-right">Activities</th>
                  <th className="px-3 py-2 font-medium text-right">Tickets</th>
                  <th className="px-3 py-2 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user_id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <div className="font-medium truncate max-w-[180px]">{r.email}</div>
                      {r.department && (
                        <div className="text-xs text-muted-foreground">{r.department}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {CRM_ROLE_LABELS[r.role as CrmRole] || r.role}
                    </td>
                    <td className="px-3 py-2 text-right">{r.leadsHandled}</td>
                    <td className="px-3 py-2 text-right">{r.leadsWon}</td>
                    <td className="px-3 py-2 text-right">{r.conversionRate}%</td>
                    <td className="px-3 py-2 text-right">{r.revenueClosed.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2 text-right">{r.activitiesDone}</td>
                    <td className="px-3 py-2 text-right">{r.ticketsResolved}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`inline-flex items-center justify-center min-w-[2.5rem] h-6 rounded-full text-xs font-semibold ${
                        r.productivityScore >= 70 ? "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100"
                        : r.productivityScore >= 40 ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100"
                        : "bg-muted text-muted-foreground"
                      }`}>
                        {r.productivityScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
