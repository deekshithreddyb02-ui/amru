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
import { Loader2, Plus, Search, Award, TrendingUp, Trophy, IndianRupee, CheckCircle2, Wallet, Trash2, Download, Settings2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Rule = {
  id: string;
  name: string;
  description: string | null;
  rule_type: string;
  flat_percentage: number;
  tiers: any;
  applies_to: string;
  category: string | null;
  min_deal_value: number;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
  priority: number;
};

type Commission = {
  id: string;
  user_id: string;
  rule_id: string | null;
  invoice_id: string | null;
  source_type: string;
  base_amount: number;
  percentage: number;
  commission_amount: number;
  earned_date: string;
  status: string;
  approved_at: string | null;
  paid_at: string | null;
  payout_reference: string | null;
  notes: string | null;
};

type Member = { user_id: string; full_name: string | null; email: string | null };

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  approved: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  paid: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  cancelled: "bg-muted text-muted-foreground",
};

const emptyRule = {
  id: "",
  name: "",
  description: "",
  rule_type: "flat",
  flat_percentage: "5",
  tiers: "",
  applies_to: "all",
  category: "",
  min_deal_value: "0",
  is_active: true,
  effective_from: new Date().toISOString().slice(0, 10),
  effective_to: "",
  priority: "0",
};

const emptyManual = {
  user_id: "",
  base_amount: "",
  percentage: "",
  commission_amount: "",
  notes: "",
};

