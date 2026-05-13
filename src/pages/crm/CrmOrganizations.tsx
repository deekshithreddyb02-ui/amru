import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";
import CrmListView, { type Column, type SavedView } from "@/components/crm/vtiger/CrmListView";
import { exportCsv } from "@/lib/csv";
import { Download } from "lucide-react";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Org = {
  id: string;
  name: string;
  industry: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  created_at: string;
};

const empty = { name: "", industry: "", city: "", state: "", phone: "", email: "", website: "", notes: "" };

const CrmOrganizations = () => {
  const { workspace } = useOutletContext<Ctx>();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_organizations")
      .select("id,name,industry,city,state,phone,email,website,created_at")
      .eq("workspace_id", workspace.id)
      .order("name");
    setRows((data as Org[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workspace.id]);

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("crm_organizations").insert({
      workspace_id: workspace.id,
      name: form.name.trim(),
      industry: form.industry || null,
      city: form.city || null,
      state: form.state || null,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      notes: form.notes || null,
      created_by: session?.user.id,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Organization created" });
      setForm(empty);
      setOpen(false);
      load();
    }
  };

  const savedViews: SavedView[] = [
    { id: "all", label: "All Organizations" },
    { id: "recent", label: "Recently Added", filter: (o: Org) => Date.now() - new Date(o.created_at).getTime() < 30 * 86400000 },
  ];

  const columns: Column<Org>[] = [
    {
      key: "name",
      label: "Name",
      render: (o) => (
        <button
          className="font-medium text-primary hover:underline text-left"
          onClick={(e) => { e.stopPropagation(); navigate(`/crm/${workspace.slug}/organizations/${o.id}`); }}
          data-no-row-click
        >
          {o.name}
        </button>
      ),
    },
    { key: "industry", label: "Industry", render: (o) => o.industry || "—" },
    { key: "location", label: "Location", render: (o) => [o.city, o.state].filter(Boolean).join(", ") || "—" },
    { key: "email", label: "Email", render: (o) => o.email || "—" },
    { key: "phone", label: "Phone", render: (o) => o.phone || "—" },
    { key: "website", label: "Website", render: (o) => o.website || "—", defaultVisible: false },
  ];

  return (
    <>
      <CrmListView<Org>
        title="Organizations"
        subtitle={workspace.name}
        rows={rows}
        loading={loading}
        columns={columns}
        savedViews={savedViews}
        defaultViewId="all"
        searchKeys={["name", "industry", "city", "email"]}
        onRefresh={load}
        onCreate={() => setOpen(true)}
        onRowClick={(o) => navigate(`/crm/${workspace.slug}/organizations/${o.id}`)}
        rightActions={
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={() =>
              exportCsv("organizations", rows, [
                { key: "name", label: "Name" },
                { key: "industry", label: "Industry" },
                { key: "city", label: "City" },
                { key: "state", label: "State" },
                { key: "email", label: "Email" },
                { key: "phone", label: "Phone" },
                { key: "website", label: "Website" },
              ])
            }
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Export</span>
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New organization</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Industry</Label><Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></div>
              <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CrmOrganizations;
