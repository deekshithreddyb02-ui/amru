import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2 } from "lucide-react";

type Props = { workspaceId: string };

type Row = {
  id: string;
  description: string | null;
  created_at: string;
  owner_id: string | null;
  assigned_to: string | null;
  deal_id: string | null;
  lead_id: string | null;
  contact_id: string | null;
  organization_id: string | null;
};

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardComments({ workspaceId }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("crm_activities")
        .select("id,description,created_at,owner_id,assigned_to,deal_id,lead_id,contact_id,organization_id")
        .eq("workspace_id", workspaceId)
        .eq("activity_type", "note")
        .eq("subject", "Comment")
        .order("created_at", { ascending: false })
        .limit(100);
      if (cancelled) return;
      const list = (data || []) as Row[];
      setRows(list);

      const ids = Array.from(new Set(list.map((r) => r.owner_id || r.assigned_to).filter(Boolean))) as string[];
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" /> Comment history
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="h-4 w-4 animate-spin inline text-primary" /></div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">No comments yet.</div>
        ) : (
          <ul className="divide-y max-h-[420px] overflow-y-auto">
            {rows.map((r) => {
              const uid = r.owner_id || r.assigned_to;
              const author = (uid && nameMap[uid]) || "Unknown";
              return (
                <li key={r.id} className="px-4 py-3 text-[13px]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-foreground">{author}</span>
                    <span className="text-[11px] text-muted-foreground">{fmt(r.created_at)}</span>
                  </div>
                  <div className="text-muted-foreground whitespace-pre-wrap break-words leading-snug">
                    {r.description || <em>(empty)</em>}
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
