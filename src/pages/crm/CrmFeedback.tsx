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
import { Loader2, Plus, Search, Smile, Frown, Meh, TrendingUp, Link as LinkIcon, Copy, MessageCircle, Trash2, Download, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Survey = {
  id: string;
  token: string;
  survey_type: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  ticket_id: string | null;
  trigger_source: string | null;
  question: string;
  status: string;
  sent_at: string;
  responded_at: string | null;
  expires_at: string | null;
  score: number | null;
  comment: string | null;
  category: string | null;
  follow_up_required: boolean;
  follow_up_done: boolean;
  follow_up_notes: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  responded: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  expired: "bg-muted text-muted-foreground",
};

const CAT_STYLE: Record<string, string> = {
  promoter: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  passive: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  detractor: "bg-red-500/15 text-red-700 border-red-500/30",
  satisfied: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  neutral: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  dissatisfied: "bg-red-500/15 text-red-700 border-red-500/30",
};

const empty = {
  survey_type: "nps",
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  question: "How likely are you to recommend us to a friend or colleague?",
};

const CrmFeedback = () => {
  const { workspace, myRole } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [followOpen, setFollowOpen] = useState<Survey | null>(null);
  const [followNotes, setFollowNotes] = useState("");

  const isAdmin = myRole === "crm_admin" || myRole === "super_admin";

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_feedback_surveys")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });
    setRows((data as Survey[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workspace.id]);

  const responded = useMemo(() => rows.filter((r) => r.score !== null), [rows]);

  const stats = useMemo(() => {
    const total = rows.length;
    const respCount = responded.length;
    const responseRate = total ? Math.round((respCount / total) * 100) : 0;

    // NPS calculation (only NPS surveys)
    const nps = responded.filter((r) => r.survey_type === "nps");
    const promoters = nps.filter((r) => r.category === "promoter").length;
    const detractors = nps.filter((r) => r.category === "detractor").length;
    const npsScore = nps.length ? Math.round(((promoters - detractors) / nps.length) * 100) : 0;

    // CSAT (avg of csat scores normalised to %)
    const csat = responded.filter((r) => r.survey_type === "csat" || r.survey_type === "ces");
    const csatAvg = csat.length ? csat.reduce((s, r) => s + (r.score || 0), 0) / csat.length : 0;
    const csatPct = Math.round((csatAvg / 5) * 100);

    const followups = rows.filter((r) => r.follow_up_required && !r.follow_up_done).length;
    return { total, respCount, responseRate, npsScore, csatPct, followups, npsCount: nps.length, csatCount: csat.length };
  }, [rows, responded]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tab === "responded" && r.status !== "responded") return false;
      if (tab === "pending" && r.status !== "sent") return false;
      if (tab === "detractors" && r.category !== "detractor" && r.category !== "dissatisfied") return false;
      if (tab === "followup" && !(r.follow_up_required && !r.follow_up_done)) return false;
      if (q.trim()) {
        const t = `${r.customer_name || ""} ${r.customer_email || ""} ${r.comment || ""}`.toLowerCase();
        if (!t.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, tab, q]);

  const create = async () => {
    if (!form.customer_email && !form.customer_phone) {
      toast({ title: "Email or phone required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("crm_feedback_surveys").insert({
      workspace_id: workspace.id,
      survey_type: form.survey_type,
      customer_name: form.customer_name || null,
      customer_email: form.customer_email || null,
      customer_phone: form.customer_phone || null,
      question: form.question,
      trigger_source: "manual",
    });
    setSaving(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Survey created" });
    setOpen(false);
    setForm(empty);
    load();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/feedback/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: url });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this survey?")) return;
    const { error } = await supabase.from("crm_feedback_surveys").delete().eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Deleted" });
    load();
  };

  const saveFollowup = async () => {
    if (!followOpen) return;
    const { error } = await supabase.from("crm_feedback_surveys").update({
      follow_up_done: true,
      follow_up_notes: followNotes || null,
    }).eq("id", followOpen.id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Follow-up logged" });
    setFollowOpen(null);
    setFollowNotes("");
    load();
  };

  const exportCsv = () => {
    if (!filtered.length) return;
    const headers = ["date", "type", "customer", "email", "score", "category", "comment", "follow_up_required", "status"];
    const csv = [
      headers.join(","),
      ...filtered.map((r) => [
        new Date(r.sent_at).toISOString().slice(0, 10),
        r.survey_type,
        `"${(r.customer_name || "").replace(/"/g, '""')}"`,
        r.customer_email || "",
        r.score ?? "",
        r.category || "",
        `"${(r.comment || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
        r.follow_up_required ? "yes" : "no",
        r.status,
      ].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `feedback-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif">Customer Feedback</h1>
          <p className="text-sm text-muted-foreground">Track NPS, CSAT and customer sentiment. Surveys auto-send when tickets close.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download className="h-4 w-4 mr-2" />Export</Button>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New survey</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">NPS Score</div>
          <div className="text-2xl font-semibold flex items-center gap-2 mt-1">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className={stats.npsScore >= 50 ? "text-emerald-600" : stats.npsScore >= 0 ? "text-amber-600" : "text-destructive"}>
              {stats.npsScore}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{stats.npsCount} responses</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">CSAT</div>
          <div className="text-2xl font-semibold mt-1">{stats.csatPct}%</div>
          <div className="text-xs text-muted-foreground mt-1">{stats.csatCount} responses</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Response rate</div>
          <div className="text-2xl font-semibold mt-1">{stats.responseRate}%</div>
          <div className="text-xs text-muted-foreground mt-1">{stats.respCount} of {stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Follow-ups due</div>
          <div className="text-2xl font-semibold flex items-center gap-2 mt-1">
            <Frown className="h-5 w-5 text-destructive" />{stats.followups}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Detractors needing outreach</div>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="responded">Responded</TabsTrigger>
          <TabsTrigger value="pending">Awaiting response</TabsTrigger>
          <TabsTrigger value="detractors">Unhappy</TabsTrigger>
          <TabsTrigger value="followup">Follow-up due</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-3 space-y-3">
          <Card className="p-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, email, comment…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </Card>

          <Card className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No feedback yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3">Sent</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-center">Score</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Comment</th>
                    <th className="p-3">Status</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-muted/30 align-top">
                      <td className="p-3 whitespace-nowrap text-muted-foreground text-xs">{new Date(r.sent_at).toLocaleDateString("en-IN")}</td>
                      <td className="p-3">
                        <div className="font-medium">{r.customer_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{r.customer_email}</div>
                      </td>
                      <td className="p-3"><Badge variant="outline" className="uppercase text-xs">{r.survey_type}</Badge></td>
                      <td className="p-3 text-center">
                        {r.score !== null ? (
                          <span className="text-lg font-semibold">{r.score}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3">
                        {r.category ? (
                          <Badge variant="outline" className={`capitalize ${CAT_STYLE[r.category] || ""}`}>
                            {r.category === "promoter" || r.category === "satisfied" ? <Smile className="h-3 w-3 mr-1" /> :
                             r.category === "passive" || r.category === "neutral" ? <Meh className="h-3 w-3 mr-1" /> :
                             <Frown className="h-3 w-3 mr-1" />}
                            {r.category}
                          </Badge>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="p-3 max-w-xs">
                        <div className="text-sm line-clamp-2">{r.comment || <span className="text-muted-foreground italic">No comment</span>}</div>
                        {r.follow_up_required && !r.follow_up_done && (
                          <Badge variant="outline" className="mt-1 text-xs bg-amber-500/10 text-amber-700">Follow-up needed</Badge>
                        )}
                        {r.follow_up_done && r.follow_up_notes && (
                          <div className="text-xs text-emerald-700 mt-1">✓ {r.follow_up_notes}</div>
                        )}
                      </td>
                      <td className="p-3"><Badge className={`capitalize ${STATUS_STYLE[r.status] || ""}`} variant="outline">{r.status}</Badge></td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => copyLink(r.token)} title="Copy link"><LinkIcon className="h-4 w-4" /></Button>
                        {r.follow_up_required && !r.follow_up_done && (
                          <Button variant="ghost" size="sm" onClick={() => { setFollowOpen(r); setFollowNotes(""); }} title="Log follow-up">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="sm" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* New survey dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card max-w-lg">
          <DialogHeader><DialogTitle>New feedback survey</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Survey type</Label>
              <Select value={form.survey_type} onValueChange={(v) => setForm({ ...form, survey_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="nps">NPS (0–10 likelihood to recommend)</SelectItem>
                  <SelectItem value="csat">CSAT (1–5 satisfaction)</SelectItem>
                  <SelectItem value="ces">CES (1–5 effort score)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Customer name</Label>
              <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Question</Label>
              <Textarea rows={2} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create & get link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Follow-up dialog */}
      <Dialog open={!!followOpen} onOpenChange={(v) => !v && setFollowOpen(null)}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>Log follow-up</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Customer feedback: <strong>{followOpen?.score}</strong> — {followOpen?.comment || "No comment"}
            </p>
            <Label>What did you do?</Label>
            <Textarea rows={3} value={followNotes} onChange={(e) => setFollowNotes(e.target.value)} placeholder="Called and apologised, refunded service fee…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFollowOpen(null)}>Cancel</Button>
            <Button onClick={saveFollowup}>Mark resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CrmFeedback;
