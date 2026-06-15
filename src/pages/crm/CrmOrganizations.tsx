import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, ArrowRight, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";
import CrmListView, { type Column, type SavedView } from "@/components/crm/vtiger/CrmListView";
import { exportCsv } from "@/lib/csv";

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
  contact_count?: number;
  project_count?: number;
};

const empty = { name: "", industry: "", city: "", state: "", phone: "", email: "", website: "", notes: "" };

/** Case- and whitespace-insensitive normalization (matches the DB unique index). */
const normalizeOrgName = (s: string) =>
  s.toLowerCase().replace(/\s+/g, " ").trim();

const CrmOrganizations = () => {
  const { workspace } = useOutletContext<Ctx>();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState<Org | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_organizations")
      .select("id,name,industry,city,state,phone,email,website,created_at")
      .eq("workspace_id", workspace.id)
      .order("name");
    const base = (data as Org[]) || [];

    // Counts: fetch contacts + deals (projects) for this workspace and aggregate.
    const [{ data: cRows }, { data: dRows }] = await Promise.all([
      supabase.from("crm_contacts").select("organization_id").eq("workspace_id", workspace.id),
      supabase.from("crm_deals").select("organization_id").eq("workspace_id", workspace.id),
    ]);
    const cMap = new Map<string, number>();
    (cRows || []).forEach((r: any) => { if (r.organization_id) cMap.set(r.organization_id, (cMap.get(r.organization_id) || 0) + 1); });
    const dMap = new Map<string, number>();
    (dRows || []).forEach((r: any) => { if (r.organization_id) dMap.set(r.organization_id, (dMap.get(r.organization_id) || 0) + 1); });

    setRows(base.map((o) => ({ ...o, contact_count: cMap.get(o.id) || 0, project_count: dMap.get(o.id) || 0 })));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workspace.id]);

  /** Live duplicate suggestion while typing. */
  const liveDuplicate = useMemo<Org | null>(() => {
    const n = normalizeOrgName(form.name);
    if (!n) return null;
    return rows.find((r) => normalizeOrgName(r.name) === n) || null;
  }, [form.name, rows]);

  const save = async () => {
    const cleanName = form.name.replace(/\s+/g, " ").trim();
    if (!cleanName) return;

    // Client-side duplicate guard.
    const existing = rows.find((r) => normalizeOrgName(r.name) === normalizeOrgName(cleanName));
    if (existing) {
      setDuplicate(existing);
      toast({
        title: "Organization already exists",
        description: "Please add a contact under the existing organization.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("crm_organizations").insert({
      workspace_id: workspace.id,
      name: cleanName,
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
      // Catch DB-level unique-violation as a safety net.
      if ((error as any).code === "23505" || /duplicate|unique/i.test(error.message)) {
        await load();
        const dup = rows.find((r) => normalizeOrgName(r.name) === normalizeOrgName(cleanName)) || null;
        setDuplicate(dup);
        toast({
          title: "Organization already exists",
          description: "Please add a contact under the existing organization.",
          variant: "destructive",
        });
        return;
      }
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
    { key: "contact_count", label: "Contacts", render: (o) => <span className="tabular-nums">{o.contact_count ?? 0}</span> },
    { key: "project_count", label: "Projects", render: (o) => <span className="tabular-nums">{o.project_count ?? 0}</span> },
    { key: "email", label: "Email", render: (o) => o.email || "—", defaultVisible: false },
    { key: "phone", label: "Phone", render: (o) => o.phone || "—", defaultVisible: false },
    { key: "website", label: "Website", render: (o) => o.website || "—", defaultVisible: false },
  ];

  const goExistingOrg = (orgId: string) => {
    setOpen(false);
    setDuplicate(null);
    setForm(empty);
    navigate(`/crm/${workspace.slug}/organizations/${orgId}?addContact=1`);
  };

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
                { key: "contact_count", label: "Contacts" },
                { key: "project_count", label: "Projects" },
              ])
            }
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Export</span>
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setDuplicate(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New organization</DialogTitle>
            <DialogDescription>Names must be unique within this workspace (case- and space-insensitive).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setDuplicate(null); }} />
              {liveDuplicate && (
                <div className="mt-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-sm">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-destructive">Organization already exists</div>
                    <div className="text-xs text-muted-foreground">
                      Please add a contact under the existing organization.
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="link"
                      className="h-auto p-0 mt-1 gap-1 text-primary"
                      onClick={() => goExistingOrg(liveDuplicate.id)}
                    >
                      Open “{liveDuplicate.name}” & add contact <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
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
            {duplicate && (
              <Button variant="outline" onClick={() => goExistingOrg(duplicate.id)}>
                Add contact to existing
              </Button>
            )}
            <Button onClick={save} disabled={saving || !form.name.trim() || !!liveDuplicate}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CrmOrganizations;
