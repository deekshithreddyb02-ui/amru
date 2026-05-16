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
import { Loader2, Plus, Search, Truck, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Vendor = {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  gstin: string | null;
  is_active: boolean;
};

const empty = {
  id: "" as string | "", name: "", contact_person: "", email: "", phone: "",
  website: "", gstin: "", pan: "", street: "", city: "", state: "", pincode: "",
  payment_terms: "", notes: "",
};

const CrmVendors = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_vendors")
      .select("id,name,contact_person,email,phone,city,state,gstin,is_active")
      .eq("workspace_id", workspace.id)
      .order("name");
    setRows((data as Vendor[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workspace.id]);

  const openNew = () => { setForm(empty); setOpen(true); };
  const openEdit = async (v: Vendor) => {
    const { data } = await supabase.from("crm_vendors").select("*").eq("id", v.id).maybeSingle();
    if (!data) return;
    setForm({
      id: data.id, name: data.name, contact_person: data.contact_person || "",
      email: data.email || "", phone: data.phone || "", website: data.website || "",
      gstin: data.gstin || "", pan: data.pan || "", street: data.street || "",
      city: data.city || "", state: data.state || "", pincode: data.pincode || "",
      payment_terms: data.payment_terms || "", notes: data.notes || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const payload = {
      workspace_id: workspace.id,
      name: form.name.trim(),
      contact_person: form.contact_person || null,
      email: form.email || null, phone: form.phone || null, website: form.website || null,
      gstin: form.gstin || null, pan: form.pan || null,
      street: form.street || null, city: form.city || null, state: form.state || null,
      pincode: form.pincode || null, payment_terms: form.payment_terms || null,
      notes: form.notes || null,
    };
    const { error } = form.id
      ? await supabase.from("crm_vendors").update(payload).eq("id", form.id)
      : await supabase.from("crm_vendors").insert({ ...payload, created_by: session?.user.id });
    setSaving(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: form.id ? "Updated" : "Added" });
    setOpen(false); setForm(empty); load();
  };

  const filtered = rows.filter((r) =>
    !q.trim() || [r.name, r.contact_person, r.gstin, r.city, r.state].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif">Vendors</h1>
          <p className="text-sm text-muted-foreground">Suppliers used in purchase orders.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New vendor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-card max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit vendor" : "Add vendor"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><Label>Vendor name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Contact person</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
              <div><Label>GSTIN</Label><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></div>
              <div><Label>PAN</Label><Input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Street</Label><Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} /></div>
              <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
              <div><Label>Pincode</Label><Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></div>
              <div><Label>Payment terms</Label><Input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} placeholder="Net 30" /></div>
              <div className="md:col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving || !form.name.trim()}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{form.id ? "Update" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search vendor, GSTIN, city…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="p-0 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <Truck className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No vendors yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Vendor</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Location</th>
                <th className="p-3">GSTIN</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{v.name}</td>
                  <td className="p-3 text-muted-foreground">{v.contact_person || "—"}</td>
                  <td className="p-3">{v.phone || "—"}</td>
                  <td className="p-3 text-muted-foreground">{[v.city, v.state].filter(Boolean).join(", ") || "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">{v.gstin || "—"}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default CrmVendors;
