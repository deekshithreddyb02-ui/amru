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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

type AddressCopySource = "" | "organization" | "contact" | "shipping" | "billing";

const DEFAULT_TERMS =
  "- Unless otherwise agreed in writing by the supplier all invoices are payable within thirty (30) days of the date of invoice, in the currency of the invoice, drawn on a bank based in India or by such other method as is agreed in advance by the Supplier.";

// ---- Reusable row helpers (declared at module scope to keep input focus stable) ----
const FieldRow = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="grid grid-cols-[180px_1fr] items-center gap-4 py-2">
    <Label className="text-sm text-muted-foreground font-normal justify-self-end text-right">
      {required && <span className="text-destructive mr-0.5">*</span>}
      {label}
    </Label>
    <div>{children}</div>
  </div>
);

const SectionCard = ({
  title,
  children,
  header,
}: {
  title: string;
  header?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="border rounded-md bg-card">
    <div className="px-4 py-3 border-b flex items-center justify-between">
      <h3 className="text-base font-semibold">{title}</h3>
      {header}
    </div>
    <div className="px-4 py-3">{children}</div>
  </div>
);

const InvoiceFormDialog = ({ open, onOpenChange, mode, workspaceId, onSaved }: Props) => {
  const [saving, setSaving] = useState(false);

  // Invoice Details
  const [docNumber, setDocNumber] = useState("");
  const [subject, setSubject] = useState("");
  const [customerNo, setCustomerNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [purchaseOrder, setPurchaseOrder] = useState("");
  const [salesCommission, setSalesCommission] = useState("");
  const [status, setStatus] = useState("");
  const [opportunityName, setOpportunityName] = useState("");
  const [salesOrder, setSalesOrder] = useState("");
  const [contactName, setContactName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [exciseDuty, setExciseDuty] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  // Address Details
  const [copyBillingFrom, setCopyBillingFrom] = useState<AddressCopySource>("");
  const [copyShippingFrom, setCopyShippingFrom] = useState<AddressCopySource>("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingPoBox, setBillingPoBox] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingPostal, setBillingPostal] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingPoBox, setShippingPoBox] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPostal, setShippingPostal] = useState("");
  const [shippingCountry, setShippingCountry] = useState("");

  // Terms / description
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [description, setDescription] = useState("");

  // Items
  const [taxRegion, setTaxRegion] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [taxMode, setTaxMode] = useState<"group" | "individual">("group");
  const [gstType, setGstType] = useState<GstType>("intra");
  const [items, setItems] = useState<LineItem[]>([blankItem()]);
  const [products, setProducts] = useState<Product[]>([]);

  // Totals
  const [discount, setDiscount] = useState(0);
  const [charges, setCharges] = useState(0);
  const [adjustmentMode, setAdjustmentMode] = useState<"add" | "deduct">("add");
  const [adjustment, setAdjustment] = useState(0);
  const [received, setReceived] = useState(0);

  // Members for "Assigned To"
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("crm_products")
      .select("id,name,hsn_sac,unit,unit_price,tax_rate")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => setProducts((data as Product[]) || []));

    (async () => {
      const { data: ms } = await supabase
        .from("crm_workspace_members")
        .select("user_id")
        .eq("workspace_id", workspaceId);
      const ids = (ms || []).map((m: any) => m.user_id);
      if (!ids.length) return setMembers([]);
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      setMembers(
        (profs || []).map((p: any) => ({
          id: p.id,
          name: p.full_name || p.email || "Member",
        }))
      );
    })();
  }, [open, workspaceId]);

  useEffect(() => {
    if (!open) return;
    const prefix = mode === "quotation" ? "QT" : "INV";
    const yr = new Date().getFullYear().toString().slice(-2);
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setDocNumber(`${prefix}-${yr}-${rand}`);
    setSubject("");
    setCustomerNo("");
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setPurchaseOrder("");
    setSalesCommission("");
    setStatus(mode === "invoice" ? "unpaid" : "draft");
    setOpportunityName("");
    setSalesOrder("");
    setContactName("");
    setDueDate("");
    setValidUntil("");
    setExciseDuty("");
    setOrganizationName("");
    setCopyBillingFrom("");
    setCopyShippingFrom("");
    setBillingAddress("");
    setBillingPoBox("");
    setBillingCity("");
    setBillingState("");
    setBillingPostal("");
    setBillingCountry("");
    setShippingAddress("");
    setShippingPoBox("");
    setShippingCity("");
    setShippingState("");
    setShippingPostal("");
    setShippingCountry("");
    setTerms(DEFAULT_TERMS);
    setDescription("");
    setTaxRegion("");
    setCurrency("INR");
    setTaxMode("group");
    setGstType("intra");
    setItems([blankItem()]);
    setDiscount(0);
    setCharges(0);
    setAdjustment(0);
    setAdjustmentMode("add");
    setReceived(0);
  }, [open, mode]);

  // Set assignedTo to current user by default
  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setAssignedTo(user.id);
    });
  }, [open]);

  const totals = useMemo(() => {
    const base = calcGst(items, gstType, discount);
    const adj = adjustmentMode === "add" ? Number(adjustment) || 0 : -(Number(adjustment) || 0);
    const grand = base.total + (Number(charges) || 0) + adj;
    return { ...base, charges: Number(charges) || 0, adjustment: adj, grandTotal: grand };
  }, [items, gstType, discount, charges, adjustment, adjustmentMode]);

  const updateItem = (idx: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  // Address copy handlers (UI helpers)
  const applyBillingCopy = (src: AddressCopySource) => {
    setCopyBillingFrom(src);
    if (src === "shipping") {
      setBillingAddress(shippingAddress);
      setBillingPoBox(shippingPoBox);
      setBillingCity(shippingCity);
      setBillingState(shippingState);
      setBillingPostal(shippingPostal);
      setBillingCountry(shippingCountry);
    }
  };
  const applyShippingCopy = (src: AddressCopySource) => {
    setCopyShippingFrom(src);
    if (src === "billing") {
      setShippingAddress(billingAddress);
      setShippingPoBox(billingPoBox);
      setShippingCity(billingCity);
      setShippingState(billingState);
      setShippingPostal(billingPostal);
      setShippingCountry(billingCountry);
    }
  };

  const composedNotes = () => {
    const blocks: string[] = [];
    if (description.trim()) blocks.push(description.trim());
    const extra: Record<string, string | number | null> = {
      subject,
      customer_no: customerNo,
      invoice_date: invoiceDate,
      purchase_order: purchaseOrder,
      sales_commission: salesCommission,
      excise_duty: exciseDuty,
      opportunity: opportunityName,
      sales_order: salesOrder,
      contact_name: contactName,
      status,
      assigned_to: assignedTo,
      shipping_address: shippingAddress,
      shipping_po_box: shippingPoBox,
      shipping_city: shippingCity,
      shipping_state: shippingState,
      shipping_postal: shippingPostal,
      shipping_country: shippingCountry,
      billing_po_box: billingPoBox,
      billing_city: billingCity,
      billing_postal: billingPostal,
      billing_country: billingCountry,
      tax_region: taxRegion,
      currency,
      tax_mode: taxMode,
      charges,
      adjustment: totals.adjustment,
      received,
    };
    const cleaned = Object.fromEntries(
      Object.entries(extra).filter(([, v]) => v !== "" && v !== null && v !== undefined)
    );
    if (Object.keys(cleaned).length) {
      blocks.push("---\n" + JSON.stringify(cleaned, null, 2));
    }
    return blocks.join("\n\n") || null;
  };

  const save = async () => {
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!organizationName.trim()) {
      toast.error("Organization Name is required");
      return;
    }
    if (!billingAddress.trim()) {
      toast.error("Billing Address is required");
      return;
    }
    if (!shippingAddress.trim()) {
      toast.error("Shipping Address is required");
      return;
    }
    if (items.length === 0 || items.every((i) => !i.description.trim())) {
      toast.error("At least one line item required");
      return;
    }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();

    const billingFull = [
      billingAddress,
      [billingCity, billingState, billingPostal].filter(Boolean).join(", "),
      billingCountry,
    ]
      .filter(Boolean)
      .join("\n");

    const baseRow = {
      workspace_id: workspaceId,
      created_by: session?.user.id ?? null,
      customer_name: organizationName.trim(),
      customer_email: null,
      customer_phone: null,
      customer_address: billingFull || null,
      customer_gstin: null,
      customer_state: billingState.trim() || null,
      gst_type: gstType,
      subtotal: totals.subtotal,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      discount,
      total: totals.grandTotal,
      notes: composedNotes(),
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
          status: status || "unpaid",
          due_date: dueDate || null,
          issue_date: invoiceDate || new Date().toISOString().slice(0, 10),
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

    const { error: itemsErr } = await supabase
      .from(itemsTable as "crm_quotation_items" | "crm_invoice_items")
      .insert(lineRows as never);
    if (itemsErr) {
      toast.error("Header saved but items failed: " + itemsErr.message);
    } else {
      toast.success(`${mode === "quotation" ? "Quotation" : "Invoice"} created`);
    }

    setSaving(false);
    onOpenChange(false);
    onSaved();
  };

  const itemsTotal = totals.subtotal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto p-0">
        {/* Vtiger-style header */}
        <div className="bg-muted/40 border-b">
          <div className="px-6 py-3 text-[11px] tracking-wider uppercase text-muted-foreground flex items-center gap-2">
            <span className="text-foreground font-semibold">{mode === "invoice" ? "INVOICES" : "QUOTATIONS"}</span>
            <span>›</span>
            <span className="text-primary">All</span>
            <span>›</span>
            <span>Adding new</span>
          </div>
          <DialogHeader className="px-6 pb-4">
            <DialogTitle className="text-2xl font-semibold">
              Creating New {mode === "invoice" ? "Invoice" : "Quotation"}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Invoice Details */}
          <SectionCard title={`${mode === "invoice" ? "Invoice" : "Quotation"} Details`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <FieldRow label="Subject" required>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
                </FieldRow>
                <FieldRow label="Customer No">
                  <Input value={customerNo} onChange={(e) => setCustomerNo(e.target.value)} />
                </FieldRow>
                <FieldRow label={mode === "invoice" ? "Invoice Date" : "Quotation Date"}>
                  <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                </FieldRow>
                <FieldRow label="Purchase Order">
                  <Input value={purchaseOrder} onChange={(e) => setPurchaseOrder(e.target.value)} />
                </FieldRow>
                <FieldRow label="Sales Commission">
                  <Input value={salesCommission} onChange={(e) => setSalesCommission(e.target.value)} />
                </FieldRow>
                <FieldRow label="Status">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue placeholder="Select an Option" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Opportunity Name">
                  <Input value={opportunityName} onChange={(e) => setOpportunityName(e.target.value)} placeholder="Type to search" />
                </FieldRow>
              </div>
              <div>
                <FieldRow label="Sales Order">
                  <Input value={salesOrder} onChange={(e) => setSalesOrder(e.target.value)} placeholder="Type to search" />
                </FieldRow>
                <FieldRow label="Contact Name">
                  <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Type to search" />
                </FieldRow>
                <FieldRow label={mode === "invoice" ? "Due Date" : "Valid Until"}>
                  <Input
                    type="date"
                    value={mode === "invoice" ? dueDate : validUntil}
                    onChange={(e) => (mode === "invoice" ? setDueDate(e.target.value) : setValidUntil(e.target.value))}
                  />
                </FieldRow>
                <FieldRow label="Excise Duty">
                  <Input value={exciseDuty} onChange={(e) => setExciseDuty(e.target.value)} />
                </FieldRow>
                <FieldRow label="Organization Name" required>
                  <Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Type to search" />
                </FieldRow>
                <FieldRow label="Assigned To" required>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>
              </div>
            </div>
          </SectionCard>

          {/* Address Details */}
          <SectionCard title="Address Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <FieldRow label="Copy Billing Address from">
                  <RadioGroup
                    value={copyBillingFrom}
                    onValueChange={(v) => applyBillingCopy(v as AddressCopySource)}
                    className="flex flex-col gap-1"
                  >
                    <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="organization" /> Organization</label>
                    <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="contact" /> Contact</label>
                    <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="shipping" /> Shipping Address</label>
                  </RadioGroup>
                </FieldRow>
                <FieldRow label="Billing Address" required>
                  <Textarea rows={3} value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} />
                </FieldRow>
                <FieldRow label="Billing PO Box">
                  <Input value={billingPoBox} onChange={(e) => setBillingPoBox(e.target.value)} />
                </FieldRow>
                <FieldRow label="Billing City">
                  <Input value={billingCity} onChange={(e) => setBillingCity(e.target.value)} />
                </FieldRow>
                <FieldRow label="Billing State">
                  <Input value={billingState} onChange={(e) => setBillingState(e.target.value)} />
                </FieldRow>
                <FieldRow label="Billing Postal Code">
                  <Input value={billingPostal} onChange={(e) => setBillingPostal(e.target.value)} />
                </FieldRow>
                <FieldRow label="Billing Country">
                  <Input value={billingCountry} onChange={(e) => setBillingCountry(e.target.value)} />
                </FieldRow>
              </div>
              <div>
                <FieldRow label="Copy Shipping Address from">
                  <RadioGroup
                    value={copyShippingFrom}
                    onValueChange={(v) => applyShippingCopy(v as AddressCopySource)}
                    className="flex flex-col gap-1"
                  >
                    <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="organization" /> Organization</label>
                    <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="contact" /> Contact</label>
                    <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="billing" /> Billing Address</label>
                  </RadioGroup>
                </FieldRow>
                <FieldRow label="Shipping Address" required>
                  <Textarea rows={3} value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} />
                </FieldRow>
                <FieldRow label="Shipping PO Box">
                  <Input value={shippingPoBox} onChange={(e) => setShippingPoBox(e.target.value)} />
                </FieldRow>
                <FieldRow label="Shipping City">
                  <Input value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} />
                </FieldRow>
                <FieldRow label="Shipping State">
                  <Input value={shippingState} onChange={(e) => setShippingState(e.target.value)} />
                </FieldRow>
                <FieldRow label="Shipping Postal Code">
                  <Input value={shippingPostal} onChange={(e) => setShippingPostal(e.target.value)} />
                </FieldRow>
                <FieldRow label="Shipping Country">
                  <Input value={shippingCountry} onChange={(e) => setShippingCountry(e.target.value)} />
                </FieldRow>
              </div>
            </div>
          </SectionCard>

          {/* Terms & Conditions */}
          <SectionCard title="Terms & Conditions">
            <FieldRow label="Terms & Conditions">
              <Textarea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} />
            </FieldRow>
          </SectionCard>

          {/* Description */}
          <SectionCard title="Description Details">
            <FieldRow label="Description">
              <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </FieldRow>
          </SectionCard>

          {/* Item Details */}
          <SectionCard
            title="Item Details"
            header={
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Tax Region</span>
                  <Select value={taxRegion} onValueChange={setTaxRegion}>
                    <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Select an Option" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intra">Intra-state</SelectItem>
                      <SelectItem value="inter">Inter-state</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Currency</span>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">India, Rupees (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Tax Mode</span>
                  <Select value={taxMode} onValueChange={(v) => setTaxMode(v as "group" | "individual")}>
                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">GST</span>
                  <Select value={gstType} onValueChange={(v) => setGstType(v as GstType)}>
                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intra">CGST+SGST</SelectItem>
                      <SelectItem value="inter">IGST</SelectItem>
                      <SelectItem value="none">No GST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-2 py-2 text-left w-12">Tools</th>
                    <th className="px-2 py-2 text-left"><span className="text-destructive">*</span>Item Name</th>
                    <th className="px-2 py-2 text-left">HSN</th>
                    <th className="px-2 py-2 text-right w-20">Quantity</th>
                    <th className="px-2 py-2 text-right w-28">Selling Price</th>
                    <th className="px-2 py-2 text-right w-20">Tax %</th>
                    <th className="px-2 py-2 text-right w-28">Total</th>
                    <th className="px-2 py-2 text-right w-28">Net Price</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const line = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
                    const net = line + (line * (Number(it.tax_rate) || 0)) / 100;
                    return (
                      <tr key={idx} className="border-t">
                        <td className="px-2 py-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex gap-1">
                            <Input
                              className="h-8 text-xs"
                              placeholder="Item name"
                              value={it.description}
                              onChange={(e) => updateItem(idx, { description: e.target.value })}
                            />
                            <Select
                              value=""
                              onValueChange={(pid) => {
                                const p = products.find((x) => x.id === pid);
                                if (!p) return;
                                updateItem(idx, {
                                  description: p.name,
                                  hsn_sac: p.hsn_sac || "",
                                  unit: p.unit || "nos",
                                  rate: Number(p.unit_price) || 0,
                                  tax_rate: Number(p.tax_rate) || 18,
                                });
                              }}
                            >
                              <SelectTrigger className="h-8 w-8 p-0 text-xs" />
                              <SelectContent>
                                {products.length === 0 ? (
                                  <div className="px-2 py-1.5 text-xs text-muted-foreground">No products</div>
                                ) : (
                                  products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            className="h-8 text-xs"
                            value={it.hsn_sac || ""}
                            onChange={(e) => updateItem(idx, { hsn_sac: e.target.value })}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            className="h-8 text-xs text-right"
                            type="number"
                            value={it.quantity}
                            onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            className="h-8 text-xs text-right"
                            type="number"
                            value={it.rate}
                            onChange={(e) => updateItem(idx, { rate: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            className="h-8 text-xs text-right"
                            type="number"
                            value={it.tax_rate}
                            onChange={(e) => updateItem(idx, { tax_rate: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-2 py-2 text-right">{formatINR(line)}</td>
                        <td className="px-2 py-2 text-right font-medium">{formatINR(net)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => setItems((p) => [...p, blankItem()])} className="gap-1">
                <Plus className="h-3 w-3" /> Add Product
              </Button>
              <Button size="sm" variant="outline" onClick={() => setItems((p) => [...p, blankItem()])} className="gap-1">
                <Plus className="h-3 w-3" /> Add Service
              </Button>
            </div>
          </SectionCard>

          {/* Totals summary */}
          <SectionCard title="Summary">
            <div className="divide-y text-sm">
              <div className="grid grid-cols-[1fr_180px] py-2">
                <div className="text-right pr-4 font-medium">Items Total</div>
                <div className="text-right">{formatINR(itemsTotal)}</div>
              </div>
              <div className="grid grid-cols-[1fr_180px] py-2 items-center">
                <div className="text-right pr-4 font-medium">(-) Overall Discount</div>
                <div className="text-right">
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="h-8 text-right"
                  />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_180px] py-2 items-center">
                <div className="text-right pr-4 font-medium">(+) Charges</div>
                <div className="text-right">
                  <Input
                    type="number"
                    value={charges}
                    onChange={(e) => setCharges(Number(e.target.value))}
                    className="h-8 text-right"
                  />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_180px] py-2">
                <div className="text-right pr-4 font-medium">Pre Tax Total</div>
                <div className="text-right">{formatINR(Math.max(0, itemsTotal - discount) + (Number(charges) || 0))}</div>
              </div>
              <div className="grid grid-cols-[1fr_180px] py-2">
                <div className="text-right pr-4 font-medium">(+) Tax</div>
                <div className="text-right">{formatINR(totals.tax)}</div>
              </div>
              <div className="grid grid-cols-[1fr_180px] py-2 items-center">
                <div className="text-right pr-4 font-medium flex items-center justify-end gap-3">
                  Adjustment
                  <RadioGroup
                    value={adjustmentMode}
                    onValueChange={(v) => setAdjustmentMode(v as "add" | "deduct")}
                    className="flex items-center gap-2"
                  >
                    <label className="flex items-center gap-1 text-xs font-normal"><RadioGroupItem value="add" /> Add</label>
                    <label className="flex items-center gap-1 text-xs font-normal"><RadioGroupItem value="deduct" /> Deduct</label>
                  </RadioGroup>
                </div>
                <div className="text-right">
                  <Input
                    type="number"
                    value={adjustment}
                    onChange={(e) => setAdjustment(Number(e.target.value))}
                    className="h-8 text-right"
                  />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_180px] py-2 bg-muted/30">
                <div className="text-right pr-4 font-bold">Grand Total</div>
                <div className="text-right font-bold text-primary">{formatINR(totals.grandTotal)}</div>
              </div>
              {mode === "invoice" && (
                <>
                  <div className="grid grid-cols-[1fr_180px] py-2 items-center">
                    <div className="text-right pr-4 font-medium">Received</div>
                    <div className="text-right">
                      <Input
                        type="number"
                        value={received}
                        onChange={(e) => setReceived(Number(e.target.value))}
                        className="h-8 text-right"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_180px] py-2">
                    <div className="text-right pr-4 font-medium">Balance</div>
                    <div className="text-right">{formatINR(Math.max(0, totals.grandTotal - (Number(received) || 0)))}</div>
                  </div>
                </>
              )}
            </div>
          </SectionCard>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceFormDialog;
