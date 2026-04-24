import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, Plus, Search, Loader2, RefreshCw, IndianRupee } from "lucide-react";
import InvoiceFormDialog from "@/components/crm/InvoiceFormDialog";
import { formatINR } from "@/lib/gst";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";
import { toast } from "sonner";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Invoice = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string | null;
  total: number;
  paid_amount: number;
  status: string;
  approval_status: string | null;
  due_date: string | null;
  issue_date: string;
  created_at: string;
};

const STATUS_TABS = ["all", "unpaid", "partial", "paid", "overdue"];

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  unpaid: "bg-amber-100 text-amber-800",
  partial: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

const approvalColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-100 text-yellow-900",
  approved: "bg-green-100 text-green-900",
  rejected: "bg-red-100 text-red-900",
};

const CrmInvoices = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [open, setOpen] = useState(false);
  const [payingFor, setPayingFor] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("upi");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [paying, setPaying] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_invoices")
      .select("id, invoice_number, customer_name, customer_email, total, paid_amount, status, approval_status, due_date, issue_date, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) console.error(error);
    setRows((data as Invoice[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id]);

  const updateApproval = async (id: string, approval_status: string) => {
    const updates: any = { approval_status };
    const { data: { user } } = await supabase.auth.getUser();
    if (approval_status === "pending") updates.submitted_at = new Date().toISOString();
    if (approval_status === "approved") {
      updates.approved_at = new Date().toISOString();
      updates.approved_by = user?.id;
    }
    const { error } = await supabase.from("crm_invoices").update(updates).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((p) => p.map((r) => (r.id === id ? { ...r, approval_status } : r)));
    toast.success(`Invoice ${approval_status}`);
  };

  const recordPayment = async () => {
    if (!payingFor) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setPaying(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("crm_payments").insert({
      workspace_id: workspace.id,
      invoice_id: payingFor.id,
      recorded_by: session?.user.id ?? null,
      amount: amt,
      method: payMethod,
      reference: payRef.trim() || null,
      notes: payNotes.trim() || null,
    });
    setPaying(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Payment recorded");
    setPayingFor(null);
    setPayAmount("");
    setPayRef("");
    setPayNotes("");
    setPayMethod("upi");
    load();
  };

  const filtered = rows.filter((r) => {
    if (tab !== "all" && r.status !== tab) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      r.invoice_number.toLowerCase().includes(s) ||
      r.customer_name.toLowerCase().includes(s)
    );
  });

  // Stats
  const totalDue = rows.reduce((sum, r) => {
    if (["unpaid", "partial", "overdue"].includes(r.status)) {
      return sum + (r.total - r.paid_amount);
    }
    return sum;
  }, 0);
  const totalPaid = rows.reduce((sum, r) => sum + r.paid_amount, 0);
  const overdueCount = rows.filter((r) => r.status === "overdue").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif flex items-center gap-2">
            <Receipt className="h-7 w-7 text-primary" /> Invoices
          </h1>
          <p className="text-muted-foreground text-sm">{workspace.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8 w-56"
            />
          </div>
          <Button variant="outline" size="icon" onClick={load}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New invoice
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Outstanding</div>
          <div className="text-2xl font-bold text-primary">{formatINR(totalDue)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total collected</div>
          <div className="text-2xl font-bold text-foreground">{formatINR(totalPaid)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Overdue invoices</div>
          <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          {STATUS_TABS.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No invoices.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Number</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                  <th className="px-4 py-3 font-medium text-right">Due</th>
                  <th className="px-4 py-3 font-medium">Due date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Approval</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const due = r.total - r.paid_amount;
                  return (
                    <tr key={r.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{r.invoice_number}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.customer_name}</div>
                        {r.customer_email && (
                          <div className="text-xs text-muted-foreground">{r.customer_email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatINR(r.total)}</td>
                      <td className="px-4 py-3 text-right text-foreground">{formatINR(r.paid_amount)}</td>
                      <td className={`px-4 py-3 text-right ${due > 0 ? "text-primary font-medium" : "text-muted-foreground"}`}>
                        {formatINR(due)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {r.due_date ? new Date(r.due_date).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`text-xs ${statusColor[r.status] || ""}`}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Select value={r.approval_status || "draft"} onValueChange={(v) => updateApproval(r.id, v)}>
                          <SelectTrigger className={`h-7 text-xs w-32 ${approvalColor[r.approval_status || "draft"] || ""}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {due > 0 && r.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPayingFor(r);
                              setPayAmount(String(due));
                            }}
                            className="gap-1 h-7"
                          >
                            <IndianRupee className="h-3 w-3" /> Record
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <InvoiceFormDialog
        open={open}
        onOpenChange={setOpen}
        mode="invoice"
        workspaceId={workspace.id}
        onSaved={load}
      />

      {/* Payment dialog */}
      <Dialog open={!!payingFor} onOpenChange={(o) => !o && setPayingFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
          </DialogHeader>
          {payingFor && (
            <div className="space-y-3">
              <div className="bg-muted/30 p-3 rounded text-sm">
                <div className="font-mono">{payingFor.invoice_number}</div>
                <div className="text-muted-foreground">
                  {payingFor.customer_name} — outstanding: {formatINR(payingFor.total - payingFor.paid_amount)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Method</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Reference (UTR / cheque #)</Label>
                <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingFor(null)}>
              Cancel
            </Button>
            <Button onClick={recordPayment} disabled={paying}>
              {paying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CrmInvoices;
