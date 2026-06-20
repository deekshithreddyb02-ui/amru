import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  DollarSign,
  FileEdit,
  FilePlus,
  Trash2,
  Loader2,
  MessageSquare,
  History,
} from "lucide-react";

type Props = { workspaceId: string };

type AuditRow = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_label: string | null;
  changes: any;
  created_at: string;
};

type CommentRow = {
  id: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
  assigned_to: string | null;
};

type FeedItem =
  | { kind: "audit"; at: string; row: AuditRow; actorId: string | null; actorFallback: string | null }
  | { kind: "comment"; at: string; row: CommentRow; actorId: string | null; actorFallback: string | null };

const ENTITY_LABEL: Record<string, string> = {
  crm_leads: "lead",
  crm_deals: "opportunity",
  crm_contacts: "contact",
  crm_organizations: "organization",
  crm_invoices: "invoice",
  crm_quotations: "quotation",
  crm_activities: "activity",
  crm_support_tickets: "ticket",
};

function iconForAudit(entity: string, action: string) {
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

function describeAudit(r: AuditRow) {
  const ent = ENTITY_LABEL[r.entity_type] || r.entity_type.replace(/^crm_/, "");
  const label = r.entity_label ? <strong className="text-foreground">{r.entity_label}</strong> : ent;
  if (r.action === "created") return <>added {label}</>;
  if (r.action === "deleted") return <>deleted {label}</>;
  const changedKeys =
    r.changes && typeof r.changes === "object" ? Object.keys(r.changes).slice(0, 4) : [];
  if (changedKeys.length) {
    return (
      <>
        edited {label} <span className="text-muted-foreground">— {changedKeys.join(", ")}</span>
      </>
    );
  }
  return <>edited {label}</>;
}

export default function DashboardActivityFeed({ workspaceId }: Props) {
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<"all" | "edits" | "comments">("all");
  const [myId, setMyId] = useState<string | null>(null);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [a, c] = await Promise.all([
        supabase
          .from("crm_audit_log")
          .select("id,actor_id,actor_email,action,entity_type,entity_label,changes,created_at")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false })
          .limit(120),
        supabase
          .from("crm_activities")
          .select("id,description,created_at,created_by,assigned_to")
          .eq("workspace_id", workspaceId)
          .eq("activity_type", "note")
          .eq("subject", "Comment")
          .order("created_at", { ascending: false })
          .limit(120),
      ]);
      if (cancelled) return;

      const auditList = (a.data || []) as AuditRow[];
      const commentList = (c.data || []) as CommentRow[];
      setAudit(auditList);
      setComments(commentList);

      const ids = new Set<string>();
      auditList.forEach((r) => r.actor_id && ids.add(r.actor_id));
      commentList.forEach((r) => {
        if (r.created_by) ids.add(r.created_by);
        else if (r.assigned_to) ids.add(r.assigned_to);
      });

      if (ids.size) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id,full_name,username")
          .in("user_id", Array.from(ids));
        const map: Record<string, string> = {};
        (profs || []).forEach((p: any) => {
          map[p.user_id] = p.full_name || p.username || "";
        });
        if (!cancelled) setNameMap(map);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const items: FeedItem[] = useMemo(() => {
    const merged: FeedItem[] = [];
    audit.forEach((r) =>
      merged.push({ kind: "audit", at: r.created_at, row: r, actorId: r.actor_id, actorFallback: r.actor_email })
    );
    comments.forEach((r) =>
      merged.push({
        kind: "comment",
        at: r.created_at,
        row: r,
        actorId: r.created_by || r.assigned_to,
        actorFallback: null,
      })
    );
    merged.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime());
    return merged;
  }, [audit, comments]);

  const actors = useMemo(() => {
    const seen = new Map<string, string>();
    items.forEach((it) => {
      if (!it.actorId) return;
      const name = nameMap[it.actorId] || it.actorFallback || "Unknown";
      if (!seen.has(it.actorId)) seen.set(it.actorId, name);
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [items, nameMap]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (kindFilter === "edits" && it.kind !== "audit") return false;
      if (kindFilter === "comments" && it.kind !== "comment") return false;
      if (filter === "all") return true;
      if (filter === "mine") return it.actorId && myId && it.actorId === myId;
      return it.actorId === filter;
    });
  }, [items, filter, kindFilter, myId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 gap-2 flex-wrap">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4 text-primary" /> Activity & comments
        </CardTitle>
        <div className="flex gap-2">
          <Select value={kindFilter} onValueChange={(v: any) => setKindFilter(v)}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="edits">Edits only</SelectItem>
              <SelectItem value="comments">Comments only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All people</SelectItem>
              <SelectItem value="mine">Mine</SelectItem>
              {actors.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-4 w-4 animate-spin inline text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Nothing here yet.</div>
        ) : (
          <ul className="divide-y max-h-[520px] overflow-y-auto">
            {filtered.map((it) => {
              const fromWebsite =
                !it.actorId &&
                it.kind === "audit" &&
                (it.row.entity_type === "crm_leads" ||
                  it.row.entity_type === "crm_support_tickets" ||
                  it.row.entity_type === "crm_hydrogeo_enquiries") &&
                (it.row.action === "created" ||
                  !!(it.row.changes && typeof it.row.changes === "object" && it.row.changes.source_enquiry_id));
              const actorName = fromWebsite
                ? "Website"
                : (it.actorId && nameMap[it.actorId]) || it.actorFallback || "Someone";
              if (it.kind === "audit") {
                const Icon = iconForAudit(it.row.entity_type, it.row.action);
                return (
                  <li key={`a-${it.row.id}`} className="flex gap-3 px-4 py-2.5 text-[13px]">
                    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="leading-snug">
                        <span className="font-semibold text-foreground">{actorName}</span>{" "}
                        <span className="text-muted-foreground">{describeAudit(it.row)}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>{timeAgo(it.at)}</span>
                        <Badge variant="outline" className="h-4 px-1 text-[10px]">change</Badge>
                      </div>
                    </div>
                  </li>
                );
              }
              return (
                <li key={`c-${it.row.id}`} className="flex gap-3 px-4 py-2.5 text-[13px]">
                  <MessageSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="leading-snug">
                      <span className="font-semibold text-foreground">{actorName}</span>{" "}
                      <span className="text-muted-foreground">commented</span>
                    </div>
                    <div className="text-muted-foreground whitespace-pre-wrap break-words leading-snug mt-1">
                      {it.row.description || <em>(empty)</em>}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span>{timeAgo(it.at)}</span>
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">comment</Badge>
                    </div>
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
