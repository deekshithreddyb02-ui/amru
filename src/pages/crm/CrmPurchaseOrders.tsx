import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Search, ClipboardCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type PO = {
  id: string;
  po_number: string;
  vendor_name: string;
  status: string;
  approval_status: string;
  order_date: string;
  expected_delivery: string | null;
  total: number;
};

type Vendor = { id: string; name: string };

const STATUS_VARIANTS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/15 text-primary",
  received: "bg-emerald-500/15 text-emerald-700",
  cancelled: "bg-destructive/15 text-destructive",
};

const empty = {
  vendor_id: "", vendor_name: "", vendor_email: "", vendor_phone: "",
  order_date: new Date().toISOString().slice(0, 10),
  expected_delivery: "", notes: "", terms: "",
  subtotal: "0", total: "0",
};

const CrmPurchaseOrders = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<PO[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: poData }, { data: vData }] = await Promise.all([
      supabase.from("crm_purchase_orders")
        .select("id,po_number,vendor_name,status,approval_status,order_date,expected_delivery,total")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false }),
      supabase.from("crm_vendors").select("id,name").eq("workspace_id", workspace.id).eq("is_active", true).order("name"),
    ]);
    setRows((poData as PO[]) || []);
    setVendors((vData as Vendor[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workspace.id]);

  const save = async () => {
    if (!form.vendor_name.trim()) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const po_number = `PO-${Date.now().toString().slice(-8)}`;
    const total = Number(form.total) || 0;
    const { error } = await supabase.from("crm_purchase_orders").insert({
      workspace_id: workspace.id,
      po_number,
      vendor_id: form.vendor_id || null,
      vendor_name: form.vendor_name.trim(),
      vendor_email: form.vendor_email || null,
      vendor_phone: form.vendor_phone || null,
      order_date: form.order_date,
      expected_delivery: form.expected_delivery || null,
      notes: form.notes || null, terms: form.terms || null,
      subtotal: Number(form.subtotal) || total,
      total,
      created_by: session?.user.id,
    });
    setSaving(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Purchase order created", description: po_number });
    setOpen(false); setForm(empty); load();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("crm_purchase_orders").update({ status }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    load();
  };

  const onVendorPick = (vid: string) => {
    const v = vendors.find((x) => x.id === vid);
    setForm({ ...form, vendor_id: vid, vendor_name: v?.name || form.vendor_name });
  };

  const filtered = rows.filter((r) =>
    !q.trim() || [r.po_number, r.vendor_name, r.status].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">Track procurement from vendors.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm(empty)}><Plus className="h-4 w-4 mr-2" />New PO</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-card max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create purchase order</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><Label>Vendor</Label>
                <Select value={form.vendor_id} onValueChange={onVendorPick}>
                  <SelectTrigger><SelectValue placeholder="Pick a vendor…" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Vendor name *</Label><Input value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.vendor_email} onChange={(e) => setForm({ ...form, vendor_email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.vendor_phone} onChange={(e) => setForm({ ...form, vendor_phone: e.target.value })} /></div>
              <div><Label>Order date</Label><Input type="date" value={form.order_date} onChange={(e) => setForm({ ...form, order_date: e.target.value })} /></div>
              <div><Label>Expected delivery</Label><Input type="date" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} /></div>
              <div><Label>Subtotal (₹)</Label><Input type="number" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} /></div>
              <div><Label>Total (₹)</Label><Input type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Terms</Label><Textarea rows={2} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving || !form.vendor_name.trim()}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search PO #, vendor…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="p-0 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No purchase orders yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">PO #</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Order date</th>
                <th className="p-3">Expected</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{p.po_number}</td>
                  <td className="p-3">{p.vendor_name}</td>
                  <td className="p-3 text-muted-foreground">{p.order_date}</td>
                  <td className="p-3 text-muted-foreground">{p.expected_delivery || "—"}</td>
                  <td className="p-3 text-right font-medium">₹{Number(p.total).toLocaleString("en-IN")}</td>
                  <td className="p-3">
                    <Select value={p.status} onValueChange={(v) => updateStatus(p.id, v)}>
                      <SelectTrigger className="h-8 w-32">
                        <Badge className={STATUS_VARIANTS[p.status] || ""} variant="outline">{p.status}</Badge>
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="draft">draft</SelectItem>
                        <SelectItem value="sent">sent</SelectItem>
                        <SelectItem value="received">received</SelectItem>
                        <SelectItem value="cancelled">cancelled</SelectItem>
                      </SelectContent>
                    </Select>
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

export default CrmPurchaseOrders;
