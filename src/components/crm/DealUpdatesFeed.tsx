import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User as UserIcon, Mail, MessageSquare, FileText } from "lucide-react";

type Props = { dealId: string; workspaceId: string };

type Item = {
  id: string;
  kind: "audit" | "activity" | "comment";
  action: string;
  actor: string;
  created_at: string;
  changes?: Array<{ field: string; from: any; to: any }>;
  subject?: string;
  description?: string;
  activity_type?: string;
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? "s" : ""} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo > 1 ? "s" : ""} ago`;
  return `${Math.floor(mo / 12)} year ago`;
};

const HIDDEN_FIELDS = new Set([
  "id", "updated_at", "created_at", "workspace_id", "search_vector",
]);

const prettyField = (f: string) =>
  f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const prettyVal = (v: any) => {
  if (v == null || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

export default function DealUpdatesFeed({ dealId, workspaceId }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [auditRes, actRes] = await Promise.all([
        (supabase as any).from("crm_audit_log")
          .select("id,action,actor_email,actor_id,changes,created_at,entity_label")
          .eq("workspace_id", workspaceId)
          .eq("entity_type", "deal")
          .eq("entity_id", dealId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("crm_activities")
          .select("id,activity_type,subject,description,status,created_at,created_by")
          .eq("deal_id", dealId)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      // Get actor names
      const actorIds = new Set<string>();
      (auditRes.data || []).forEach((a: any) => a.actor_id && actorIds.add(a.actor_id));
      (actRes.data || []).forEach((a: any) => a.created_by && actorIds.add(a.created_by));
      let nameMap: Record<string, string> = {};
      if (actorIds.size) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,full_name,email")
          .in("id", Array.from(actorIds));
        (profs || []).forEach((p: any) => {
          nameMap[p.id] = p.full_name || p.email || "User";
        });
      }

      const audits: Item[] = (auditRes.data || []).map((a: any) => {
        const ch = a.changes || {};
        const changes: Item["changes"] = [];
        // changes may be { field: {from, to} } or { before, after }
        if (ch.before && ch.after) {
          const keys = new Set([...Object.keys(ch.before || {}), ...Object.keys(ch.after || {})]);
          keys.forEach((k) => {
            if (HIDDEN_FIELDS.has(k)) return;
            const from = ch.before[k];
            const to = ch.after[k];
            if (JSON.stringify(from) !== JSON.stringify(to)) {
              changes.push({ field: k, from, to });
            }
          });
        } else {
          Object.entries(ch).forEach(([k, v]: any) => {
            if (HIDDEN_FIELDS.has(k)) return;
            if (v && typeof v === "object" && ("from" in v || "to" in v)) {
              changes.push({ field: k, from: v.from, to: v.to });
            }
          });
        }
        return {
          id: `a-${a.id}`,
          kind: "audit",
          action: a.action,
          actor: (a.actor_id && nameMap[a.actor_id]) || a.actor_email || "Website",
          created_at: a.created_at,
          changes,
        };
      });

      const acts: Item[] = (actRes.data || []).map((a: any) => ({
        id: `t-${a.id}`,
        kind: a.activity_type === "note" ? "comment" : "activity",
        action: a.activity_type === "note" ? "commented" : (a.status || "added"),
        actor: (a.created_by && nameMap[a.created_by]) || "Website",
        created_at: a.created_at,
        subject: a.subject,
        description: a.description,
        activity_type: a.activity_type,
      }));

      const merged = [...audits, ...acts].sort(
        (x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime()
      );
      if (!cancelled) {
        setItems(merged);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dealId, workspaceId]);

  if (loading) {
    return <div className="p-10 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>;
  }

  if (items.length === 0) {
    return <div className="p-10 text-center text-[12px] text-muted-foreground">No updates yet.</div>;
  }

  return (
    <div className="bg-white">
      <ul className="relative px-6 py-6 space-y-6">
        <span className="absolute left-[148px] top-6 bottom-6 w-px bg-border" />
        {items.map((it) => {
          const isComment = it.kind === "comment";
          const isEmail = it.activity_type === "email";
          const Icon = isEmail ? Mail : isComment ? MessageSquare : it.kind === "audit" ? UserIcon : FileText;
          const iconBg =
            isEmail ? "bg-blue-500" :
            isComment ? "bg-emerald-500" :
            it.kind === "audit" ? "bg-orange-400" : "bg-slate-400";

          return (
            <li key={it.id} className="grid grid-cols-[120px_40px_1fr] gap-3 items-start relative">
              <div className="text-[12px] text-muted-foreground italic pt-1 text-right">
                {timeAgo(it.created_at)}
              </div>
              <div className={`h-8 w-8 rounded-full ${iconBg} text-white flex items-center justify-center relative z-10`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-[13px] min-w-0 pt-0.5">
                <div>
                  <span className="text-primary font-medium">{it.actor}</span>{" "}
                  <span className="text-foreground font-medium">{it.action}</span>
                </div>

                {it.kind === "audit" && it.changes && it.changes.length > 0 && (
                  <div className="mt-2 space-y-3 text-[12.5px]">
                    {it.changes.slice(0, 8).map((c, i) => (
                      <div key={i} className="pl-4">
                        <div className="text-primary font-medium">
                          {prettyField(c.field)} <span className="text-foreground font-normal ml-1">changed</span>
                        </div>
                        <div className="text-muted-foreground">
                          <span className="text-primary">From</span>{" "}
                          <span className="italic text-foreground">{prettyVal(c.from)}</span>
                        </div>
                        <div className="text-muted-foreground">
                          <span className="text-primary">To</span>{" "}
                          <span className="italic text-foreground">{prettyVal(c.to)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(it.kind === "activity" || it.kind === "comment") && (
                  <div className="mt-1 text-[12.5px]">
                    {it.subject && <div className="font-medium">{it.subject}</div>}
                    {it.description && (
                      <div className="text-muted-foreground whitespace-pre-wrap break-words">
                        {it.description}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
