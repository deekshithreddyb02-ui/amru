import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRightLeft, Loader2, RefreshCw, Search } from "lucide-react";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";
import ConvertLeadDialog from "@/components/crm/ConvertLeadDialog";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Lead = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  service_needed: string | null;
  stage: string;
  status: string;
  created_at: string;
};

const stageColor: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-secondary/20 text-secondary-foreground",
  qualified: "bg-[hsl(var(--teal))]/15 text-[hsl(var(--teal))]",
  won: "bg-green-100 text-green-800",
  lost: "bg-destructive/10 text-destructive",
};

const CrmLeads = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [convertLead, setConvertLead] = useState<Lead | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_leads")
      .select("id,full_name,email,phone,city,state,service_needed,stage,status,created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) console.error(error);
    setLeads((data as Lead[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id]);

  const filtered = leads.filter((l) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      l.full_name?.toLowerCase().includes(s) ||
      l.email?.toLowerCase().includes(s) ||
      l.phone?.toLowerCase().includes(s) ||
      l.city?.toLowerCase().includes(s) ||
      l.service_needed?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif">Leads</h1>
          <p className="text-muted-foreground text-sm">{workspace.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8 w-56"
            />
          </div>
          <Button variant="outline" size="icon" onClick={load} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No leads yet. New website enquiries from {workspace.name} will appear here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{l.full_name}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs">{l.email || "—"}</div>
                      <div className="text-xs text-muted-foreground">{l.phone || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {[l.city, l.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">{l.service_needed || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={stageColor[l.stage] || ""}>
                        {l.stage}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setConvertLead(l)}
                        disabled={l.stage === "won" || l.stage === "lost"}
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        Convert
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConvertLeadDialog
        workspaceId={workspace.id}
        lead={convertLead}
        open={!!convertLead}
        onOpenChange={(v) => !v && setConvertLead(null)}
        onDone={() => {
          setConvertLead(null);
          load();
        }}
      />
    </div>
  );
};

export default CrmLeads;
