import { useEffect, useMemo, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Loader2, RefreshCw, Search, Radio } from "lucide-react";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type AuditRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  actor_email: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
};

const ENTITY_LABEL: Record<string, string> = {
  crm_leads: "Lead",
  crm_deals: "Deal",
  crm_contacts: "Contact",
  crm_organizations: "Organization",
  crm_quotations: "Quotation",
  crm_invoices: "Invoice",
  crm_support_tickets: "Ticket",
  crm_activities: "Activity",
  crm_payments: "Payment",
  crm_field_visits: "Field visit",
};

const actionColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  created: "default",
  updated: "secondary",
  deleted: "destructive",
};

export default function CrmActivityFeed() {
  const { workspace } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState<string>("all");
  const [action, setAction] = useState<string>("all");
  const [live, setLive] = useState(true);

  const load = useCallback(async () => {
    if (!workspace?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("crm_audit_log")
      .select("id, action, entity_type, entity_id, entity_label, actor_email, changes, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data || []) as AuditRow[]);
    setLoading(false);
  }, [workspace?.id]);

  useEffect(() => { load(); }, [load]);

  // Realtime stream
  useEffect(() => {
    if (!workspace?.id || !live) return;
    const ch = supabase
      .channel(`audit-feed-${workspace.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "crm_audit_log", filter: `workspace_id=eq.${workspace.id}` },
        (p) => setRows((prev) => [p.new as AuditRow, ...prev].slice(0, 200)),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [workspace?.id, live]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (entity !== "all" && r.entity_type !== entity) return false;
      if (action !== "all" && r.action !== action) return false;
      if (q) {
        const hay = `${r.entity_label || ""} ${r.actor_email || ""} ${r.entity_type}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, entity, action, q]);

  const entityOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.entity_type));
    return Array.from(set);
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> Activity Feed
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time stream of every change across your CRM.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={live ? "default" : "outline"}
            onClick={() => setLive((v) => !v)}
            className="gap-1.5"
          >
            <Radio className={`h-3.5 w-3.5 ${live ? "animate-pulse" : ""}`} />
            {live ? "Live" : "Paused"}
          </Button>
          <Button size="sm" variant="outline" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <Card className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search label or user…" className="pl-8" />
          </div>
          <Select value={entity} onValueChange={setEntity}>
            <SelectTrigger><SelectValue placeholder="Entity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              {entityOptions.map((e) => (
                <SelectItem key={e} value={e}>{ENTITY_LABEL[e] || e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="updated">Updated</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No activity matches your filters yet.
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const changedKeys = r.action === "updated" && r.changes ? Object.keys(r.changes).slice(0, 4) : [];
            return (
              <Card key={r.id} className="p-3">
                <div className="flex items-start gap-3">
                  <Badge variant={actionColor[r.action] || "outline"} className="capitalize shrink-0">
                    {r.action}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{r.entity_label || r.entity_type}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {ENTITY_LABEL[r.entity_type] || r.entity_type}
                      </Badge>
                    </div>
                    {changedKeys.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        Changed: {changedKeys.join(", ")}{Object.keys(r.changes!).length > 4 ? "…" : ""}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {r.actor_email || "system"} • {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
