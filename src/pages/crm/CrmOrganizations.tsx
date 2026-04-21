import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Search, Building2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

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
};

const empty = { name: "", industry: "", city: "", state: "", phone: "", email: "", website: "", notes: "" };

const CrmOrganizations = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_organizations")
      .select("id,name,industry,city,state,phone,email,website")
      .eq("workspace_id", workspace.id)
      .order("name");
    setRows((data as Org[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id]);

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

  const filtered = rows.filter((o) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return o.name.toLowerCase().includes(s) || o.city?.toLowerCase().includes(s) || o.industry?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif">Organizations</h1>
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
              <DialogHeader><DialogTitle>New organization</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Industry</Label>
                    <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                  </div>
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
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
            No organizations yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Industry</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{o.name}</td>
                    <td className="px-4 py-3 text-xs">{o.industry || "—"}</td>
                    <td className="px-4 py-3 text-xs">{[o.city, o.state].filter(Boolean).join(", ") || "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      <div>{o.email || ""}</div>
                      <div className="text-muted-foreground">{o.phone || ""}</div>
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

export default CrmOrganizations;
