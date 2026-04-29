import { useEffect, useMemo, useState } from "react";
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
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Search, Receipt, Wallet, TrendingUp, AlertCircle, Download, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Payment = {
  id: string;
  invoice_id: string;
  amount: number;
  method: string;
  reference: string | null;
  paid_at: string;
  notes: string | null;
  created_at: string;
};

type Invoice = {
  id: string;
  invoice_number: string;
  customer_name: string;
  total: number;
  paid_amount: number;
  status: string;
  due_date: string | null;
  workspace_id: string;
};

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

const CrmPayments = () => {
  const { workspace, myRole } = useOutletContext<Ctx>();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    invoice_id: "",
    amount: "",
    method: "cash",
    reference: "",
    paid_at: new Date().toISOString().slice(0, 16),
    notes: "",
  });

  const isAdmin = myRole === "crm_admin" || myRole === "super_admin";

  const load = async () => {
    setLoading(true);
    const [{ data: pData }, { data: iData }] = await Promise.all([
      supabase
        .from("crm_payments")
        .select("id,invoice_id,amount,method,reference,paid_at,notes,created_at")
        .eq("workspace_id", workspace.id)
        .order("paid_at", { ascending: false })
        .limit(500),
      supabase
        .from("crm_invoices")
        .select("id,invoice_number,customer_name,total,paid_amount,status,due_date,workspace_id")
        .eq("workspace_id", workspace.id)
        .order("issue_date", { ascending: false }),
    ]);
    setPayments((pData as Payment[]) || []);
    setInvoices((iData as Invoice[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workspace.id]);

  const invoiceMap = useMemo(() => {
    const m: Record<string, Invoice> = {};
    invoices.forEach((i) => (m[i.id] = i));
    return m;
  }, [invoices]);

  const outstandingInvoices = invoices.filter((i) => Number(i.total) > Number(i.paid_amount || 0));

  const totals = useMemo(() => {
    const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);
    const thisMonth = payments
      .filter((p) => new Date(p.paid_at).getMonth() === new Date().getMonth() && new Date(p.paid_at).getFullYear() === new Date().getFullYear())
      .reduce((s, p) => s + Number(p.amount), 0);
    const outstanding = invoices.reduce((s, i) => s + Math.max(0, Number(i.total) - Number(i.paid_amount || 0)), 0);
    const overdue = invoices
      .filter((i) => i.due_date && new Date(i.due_date) < new Date() && Number(i.total) > Number(i.paid_amount || 0))
      .reduce((s, i) => s + (Number(i.total) - Number(i.paid_amount || 0)), 0);
    return { totalCollected, thisMonth, outstanding, overdue };
  }, [payments, invoices]);

  const openNew = (invoiceId?: string) => {
    const inv = invoiceId ? invoices.find((i) => i.id === invoiceId) : null;
    const balance = inv ? Number(inv.total) - Number(inv.paid_amount || 0) : 0;
    setForm({
      invoice_id: invoiceId || "",
      amount: balance > 0 ? String(balance) : "",
      method: "cash",
      reference: "",
      paid_at: new Date().toISOString().slice(0, 16),
      notes: "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.invoice_id || !form.amount) {
      toast({ title: "Pick an invoice and enter amount", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("crm_payments").insert({
      workspace_id: workspace.id,
      invoice_id: form.invoice_id,
      amount: Number(form.amount),
      method: form.method,
      reference: form.reference || null,
      paid_at: new Date(form.paid_at).toISOString(),
      notes: form.notes || null,
      recorded_by: session?.user.id,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Payment recorded" });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this payment? Invoice status will be recalculated.")) return;
    const { error } = await supabase.from("crm_payments").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Payment removed" });
    load();
  };

  const exportCsv = () => {
    const rows = filtered.map((p) => {
      const inv = invoiceMap[p.invoice_id];
      return {
        date: new Date(p.paid_at).toLocaleString("en-IN"),
        invoice: inv?.invoice_number || "",
        customer: inv?.customer_name || "",
        amount: p.amount,
        method: p.method,
        reference: p.reference || "",
        notes: (p.notes || "").replace(/[\r\n,]+/g, " "),
      };
    });
    const headers = Object.keys(rows[0] || { date: "", invoice: "", customer: "", amount: "", method: "", reference: "", notes: "" });
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const methodBadge = (m: string) => {
    const colors: Record<string, string> = {
      cash: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
      bank_transfer: "bg-blue-500/15 text-blue-700 border-blue-500/30",
      upi: "bg-purple-500/15 text-purple-700 border-purple-500/30",
      cheque: "bg-amber-500/15 text-amber-700 border-amber-500/30",
      card: "bg-pink-500/15 text-pink-700 border-pink-500/30",
    };
    return <Badge className={colors[m] || ""} variant="outline">{METHODS.find((x) => x.value === m)?.label || m}</Badge>;
  };

  const filtered = payments.filter((p) => {
    if (methodFilter !== "all" && p.method !== methodFilter) return false;
    if (!q.trim()) return true;
    const inv = invoiceMap[p.invoice_id];
    const text = `${inv?.invoice_number || ""} ${inv?.customer_name || ""} ${p.reference || ""}`.toLowerCase();
    return text.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif">Payments & Receipts</h1>
          <p className="text-sm text-muted-foreground">Record customer payments and track outstanding balances.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          <Button onClick={() => openNew()}><Plus className="h-4 w-4 mr-2" />Record payment</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total collected</div>
          <div className="text-2xl font-semibold flex items-center gap-2 mt-1"><Wallet className="h-5 w-5 text-emerald-600" />₹{totals.totalCollected.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">This month</div>
          <div className="text-2xl font-semibold flex items-center gap-2 mt-1"><TrendingUp className="h-5 w-5 text-primary" />₹{totals.thisMonth.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Outstanding</div>
          <div className="text-2xl font-semibold mt-1">₹{totals.outstanding.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Overdue</div>
          <div className={`text-2xl font-semibold flex items-center gap-2 mt-1 ${totals.overdue > 0 ? "text-destructive" : ""}`}>
            <AlertCircle className="h-5 w-5" />₹{totals.overdue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
        </Card>
      </div>

      {/* Outstanding invoices quick action */}
      {outstandingInvoices.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Outstanding invoices ({outstandingInvoices.length})</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {outstandingInvoices.slice(0, 10).map((i) => {
              const balance = Number(i.total) - Number(i.paid_amount || 0);
              const isOverdue = i.due_date && new Date(i.due_date) < new Date();
              return (
                <button
                  key={i.id}
                  onClick={() => openNew(i.id)}
                  className={`shrink-0 text-left p-3 rounded-md border hover:border-primary transition-colors min-w-[200px] ${isOverdue ? "border-destructive/40 bg-destructive/5" : ""}`}
                >
                  <div className="text-xs text-muted-foreground">{i.invoice_number}</div>
                  <div className="font-medium text-sm truncate">{i.customer_name}</div>
                  <div className="text-sm mt-1">Due: ₹{balance.toLocaleString("en-IN")}</div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-3 flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoice, customer, reference…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All methods</SelectItem>
            {METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      {/* Payments list */}
      <Card className="p-0 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <Receipt className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No payments recorded yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Invoice</th>
                <th className="p-3">Customer</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Method</th>
                <th className="p-3">Reference</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const inv = invoiceMap[p.invoice_id];
                return (
                  <tr key={p.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 whitespace-nowrap text-muted-foreground">{new Date(p.paid_at).toLocaleString("en-IN")}</td>
                    <td className="p-3 font-medium">{inv?.invoice_number || "—"}</td>
                    <td className="p-3">{inv?.customer_name || "—"}</td>
                    <td className="p-3 text-right font-semibold text-emerald-700">₹{Number(p.amount).toLocaleString("en-IN")}</td>
                    <td className="p-3">{methodBadge(p.method)}</td>
                    <td className="p-3 text-muted-foreground">{p.reference || "—"}</td>
                    <td className="p-3 text-right">
                      {isAdmin && (
                        <Button variant="ghost" size="sm" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card max-w-lg">
          <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Invoice *</Label>
              <Select value={form.invoice_id} onValueChange={(v) => {
                const inv = invoices.find((i) => i.id === v);
                const balance = inv ? Number(inv.total) - Number(inv.paid_amount || 0) : 0;
                setForm({ ...form, invoice_id: v, amount: balance > 0 ? String(balance) : form.amount });
              }}>
                <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                <SelectContent className="bg-popover max-h-72">
                  {outstandingInvoices.map((i) => {
                    const balance = Number(i.total) - Number(i.paid_amount || 0);
                    return (
                      <SelectItem key={i.id} value={i.id}>
                        {i.invoice_number} — {i.customer_name} (₹{balance.toLocaleString("en-IN")} due)
                      </SelectItem>
                    );
                  })}
                  {invoices.filter((i) => Number(i.total) <= Number(i.paid_amount || 0)).map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.invoice_number} — {i.customer_name} (paid)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount (₹) *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <Label>Method *</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Paid at *</Label>
                <Input type="datetime-local" value={form.paid_at} onChange={(e) => setForm({ ...form, paid_at: e.target.value })} />
              </div>
              <div>
                <Label>Reference #</Label>
                <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="UTR / Cheque / Txn ID" />
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

export default CrmPayments;
