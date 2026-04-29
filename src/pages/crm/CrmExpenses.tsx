import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Search, ReceiptText, Wallet, TrendingDown, AlertCircle, CheckCircle2, XCircle, Upload, FileImage, Send, Trash2, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Expense = {
  id: string;
  expense_number: string | null;
  title: string;
  category: string;
  amount: number;
  tax_amount: number;
  expense_date: string;
  payment_method: string;
  vendor_id: string | null;
  vendor_name: string | null;
  description: string | null;
  receipt_path: string | null;
  reimbursable: boolean;
  status: string;
  created_by: string | null;
  created_at: string;
  rejection_reason: string | null;
};

type Vendor = { id: string; name: string };

const CATEGORIES = ["general", "travel", "fuel", "materials", "equipment", "office", "utilities", "food", "lodging", "professional_fees", "marketing", "other"];
const METHODS = ["cash", "bank_transfer", "upi", "cheque", "card", "company_card", "other"];

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  approved: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-700 border-red-500/30",
  reimbursed: "bg-purple-500/15 text-purple-700 border-purple-500/30",
};

const empty = {
  id: "",
  title: "",
  category: "general",
  amount: "",
  tax_amount: "0",
  expense_date: new Date().toISOString().slice(0, 10),
  payment_method: "cash",
  vendor_id: "",
  vendor_name: "",
  description: "",
  reimbursable: false,
  receipt_path: "",
};

