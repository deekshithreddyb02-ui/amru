import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, Target, Receipt, LifeBuoy, Loader2 } from "lucide-react";

type Stats = { leads: number; deals: number; invoices: number; tickets: number };

export default function CrmDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const { data: ws } = await supabase.from("crm_workspaces").select("id").eq("slug", slug!).maybeSingle();
      if (!ws) return;
      const wid = ws.id;
      const [leads, deals, invoices, tickets] = await Promise.all([
        supabase.from("crm_leads").select("id", { count: "exact", head: true }).eq("workspace_id", wid),
        supabase.from("crm_deals").select("id", { count: "exact", head: true }).eq("workspace_id", wid),
        supabase.from("crm_invoices").select("id", { count: "exact", head: true }).eq("workspace_id", wid),
        supabase.from("crm_support_tickets").select("id", { count: "exact", head: true }).eq("workspace_id", wid),
      ]);
      setStats({
        leads: leads.count || 0,
        deals: deals.count || 0,
        invoices: invoices.count || 0,
        tickets: tickets.count || 0,
      });
    })();
  }, [slug]);

  const cards = [
    { label: "Leads", value: stats?.leads, icon: Users, color: "from-blue-500/20 to-blue-500/5" },
    { label: "Deals", value: stats?.deals, icon: Target, color: "from-emerald-500/20 to-emerald-500/5" },
    { label: "Invoices", value: stats?.invoices, icon: Receipt, color: "from-amber-500/20 to-amber-500/5" },
    { label: "Open Tickets", value: stats?.tickets, icon: LifeBuoy, color: "from-rose-500/20 to-rose-500/5" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`bg-gradient-to-br ${c.color} border border-white/5 rounded-lg p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/60">{c.label}</span>
              <c.icon className="w-4 h-4 text-white/40" />
            </div>
            <div className="text-3xl font-bold">
              {c.value === undefined ? <Loader2 className="w-5 h-5 animate-spin" /> : c.value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 bg-[#0f1923] border border-white/5 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Welcome back</h2>
        <p className="text-white/60 text-sm">
          Use the sidebar to navigate modules. Phase 1 (shell) is ready — module screens
          will come online phase by phase.
        </p>
      </div>
    </div>
  );
}
