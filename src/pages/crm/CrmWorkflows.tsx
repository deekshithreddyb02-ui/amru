import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2, Plus, Search, Workflow, Trash2, History, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type ActionType =
  | "assign_user"
  | "create_notification"
  | "create_activity"
  | "update_field"
  | "create_approval_request";

type Action = { type: ActionType } & Record<string, string>;

type Rule = {
  id: string;
  name: string;
  description: string | null;
  entity_type: string;
  trigger_event: string;
  trigger_field: string | null;
  trigger_value: string | null;
  conditions: unknown;
  actions: Action[];
  is_active: boolean;
  run_count: number;
  last_run_at: string | null;
};

type Execution = {
  id: string;
  workflow_id: string;
  entity_type: string;
  entity_id: string | null;
  trigger_event: string;
  status: string;
  error_message: string | null;
  executed_at: string;
};

const ENTITY_TYPES = [
  { value: "crm_leads", label: "Lead" },
  { value: "crm_deals", label: "Deal" },
  { value: "crm_support_tickets", label: "Support Ticket" },
  { value: "crm_activities", label: "Activity" },
  { value: "crm_invoices", label: "Invoice" },
];

const TRIGGER_EVENTS = [
  { value: "on_create", label: "When created" },
  { value: "on_update", label: "When updated" },
  { value: "on_status_change", label: "When a field changes" },
];

const ACTION_TYPES: { value: ActionType; label: string }[] = [
  { value: "assign_user", label: "Assign user" },
  { value: "create_notification", label: "Send notification" },
  { value: "create_activity", label: "Create task" },
  { value: "update_field", label: "Update field" },
  { value: "create_approval_request", label: "Request approval" },
];

const empty = {
  name: "",
  description: "",
  entity_type: "crm_leads",
  trigger_event: "on_create",
  trigger_field: "",
  trigger_value: "",
  is_active: true,
};

const newAction = (type: ActionType): Action => ({ type });

