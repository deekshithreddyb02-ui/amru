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
import { Loader2, Plus, Search, Package, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Product = {
  id: string;
  sku: string | null;
  name: string;
  product_type: string;
  category: string | null;
  unit: string | null;
  hsn_sac: string | null;
  tax_rate: number;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  reorder_level: number;
  is_active: boolean;
  description: string | null;
};

const empty = {
  id: "" as string | "",
  sku: "", name: "", product_type: "product", category: "", unit: "unit",
  hsn_sac: "", tax_rate: "18", unit_price: "0", cost_price: "0",
  stock_quantity: "0", reorder_level: "0", description: "",
};

const CrmProducts = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_products")
      .select("id,sku,name,product_type,category,unit,hsn_sac,tax_rate,unit_price,cost_price,stock_quantity,reorder_level,is_active,description")
      .eq("workspace_id", workspace.id)
      .order("name");
    setRows((data as Product[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workspace.id]);

  const openNew = () => { setForm(empty); setOpen(true); };
  const openEdit = (p: Product) => {
    setForm({
      id: p.id, sku: p.sku || "", name: p.name, product_type: p.product_type,
      category: p.category || "", unit: p.unit || "unit", hsn_sac: p.hsn_sac || "",
      tax_rate: String(p.tax_rate), unit_price: String(p.unit_price), cost_price: String(p.cost_price),
      stock_quantity: String(p.stock_quantity), reorder_level: String(p.reorder_level),
      description: p.description || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const payload = {
      workspace_id: workspace.id,
      sku: form.sku || null,
      name: form.name.trim(),
      product_type: form.product_type,
      category: form.category || null,
      unit: form.unit || null,
      hsn_sac: form.hsn_sac || null,
      tax_rate: Number(form.tax_rate) || 0,
      unit_price: Number(form.unit_price) || 0,
      cost_price: Number(form.cost_price) || 0,
      stock_quantity: Number(form.stock_quantity) || 0,
      reorder_level: Number(form.reorder_level) || 0,
      description: form.description || null,
    };
    const { error } = form.id
      ? await supabase.from("crm_products").update(payload).eq("id", form.id)
      : await supabase.from("crm_products").insert({ ...payload, created_by: session?.user.id });
    setSaving(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: form.id ? "Updated" : "Added" });
    setOpen(false); setForm(empty); load();
  };

  const filtered = rows.filter((r) =>
    !q.trim() || [r.name, r.sku, r.category].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif">Products & Services</h1>
          <p className="text-sm text-muted-foreground">Catalog used in quotations, sales orders, and invoices.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New item</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-card max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit item" : "Add product / service"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Type</Label>
                <Select value={form.product_type} onValueChange={(v) => setForm({ ...form, product_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              <div><Label>Unit</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="unit / hr / m / kg" /></div>
              <div><Label>HSN/SAC</Label><Input value={form.hsn_sac} onChange={(e) => setForm({ ...form, hsn_sac: e.target.value })} /></div>
              <div><Label>Tax %</Label><Input type="number" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} /></div>
              <div><Label>Unit price (₹)</Label><Input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} /></div>
              <div><Label>Cost price (₹)</Label><Input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} /></div>
              <div><Label>Stock qty</Label><Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} /></div>
              <div><Label>Reorder level</Label><Input type="number" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
          <Input placeholder="Search by name, SKU or category…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="p-0 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No products yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">SKU</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-right">Tax</th>
                <th className="p-3 text-right">Stock</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">
                    <div className="font-medium">{p.name}</div>
                    {p.category && <div className="text-xs text-muted-foreground">{p.category}</div>}
                  </td>
                  <td className="p-3"><Badge variant="outline">{p.product_type}</Badge></td>
                  <td className="p-3 text-muted-foreground">{p.sku || "—"}</td>
                  <td className="p-3 text-right">₹{Number(p.unit_price).toLocaleString("en-IN")}</td>
                  <td className="p-3 text-right">{p.tax_rate}%</td>
                  <td className="p-3 text-right">
                    {p.product_type === "service" ? "—" : (
                      <span className={p.stock_quantity <= p.reorder_level ? "text-destructive font-medium" : ""}>
                        {p.stock_quantity}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
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

export default CrmProducts;
