import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, DollarSign, FileEdit, FilePlus, Trash2, Loader2 } from "lucide-react";

type Props = { workspaceId: string };

type Row = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_label: string | null;
  changes: any;
  created_at: string;
};

const ENTITY_LABEL: Record<string, string> = {
  crm_leads: "lead",
  crm_deals: "opportunity",
  crm_contacts: "contact",
  crm_organizations: "organization",
  crm_invoices: "invoice",
  crm_quotations: "quotation",
  crm_activities: "activity",
};

function iconFor(entity: string, action: string) {
  if (action === "deleted") return Trash2;
  if (entity === "crm_deals" || entity === "crm_invoices" || entity === "crm_quotations") return DollarSign;
  if (entity === "crm_activities") return Calendar;
  return action === "created" ? FilePlus : FileEdit;
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} month${mo === 1 ? "" : "s"} ago`;
}

function describe(r: Row, actorName: string) {
  const ent = ENTITY_LABEL[r.entity_type] || r.entity_type.replace(/^crm_/, "");
  const label = r.entity_label ? <strong className="text-foreground">{r.entity_label}</strong> : ent;
  if (r.action === "created") return <>added {label}</>;
  if (r.action === "deleted") return <>deleted {label}</>;
  const changedKeys = r.changes && typeof r.changes === "object" ? Object.keys(r.changes).slice(0, 3) : [];
  if (changedKeys.length) {
    return (
      <>
        updated {label}{" "}
        <span className="text-muted-foreground">— {changedKeys.join(", ")}</span>
      </>
    );
  }
  return <>updated {label}</>;
}

export default function DashboardHistory({ workspaceId }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [myId, setMyId] = useState<string | null>(null);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("crm_audit_log")
        .select("id,actor_id,actor_email,action,entity_type,entity_label,changes,created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(80);
      if (cancelled) return;
      const list = (data || []) as Row[];
      setRows(list);

      const ids = Array.from(new Set(list.map((r) => r.actor_id).filter(Boolean))) as string[];
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id,full_name,username")
          .in("user_id", ids);
        const map: Record<string, string> = {};
        (profs || []).forEach((p: any) => {
          map[p.user_id] = p.full_name || p.username || "";
        });
        if (!cancelled) setNameMap(map);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [workspaceId]);

  const actors = useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach((r) => {
      if (!r.actor_id) return;
      const name = nameMap[r.actor_id] || r.actor_email || "Unknown";
      if (!seen.has(r.actor_id)) seen.set(r.actor_id, name);
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [rows, nameMap]);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "mine") return rows.filter((r) => r.actor_id && myId && r.actor_id === myId);
    return rows.filter((r) => r.actor_id === filter);
  }, [rows, filter, myId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">History</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="mine">Mine</SelectItem>
            {actors.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="h-4 w-4 animate-spin inline text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">No activity yet.</div>
        ) : (
          <ul className="divide-y max-h-[420px] overflow-y-auto">
            {filtered.map((r) => {
              const Icon = iconFor(r.entity_type, r.action);
              const actorName = (r.actor_id && nameMap[r.actor_id]) || r.actor_email || "Someone";
              return (
                <li key={r.id} className="flex gap-3 px-4 py-2.5 text-[13px]">
                  <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="leading-snug">
                      <span className="font-semibold text-foreground">{actorName}</span>{" "}
                      <span className="text-muted-foreground">{describe(r, actorName)}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(r.created_at)}</div>
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
