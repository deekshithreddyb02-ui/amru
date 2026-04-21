import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Search, UserRound } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Contact = {
  id: string;
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  organization_id: string | null;
  organization?: { name: string } | null;
};

type OrgRef = { id: string; name: string };

const empty = {
  full_name: "", title: "", email: "", phone: "", whatsapp: "",
  city: "", state: "", organization_id: "", notes: "",
};

const CrmContacts = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<Contact[]>([]);
  const [orgs, setOrgs] = useState<OrgRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [c, o] = await Promise.all([
      supabase
        .from("crm_contacts")
        .select("id,full_name,title,email,phone,city,organization_id,organization:crm_organizations(name)")
        .eq("workspace_id", workspace.id)
        .order("full_name"),
      supabase.from("crm_organizations").select("id,name").eq("workspace_id", workspace.id).order("name"),
    ]);
    setRows((c.data as unknown as Contact[]) || []);
    setOrgs((o.data as OrgRef[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id]);

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

  const filtered = rows.filter((c) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.phone?.toLowerCase().includes(s) ||
      c.organization?.name?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif">Contacts</h1>
          <p className="text-muted-foreground text-sm">{workspace.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 w-56" />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New</Button>
            </DialogTrigger>
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
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <UserRound className="h-10 w-10 mx-auto mb-2 opacity-40" />
            No contacts yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{c.full_name}</td>
                    <td className="px-4 py-3 text-xs">{c.title || "—"}</td>
                    <td className="px-4 py-3 text-xs">{c.organization?.name || "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      <div>{c.email || ""}</div>
                      <div className="text-muted-foreground">{c.phone || ""}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CrmContacts;
