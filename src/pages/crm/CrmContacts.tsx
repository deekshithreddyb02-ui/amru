import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";
import CrmListView, { type Column, type SavedView } from "@/components/crm/vtiger/CrmListView";
import { exportCsv } from "@/lib/csv";
import { Download } from "lucide-react";
import { perfMonitor, timeQuery } from "@/lib/perfMonitor";
import { useRenderTiming } from "@/hooks/usePerfMonitor";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Contact = {
  id: string;
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  organization_id: string | null;
  created_at: string;
  organization?: { name: string } | null;
};

type OrgRef = { id: string; name: string };

const empty = {
  full_name: "", title: "", email: "", phone: "", whatsapp: "",
  city: "", state: "", organization_id: "", notes: "",
};

const CrmContacts = () => {
  const { workspace } = useOutletContext<Ctx>();
  useRenderTiming("CrmContacts");
  const navigate = useNavigate();
  const [rows, setRows] = useState<Contact[]>([]);
  const [orgs, setOrgs] = useState<OrgRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const t = performance.now();
    const { data } = await timeQuery(
      "crm_contacts:list",
      supabase
        .from("crm_contacts")
        .select("id,full_name,title,email,phone,city,organization_id,created_at,organization:crm_organizations(name)")
        .eq("workspace_id", workspace.id)
        .order("full_name"),
    );
    setRows((data as unknown as Contact[]) || []);
    setLoading(false);
    perfMonitor.recordRender("CrmContacts:load", performance.now() - t);
  }, [workspace.id]);

  const loadOrgs = useCallback(async () => {
    if (orgs.length > 0) return;
    const { data } = await timeQuery(
      "crm_organizations:list",
      supabase
        .from("crm_organizations")
        .select("id,name")
        .eq("workspace_id", workspace.id)
        .order("name"),
    );
    setOrgs((data as OrgRef[]) || []);
  }, [orgs.length, workspace.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    void loadOrgs();
  }, [open, loadOrgs]);

  const save = async () => {
    if (!form.full_name.trim()) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("crm_contacts").insert({
      workspace_id: workspace.id,
      full_name: form.full_name.trim(),
      title: form.title || null,
      email: form.email || null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      city: form.city || null,
      state: form.state || null,
      organization_id: form.organization_id || null,
      notes: form.notes || null,
      created_by: session?.user.id,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contact created" });
      setForm(empty);
      setOpen(false);
      load();
    }
  };

  const savedViews: SavedView[] = useMemo(() => [
    { id: "all", label: "All Contacts" },
    { id: "with_org", label: "With Organization", filter: (c: Contact) => !!c.organization_id },
    { id: "no_org", label: "Unassigned", filter: (c: Contact) => !c.organization_id },
    { id: "recent", label: "Recently Added", filter: (c: Contact) => Date.now() - new Date(c.created_at).getTime() < 30 * 86400000 },
  ], []);

  const columns: Column<Contact>[] = useMemo(() => [
    {
      key: "full_name",
      label: "Name",
      render: (c) => (
        <button
          className="font-medium text-primary hover:underline text-left"
          onClick={(e) => { e.stopPropagation(); navigate(`/crm/${workspace.slug}/contacts/${c.id}`); }}
          data-no-row-click
        >
          {c.full_name}
        </button>
      ),
    },
    { key: "title", label: "Title", render: (c) => c.title || "—" },
    { key: "organization", label: "Organization", render: (c) => c.organization?.name || "—" },
    { key: "email", label: "Email", render: (c) => c.email || "—" },
    { key: "phone", label: "Phone", render: (c) => c.phone || "—" },
    { key: "city", label: "City", render: (c) => c.city || "—", defaultVisible: false },
  ], [navigate, workspace.slug]);

  return (
    <>
      <CrmListView<Contact>
        title="Contacts"
        subtitle={workspace.name}
        rows={rows}
        loading={loading}
        columns={columns}
        savedViews={savedViews}
        defaultViewId="all"
        searchKeys={["full_name", "email", "phone", "city"]}
        onRefresh={load}
        onCreate={() => setOpen(true)}
        onRowClick={(c) => navigate(`/crm/${workspace.slug}/contacts/${c.id}`)}
        rightActions={
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={() =>
              exportCsv("contacts", rows, [
                { key: "full_name", label: "Name" },
                { key: "title", label: "Title" },
                { key: "organization", label: "Organization", get: (r) => r.organization?.name || "" },
                { key: "email", label: "Email" },
                { key: "phone", label: "Phone" },
                { key: "city", label: "City" },
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
          <DialogHeader><DialogTitle>New contact</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Full name *</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Organization</Label>
                <Select
                  value={form.organization_id || "none"}
                  onValueChange={(v) => setForm({ ...form, organization_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} disabled={saving || !form.full_name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CrmContacts;
