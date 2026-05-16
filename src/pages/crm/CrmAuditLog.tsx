import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Workspace { id: string; slug: string; name: string }
interface Entry {
  id: string; created_at: string; actor_email: string | null;
  action: string; entity_type: string; entity_label: string | null; changes: any;
}

const ACTION_COLORS: Record<string, string> = {
  created: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100",
  updated: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100",
  deleted: "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100",
  approved: "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100",
  rejected: "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100",
  submitted: "bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-100",
  sent: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100",
};

export default function CrmAuditLog() {
  const { workspace } = useOutletContext<{ workspace: Workspace }>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("crm_audit_log").select("*").eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false }).limit(500);
      setEntries((data as Entry[]) || []);
      setLoading(false);
    })();
  }, [workspace.id]);

  const filtered = entries.filter((e) => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    return (e.entity_type + e.action + (e.entity_label || "") + (e.actor_email || "")).toLowerCase().includes(f);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif">Audit log</h1>
        <p className="text-sm text-muted-foreground">Track every change in this workspace</p>
      </div>
      <Input placeholder="Filter by user, entity, action…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-md" />
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" />{filtered.length} entries</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">No audit entries yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead><TableHead>Who</TableHead><TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead><TableHead>Item</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(e.created_at).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-xs">{e.actor_email || "—"}</TableCell>
                      <TableCell><Badge className={ACTION_COLORS[e.action] || ""}>{e.action}</Badge></TableCell>
                      <TableCell className="text-xs capitalize">{e.entity_type.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{e.entity_label || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
