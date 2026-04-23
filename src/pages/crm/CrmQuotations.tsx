import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, Plus, Search, Loader2, RefreshCw } from "lucide-react";
import InvoiceFormDialog from "@/components/crm/InvoiceFormDialog";
import { formatINR } from "@/lib/gst";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";
import { toast } from "sonner";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Quotation = {
  id: string;
  quotation_number: string;
  customer_name: string;
  customer_email: string | null;
  total: number;
  status: string;
  valid_until: string | null;
  created_at: string;
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
      .select("id, quotation_number, customer_name, customer_email, total, status, valid_until, created_at")
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
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
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
                  <th className="px-4 py-3 font-medium">Created</th>
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
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-IN")}
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