const CrmWorkflows = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<Rule[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [actions, setActions] = useState<Action[]>([newAction("create_notification")]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: rulesData }, { data: execData }] = await Promise.all([
      supabase
        .from("crm_workflow_rules")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("crm_workflow_executions")
        .select("id, workflow_id, entity_type, entity_id, trigger_event, status, error_message, executed_at")
        .eq("workspace_id", workspace.id)
        .order("executed_at", { ascending: false })
        .limit(50),
    ]);
    setRows(((rulesData || []) as unknown) as Rule[]);
    setExecutions((execData as Execution[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (workspace?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  const reset = () => {
    setEditingId(null);
    setForm(empty);
    setActions([newAction("create_notification")]);
  };

  const openEdit = (r: Rule) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      description: r.description || "",
      entity_type: r.entity_type,
      trigger_event: r.trigger_event,
      trigger_field: r.trigger_field || "",
      trigger_value: r.trigger_value || "",
      is_active: r.is_active,
    });
    const acts = Array.isArray(r.actions) && r.actions.length > 0
      ? (r.actions as Action[])
      : [newAction("create_notification")];
    setActions(acts);
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description || null,
      entity_type: form.entity_type,
      trigger_event: form.trigger_event,
      trigger_field: form.trigger_field || null,
      trigger_value: form.trigger_value || null,
      actions: actions as unknown as never,
      is_active: form.is_active,
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("crm_workflow_rules").update(payload).eq("id", editingId));
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      ({ error } = await supabase.from("crm_workflow_rules").insert({
        ...payload,
        workspace_id: workspace.id,
        created_by: session?.user?.id ?? null,
      }));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "Workflow updated" : "Workflow created" });
    setOpen(false);
    reset();
    load();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("crm_workflow_rules").update({ is_active: active }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this workflow?")) return;
    await supabase.from("crm_workflow_rules").delete().eq("id", id);
    toast({ title: "Workflow deleted" });
    load();
  };

  const addAction = () => setActions((a) => [...a, newAction("create_notification")]);

  const updateAction = (i: number, patch: Partial<Action>) =>
    setActions((a) => a.map((act, idx) => (idx === i ? { ...act, ...patch } : act)));

  const removeAction = (i: number) =>
    setActions((a) => a.filter((_, idx) => idx !== i));

  const renderActionFields = (act: Action, i: number) => {
    switch (act.type) {
      case "assign_user":
        return (
          <Input
            placeholder="User ID (UUID)"
            value={act.user_id || ""}
            onChange={(e) => updateAction(i, { user_id: e.target.value })}
          />
        );
      case "create_notification":
        return (
          <div className="grid grid-cols-2 gap-2 flex-1">
            <Input
              placeholder="Title"
              value={act.title || ""}
              onChange={(e) => updateAction(i, { title: e.target.value })}
            />
            <Input
              placeholder="Body"
              value={act.body || ""}
              onChange={(e) => updateAction(i, { body: e.target.value })}
            />
          </div>
        );
      case "create_activity":
        return (
          <div className="grid grid-cols-2 gap-2 flex-1">
            <Input
              placeholder="Subject"
              value={act.subject || ""}
              onChange={(e) => updateAction(i, { subject: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Due in hours"
              value={act.due_in_hours || ""}
              onChange={(e) => updateAction(i, { due_in_hours: e.target.value })}
            />
          </div>
        );
      case "update_field":
        return (
          <div className="grid grid-cols-2 gap-2 flex-1">
            <Input
              placeholder="Field name"
              value={act.field || ""}
              onChange={(e) => updateAction(i, { field: e.target.value })}
            />
            <Input
              placeholder="New value"
              value={act.value || ""}
              onChange={(e) => updateAction(i, { value: e.target.value })}
            />
          </div>
        );
      case "create_approval_request":
        return (
          <div className="grid grid-cols-2 gap-2 flex-1">
            <Input
              placeholder="Title"
              value={act.title || ""}
              onChange={(e) => updateAction(i, { title: e.target.value })}
            />
            <Input
              placeholder="Approver user ID"
              value={act.approver_user_id || ""}
              onChange={(e) => updateAction(i, { approver_user_id: e.target.value })}
            />
          </div>
        );
    }
  };

  const filtered = rows.filter((r) =>
    !q || r.name.toLowerCase().includes(q.toLowerCase())
  );

  const ruleName = (id: string) => rows.find((r) => r.id === id)?.name || "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Workflow className="h-6 w-6 text-primary" /> Workflow Rules
          </h1>
          <p className="text-sm text-muted-foreground">
            Automate actions when records are created, updated, or change status.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const { error } = await supabase.functions.invoke("crm-scheduled-workflows");
              if (error) toast({ title: "Run failed", description: error.message, variant: "destructive" });
              else { toast({ title: "Scheduled rules executed" }); load(); }
            }}
          >
            Run scheduled now
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search rules…"
              className="pl-8 w-56"
            />
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New rule</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create workflow rule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Auto-assign hot leads"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Entity</Label>
                    <Select value={form.entity_type} onValueChange={(v) => setForm({ ...form, entity_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ENTITY_TYPES.map((e) => (
                          <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Trigger</Label>
                    <Select value={form.trigger_event} onValueChange={(v) => setForm({ ...form, trigger_event: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TRIGGER_EVENTS.map((e) => (
                          <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {form.trigger_event === "on_status_change" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Field name</Label>
                      <Input
                        value={form.trigger_field}
                        onChange={(e) => setForm({ ...form, trigger_field: e.target.value })}
                        placeholder="status"
                      />
                    </div>
                    <div>
                      <Label>New value (optional)</Label>
                      <Input
                        value={form.trigger_value}
                        onChange={(e) => setForm({ ...form, trigger_value: e.target.value })}
                        placeholder="qualified"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Actions</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addAction}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add action
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {actions.map((act, i) => (
                      <div key={i} className="flex gap-2 items-start border rounded-md p-2">
                        <Select
                          value={act.type}
                          onValueChange={(v) => updateAction(i, { type: v as ActionType })}
                        >
                          <SelectTrigger className="w-44 shrink-0"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ACTION_TYPES.map((a) => (
                              <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex-1">{renderActionFields(act, i)}</div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAction(i)}
                          disabled={actions.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <Label htmlFor="active">Active</Label>
                  <Switch
                    id="active"
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Create rule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="rules">
          <TabsList>
            <TabsTrigger value="rules">Rules ({rows.length})</TabsTrigger>
            <TabsTrigger value="log">
              <History className="h-3.5 w-3.5 mr-1" /> Recent runs ({executions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="mt-4">
            {filtered.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                No workflow rules yet. Create your first one to automate actions.
              </Card>
            ) : (
              <div className="grid gap-3">
                {filtered.map((r) => (
                  <Card key={r.id} className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium truncate">{r.name}</h3>
                          <Badge variant={r.is_active ? "default" : "secondary"}>
                            {r.is_active ? "Active" : "Paused"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {ENTITY_TYPES.find((e) => e.value === r.entity_type)?.label || r.entity_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {TRIGGER_EVENTS.find((e) => e.value === r.trigger_event)?.label || r.trigger_event}
                          </Badge>
                        </div>
                        {r.description && (
                          <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                        )}
                        <div className="text-xs text-muted-foreground mt-1.5">
                          {(r.actions || []).length} action{(r.actions || []).length === 1 ? "" : "s"} •
                          {" "}{r.run_count} run{r.run_count === 1 ? "" : "s"}
                          {r.last_run_at && ` • last: ${new Date(r.last_run_at).toLocaleString()}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={r.is_active}
                          onCheckedChange={(v) => toggle(r.id, v)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(r.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="log" className="mt-4">
            {executions.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                No workflow runs yet. They'll appear here as rules fire.
              </Card>
            ) : (
              <Card className="divide-y">
                {executions.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <Badge
                      variant="outline"
                      className={
                        e.status === "success"
                          ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                          : "bg-destructive/15 text-destructive border-destructive/30"
                      }
                    >
                      {e.status}
                    </Badge>
                    <span className="font-medium truncate flex-1 min-w-0">{ruleName(e.workflow_id)}</span>
                    <span className="text-xs text-muted-foreground">{e.trigger_event}</span>
                    <span className="text-xs text-muted-foreground">
                      {ENTITY_TYPES.find((x) => x.value === e.entity_type)?.label || e.entity_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(e.executed_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default CrmWorkflows;
