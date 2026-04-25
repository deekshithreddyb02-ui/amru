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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, FileText, CheckCircle2, XCircle, Clock, Sparkles, Send, Eye, RefreshCw, Image as ImageIcon, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { logAudit } from "@/lib/audit";

interface Workspace { id: string; slug: string; name: string }
interface Template { id: string; name: string; template_type: string; description: string | null; default_model: string }
interface ProjectReport {
  id: string; title: string; description: string | null;
  template_id: string | null; template_type: string | null;
  status: string; current_version: number;
  related_to_type: string | null; related_to_id: string | null;
  customer_contact_id: string | null; customer_org_id: string | null;
  primary_owner_user_id: string | null;
  rejection_reason: string | null;
  sent_to_customer_at: string | null;
  acknowledged_at: string | null;
  created_at: string; created_by: string | null;
}
interface Version {
  id: string; report_id: string; version_no: number;
  ai_model: string | null; rendered_markdown: string | null;
  edited_markdown: string | null; is_current: boolean;
  user_inputs: any; photo_paths: any; created_at: string;
}
interface StatusEntry { id: string; from_status: string | null; to_status: string; note: string | null; changed_at: string }
interface Assignment { id: string; user_id: string; role: string; assigned_at: string }

const STATUS_FLOW: Record<string, { label: string; cls: string; icon: any; next: string[] }> = {
  draft: { label: "Draft", cls: "bg-muted text-foreground", icon: Clock, next: ["in_review"] },
  in_review: { label: "In review", cls: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100", icon: Eye, next: ["approved", "rejected", "draft"] },
  approved: { label: "Approved", cls: "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100", icon: CheckCircle2, next: ["sent_to_customer"] },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100", icon: XCircle, next: ["draft"] },
  sent_to_customer: { label: "Sent to customer", cls: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100", icon: Send, next: ["acknowledged"] },
  acknowledged: { label: "Acknowledged", cls: "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100", icon: CheckCircle2, next: [] },
};

const RELATED_TYPES = [
  { value: "none", label: "None" },
  { value: "lead", label: "Lead" },
  { value: "deal", label: "Deal" },
  { value: "hydrogeo", label: "HydroGeo enquiry" },
  { value: "contact", label: "Contact" },
  { value: "organization", label: "Organization" },
  { value: "ticket", label: "Support ticket" },
];

export default function CrmProjectReports() {
  const { workspace, myRole } = useOutletContext<{ workspace: Workspace; myRole: string }>();
  const { toast } = useToast();
  const isAdmin = myRole === "crm_admin";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [reports, setReports] = useState<ProjectReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [openReport, setOpenReport] = useState<ProjectReport | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [statusLog, setStatusLog] = useState<StatusEntry[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [editMd, setEditMd] = useState<string>("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // create form
  const [form, setForm] = useState({
    template_id: "",
    title: "",
    description: "",
    related_to_type: "none",
    related_to_id: "",
    customer_contact_id: "",
    customer_org_id: "",
    free_scope: "",
    free_findings: "",
    free_costs: "",
  });
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([]);

  const fetchTemplates = async () => {
    const { data } = await (supabase as any)
      .from("crm_ai_report_templates")
      .select("id,name,template_type,description,default_model")
      .eq("workspace_id", workspace.id)
      .eq("is_active", true)
      .order("name");
    setTemplates((data as Template[]) || []);
  };

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("crm_ai_reports")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(200);
    setReports((data as ProjectReport[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); fetchReports(); }, [workspace.id]);

  const openReportDetail = async (r: ProjectReport) => {
    setOpenReport(r);
    const [v, s, a] = await Promise.all([
      (supabase as any).from("crm_ai_report_versions").select("*").eq("report_id", r.id).order("version_no", { ascending: false }),
      (supabase as any).from("crm_ai_report_status_log").select("*").eq("report_id", r.id).order("changed_at", { ascending: false }),
      (supabase as any).from("crm_ai_report_assignments").select("*").eq("report_id", r.id),
    ]);
    const versionList = (v.data as Version[]) || [];
    setVersions(versionList);
    setStatusLog((s.data as StatusEntry[]) || []);
    setAssignments((a.data as Assignment[]) || []);
    const current = versionList.find((x) => x.is_current) || versionList[0];
    setActiveVersionId(current?.id || null);
    setEditMd(current?.edited_markdown || current?.rendered_markdown || "");
  };

  const closeReportDetail = () => {
    setOpenReport(null); setVersions([]); setStatusLog([]); setAssignments([]); setActiveVersionId(null); setEditMd("");
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (!photoFiles.length) return [];
    const paths: string[] = [];
    for (const file of photoFiles) {
      const path = `${workspace.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("crm-report-photos").upload(path, file, { contentType: file.type });
      if (!error) paths.push(path);
    }
    return paths;
  };

  const generate = async (existingReportId?: string) => {
    setGenerating(true);
    try {
      const newPhotoPaths = await uploadPhotos();
      const allPaths = [...uploadedPaths, ...newPhotoPaths];
      setUploadedPaths(allPaths);

      const payload: any = {
        workspace_id: workspace.id,
        photo_paths: newPhotoPaths,
        user_inputs: {
          scope: form.free_scope || undefined,
          findings: form.free_findings || undefined,
          costs: form.free_costs || undefined,
        },
      };

      if (existingReportId) {
        payload.report_id = existingReportId;
      } else {
        if (!form.template_id || !form.title) {
          toast({ title: "Template and title required", variant: "destructive" });
          setGenerating(false); return;
        }
        payload.template_id = form.template_id;
        payload.title = form.title;
        payload.description = form.description || undefined;
        payload.related_to_type = form.related_to_type !== "none" ? form.related_to_type : undefined;
        payload.related_to_id = form.related_to_id || undefined;
        payload.customer_contact_id = form.customer_contact_id || undefined;
        payload.customer_org_id = form.customer_org_id || undefined;
      }

      const { data, error } = await supabase.functions.invoke("crm-project-report-generate", { body: payload });
      if (error || !data?.ok) throw new Error(data?.error || error?.message || "Failed");

      toast({ title: existingReportId ? "New version generated" : "Report created", description: `Version ${data.version_no} ready.` });
      setCreateOpen(false);
      setForm({ template_id: "", title: "", description: "", related_to_type: "none", related_to_id: "", customer_contact_id: "", customer_org_id: "", free_scope: "", free_findings: "", free_costs: "" });
      setPhotoFiles([]); setUploadedPaths([]);
      await fetchReports();
      if (existingReportId && openReport) {
        const refreshed = await (supabase as any).from("crm_ai_reports").select("*").eq("id", existingReportId).single();
        if (refreshed.data) openReportDetail(refreshed.data as ProjectReport);
      }
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally { setGenerating(false); }
  };

  const transitionStatus = async (to: string, extra: Record<string, any> = {}) => {
    if (!openReport) return;
    const updates: any = { status: to, ...extra };
    if (to === "sent_to_customer") updates.sent_to_customer_at = new Date().toISOString();
    if (to === "acknowledged") updates.acknowledged_at = new Date().toISOString();
    const { error } = await (supabase as any).from("crm_ai_reports").update(updates).eq("id", openReport.id);
    if (error) { toast({ title: "Status update failed", description: error.message, variant: "destructive" }); return; }
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase as any).from("crm_ai_report_status_log").insert({
      workspace_id: workspace.id, report_id: openReport.id,
      from_status: openReport.status, to_status: to,
      by_user_id: user?.id, note: statusNote || null,
    });
    await logAudit({ workspace_id: workspace.id, action: "updated", entity_type: "ai_report", entity_id: openReport.id, entity_label: openReport.title, metadata: { status: to } });
    setStatusNote("");
    await fetchReports();
    const { data: r } = await (supabase as any).from("crm_ai_reports").select("*").eq("id", openReport.id).single();
    if (r) openReportDetail(r as ProjectReport);
  };

  const submitReject = async () => {
    if (!rejectingId) return;
    await transitionStatus("rejected", { rejection_reason: rejectReason });
    setRejectingId(null); setRejectReason("");
  };

  const saveEditedVersion = async () => {
    if (!activeVersionId) return;
    const { error } = await (supabase as any).from("crm_ai_report_versions").update({ edited_markdown: editMd }).eq("id", activeVersionId);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Edits saved" });
    if (openReport) {
      const { data } = await (supabase as any).from("crm_ai_report_versions").select("*").eq("report_id", openReport.id).order("version_no", { ascending: false });
      setVersions((data as Version[]) || []);
    }
  };

  const stats = useMemo(() => ({
    total: reports.length,
    in_review: reports.filter((r) => r.status === "in_review").length,
    approved: reports.filter((r) => r.status === "approved" || r.status === "sent_to_customer" || r.status === "acknowledged").length,
  }), [reports]);

  const activeVersion = versions.find((v) => v.id === activeVersionId);
  const activeMarkdown = activeVersion?.edited_markdown || activeVersion?.rendered_markdown || "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif">Project Reports</h1>
          <p className="text-sm text-muted-foreground">{stats.total} total • {stats.in_review} in review • {stats.approved} approved+</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto"><Sparkles className="h-4 w-4" /> New project report</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Generate new project report</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-[65vh] pr-3">
              <div className="space-y-4 py-2">
                <div>
                  <Label>Template *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {templates.map((t) => (
                      <button key={t.id} type="button" onClick={() => setForm({ ...form, template_id: t.id, title: form.title || t.name })}
                        className={`text-left rounded-md border p-3 text-sm transition ${form.template_id === t.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                        <div className="font-medium">{t.name}</div>
                        {t.description && <div className="text-xs text-muted-foreground mt-1">{t.description}</div>}
                        <div className="text-[10px] text-muted-foreground mt-1">{t.default_model}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div>
                    <Label>Linked to</Label>
                    <Select value={form.related_to_type} onValueChange={(v) => setForm({ ...form, related_to_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{RELATED_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {form.related_to_type !== "none" && (
                  <div><Label>Linked entity ID</Label><Input value={form.related_to_id} onChange={(e) => setForm({ ...form, related_to_id: e.target.value })} placeholder="UUID of the linked record" /></div>
                )}
                <div><Label>Description (optional)</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Scope of work / requirement</Label><Textarea rows={3} value={form.free_scope} onChange={(e) => setForm({ ...form, free_scope: e.target.value })} placeholder="Describe the scope, customer requirement, depth needed, etc." /></div>
                <div><Label>Findings / observations</Label><Textarea rows={3} value={form.free_findings} onChange={(e) => setForm({ ...form, free_findings: e.target.value })} placeholder="Field readings, soil observations, water yield estimate, etc." /></div>
                <div><Label>Costing notes (INR)</Label><Textarea rows={2} value={form.free_costs} onChange={(e) => setForm({ ...form, free_costs: e.target.value })} placeholder="Eg: Survey 5000, Drilling 80000/100ft, Casing 250/ft" /></div>
                <div>
                  <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Site photos (max 6, multimodal)</Label>
                  <Input type="file" multiple accept="image/*" onChange={(e) => setPhotoFiles(Array.from(e.target.files || []).slice(0, 6))} className="mt-2" />
                  {photoFiles.length > 0 && <p className="text-xs text-muted-foreground mt-1">{photoFiles.length} photo(s) selected</p>}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={() => generate()} disabled={generating || !form.template_id || !form.title} className="gap-2">
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
        <Card><CardContent className="text-center py-10 text-muted-foreground"><FileText className="h-10 w-10 mx-auto mb-2" />No project reports yet — create your first one.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {reports.map((r) => {
            const s = STATUS_FLOW[r.status] || STATUS_FLOW.draft;
            const Icon = s.icon;
            return (
              <Card key={r.id} className="cursor-pointer hover:border-primary/50 transition" onClick={() => openReportDetail(r)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{r.title}</CardTitle>
                    <Badge className={`${s.cls} shrink-0`}><Icon className="h-3 w-3 mr-1" />{s.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">v{r.current_version} • {new Date(r.created_at).toLocaleString("en-IN")}</p>
                </CardHeader>
                <CardContent className="space-y-1">
                  {r.template_type && <Badge variant="outline" className="text-[10px]">{r.template_type.replace(/_/g, " ")}</Badge>}
                  {r.description && <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
                  {r.rejection_reason && <p className="text-xs text-red-600 dark:text-red-400">Rejected: {r.rejection_reason}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* DETAIL DIALOG */}
      <Dialog open={!!openReport} onOpenChange={(o) => !o && closeReportDetail()}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 pr-6">
              <DialogTitle className="truncate">{openReport?.title}</DialogTitle>
              {openReport && (() => {
                const s = STATUS_FLOW[openReport.status] || STATUS_FLOW.draft;
                const Icon = s.icon;
                return <Badge className={s.cls}><Icon className="h-3 w-3 mr-1" />{s.label}</Badge>;
              })()}
            </div>
          </DialogHeader>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="versions">Versions ({versions.length})</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Select value={activeVersionId || ""} onValueChange={(v) => {
                  setActiveVersionId(v);
                  const ver = versions.find((x) => x.id === v);
                  setEditMd(ver?.edited_markdown || ver?.rendered_markdown || "");
                }}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Pick version" /></SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>v{v.version_no} {v.is_current ? "(current)" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => openReport && generate(openReport.id)} disabled={generating} className="gap-2">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Regenerate
                </Button>
                <Button size="sm" onClick={saveEditedVersion}>Save edits</Button>
              </div>
              <ScrollArea className="h-[55vh] border rounded-md">
                <Tabs defaultValue="preview" className="w-full">
                  <TabsList className="m-2"><TabsTrigger value="preview">Preview</TabsTrigger><TabsTrigger value="edit">Edit Markdown</TabsTrigger></TabsList>
                  <TabsContent value="preview" className="px-4 pb-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{activeMarkdown || "*No content*"}</ReactMarkdown>
                    </div>
                  </TabsContent>
                  <TabsContent value="edit" className="px-4 pb-4">
                    <Textarea rows={20} value={editMd} onChange={(e) => setEditMd(e.target.value)} className="font-mono text-xs" />
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="versions">
              <ScrollArea className="h-[55vh]">
                <div className="space-y-2">
                  {versions.map((v) => (
                    <Card key={v.id} className={`${v.is_current ? "border-primary" : ""}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Version {v.version_no} {v.is_current && <Badge className="ml-2">Current</Badge>}</CardTitle>
                          <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString("en-IN")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{v.ai_model} • {Array.isArray(v.photo_paths) ? v.photo_paths.length : 0} photos</p>
                      </CardHeader>
                      <CardContent>
                        <Button size="sm" variant="outline" onClick={() => { setActiveVersionId(v.id); setEditMd(v.edited_markdown || v.rendered_markdown || ""); }}>View</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="workflow" className="space-y-3">
              {openReport && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Transition status</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <Textarea placeholder="Optional note for this transition" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} rows={2} />
                    <div className="flex flex-wrap gap-2">
                      {(STATUS_FLOW[openReport.status]?.next || []).map((next) => {
                        const isApproval = next === "approved";
                        const isReject = next === "rejected";
                        if (isReject) {
                          return <Button key={next} size="sm" variant="outline" onClick={() => setRejectingId(openReport.id)}><XCircle className="h-3 w-3 mr-1" />Reject</Button>;
                        }
                        const canDo = !isApproval || isAdmin;
                        if (!canDo) return null;
                        const conf = STATUS_FLOW[next];
                        const Icon = conf.icon;
                        return (
                          <Button key={next} size="sm" onClick={() => transitionStatus(next)}>
                            <Icon className="h-3 w-3 mr-1" />Move to {conf.label}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Status history</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[35vh]">
                    {statusLog.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No transitions yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {statusLog.map((l) => (
                          <li key={l.id} className="text-sm border-l-2 border-primary/30 pl-3">
                            <div className="font-medium">{l.from_status || "—"} → {l.to_status}</div>
                            <div className="text-xs text-muted-foreground">{new Date(l.changed_at).toLocaleString("en-IN")}</div>
                            {l.note && <div className="text-xs italic mt-1">"{l.note}"</div>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="people">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Assignments</CardTitle></CardHeader>
                <CardContent>
                  {assignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No assignments yet. The creator is auto-assigned as owner.</p>
                  ) : (
                    <ul className="space-y-1">
                      {assignments.map((a) => (
                        <li key={a.id} className="text-sm flex items-center justify-between">
                          <span className="font-mono text-xs">{a.user_id.slice(0, 8)}…</span>
                          <Badge variant="outline">{a.role}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">Add reviewers/approvers via the workspace member directory (coming soon).</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* REJECT */}
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
