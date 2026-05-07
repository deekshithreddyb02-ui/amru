import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";
import ConvertLeadDialog from "@/components/crm/ConvertLeadDialog";
import CrmListView, { type Column, type SavedView } from "@/components/crm/vtiger/CrmListView";

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

const stageTone: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-secondary/20 text-secondary-foreground",
  qualified: "bg-[hsl(var(--teal))]/15 text-[hsl(var(--teal))]",
  won: "bg-green-100 text-green-800",
  lost: "bg-destructive/10 text-destructive",
};

const CrmLeads = () => {
  const { workspace } = useOutletContext<Ctx>();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_leads")
      .select("id,full_name,email,phone,city,state,service_needed,stage,status,created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) console.error(error);
    setLeads((data as Lead[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id]);

  const savedViews: SavedView[] = [
    { id: "all", label: "All Leads" },
    { id: "open", label: "Open Leads", filter: (l: Lead) => !["won", "lost"].includes(l.stage) },
    { id: "new", label: "New This Week", filter: (l: Lead) => Date.now() - new Date(l.created_at).getTime() < 7 * 86400000 },
    { id: "qualified", label: "Qualified", filter: (l: Lead) => l.stage === "qualified" },
    { id: "won", label: "Won", filter: (l: Lead) => l.stage === "won" },
  ];

  const columns: Column<Lead>[] = [
    {
      key: "full_name",
      label: "Name",
      render: (l) => (
        <button
          className="font-medium text-primary hover:underline text-left"
          onClick={(e) => { e.stopPropagation(); navigate(`/crm/${workspace.slug}/leads/${l.id}`); }}
          data-no-row-click
        >
          {l.full_name}
        </button>
      ),
    },
    { key: "email", label: "Email", render: (l) => l.email || "—" },
    { key: "phone", label: "Phone", render: (l) => l.phone || "—" },
    {
      key: "location",
      label: "Location",
      render: (l) => [l.city, l.state].filter(Boolean).join(", ") || "—",
    },
    { key: "service_needed", label: "Service", render: (l) => l.service_needed || "—", defaultVisible: true },
    {
      key: "stage",
      label: "Stage",
      render: (l) => (
        <Badge variant="secondary" className={stageTone[l.stage] || ""}>{l.stage}</Badge>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (l) => new Date(l.created_at).toLocaleDateString("en-IN"),
    },
    {
      key: "actions",
      label: "",
      className: "text-right w-24",
      render: (l) => (
        <div data-no-row-click>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            disabled={l.stage === "won" || l.stage === "lost"}
            onClick={(e) => { e.stopPropagation(); setConvertLead(l); }}
          >
            <ArrowRightLeft className="h-3 w-3" />
            Convert
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <CrmListView<Lead>
        title="Leads"
        subtitle={workspace.name}
        rows={leads}
        loading={loading}
        columns={columns}
        savedViews={savedViews}
        defaultViewId="all"
        searchKeys={["full_name", "email", "phone", "city", "service_needed"]}
        onRefresh={load}
        onRowClick={(l) => navigate(`/crm/${workspace.slug}/leads/${l.id}`)}
      />
      <ConvertLeadDialog
        workspaceId={workspace.id}
        lead={convertLead}
        open={!!convertLead}
        onOpenChange={(v) => !v && setConvertLead(null)}
        onDone={() => { setConvertLead(null); load(); }}
      />
    </>
  );
};

export default CrmLeads;
