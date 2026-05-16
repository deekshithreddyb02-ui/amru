import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, AlertTriangle, Package, ArrowDownCircle, ArrowUpCircle, Settings2, Warehouse } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Product = {
  id: string;
  sku: string | null;
  name: string;
  product_type: string;
  unit: string | null;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  reorder_level: number;
};

type Movement = {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  unit_cost: number;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
};

const CrmInventory = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_id: "",
    movement_type: "in",
    quantity: "1",
    unit_cost: "0",
    reference_number: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    const [{ data: pData }, { data: mData }] = await Promise.all([
      supabase
        .from("crm_products")
        .select("id,sku,name,product_type,unit,unit_price,cost_price,stock_quantity,reorder_level")
        .eq("workspace_id", workspace.id)
        .eq("product_type", "product")
        .order("name"),
      supabase
        .from("crm_stock_movements")
        .select("id,product_id,movement_type,quantity,unit_cost,reference_number,notes,created_at")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    setProducts((pData as Product[]) || []);
    setMovements((mData as Movement[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workspace.id]);

  const productMap = useMemo(() => {
    const m: Record<string, Product> = {};
    products.forEach((p) => (m[p.id] = p));
    return m;
  }, [products]);

  const lowStock = products.filter((p) => p.stock_quantity <= p.reorder_level);
  const totalValue = products.reduce((s, p) => s + p.stock_quantity * Number(p.cost_price || 0), 0);
  const totalUnits = products.reduce((s, p) => s + Number(p.stock_quantity || 0), 0);

  const openMovement = (productId?: string, type: string = "in") => {
    setForm({
      product_id: productId || "",
      movement_type: type,
      quantity: "1",
      unit_cost: "0",
      reference_number: "",
      notes: "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.product_id || !form.quantity) {
      toast({ title: "Select a product and quantity", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("crm_stock_movements").insert({
      workspace_id: workspace.id,
      product_id: form.product_id,
      movement_type: form.movement_type,
      quantity: Number(form.quantity),
      unit_cost: Number(form.unit_cost) || 0,
      reference_number: form.reference_number || null,
      notes: form.notes || null,
      performed_by: session?.user.id,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Stock updated" });
    setOpen(false);
    load();
  };

  const movementBadge = (t: string) => {
    if (t === "in") return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">Stock In</Badge>;
    if (t === "out") return <Badge className="bg-red-500/15 text-red-700 border-red-500/30">Stock Out</Badge>;
    if (t === "adjustment") return <Badge variant="outline">Adjustment</Badge>;
    return <Badge variant="outline">{t}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif">Inventory & Stock</h1>
          <p className="text-sm text-muted-foreground">Track stock movements, low-stock alerts, and inventory value.</p>
        </div>
        <Button onClick={() => openMovement()}><Plus className="h-4 w-4 mr-2" />Record movement</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Products tracked</div>
          <div className="text-2xl font-semibold flex items-center gap-2 mt-1"><Package className="h-5 w-5 text-primary" />{products.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total units in stock</div>
          <div className="text-2xl font-semibold flex items-center gap-2 mt-1"><Warehouse className="h-5 w-5 text-primary" />{totalUnits.toLocaleString("en-IN")}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Inventory value (cost)</div>
          <div className="text-2xl font-semibold mt-1">₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Low stock alerts</div>
          <div className={`text-2xl font-semibold flex items-center gap-2 mt-1 ${lowStock.length ? "text-destructive" : ""}`}>
            <AlertTriangle className="h-5 w-5" />{lowStock.length}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock levels</TabsTrigger>
          <TabsTrigger value="alerts">Low stock ({lowStock.length})</TabsTrigger>
          <TabsTrigger value="movements">Movement history</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-3">
          <Card className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
            ) : products.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No products yet. Add products from the Products page.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3 text-right">In stock</th>
                    <th className="p-3 text-right">Reorder</th>
                    <th className="p-3 text-right">Value</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const low = p.stock_quantity <= p.reorder_level;
                    return (
                      <tr key={p.id} className="border-t hover:bg-muted/30">
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 text-muted-foreground">{p.sku || "—"}</td>
                        <td className={`p-3 text-right font-medium ${low ? "text-destructive" : ""}`}>
                          {p.stock_quantity} {p.unit || ""}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">{p.reorder_level}</td>
                        <td className="p-3 text-right">₹{(p.stock_quantity * Number(p.cost_price || 0)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <Button variant="ghost" size="sm" onClick={() => openMovement(p.id, "in")} title="Stock in"><ArrowDownCircle className="h-4 w-4 text-emerald-600" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => openMovement(p.id, "out")} title="Stock out"><ArrowUpCircle className="h-4 w-4 text-red-600" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => openMovement(p.id, "adjustment")} title="Adjust"><Settings2 className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-3">
          <Card className="p-0 overflow-x-auto">
            {lowStock.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>All products are above reorder level. 🎉</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3 text-right">In stock</th>
                    <th className="p-3 text-right">Reorder level</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-right text-destructive font-medium">{p.stock_quantity}</td>
                      <td className="p-3 text-right">{p.reorder_level}</td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => openMovement(p.id, "in")}>Restock</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="mt-3">
          <Card className="p-0 overflow-x-auto">
            {movements.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No movements recorded yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Unit cost</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 whitespace-nowrap text-muted-foreground">{new Date(m.created_at).toLocaleString("en-IN")}</td>
                      <td className="p-3">{productMap[m.product_id]?.name || "—"}</td>
                      <td className="p-3">{movementBadge(m.movement_type)}</td>
                      <td className="p-3 text-right font-medium">{m.quantity}</td>
                      <td className="p-3 text-right">{m.unit_cost ? `₹${Number(m.unit_cost).toLocaleString("en-IN")}` : "—"}</td>
                      <td className="p-3 text-muted-foreground">{m.reference_number || "—"}</td>
                      <td className="p-3 text-muted-foreground max-w-xs truncate">{m.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card max-w-lg">
          <DialogHeader><DialogTitle>Record stock movement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Product *</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent className="bg-popover max-h-72">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.stock_quantity} in stock)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type *</Label>
                <Select value={form.movement_type} onValueChange={(v) => setForm({ ...form, movement_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="in">Stock In (purchase, return)</SelectItem>
                    <SelectItem value="out">Stock Out (sale, usage)</SelectItem>
                    <SelectItem value="adjustment">Adjustment (set exact value)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity *</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div>
                <Label>Unit cost (₹)</Label>
                <Input type="number" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} />
              </div>
              <div>
                <Label>Reference #</Label>
                <Input value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} placeholder="PO-123, INV-45…" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CrmInventory;
