import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, Plus, Search, Loader2, RefreshCw, FileSignature, ArrowRightCircle } from "lucide-react";
import InvoiceFormDialog from "@/components/crm/InvoiceFormDialog";
import { formatINR } from "@/lib/gst";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { convertQuotationToInvoice, convertQuotationToSalesOrder } from "@/lib/quoteConvert";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Quotation = {
  id: string;
  quotation_number: string;
  customer_name: string;
  customer_email: string | null;
  total: number;
  status: string;
  approval_status: string | null;
  valid_until: string | null;
  created_at: string;
};

const approvalColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-100 text-yellow-900",
  approved: "bg-green-100 text-green-900",
  rejected: "bg-red-100 text-red-900",
};

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-destructive/15 text-destructive",
  expired: "bg-amber-100 text-amber-800",
};

const CrmQuotations = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_quotations")
      .select("id, quotation_number, customer_name, customer_email, total, status, approval_status, valid_until, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) console.error(error);
    setRows((data as Quotation[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("crm_quotations").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const updateApproval = async (id: string, approval_status: string) => {
    const updates: any = { approval_status };
    const { data: { user } } = await supabase.auth.getUser();
    if (approval_status === "pending") updates.submitted_at = new Date().toISOString();
    if (approval_status === "approved") { updates.approved_at = new Date().toISOString(); updates.approved_by = user?.id; }
    const { error } = await supabase.from("crm_quotations").update(updates).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((p) => p.map((r) => (r.id === id ? { ...r, approval_status } : r)));
    toast.success(`Quotation ${approval_status}`);
  };

  const createSignLink = async (r: Quotation) => {
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase.from("crm_signing_tokens" as any).insert({
      token, workspace_id: workspace.id, quotation_id: r.id, signer_email: r.customer_email,
    });
    if (error) return toast.error(error.message);
    const url = `${window.location.origin}/sign/${token}`;
    try { await navigator.clipboard.writeText(url); toast.success("Signing link copied to clipboard"); }
    catch { toast.success(`Link: ${url}`); }
  };

  const convert = async (r: Quotation, target: "sales_order" | "invoice") => {
    try {
      if (target === "sales_order") {
        const so = await convertQuotationToSalesOrder(r.id);
        toast.success(`Sales order ${(so as any).so_number} created`);
      } else {
        const inv = await convertQuotationToInvoice(r.id);
        toast.success(`Invoice ${(inv as any).invoice_number} created`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Conversion failed");
    }
  };

  const filtered = rows.filter(
    (r) =>
      !q ||
      r.quotation_number.toLowerCase().includes(q.toLowerCase()) ||
      r.customer_name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif flex items-center gap-2">
            <FileSpreadsheet className="h-7 w-7 text-primary" /> Quotations
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
            <Plus className="h-4 w-4" /> New quotation
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No quotations yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Number</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium">Valid until</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Approval</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">E-sign</th>
                  <th className="px-4 py-3 font-medium">Convert</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{r.quotation_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.customer_name}</div>
                      {r.customer_email && (
                        <div className="text-xs text-muted-foreground">{r.customer_email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatINR(r.total)}</td>
                    <td className="px-4 py-3 text-xs">
                      {r.valid_until ? new Date(r.valid_until).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                        <SelectTrigger className={`h-7 text-xs w-28 ${statusColor[r.status] || ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => createSignLink(r)}>
                        <FileSignature className="h-3 w-3" /> Send
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            <ArrowRightCircle className="h-3 w-3" /> Convert
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => convert(r, "sales_order")}>
                            To Sales Order
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => convert(r, "invoice")}>
                            To Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <InvoiceFormDialog
        open={open}
        onOpenChange={setOpen}
        mode="quotation"
        workspaceId={workspace.id}
        onSaved={load}
      />
    </div>
  );
};

export default CrmQuotations;
