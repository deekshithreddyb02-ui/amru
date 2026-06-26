import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users2, Merge, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type Workspace = { id: string };
type Group = { key: string; reason: string; rows: any[] };

const ENTITIES = [
  { key: "crm_leads", label: "Leads", nameField: "full_name" },
  { key: "crm_contacts", label: "Contacts", nameField: "full_name" },
  { key: "crm_organizations", label: "Organizations", nameField: "name" },
];

export default function CrmDataQuality() {
  const { workspace, myRole } = useOutletContext<{ workspace: Workspace; myRole: string }>();
  const [entity, setEntity] = useState("crm_leads");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState<string | null>(null);
  const isAdmin = myRole === "crm_admin" || myRole === "super_admin";

  const scan = async (ent: string) => {
    setEntity(ent);
    setLoading(true);
    setGroups([]);
    const { data, error } = await supabase.functions.invoke("crm-find-duplicates", {
      body: { workspace_id: workspace.id, entity: ent },
    });
    if (error) toast.error(error.message);
    setGroups((data as any)?.groups ?? []);
    setLoading(false);
  };

  const merge = async (primary_id: string, merged_id: string) => {
    if (!isAdmin) return toast.error("Admins only");
    if (!confirm("Merge these records? This deletes the duplicate and reassigns its references.")) return;
    setMerging(merged_id);
    const { data, error } = await supabase.functions.invoke("crm-merge-records", {
      body: { workspace_id: workspace.id, entity, primary_id, merged_id },
    });
    setMerging(null);
    if (error || (data as any)?.error) return toast.error(error?.message ?? (data as any)?.error);
    toast.success("Merged");
    scan(entity);
  };

  const nameField = ENTITIES.find((e) => e.key === entity)?.nameField ?? "full_name";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif flex items-center gap-2"><Users2 className="h-6 w-6 text-primary" />Data Quality</h1>
        <p className="text-sm text-muted-foreground">Find and merge duplicate records.</p>
      </div>
      <Tabs value={entity} onValueChange={scan}>
        <TabsList>
          {ENTITIES.map((e) => <TabsTrigger key={e.key} value={e.key}>{e.label}</TabsTrigger>)}
        </TabsList>
        {ENTITIES.map((e) => (
          <TabsContent key={e.key} value={e.key} className="space-y-3">
            <div className="flex justify-end"><Button onClick={() => scan(e.key)} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Scan duplicates"}</Button></div>
            {!loading && groups.length === 0 && <Card className="p-8 text-center text-muted-foreground">Click "Scan duplicates" to start.</Card>}
            {groups.map((g, idx) => (
              <Card key={idx} className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-amber-500" /><Badge variant="outline">{g.reason}</Badge><span className="text-muted-foreground">{g.rows.length} matches</span></div>
                <div className="space-y-2">
                  {g.rows.map((r, i) => (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded border">
                      <div className="text-sm">
                        <div className="font-medium">{r[nameField] || "(no name)"} {i === 0 && <Badge className="ml-2" variant="default">Primary</Badge>}</div>
                        <div className="text-xs text-muted-foreground">{r.email || r.phone || r.whatsapp || r.id}</div>
                      </div>
                      {i > 0 && isAdmin && (
                        <Button size="sm" variant="outline" disabled={merging === r.id} onClick={() => merge(g.rows[0].id, r.id)}>
                          {merging === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Merge className="h-3 w-3 mr-1" />Merge into primary</>}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
