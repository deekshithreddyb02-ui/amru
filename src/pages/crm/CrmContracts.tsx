import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, FileSignature, RefreshCw, Download, AlertTriangle, CheckCircle2, Clock, X } from "lucide-react";

type Workspace = { id: string; slug: string; name: string };
type Ctx = { workspace: Workspace; myRole: string };

type Contract = {
  id: string;
  workspace_id: string;
  contract_number: string;
  title: string;
  contract_type: string;
  status: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  start_date: string;
  end_date: string;
  renewal_date: string | null;
  auto_renew: boolean;
  renewal_period_months: number | null;
  notice_period_days: number | null;
  contract_value: number;
  currency: string | null;
  billing_frequency: string | null;
  payment_terms: string | null;
  scope_of_work: string | null;
  service_level: string | null;
  visits_per_year: number | null;
  visits_completed: number | null;
  document_url: string | null;
  notes: string | null;
  created_at: string;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  expiring: "secondary",
  expired: "destructive",
  draft: "outline",
  cancelled: "outline",
  terminated: "destructive",
  renewed: "default",
};

const emptyForm = {
  title: "",
  contract_type: "amc",
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  auto_renew: false,
  renewal_period_months: 12,
  notice_period_days: 30,
  contract_value: 0,
  currency: "INR",
  billing_frequency: "annually",
  payment_terms: "",
  scope_of_work: "",
  service_level: "",
  visits_per_year: 4,
  document_url: "",
  notes: "",
};