const CrmExpenses = () => {
  const { workspace, myRole } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<Expense[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const isAdmin = myRole === "crm_admin" || myRole === "super_admin";

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    setUserId(session?.user.id || null);
    const [{ data: eData }, { data: vData }] = await Promise.all([
      supabase
        .from("crm_expenses")
        .select("id,expense_number,title,category,amount,tax_amount,expense_date,payment_method,vendor_id,vendor_name,description,receipt_path,reimbursable,status,created_by,created_at,rejection_reason")
        .eq("workspace_id", workspace.id)
        .order("expense_date", { ascending: false }),
      supabase
        .from("crm_vendors")
        .select("id,name")
        .eq("workspace_id", workspace.id)
        .order("name"),
    ]);
    setRows((eData as Expense[]) || []);
    setVendors((vData as Vendor[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workspace.id]);

  const totals = useMemo(() => {
    const total = rows.reduce((s, r) => s + Number(r.amount) + Number(r.tax_amount || 0), 0);
    const month = rows
      .filter((r) => new Date(r.expense_date).getMonth() === new Date().getMonth() && new Date(r.expense_date).getFullYear() === new Date().getFullYear())
      .reduce((s, r) => s + Number(r.amount) + Number(r.tax_amount || 0), 0);
    const pending = rows.filter((r) => r.status === "submitted").reduce((s, r) => s + Number(r.amount) + Number(r.tax_amount || 0), 0);
    const reimburseDue = rows
      .filter((r) => r.reimbursable && (r.status === "submitted" || r.status === "approved"))
      .reduce((s, r) => s + Number(r.amount) + Number(r.tax_amount || 0), 0);
    return { total, month, pending, reimburseDue };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tab === "mine" && r.created_by !== userId) return false;
      if (tab === "submitted" && r.status !== "submitted") return false;
      if (tab === "approved" && r.status !== "approved") return false;
      if (tab === "reimbursable" && !r.reimbursable) return false;
      if (q.trim()) {
        const t = `${r.expense_number || ""} ${r.title} ${r.category} ${r.vendor_name || ""}`.toLowerCase();
        if (!t.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, tab, q, userId]);

  const openNew = () => { setForm(empty); setOpen(true); };
  const openEdit = (e: Expense) => {
    setForm({
      id: e.id,
      title: e.title,
      category: e.category,
      amount: String(e.amount),
      tax_amount: String(e.tax_amount || 0),
      expense_date: e.expense_date,
      payment_method: e.payment_method,
      vendor_id: e.vendor_id || "",
      vendor_name: e.vendor_name || "",
      description: e.description || "",
      reimbursable: e.reimbursable,
      receipt_path: e.receipt_path || "",
    });
    setOpen(true);
  };

  const uploadReceipt = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `expenses/${workspace.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("crm-documents").upload(path, file, { upsert: false });
    setUploading(false);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return;
    }
    setForm((f) => ({ ...f, receipt_path: path }));
    toast({ title: "Receipt uploaded" });
  };

  const downloadReceipt = async (path: string) => {
    const { data } = await supabase.storage.from("crm-documents").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const save = async () => {
    if (!form.title.trim() || !form.amount) {
      toast({ title: "Title and amount required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const vendorName = form.vendor_id ? vendors.find((v) => v.id === form.vendor_id)?.name || form.vendor_name : form.vendor_name;
    const payload: any = {
      workspace_id: workspace.id,
      title: form.title.trim(),
      category: form.category,
      amount: Number(form.amount),
      tax_amount: Number(form.tax_amount) || 0,
      expense_date: form.expense_date,
      payment_method: form.payment_method,
      vendor_id: form.vendor_id || null,
      vendor_name: vendorName || null,
      description: form.description || null,
      receipt_path: form.receipt_path || null,
      reimbursable: form.reimbursable,
    };
    let error;
    if (form.id) {
      ({ error } = await supabase.from("crm_expenses").update(payload).eq("id", form.id));
    } else {
      payload.created_by = userId;
      ({ error } = await supabase.from("crm_expenses").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: form.id ? "Updated" : "Saved" });
    setOpen(false);
    setForm(empty);
    load();
  };

  const submitForApproval = async (id: string) => {
    const { error } = await supabase.from("crm_expenses").update({
      status: "submitted",
      submitted_by: userId,
      submitted_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Submitted for approval" });
    load();
  };

  const approve = async (id: string) => {
    const { error } = await supabase.from("crm_expenses").update({
      status: "approved", approved_by: userId, approved_at: new Date().toISOString(), rejection_reason: null,
    }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Approved" });
    load();
  };

  const reject = async (id: string) => {
    const reason = prompt("Reason for rejection?");
    if (!reason) return;
    const { error } = await supabase.from("crm_expenses").update({
      status: "rejected", approved_by: userId, approved_at: new Date().toISOString(), rejection_reason: reason,
    }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Rejected" });
    load();
  };

  const markReimbursed = async (id: string) => {
    const { error } = await supabase.from("crm_expenses").update({
      status: "reimbursed", reimbursed_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Marked reimbursed" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    const { error } = await supabase.from("crm_expenses").delete().eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Deleted" });
    load();
  };

  const exportCsv = () => {
    if (!filtered.length) return;
    const headers = ["expense_number", "date", "title", "category", "amount", "tax", "method", "vendor", "reimbursable", "status"];
    const csv = [
      headers.join(","),
      ...filtered.map((r) => [
        r.expense_number || "",
        r.expense_date,
        `"${r.title.replace(/"/g, '""')}"`,
        r.category,
        r.amount,
        r.tax_amount,
        r.payment_method,
        `"${(r.vendor_name || "").replace(/"/g, '""')}"`,
        r.reimbursable ? "yes" : "no",
        r.status,
      ].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif">Expenses & Reimbursements</h1>
          <p className="text-sm text-muted-foreground">Track business spending, reimburse staff, and approve expense claims.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download className="h-4 w-4 mr-2" />Export</Button>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New expense</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total spend</div>
          <div className="text-2xl font-semibold flex items-center gap-2 mt-1"><TrendingDown className="h-5 w-5 text-primary" />₹{totals.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">This month</div>
          <div className="text-2xl font-semibold mt-1">₹{totals.month.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Pending approval</div>
          <div className="text-2xl font-semibold flex items-center gap-2 mt-1"><AlertCircle className="h-5 w-5 text-amber-600" />₹{totals.pending.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Reimbursement due</div>
          <div className="text-2xl font-semibold flex items-center gap-2 mt-1"><Wallet className="h-5 w-5 text-purple-600" />₹{totals.reimburseDue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="mine">My expenses</TabsTrigger>
          <TabsTrigger value="submitted">Awaiting approval</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="reimbursable">Reimbursable</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-3 space-y-3">
          <Card className="p-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by number, title, category, vendor…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </Card>

          <Card className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <ReceiptText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No expenses found.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3">Number</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const total = Number(r.amount) + Number(r.tax_amount || 0);
                    const isOwner = r.created_by === userId;
                    return (
                      <tr key={r.id} className="border-t hover:bg-muted/30">
                        <td className="p-3 font-mono text-xs">{r.expense_number || "—"}</td>
                        <td className="p-3 whitespace-nowrap text-muted-foreground">{new Date(r.expense_date).toLocaleDateString("en-IN")}</td>
                        <td className="p-3">
                          <button onClick={() => openEdit(r)} className="font-medium hover:underline text-left">{r.title}</button>
                          {r.vendor_name && <div className="text-xs text-muted-foreground">{r.vendor_name}</div>}
                          {r.reimbursable && <Badge variant="outline" className="mt-1 text-xs">Reimbursable</Badge>}
                          {r.rejection_reason && <div className="text-xs text-destructive mt-1">Rejected: {r.rejection_reason}</div>}
                        </td>
                        <td className="p-3"><Badge variant="outline" className="capitalize">{r.category.replace("_", " ")}</Badge></td>
                        <td className="p-3 text-right font-semibold">₹{total.toLocaleString("en-IN")}</td>
                        <td className="p-3"><Badge className={`capitalize ${STATUS_STYLE[r.status] || ""}`} variant="outline">{r.status}</Badge></td>
                        <td className="p-3 text-right whitespace-nowrap">
                          {r.receipt_path && (
                            <Button variant="ghost" size="sm" onClick={() => downloadReceipt(r.receipt_path!)} title="View receipt">
                              <FileImage className="h-4 w-4" />
                            </Button>
                          )}
                          {r.status === "draft" && isOwner && (
                            <Button variant="ghost" size="sm" onClick={() => submitForApproval(r.id)} title="Submit"><Send className="h-4 w-4 text-blue-600" /></Button>
                          )}
                          {r.status === "submitted" && isAdmin && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => approve(r.id)} title="Approve"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => reject(r.id)} title="Reject"><XCircle className="h-4 w-4 text-destructive" /></Button>
                            </>
                          )}
                          {r.status === "approved" && r.reimbursable && isAdmin && (
                            <Button variant="ghost" size="sm" onClick={() => markReimbursed(r.id)} title="Mark reimbursed"><Wallet className="h-4 w-4 text-purple-600" /></Button>
                          )}
                          {(isAdmin || (isOwner && r.status === "draft")) && (
                            <Button variant="ghost" size="sm" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit expense" : "New expense"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Site visit fuel, office supplies…" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
            </div>
            <div>
              <Label>Amount (₹) *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Label>Tax (₹)</Label>
              <Input type="number" value={form.tax_amount} onChange={(e) => setForm({ ...form, tax_amount: e.target.value })} />
            </div>
            <div>
              <Label>Payment method</Label>
              <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {METHODS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vendor</Label>
              <Select value={form.vendor_id || "_none"} onValueChange={(v) => setForm({ ...form, vendor_id: v === "_none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="_none">— None —</SelectItem>
                  {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!form.vendor_id && (
              <div className="md:col-span-2">
                <Label>Vendor name (free text)</Label>
                <Input value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} placeholder="e.g. Indian Oil" />
              </div>
            )}
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="md:col-span-2 flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label className="cursor-pointer">Reimbursable expense</Label>
                <p className="text-xs text-muted-foreground">Paid out-of-pocket and needs to be paid back to the employee.</p>
              </div>
              <Switch checked={form.reimbursable} onCheckedChange={(v) => setForm({ ...form, reimbursable: v })} />
            </div>
            <div className="md:col-span-2">
              <Label>Receipt</Label>
              {form.receipt_path ? (
                <div className="flex items-center gap-2 p-2 border rounded">
                  <FileImage className="h-4 w-4 text-primary" />
                  <span className="text-sm truncate flex-1">{form.receipt_path.split("/").pop()}</span>
                  <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, receipt_path: "" })}>Remove</Button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/30">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="text-sm">{uploading ? "Uploading…" : "Upload receipt (image or PDF)"}</span>
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadReceipt(e.target.files[0])} />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || uploading}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{form.id ? "Update" : "Save as draft"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CrmExpenses;
