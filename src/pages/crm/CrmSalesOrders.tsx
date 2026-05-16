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
import { Loader2, Plus, Search, ShoppingCart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type SO = {
  id: string;
  so_number: string;
  customer_name: string;
  status: string;
  approval_status: string;
  order_date: string;
  delivery_date: string | null;
  total: number;
  currency: string;
};

const STATUS_VARIANTS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/15 text-primary",
  in_fulfillment: "bg-amber-500/15 text-amber-700",
  delivered: "bg-emerald-500/15 text-emerald-700",
  cancelled: "bg-destructive/15 text-destructive",
};

const empty = {
  customer_name: "", customer_email: "", customer_phone: "",
  order_date: new Date().toISOString().slice(0, 10),
  delivery_date: "", notes: "", terms: "",
  total: "0", subtotal: "0",
};

const CrmSalesOrders = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<SO[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_sales_orders")
      .select("id,so_number,customer_name,status,approval_status,order_date,delivery_date,total,currency")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });
    setRows((data as SO[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workspace.id]);

  const save = async () => {
    if (!form.customer_name.trim()) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const so_number = `SO-${Date.now().toString().slice(-8)}`;
    const total = Number(form.total) || 0;
    const { error } = await supabase.from("crm_sales_orders").insert({
      workspace_id: workspace.id,
      so_number,
      customer_name: form.customer_name.trim(),
      customer_email: form.customer_email || null,
      customer_phone: form.customer_phone || null,
      order_date: form.order_date,
      delivery_date: form.delivery_date || null,
      notes: form.notes || null, terms: form.terms || null,
      subtotal: Number(form.subtotal) || total,
      total,
      created_by: session?.user.id,
    });
    setSaving(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Sales order created", description: so_number });
    setOpen(false); setForm(empty); load();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("crm_sales_orders").update({ status }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    load();
  };

  const filtered = rows.filter((r) =>
    !q.trim() || [r.so_number, r.customer_name, r.status].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif">Sales Orders</h1>
          <p className="text-sm text-muted-foreground">Confirmed orders moving from quotation to delivery.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm(empty)}><Plus className="h-4 w-4 mr-2" />New order</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-card max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create sales order</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><Label>Customer name *</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} /></div>
              <div><Label>Order date</Label><Input type="date" value={form.order_date} onChange={(e) => setForm({ ...form, order_date: e.target.value })} /></div>
              <div><Label>Delivery date</Label><Input type="date" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} /></div>
              <div><Label>Subtotal (₹)</Label><Input type="number" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} /></div>
              <div><Label>Total (₹)</Label><Input type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Terms</Label><Textarea rows={2} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving || !form.customer_name.trim()}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search SO #, customer…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="p-0 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No sales orders yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">SO #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Order date</th>
                <th className="p-3">Delivery</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{s.so_number}</td>
                  <td className="p-3">{s.customer_name}</td>
                  <td className="p-3 text-muted-foreground">{s.order_date}</td>
                  <td className="p-3 text-muted-foreground">{s.delivery_date || "—"}</td>
                  <td className="p-3 text-right font-medium">₹{Number(s.total).toLocaleString("en-IN")}</td>
                  <td className="p-3">
                    <Select value={s.status} onValueChange={(v) => updateStatus(s.id, v)}>
                      <SelectTrigger className="h-8 w-36">
                        <Badge className={STATUS_VARIANTS[s.status] || ""} variant="outline">{s.status}</Badge>
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="draft">draft</SelectItem>
                        <SelectItem value="confirmed">confirmed</SelectItem>
                        <SelectItem value="in_fulfillment">in_fulfillment</SelectItem>
                        <SelectItem value="delivered">delivered</SelectItem>
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

export default CrmSalesOrders;