const CrmContracts = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [renewOpen, setRenewOpen] = useState(false);
  const [renewTarget, setRenewTarget] = useState<Contract | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_contracts")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("end_date", { ascending: true });
    if (error) {
      toast({ title: "Failed to load contracts", description: error.message, variant: "destructive" });
    } else {
      setContracts((data || []) as Contract[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (workspace?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  const stats = useMemo(() => {
    const today = new Date();
    const in30 = new Date(Date.now() + 30 * 86400000);
    let total = 0,
      active = 0,
      expiring = 0,
      expired = 0,
      value = 0;
    for (const c of contracts) {
      total++;
      const end = new Date(c.end_date);
      if (c.status === "active") active++;
      if (c.status === "expiring" || (end >= today && end <= in30)) expiring++;
      if (c.status === "expired" || end < today) expired++;
      if (["active", "expiring"].includes(c.status)) value += Number(c.contract_value || 0);
    }
    return { total, active, expiring, expired, value };
  }, [contracts]);

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          c.contract_number.toLowerCase().includes(s) ||
          c.title.toLowerCase().includes(s) ||
          c.customer_name.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [contracts, filter, search]);

  const submit = async () => {
    if (!form.title.trim() || !form.customer_name.trim()) {
      toast({ title: "Title and customer name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      workspace_id: workspace.id,
      title: form.title,
      contract_type: form.contract_type,
      customer_name: form.customer_name,
      customer_email: form.customer_email || null,
      customer_phone: form.customer_phone || null,
      start_date: form.start_date,
      end_date: form.end_date,
      auto_renew: form.auto_renew,
      renewal_period_months: Number(form.renewal_period_months) || 12,
      notice_period_days: Number(form.notice_period_days) || 30,
      contract_value: Number(form.contract_value) || 0,
      currency: form.currency,
      billing_frequency: form.billing_frequency,
      payment_terms: form.payment_terms || null,
      scope_of_work: form.scope_of_work || null,
      service_level: form.service_level || null,
      visits_per_year: Number(form.visits_per_year) || null,
      document_url: form.document_url || null,
      notes: form.notes || null,
      created_by: user?.id ?? null,
      owner_id: user?.id ?? null,
    };
    const { error } = await supabase.from("crm_contracts").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to create contract", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Contract created" });
    setForm(emptyForm);
    setOpen(false);
    load();
  };

  const openRenew = (c: Contract) => {
    setRenewTarget(c);
    setRenewOpen(true);
  };

  const submitRenewal = async (newEnd: string, newValue: number) => {
    if (!renewTarget) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data: { user } } = await supabase.auth.getUser();
    const { error: rErr } = await supabase.from("crm_contract_renewals").insert({
      workspace_id: workspace.id,
      contract_id: renewTarget.id,
      previous_end_date: renewTarget.end_date,
      new_start_date: today,
      new_end_date: newEnd,
      new_value: newValue,
      status: "completed",
      renewed_by: user?.id ?? null,
      renewed_at: new Date().toISOString(),
    });
    if (rErr) {
      toast({ title: "Renewal failed", description: rErr.message, variant: "destructive" });
      return;
    }
    const { error: cErr } = await supabase
      .from("crm_contracts")
      .update({ start_date: today, end_date: newEnd, contract_value: newValue, status: "active" })
      .eq("id", renewTarget.id);
    if (cErr) {
      toast({ title: "Contract update failed", description: cErr.message, variant: "destructive" });
      return;
    }
    toast({ title: "Contract renewed" });
    setRenewOpen(false);
    setRenewTarget(null);
    load();
  };

  const cancel = async (c: Contract) => {
    if (!confirm(`Cancel contract ${c.contract_number}?`)) return;
    const { error } = await supabase
      .from("crm_contracts")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", c.id);
    if (error) toast({ title: "Cancel failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Contract cancelled" }); load(); }
  };

  const exportCsv = () => {
    const rows = [
      ["Contract #", "Title", "Type", "Customer", "Status", "Start", "End", "Value", "Auto-Renew"],
      ...filtered.map((c) => [
        c.contract_number, c.title, c.contract_type, c.customer_name, c.status,
        c.start_date, c.end_date, String(c.contract_value), c.auto_renew ? "Yes" : "No",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contracts-${workspace.slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-primary" />
            Contracts & AMC Renewals
          </h1>
          <p className="text-sm text-muted-foreground">Track recurring service contracts and renewals.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" /> New Contract</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Contract</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.contract_type} onValueChange={(v) => setForm({ ...form, contract_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amc">AMC</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="lease">Lease</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Billing</Label>
                  <Select value={form.billing_frequency} onValueChange={(v) => setForm({ ...form, billing_frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="half_yearly">Half-yearly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                      <SelectItem value="one_time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Customer Name *</Label>
                  <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
                </div>
                <div>
                  <Label>Customer Email</Label>
                  <Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
                </div>
                <div>
                  <Label>Customer Phone</Label>
                  <Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
                <div>
                  <Label>Contract Value (₹)</Label>
                  <Input type="number" value={form.contract_value} onChange={(e) => setForm({ ...form, contract_value: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Visits / Year</Label>
                  <Input type="number" value={form.visits_per_year} onChange={(e) => setForm({ ...form, visits_per_year: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Renewal Period (months)</Label>
                  <Input type="number" value={form.renewal_period_months} onChange={(e) => setForm({ ...form, renewal_period_months: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Notice Period (days)</Label>
                  <Input type="number" value={form.notice_period_days} onChange={(e) => setForm({ ...form, notice_period_days: Number(e.target.value) })} />
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <input id="autorenew" type="checkbox" checked={form.auto_renew} onChange={(e) => setForm({ ...form, auto_renew: e.target.checked })} />
                  <Label htmlFor="autorenew">Auto-renew on expiry</Label>
                </div>
                <div className="md:col-span-2">
                  <Label>Scope of Work</Label>
                  <Textarea rows={3} value={form.scope_of_work} onChange={(e) => setForm({ ...form, scope_of_work: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Document URL</Label>
                  <Input value={form.document_url} onChange={(e) => setForm({ ...form, document_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                  <Label>Notes</Label>
                  <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-semibold">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Active</div><div className="text-2xl font-semibold text-primary">{stats.active}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Expiring</div><div className="text-2xl font-semibold text-orange-500">{stats.expiring}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Expired</div><div className="text-2xl font-semibold text-destructive">{stats.expired}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Active Value</div><div className="text-xl font-semibold">₹{stats.value.toLocaleString("en-IN")}</div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expiring">Expiring</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="renewed">Renewed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Contracts ({filtered.length})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No contracts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.contract_number}</TableCell>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>{c.customer_name}</TableCell>
                    <TableCell><span className="uppercase text-xs">{c.contract_type}</span></TableCell>
                    <TableCell>{new Date(c.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>₹{Number(c.contract_value).toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[c.status] || "outline"}>{c.status}</Badge>
                      {c.auto_renew && <Badge variant="outline" className="ml-1 text-xs">auto</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => openRenew(c)} title="Renew">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      {!["cancelled", "expired"].includes(c.status) && (
                        <Button size="sm" variant="ghost" onClick={() => cancel(c)} title="Cancel">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Renewal Dialog */}
      <RenewalDialog
        open={renewOpen}
        onOpenChange={setRenewOpen}
        contract={renewTarget}
        onSubmit={submitRenewal}
      />
    </div>
  );
};

const RenewalDialog = ({ open, onOpenChange, contract, onSubmit }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contract: Contract | null;
  onSubmit: (newEnd: string, newValue: number) => void;
}) => {
  const [newEnd, setNewEnd] = useState("");
  const [newValue, setNewValue] = useState(0);

  useEffect(() => {
    if (contract) {
      const months = contract.renewal_period_months || 12;
      const end = new Date();
      end.setMonth(end.getMonth() + months);
      setNewEnd(end.toISOString().slice(0, 10));
      setNewValue(Number(contract.contract_value) || 0);
    }
  }, [contract]);

  if (!contract) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Renew {contract.contract_number}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>New End Date</Label>
            <Input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
          </div>
          <div><Label>New Contract Value (₹)</Label>
            <Input type="number" value={newValue} onChange={(e) => setNewValue(Number(e.target.value))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit(newEnd, newValue)}>Renew</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CrmContracts;