const CrmCommissions = () => {
  const { workspace, myRole } = useOutletContext<Ctx>();
  const isAdmin = myRole === "crm_admin" || myRole === "super_admin";

  const [rules, setRules] = useState<Rule[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("commissions");
  const [statusTab, setStatusTab] = useState("all");
  const [q, setQ] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState(emptyRule);
  const [savingRule, setSavingRule] = useState(false);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState(emptyManual);
  const [savingManual, setSavingManual] = useState(false);

  const memberMap = useMemo(() => {
    const m: Record<string, Member> = {};
    members.forEach((mm) => { m[mm.user_id] = mm; });
    return m;
  }, [members]);

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    setUserId(session?.user.id || null);
    const [{ data: rData }, { data: cData }, { data: mData }] = await Promise.all([
      supabase.from("crm_commission_rules").select("*").eq("workspace_id", workspace.id).order("priority", { ascending: false }),
      supabase.from("crm_commissions").select("*").eq("workspace_id", workspace.id).order("earned_date", { ascending: false }),
      supabase.from("crm_workspace_members").select("user_id, profiles:user_id(full_name)").eq("workspace_id", workspace.id),
    ]);
    setRules((rData as Rule[]) || []);
    setCommissions((cData as Commission[]) || []);
    // Flatten members
    const flat: Member[] = ((mData as any[]) || []).map((m) => ({
      user_id: m.user_id,
      full_name: m.profiles?.full_name || null,
      email: null,
    }));
    setMembers(flat);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workspace.id]);

  const visibleCommissions = useMemo(() => {
    return commissions.filter((c) => {
      if (!isAdmin && c.user_id !== userId) return false;
      if (statusTab !== "all" && c.status !== statusTab) return false;
      if (q.trim()) {
        const name = memberMap[c.user_id]?.full_name || "";
        const t = `${name} ${c.notes || ""} ${c.payout_reference || ""}`.toLowerCase();
        if (!t.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [commissions, statusTab, q, isAdmin, userId, memberMap]);

  const stats = useMemo(() => {
    const mine = commissions.filter((c) => c.user_id === userId);
    const visible = isAdmin ? commissions : mine;
    const total = visible.reduce((s, c) => s + Number(c.commission_amount), 0);
    const pending = visible.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.commission_amount), 0);
    const paid = visible.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.commission_amount), 0);
    const thisMonth = visible
      .filter((c) => new Date(c.earned_date).getMonth() === new Date().getMonth() && new Date(c.earned_date).getFullYear() === new Date().getFullYear())
      .reduce((s, c) => s + Number(c.commission_amount), 0);
    return { total, pending, paid, thisMonth };
  }, [commissions, isAdmin, userId]);

  // Leaderboard (admins only)
  const leaderboard = useMemo(() => {
    const map: Record<string, { user_id: string; total: number; count: number }> = {};
    commissions.forEach((c) => {
      if (!map[c.user_id]) map[c.user_id] = { user_id: c.user_id, total: 0, count: 0 };
      map[c.user_id].total += Number(c.commission_amount);
      map[c.user_id].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [commissions]);

  // ---- Rule CRUD ----
  const openNewRule = () => { setRuleForm(emptyRule); setRuleOpen(true); };
  const openEditRule = (r: Rule) => {
    setRuleForm({
      id: r.id,
      name: r.name,
      description: r.description || "",
      rule_type: r.rule_type,
      flat_percentage: String(r.flat_percentage),
      tiers: r.tiers && Array.isArray(r.tiers) ? JSON.stringify(r.tiers, null, 2) : "",
      applies_to: r.applies_to,
      category: r.category || "",
      min_deal_value: String(r.min_deal_value),
      is_active: r.is_active,
      effective_from: r.effective_from,
      effective_to: r.effective_to || "",
      priority: String(r.priority),
    });
    setRuleOpen(true);
  };

  const saveRule = async () => {
    if (!ruleForm.name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    let tiersParsed: any = [];
    if (ruleForm.rule_type === "tiered") {
      try { tiersParsed = ruleForm.tiers ? JSON.parse(ruleForm.tiers) : []; }
      catch { toast({ title: "Invalid tier JSON", variant: "destructive" }); return; }
    }
    setSavingRule(true);
    const payload: any = {
      workspace_id: workspace.id,
      name: ruleForm.name.trim(),
      description: ruleForm.description || null,
      rule_type: ruleForm.rule_type,
      flat_percentage: Number(ruleForm.flat_percentage) || 0,
      tiers: tiersParsed,
      applies_to: ruleForm.applies_to,
      category: ruleForm.applies_to === "category" ? (ruleForm.category || null) : null,
      min_deal_value: Number(ruleForm.min_deal_value) || 0,
      is_active: ruleForm.is_active,
      effective_from: ruleForm.effective_from,
      effective_to: ruleForm.effective_to || null,
      priority: Number(ruleForm.priority) || 0,
    };
    let error;
    if (ruleForm.id) ({ error } = await supabase.from("crm_commission_rules").update(payload).eq("id", ruleForm.id));
    else { payload.created_by = userId; ({ error } = await supabase.from("crm_commission_rules").insert(payload)); }
    setSavingRule(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: ruleForm.id ? "Rule updated" : "Rule saved" });
    setRuleOpen(false); setRuleForm(emptyRule); load();
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    const { error } = await supabase.from("crm_commission_rules").delete().eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Deleted" }); load();
  };

  // ---- Commission actions ----
  const approve = async (id: string) => {
    const { error } = await supabase.from("crm_commissions").update({
      status: "approved", approved_by: userId, approved_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Approved" }); load();
  };

  const markPaid = async (id: string) => {
    const ref = prompt("Payout reference (UPI/bank txn id, optional)") || "";
    const { error } = await supabase.from("crm_commissions").update({
      status: "paid", paid_at: new Date().toISOString(), payout_reference: ref || null,
    }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Marked paid" }); load();
  };

  const cancel = async (id: string) => {
    if (!confirm("Cancel this commission?")) return;
    const { error } = await supabase.from("crm_commissions").update({ status: "cancelled" }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cancelled" }); load();
  };

  const removeCommission = async (id: string) => {
    if (!confirm("Delete this commission record?")) return;
    const { error } = await supabase.from("crm_commissions").delete().eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Deleted" }); load();
  };

  const saveManual = async () => {
    if (!manualForm.user_id || !manualForm.commission_amount) {
      toast({ title: "Rep and amount required", variant: "destructive" }); return;
    }
    setSavingManual(true);
    const { error } = await supabase.from("crm_commissions").insert({
      workspace_id: workspace.id,
      user_id: manualForm.user_id,
      source_type: "manual",
      base_amount: Number(manualForm.base_amount) || 0,
      percentage: Number(manualForm.percentage) || 0,
      commission_amount: Number(manualForm.commission_amount),
      notes: manualForm.notes || null,
    });
    setSavingManual(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Commission added" });
    setManualOpen(false); setManualForm(emptyManual); load();
  };

  const exportCsv = () => {
    if (!visibleCommissions.length) return;
    const headers = ["date", "rep", "source", "base", "pct", "commission", "status", "payout_ref"];
    const csv = [
      headers.join(","),
      ...visibleCommissions.map((c) => [
        c.earned_date,
        `"${(memberMap[c.user_id]?.full_name || c.user_id).replace(/"/g, '""')}"`,
        c.source_type,
        c.base_amount, c.percentage, c.commission_amount,
        c.status, c.payout_reference || "",
      ].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `commissions-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif">Commission & Incentives</h1>
          <p className="text-sm text-muted-foreground">Auto-calculated commissions when invoices are paid. Track payouts and reward top performers.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={exportCsv} disabled={!visibleCommissions.length}><Download className="h-4 w-4 mr-2" />Export</Button>
          {isAdmin && <Button variant="outline" onClick={() => setManualOpen(true)}><Plus className="h-4 w-4 mr-2" />Manual entry</Button>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">{isAdmin ? "Total earned" : "My total earned"}</div>
          <div className="text-2xl font-semibold flex items-center gap-2 mt-1"><IndianRupee className="h-5 w-5 text-primary" />{stats.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">This month</div>
          <div className="text-2xl font-semibold mt-1">₹{stats.thisMonth.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Pending payout</div>
          <div className="text-2xl font-semibold flex items-center gap-2 mt-1"><Wallet className="h-5 w-5 text-amber-600" />₹{stats.pending.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Paid out</div>
          <div className="text-2xl font-semibold flex items-center gap-2 mt-1"><CheckCircle2 className="h-5 w-5 text-emerald-600" />₹{stats.paid.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="commissions"><Award className="h-4 w-4 mr-1" />Commissions</TabsTrigger>
          {isAdmin && <TabsTrigger value="rules"><Settings2 className="h-4 w-4 mr-1" />Rules</TabsTrigger>}
          {isAdmin && <TabsTrigger value="leaderboard"><Trophy className="h-4 w-4 mr-1" />Leaderboard</TabsTrigger>}
        </TabsList>

        <TabsContent value="commissions" className="mt-3 space-y-3">
          <Card className="p-3 flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by rep, notes…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Tabs value={statusTab} onValueChange={setStatusTab}>
              <TabsList className="h-9">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
              </TabsList>
            </Tabs>
          </Card>

          <Card className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
            ) : visibleCommissions.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <Award className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No commissions yet. They'll appear when invoices are marked paid.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Sales rep</th>
                    <th className="p-3">Source</th>
                    <th className="p-3 text-right">Base</th>
                    <th className="p-3 text-right">%</th>
                    <th className="p-3 text-right">Commission</th>
                    <th className="p-3">Status</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCommissions.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 whitespace-nowrap text-muted-foreground text-xs">{new Date(c.earned_date).toLocaleDateString("en-IN")}</td>
                      <td className="p-3">
                        <div className="font-medium">{memberMap[c.user_id]?.full_name || "—"}</div>
                        {c.notes && <div className="text-xs text-muted-foreground">{c.notes}</div>}
                      </td>
                      <td className="p-3"><Badge variant="outline" className="capitalize">{c.source_type}</Badge></td>
                      <td className="p-3 text-right text-muted-foreground">₹{Number(c.base_amount).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right text-muted-foreground">{Number(c.percentage).toFixed(2)}%</td>
                      <td className="p-3 text-right font-semibold">₹{Number(c.commission_amount).toLocaleString("en-IN")}</td>
                      <td className="p-3">
                        <Badge className={`capitalize ${STATUS_STYLE[c.status] || ""}`} variant="outline">{c.status}</Badge>
                        {c.payout_reference && <div className="text-xs text-muted-foreground mt-1">{c.payout_reference}</div>}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {isAdmin && c.status === "pending" && (
                          <Button variant="ghost" size="sm" onClick={() => approve(c.id)} title="Approve"><CheckCircle2 className="h-4 w-4 text-blue-600" /></Button>
                        )}
                        {isAdmin && c.status === "approved" && (
                          <Button variant="ghost" size="sm" onClick={() => markPaid(c.id)} title="Mark paid"><Wallet className="h-4 w-4 text-emerald-600" /></Button>
                        )}
                        {isAdmin && c.status !== "paid" && c.status !== "cancelled" && (
                          <Button variant="ghost" size="sm" onClick={() => cancel(c.id)} title="Cancel"><XCircle className="h-4 w-4 text-destructive" /></Button>
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="sm" onClick={() => removeCommission(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="rules" className="mt-3 space-y-3">
            <div className="flex justify-end">
              <Button onClick={openNewRule}><Plus className="h-4 w-4 mr-2" />New rule</Button>
            </div>
            <Card className="p-0 overflow-x-auto">
              {rules.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <Settings2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No commission rules. Create one to start auto-calculating commissions.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Rate</th>
                      <th className="p-3">Min deal</th>
                      <th className="p-3">Effective</th>
                      <th className="p-3">Active</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((r) => (
                      <tr key={r.id} className="border-t hover:bg-muted/30">
                        <td className="p-3">
                          <button onClick={() => openEditRule(r)} className="font-medium hover:underline text-left">{r.name}</button>
                          {r.description && <div className="text-xs text-muted-foreground">{r.description}</div>}
                          {r.applies_to === "category" && r.category && <Badge variant="outline" className="mt-1 text-xs">Category: {r.category}</Badge>}
                        </td>
                        <td className="p-3"><Badge variant="outline" className="capitalize">{r.rule_type}</Badge></td>
                        <td className="p-3 font-semibold">
                          {r.rule_type === "flat" ? `${Number(r.flat_percentage).toFixed(2)}%` : `${(r.tiers as any[])?.length || 0} tiers`}
                        </td>
                        <td className="p-3 text-muted-foreground">₹{Number(r.min_deal_value).toLocaleString("en-IN")}</td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {new Date(r.effective_from).toLocaleDateString("en-IN")}
                          {r.effective_to && ` → ${new Date(r.effective_to).toLocaleDateString("en-IN")}`}
                        </td>
                        <td className="p-3">{r.is_active ? <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30" variant="outline">Active</Badge> : <Badge variant="outline">Off</Badge>}</td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => deleteRule(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="leaderboard" className="mt-3">
            <Card className="p-0 overflow-x-auto">
              {leaderboard.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No earnings yet.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Sales rep</th>
                      <th className="p-3 text-right">Deals</th>
                      <th className="p-3 text-right">Total earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((l, i) => (
                      <tr key={l.user_id} className="border-t hover:bg-muted/30">
                        <td className="p-3">
                          {i === 0 ? <Trophy className="h-5 w-5 text-amber-500 inline" /> :
                           i === 1 ? <Trophy className="h-5 w-5 text-slate-400 inline" /> :
                           i === 2 ? <Trophy className="h-5 w-5 text-amber-700 inline" /> :
                           <span className="text-muted-foreground">#{i + 1}</span>}
                        </td>
                        <td className="p-3 font-medium">{memberMap[l.user_id]?.full_name || "—"}</td>
                        <td className="p-3 text-right">{l.count}</td>
                        <td className="p-3 text-right font-semibold flex items-center justify-end gap-1"><TrendingUp className="h-4 w-4 text-emerald-600" />₹{l.total.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Rule dialog */}
      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
        <DialogContent className="bg-card max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{ruleForm.id ? "Edit rule" : "New commission rule"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label>Rule name *</Label>
              <Input value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} placeholder="Standard 5%, Tiered slab" />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Input value={ruleForm.description} onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={ruleForm.rule_type} onValueChange={(v) => setRuleForm({ ...ruleForm, rule_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="flat">Flat percentage</SelectItem>
                  <SelectItem value="tiered">Tiered slabs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {ruleForm.rule_type === "flat" ? (
              <div>
                <Label>Percentage (%)</Label>
                <Input type="number" step="0.01" value={ruleForm.flat_percentage} onChange={(e) => setRuleForm({ ...ruleForm, flat_percentage: e.target.value })} />
              </div>
            ) : (
              <div className="md:col-span-2">
                <Label>Tiers (JSON)</Label>
                <Textarea rows={4} value={ruleForm.tiers} onChange={(e) => setRuleForm({ ...ruleForm, tiers: e.target.value })}
                  placeholder={`[\n  {"min": 0, "max": 100000, "pct": 3},\n  {"min": 100000, "max": 500000, "pct": 5},\n  {"min": 500000, "max": null, "pct": 8}\n]`} />
                <p className="text-xs text-muted-foreground mt-1">Each tier: min, max (null for no upper limit), pct.</p>
              </div>
            )}
            <div>
              <Label>Min deal value (₹)</Label>
              <Input type="number" value={ruleForm.min_deal_value} onChange={(e) => setRuleForm({ ...ruleForm, min_deal_value: e.target.value })} />
            </div>
            <div>
              <Label>Priority</Label>
              <Input type="number" value={ruleForm.priority} onChange={(e) => setRuleForm({ ...ruleForm, priority: e.target.value })} />
            </div>
            <div>
              <Label>Effective from</Label>
              <Input type="date" value={ruleForm.effective_from} onChange={(e) => setRuleForm({ ...ruleForm, effective_from: e.target.value })} />
            </div>
            <div>
              <Label>Effective to (optional)</Label>
              <Input type="date" value={ruleForm.effective_to} onChange={(e) => setRuleForm({ ...ruleForm, effective_to: e.target.value })} />
            </div>
            <div className="md:col-span-2 flex items-center justify-between p-3 border rounded-md">
              <Label>Active</Label>
              <Switch checked={ruleForm.is_active} onCheckedChange={(v) => setRuleForm({ ...ruleForm, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleOpen(false)}>Cancel</Button>
            <Button onClick={saveRule} disabled={savingRule}>{savingRule && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{ruleForm.id ? "Update" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual entry dialog */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>Manual commission entry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Sales rep *</Label>
              <Select value={manualForm.user_id} onValueChange={(v) => setManualForm({ ...manualForm, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select rep" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {members.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.full_name || m.user_id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Base amount</Label>
                <Input type="number" value={manualForm.base_amount} onChange={(e) => setManualForm({ ...manualForm, base_amount: e.target.value })} />
              </div>
              <div>
                <Label>Percentage</Label>
                <Input type="number" step="0.01" value={manualForm.percentage} onChange={(e) => setManualForm({ ...manualForm, percentage: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Commission amount (₹) *</Label>
              <Input type="number" value={manualForm.commission_amount} onChange={(e) => setManualForm({ ...manualForm, commission_amount: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={manualForm.notes} onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })} placeholder="Bonus for Q4 referral…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualOpen(false)}>Cancel</Button>
            <Button onClick={saveManual} disabled={savingManual}>{savingManual && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CrmCommissions;
