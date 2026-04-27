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
import { Loader2, Plus, Search, Workflow, Play, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Action = {
  type: "assign" | "notify" | "create_task" | "send_email" | "update_field" | "create_approval";
  config: Record<string, string>;
};

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

const ENTITY_TYPES = [
  { value: "lead", label: "Lead" },
  { value: "deal", label: "Deal" },
  { value: "ticket", label: "Support Ticket" },
  { value: "activity", label: "Activity" },
  { value: "invoice", label: "Invoice" },
  { value: "quotation", label: "Quotation" },
];

const TRIGGER_EVENTS = [
  { value: "on_create", label: "When created" },
  { value: "on_update", label: "When updated" },
  { value: "on_status_change", label: "When status changes" },
  { value: "on_overdue", label: "When overdue" },
];

const ACTION_TYPES = [
  { value: "assign", label: "Assign owner" },
  { value: "notify", label: "Send notification" },
  { value: "create_task", label: "Create task" },
  { value: "send_email", label: "Send email" },
  { value: "update_field", label: "Update field" },
  { value: "create_approval", label: "Request approval" },
];

const empty = {
  name: "",
  description: "",
  entity_type: "lead",
  trigger_event: "on_create",
  trigger_field: "",
  trigger_value: "",
  is_active: true,
};

const CrmWorkflows = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [actions, setActions] = useState<Action[]>([
    { type: "notify", config: { message: "" } },
  ]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_workflow_rules")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });
    setRows((data as Rule[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (workspace?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  const reset = () => {
    setForm(empty);
    setActions([{ type: "notify", config: { message: "" } }]);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("crm_workflow_rules").insert({
      workspace_id: workspace.id,
      name: form.name,
      description: form.description || null,
      entity_type: form.entity_type,
      trigger_event: form.trigger_event,
      trigger_field: form.trigger_field || null,
      trigger_value: form.trigger_value || null,
      actions: actions as unknown as never,
      is_active: form.is_active,
      created_by: session?.user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Workflow created" });
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

  const addAction = () =>
    setActions((a) => [...a, { type: "notify", config: { message: "" } }]);

  const updateAction = (i: number, patch: Partial<Action>) =>
    setActions((a) => a.map((act, idx) => (idx === i ? { ...act, ...patch } : act)));

  const removeAction = (i: number) =>
    setActions((a) => a.filter((_, idx) => idx !== i));

  const filtered = rows.filter((r) =>
    !q || r.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Workflow className="h-6 w-6 text-primary" /> Workflow Rules
          </h1>
          <p className="text-sm text-muted-foreground">
            Automate actions when records are created, updated, or overdue.
          </p>
        </div>
        <div className="flex gap-2">
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
                      <Label>New value</Label>
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
                          onValueChange={(v) => updateAction(i, { type: v as Action["type"] })}
                        >
                          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ACTION_TYPES.map((a) => (
                              <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          className="flex-1"
                          placeholder={
                            act.type === "assign" ? "User ID or 'round_robin'" :
                            act.type === "notify" ? "Notification message" :
                            act.type === "create_task" ? "Task subject" :
                            act.type === "send_email" ? "Email template ID" :
                            act.type === "update_field" ? "field=value" :
                            "Approval title"
                          }
                          value={
                            act.config.message ||
                            act.config.user_id ||
                            act.config.subject ||
                            act.config.template_id ||
                            act.config.field ||
                            act.config.title || ""
                          }
                          onChange={(e) => {
                            const k =
                              act.type === "assign" ? "user_id" :
                              act.type === "notify" ? "message" :
                              act.type === "create_task" ? "subject" :
                              act.type === "send_email" ? "template_id" :
                              act.type === "update_field" ? "field" :
                              "title";
                            updateAction(i, { config: { ...act.config, [k]: e.target.value } });
                          }}
                        />
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
      ) : filtered.length === 0 ? (
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
    </div>
  );
};

export default CrmWorkflows;
