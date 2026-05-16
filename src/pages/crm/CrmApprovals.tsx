import { useEffect, useState } from "react";
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
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { Loader2, Plus, ClipboardCheck, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Approval = {
  id: string;
  request_type: string;
  title: string;
  description: string | null;
  amount: number | null;
  currency: string | null;
  status: string;
  decision_note: string | null;
  requested_by: string;
  approver_user_id: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  due_at: string | null;
  entity_type: string | null;
  entity_id: string | null;
};

const REQUEST_TYPES = [
  { value: "discount", label: "Discount" },
  { value: "refund", label: "Refund" },
  { value: "expense", label: "Expense" },
  { value: "large_deal", label: "Large Deal" },
  { value: "pricing_exception", label: "Pricing Exception" },
  { value: "other", label: "Other" },
];

const STATUS_VARIANT: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground",
};

const empty = {
  request_type: "discount",
  title: "",
  description: "",
  amount: "",
  approver_user_id: "",
  due_at: "",
};

const CrmApprovals = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<Approval[]>([]);
  const [members, setMembers] = useState<{ user_id: string; crm_role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<string | null>(null);
  const [decisionFor, setDecisionFor] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: { session } }, { data }, { data: mem }] = await Promise.all([
      supabase.auth.getSession(),
      supabase
        .from("crm_approval_requests")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("crm_workspace_members")
        .select("user_id, crm_role")
        .eq("workspace_id", workspace.id),
    ]);
    setMe(session?.user?.id ?? null);
    setRows((data as Approval[]) || []);
    setMembers((mem as { user_id: string; crm_role: string }[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (workspace?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  const submit = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) {
      setSaving(false);
      toast({ title: "Not signed in", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("crm_approval_requests").insert({
      workspace_id: workspace.id,
      request_type: form.request_type,
      title: form.title,
      description: form.description || null,
      amount: form.amount ? Number(form.amount) : null,
      requested_by: uid,
      approver_user_id: form.approver_user_id || null,
      due_at: form.due_at || null,
      status: "pending",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not submit", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Approval requested" });
    setForm(empty);
    setOpen(false);
    load();
  };

  const decide = async (status: "approved" | "rejected") => {
    if (!decisionFor || !me) return;
    const { error } = await supabase
      .from("crm_approval_requests")
      .update({
        status,
        decision_note: decisionNote || null,
        decided_by: me,
        decided_at: new Date().toISOString(),
      })
      .eq("id", decisionFor.id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: status === "approved" ? "Approved" : "Rejected" });
    setDecisionFor(null);
    setDecisionNote("");
    load();
  };

  const myInbox = rows.filter((r) => r.approver_user_id === me && r.status === "pending");
  const myRequests = rows.filter((r) => r.requested_by === me);
  const all = rows;

  const renderList = (list: Approval[]) => {
    if (list.length === 0) {
      return (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nothing here yet.
        </Card>
      );
    }
    return (
      <div className="grid gap-3">
        {list.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium truncate">{a.title}</h3>
                  <Badge className={STATUS_VARIANT[a.status]} variant="outline">
                    {a.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {REQUEST_TYPES.find((t) => t.value === a.request_type)?.label || a.request_type}
                  </Badge>
                  {a.amount != null && (
                    <Badge variant="secondary" className="text-xs">
                      ₹{Number(a.amount).toLocaleString("en-IN")}
                    </Badge>
                  )}
                </div>
                {a.description && (
                  <p className="text-sm text-muted-foreground mt-1.5">{a.description}</p>
                )}
                {a.decision_note && (
                  <p className="text-sm mt-1.5 italic">
                    <span className="text-muted-foreground">Note:</span> {a.decision_note}
                  </p>
                )}
                <div className="text-xs text-muted-foreground mt-1.5">
                  Requested {new Date(a.created_at).toLocaleString()}
                  {a.due_at && ` • due ${new Date(a.due_at).toLocaleDateString()}`}
                  {a.decided_at && ` • decided ${new Date(a.decided_at).toLocaleString()}`}
                </div>
              </div>
              {a.status === "pending" && a.approver_user_id === me && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-700 border-emerald-500/30"
                    onClick={() => { setDecisionFor({ id: a.id, action: "approve" }); setDecisionNote(""); }}
                  >
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/30"
                    onClick={() => { setDecisionFor({ id: a.id, action: "reject" }); setDecisionNote(""); }}
                  >
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" /> Approvals
          </h1>
          <p className="text-sm text-muted-foreground">
            Discounts, refunds, expenses, and other requests requiring sign-off.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Request approval</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New approval request</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Type</Label>
                <Select value={form.request_type} onValueChange={(v) => setForm({ ...form, request_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. 15% discount for Acme Corp"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Due by</Label>
                  <Input
                    type="datetime-local"
                    value={form.due_at}
                    onChange={(e) => setForm({ ...form, due_at: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Approver</Label>
                <Select value={form.approver_user_id} onValueChange={(v) => setForm({ ...form, approver_user_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select approver" /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.crm_role} • {m.user_id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="inbox">
          <TabsList>
            <TabsTrigger value="inbox">My Inbox ({myInbox.length})</TabsTrigger>
            <TabsTrigger value="mine">My Requests ({myRequests.length})</TabsTrigger>
            <TabsTrigger value="all">All ({all.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="inbox" className="mt-4">{renderList(myInbox)}</TabsContent>
          <TabsContent value="mine" className="mt-4">{renderList(myRequests)}</TabsContent>
          <TabsContent value="all" className="mt-4">{renderList(all)}</TabsContent>
        </Tabs>
      )}

      <Dialog open={!!decisionFor} onOpenChange={(o) => !o && setDecisionFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {decisionFor?.action === "approve" ? "Approve request" : "Reject request"}
            </DialogTitle>
          </DialogHeader>
          <div>
            <Label>Decision note (optional)</Label>
            <Textarea
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              rows={3}
              placeholder="Reason or context…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionFor(null)}>Cancel</Button>
            <Button
              variant={decisionFor?.action === "approve" ? "default" : "destructive"}
              onClick={() => decide(decisionFor?.action === "approve" ? "approved" : "rejected")}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CrmApprovals;
