import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { calcGst, formatINR, type LineItem, type GstType } from "@/lib/gst";

type Mode = "quotation" | "invoice";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: Mode;
  workspaceId: string;
  onSaved: () => void;
};

const blankItem = (): LineItem => ({
  description: "",
  hsn_sac: "",
  quantity: 1,
  unit: "nos",
  rate: 0,
  tax_rate: 18,
});

type Product = {
  id: string;
  name: string;
  hsn_sac: string | null;
  unit: string | null;
  unit_price: number;
  tax_rate: number;
};

const InvoiceFormDialog = ({ open, onOpenChange, mode, workspaceId, onSaved }: Props) => {
  const [saving, setSaving] = useState(false);
  const [docNumber, setDocNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [gstType, setGstType] = useState<GstType>("intra");
  const [discount, setDiscount] = useState(0);
  const [validUntil, setValidUntil] = useState(""); // quotation
  const [dueDate, setDueDate] = useState(""); // invoice
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<LineItem[]>([blankItem()]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("crm_products")
      .select("id,name,hsn_sac,unit,unit_price,tax_rate")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => setProducts((data as Product[]) || []));
  }, [open, workspaceId]);

  useEffect(() => {
    if (!open) return;
    // generate doc number
    const prefix = mode === "quotation" ? "QT" : "INV";
    const yr = new Date().getFullYear().toString().slice(-2);
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setDocNumber(`${prefix}-${yr}-${rand}`);
    // reset other fields
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerGstin("");
    setCustomerState("");
    setGstType("intra");
    setDiscount(0);
    setValidUntil("");
    setDueDate("");
    setNotes("");
    setTerms("");
    setItems([blankItem()]);
  }, [open, mode]);

  const totals = useMemo(() => calcGst(items, gstType, discount), [items, gstType, discount]);

  const updateItem = (idx: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const save = async () => {
    if (!customerName.trim()) {
      toast.error("Customer name required");
      return;
    }
    if (items.length === 0 || items.every((i) => !i.description.trim())) {
      toast.error("At least one line item required");
      return;
    }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();

    const baseRow = {
      workspace_id: workspaceId,
      created_by: session?.user.id ?? null,
      customer_name: customerName.trim(),
      customer_email: customerEmail.trim() || null,
      customer_phone: customerPhone.trim() || null,
      customer_address: customerAddress.trim() || null,
      customer_gstin: customerGstin.trim() || null,
      customer_state: customerState.trim() || null,
      gst_type: gstType,
      subtotal: totals.subtotal,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      discount,
      total: totals.total,
      notes: notes.trim() || null,
      terms: terms.trim() || null,
    };

    let docId: string | null = null;
    if (mode === "quotation") {
      const { data, error } = await supabase
        .from("crm_quotations")
        .insert({
          ...baseRow,
          quotation_number: docNumber,
          status: "draft",
          valid_until: validUntil || null,
        })
        .select("id")
        .single();
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      docId = data.id;
    } else {
      const { data, error } = await supabase
        .from("crm_invoices")
        .insert({
          ...baseRow,
          invoice_number: docNumber,
          status: "unpaid",
          due_date: dueDate || null,
        })
        .select("id")
        .single();
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      docId = data.id;
    }

    // insert line items
    const itemsTable = mode === "quotation" ? "crm_quotation_items" : "crm_invoice_items";
    const fkColumn = mode === "quotation" ? "quotation_id" : "invoice_id";
    const lineRows = items
      .filter((i) => i.description.trim())
      .map((it, idx) => ({
        [fkColumn]: docId,
        description: it.description.trim(),
        hsn_sac: it.hsn_sac?.trim() || null,
        quantity: Number(it.quantity) || 1,
        unit: it.unit?.trim() || null,
        rate: Number(it.rate) || 0,
        tax_rate: Number(it.tax_rate) || 0,
        amount: (Number(it.quantity) || 0) * (Number(it.rate) || 0),
        position: idx,
      }));

    const { error: itemsErr } = await supabase.from(itemsTable as "crm_quotation_items" | "crm_invoice_items").insert(lineRows as never);
    if (itemsErr) {
      toast.error("Header saved but items failed: " + itemsErr.message);
    } else {
      toast.success(`${mode === "quotation" ? "Quotation" : "Invoice"} created`);
    }

    setSaving(false);
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            New {mode === "quotation" ? "Quotation" : "Invoice"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{mode === "quotation" ? "Quotation #" : "Invoice #"}</Label>
              <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{mode === "quotation" ? "Valid until" : "Due date"}</Label>
              <Input
                type="date"
                value={mode === "quotation" ? validUntil : dueDate}
                onChange={(e) =>
                  mode === "quotation" ? setValidUntil(e.target.value) : setDueDate(e.target.value)
                }
              />
            </div>
          </div>

          <div className="border rounded-lg p-3 space-y-3">
            <h4 className="font-medium text-sm">Customer</h4>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Customer name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Input
                placeholder="Email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
              <Input
                placeholder="Phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <Input
                placeholder="GSTIN (optional)"
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value)}
              />
              <Input
                placeholder="State"
                value={customerState}
                onChange={(e) => setCustomerState(e.target.value)}
              />
              <Select value={gstType} onValueChange={(v) => setGstType(v as GstType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intra">Intra-state (CGST + SGST)</SelectItem>
                  <SelectItem value="inter">Inter-state (IGST)</SelectItem>
                  <SelectItem value="none">No GST</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Customer address"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              rows={2}
            />
          </div>

          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Line items</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setItems((p) => [...p, blankItem()])}
                className="gap-1"
              >
                <Plus className="h-3 w-3" /> Add row
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                  <Input
                    className="col-span-4"
                    placeholder="Description"
                    value={it.description}
                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                  />
                  <Input
                    className="col-span-1"
                    placeholder="HSN"
                    value={it.hsn_sac || ""}
                    onChange={(e) => updateItem(idx, { hsn_sac: e.target.value })}
                  />
                  <Input
                    className="col-span-1"
                    type="number"
                    placeholder="Qty"
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                  />
                  <Input
                    className="col-span-1"
                    placeholder="Unit"
                    value={it.unit || ""}
                    onChange={(e) => updateItem(idx, { unit: e.target.value })}
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    placeholder="Rate"
                    value={it.rate}
                    onChange={(e) => updateItem(idx, { rate: Number(e.target.value) })}
                  />
                  <Input
                    className="col-span-1"
                    type="number"
                    placeholder="Tax %"
                    value={it.tax_rate}
                    onChange={(e) => updateItem(idx, { tax_rate: Number(e.target.value) })}
                  />
                  <div className="col-span-1 text-right text-sm pt-2 font-medium">
                    {formatINR((it.quantity || 0) * (it.rate || 0))}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="col-span-1 text-destructive"
                    onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Terms & conditions</Label>
                <Textarea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} />
              </div>
            </div>
            <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-medium">{formatINR(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <Label className="font-normal">Discount</Label>
                <Input
                  type="number"
                  className="w-28 h-8 text-right"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
              {gstType === "intra" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>CGST</span>
                    <span>{formatINR(totals.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>SGST</span>
                    <span>{formatINR(totals.sgst)}</span>
                  </div>
                </>
              )}
              {gstType === "inter" && (
                <div className="flex justify-between text-sm">
                  <span>IGST</span>
                  <span>{formatINR(totals.igst)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">{formatINR(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save {mode}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceFormDialog;
