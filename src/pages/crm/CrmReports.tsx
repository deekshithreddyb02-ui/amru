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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, FileText, CheckCircle2, XCircle, Clock, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { logAudit } from "@/lib/audit";

interface Workspace { id: string; slug: string; name: string }
interface Report {
  id: string; title: string; description: string | null; template_key: string;
  approval_status: string; content_markdown: string | null;
  generated_at: string | null; created_at: string; created_by: string | null;
  approved_by: string | null; approved_at: string | null;
  rejection_reason: string | null; submitted_at: string | null;
}

const TEMPLATES = [
  { key: "pipeline_revenue", title: "Weekly Pipeline & Revenue", desc: "Sales pipeline + 30-day forecast" },
  { key: "conversion_funnel", title: "Lead Conversion Funnel", desc: "New → Qualified → Won metrics" },
  { key: "hydrogeo_status", title: "HydroGeo Survey Status", desc: "Active borewell surveys & delays" },
  { key: "support_invoice_health", title: "Support & Invoice Health", desc: "Open tickets + outstanding invoices" },
];

const STATUS_STYLE: Record<string, { label: string; cls: string; icon: any }> = {
  draft: { label: "Draft", cls: "bg-muted text-foreground", icon: Clock },
  pending: { label: "Pending approval", cls: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100", icon: Clock },
  approved: { label: "Approved", cls: "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100", icon: CheckCircle2 },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100", icon: XCircle },
};

export default function CrmReports() {
  const { workspace, myRole } = useOutletContext<{ workspace: Workspace; myRole: string }>();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [form, setForm] = useState({ template_key: "pipeline_revenue", custom_title: "", custom_prompt: "" });
  const isAdmin = myRole === "crm_admin";

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("crm_reports")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setReports((data as Report[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, [workspace.id]);

  const generate = async () => {
    setGenerating(true);
    try {
      const isCustom = form.template_key === "custom";
      const payload: any = { workspace_id: workspace.id };
      if (isCustom) {
        if (!form.custom_title || !form.custom_prompt) { toast({ title: "Title and prompt required", variant: "destructive" }); setGenerating(false); return; }
        payload.custom_title = form.custom_title;
        payload.custom_prompt = form.custom_prompt;
      } else {
        payload.template_key = form.template_key;
      }
      const { data, error } = await supabase.functions.invoke("crm-generate-report", { body: payload });
      if (error || !data?.ok) throw new Error(data?.error || error?.message || "Failed");
      toast({ title: "Report generated", description: "Review and submit for approval when ready." });
      setDialogOpen(false);
      setForm({ template_key: "pipeline_revenue", custom_title: "", custom_prompt: "" });
      fetchReports();
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally { setGenerating(false); }
  };

  const setStatus = async (id: string, status: string, extra: Record<string, any> = {}) => {
    const updates: any = { approval_status: status, ...extra };
    if (status === "approved") { updates.approved_at = new Date().toISOString(); }
    if (status === "pending") { updates.submitted_at = new Date().toISOString(); }
    const { data: { user } } = await supabase.auth.getUser();
    if (status === "approved" && user) updates.approved_by = user.id;
    const { error } = await (supabase as any).from("crm_reports").update(updates).eq("id", id);
    if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
    const r = reports.find((x) => x.id === id);
    await logAudit({ workspace_id: workspace.id, action: status === "pending" ? "submitted" : (status as any), entity_type: "report", entity_id: id, entity_label: r?.title });
    fetchReports();
  };

  const submitReject = async () => {
    if (!rejectingId) return;
    await setStatus(rejectingId, "rejected", { rejection_reason: rejectReason });
    setRejectingId(null); setRejectReason("");
  };

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter((r) => r.approval_status === "pending").length,
    approved: reports.filter((r) => r.approval_status === "approved").length,
  }), [reports]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif">AI Reports</h1>
          <p className="text-sm text-muted-foreground">{stats.total} total • {stats.pending} pending • {stats.approved} approved</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Sparkles className="h-4 w-4" /> Generate report</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Generate new report</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Template</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {TEMPLATES.map((t) => (
                    <button key={t.key} type="button" onClick={() => setForm({ ...form, template_key: t.key })}
                      className={`text-left rounded-md border p-3 text-sm transition ${form.template_key === t.key ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground">{t.desc}</div>
                    </button>
                  ))}
                  <button type="button" onClick={() => setForm({ ...form, template_key: "custom" })}
                    className={`text-left rounded-md border p-3 text-sm transition ${form.template_key === "custom" ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                    <div className="font-medium">Custom prompt</div>
                    <div className="text-xs text-muted-foreground">Write your own analytics question</div>
                  </button>
                </div>
              </div>
              {form.template_key === "custom" && (
                <>
                  <div><Label>Title</Label><Input value={form.custom_title} onChange={(e) => setForm({ ...form, custom_title: e.target.value })} /></div>
                  <div><Label>Prompt</Label><Textarea rows={4} value={form.custom_prompt} onChange={(e) => setForm({ ...form, custom_prompt: e.target.value })} placeholder="Eg: Compare lead volume Telangana vs Maharashtra last 30 days." /></div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={generate} disabled={generating} className="gap-2">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : reports.length === 0 ? (
        <Card><CardContent className="text-center py-10 text-muted-foreground"><FileText className="h-10 w-10 mx-auto mb-2" />No reports yet — generate your first one.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reports.map((r) => {
            const s = STATUS_STYLE[r.approval_status] || STATUS_STYLE.draft;
            const Icon = s.icon;
            return (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{r.title}</CardTitle>
                    <Badge className={s.cls}><Icon className="h-3 w-3 mr-1" />{s.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("en-IN")}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {r.description && <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
                  {r.rejection_reason && <p className="text-xs text-red-600 dark:text-red-400">Rejected: {r.rejection_reason}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => setViewReport(r)}>View</Button>
                    {r.approval_status === "draft" && <Button size="sm" onClick={() => setStatus(r.id, "pending")}>Submit for approval</Button>}
                    {r.approval_status === "pending" && isAdmin && (
                      <>
                        <Button size="sm" onClick={() => setStatus(r.id, "approved")}><CheckCircle2 className="h-3 w-3 mr-1" />Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => setRejectingId(r.id)}><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View dialog */}
      <Dialog open={!!viewReport} onOpenChange={(o) => !o && setViewReport(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader><DialogTitle>{viewReport?.title}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-3">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{viewReport?.content_markdown || "*No content*"}</ReactMarkdown>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectingId} onOpenChange={(o) => { if (!o) { setRejectingId(null); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject report</DialogTitle></DialogHeader>
          <Label>Reason</Label>
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={submitReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
