import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Plus,
  RefreshCw,
  CheckCircle2,
  Circle,
  Phone,
  CalendarDays,
  ListTodo,
  StickyNote,
  Mail,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type ActivityType = "task" | "call" | "meeting" | "note" | "email";
type ActivityStatus = "planned" | "in_progress" | "done" | "cancelled";

type Activity = {
  id: string;
  activity_type: ActivityType;
  subject: string;
  description: string | null;
  location: string | null;
  meeting_url: string | null;
  status: ActivityStatus;
  priority: string;
  due_at: string | null;
  duration_minutes: number | null;
  reminder_minutes_before: number | null;
  lead_id: string | null;
  contact_id: string | null;
  deal_id: string | null;
  created_at: string;
};

type LinkOption = { id: string; label: string };

const TYPE_META: Record<ActivityType, { label: string; icon: typeof ListTodo; tone: string }> = {
  task: { label: "Task", icon: ListTodo, tone: "bg-primary/10 text-primary" },
  call: { label: "Call", icon: Phone, tone: "bg-[hsl(var(--teal))]/15 text-[hsl(var(--teal))]" },
  meeting: { label: "Meeting", icon: CalendarDays, tone: "bg-secondary/20 text-secondary-foreground" },
  note: { label: "Note", icon: StickyNote, tone: "bg-muted text-foreground" },
  email: { label: "Email", icon: Mail, tone: "bg-accent text-accent-foreground" },
};

const PRIORITY_TONE: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-secondary/30 text-secondary-foreground",
  high: "bg-amber-100 text-amber-800",
  urgent: "bg-destructive/15 text-destructive",
};

const fmtDateTime = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CrmActivities = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ActivityType>("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [leadOpts, setLeadOpts] = useState<LinkOption[]>([]);
  const [contactOpts, setContactOpts] = useState<LinkOption[]>([]);
  const [dealOpts, setDealOpts] = useState<LinkOption[]>([]);

  const [form, setForm] = useState({
    activity_type: "task" as ActivityType,
    subject: "",
    description: "",
    location: "",
    meeting_url: "",
    priority: "medium",
    due_at: "",
    duration_minutes: "30",
    reminder_minutes_before: "30",
    lead_id: "",
    contact_id: "",
    deal_id: "",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_activities")
      .select(
        "id,activity_type,subject,description,location,meeting_url,status,priority,due_at,duration_minutes,reminder_minutes_before,lead_id,contact_id,deal_id,created_at"
      )
      .eq("workspace_id", workspace.id)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(300);
    if (error) console.error(error);
    setItems((data as Activity[]) || []);
    setLoading(false);
  };

  const loadLinkOptions = async () => {
    const [leads, contacts, deals] = await Promise.all([
      supabase
        .from("crm_leads")
        .select("id,full_name")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("crm_contacts")
        .select("id,full_name")
        .eq("workspace_id", workspace.id)
        .order("full_name")
        .limit(100),
      supabase
        .from("crm_deals")
        .select("id,title")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    setLeadOpts((leads.data || []).map((r: any) => ({ id: r.id, label: r.full_name })));
    setContactOpts((contacts.data || []).map((r: any) => ({ id: r.id, label: r.full_name })));
    setDealOpts((deals.data || []).map((r: any) => ({ id: r.id, label: r.title })));
  };

  useEffect(() => {
    load();
    loadLinkOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id]);

  const resetForm = () =>
    setForm({
      activity_type: "task",
      subject: "",
      description: "",
      location: "",
      meeting_url: "",
      priority: "medium",
      due_at: "",
      duration_minutes: "30",
      reminder_minutes_before: "30",
      lead_id: "",
      contact_id: "",
      deal_id: "",
    });

  const create = async () => {
    if (!form.subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      workspace_id: workspace.id,
      activity_type: form.activity_type,
      subject: form.subject.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      meeting_url: form.meeting_url.trim() || null,
      priority: form.priority,
      due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      reminder_minutes_before: form.reminder_minutes_before
        ? Number(form.reminder_minutes_before)
        : null,
      lead_id: form.lead_id || null,
      contact_id: form.contact_id || null,
      deal_id: form.deal_id || null,
      assigned_to: user?.id || null,
      created_by: user?.id || null,
    };
    const { error } = await supabase.from("crm_activities").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Activity created");
    setOpen(false);
    resetForm();
    load();
  };

  const toggleDone = async (a: Activity) => {
    const next: ActivityStatus = a.status === "done" ? "planned" : "done";
    const prev = items;
    setItems(items.map((x) => (x.id === a.id ? { ...x, status: next } : x)));
    const { error } = await supabase
      .from("crm_activities")
      .update({ status: next })
      .eq("id", a.id);
    if (error) {
      toast.error(error.message);
      setItems(prev);
    }
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.activity_type === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif">Activities</h1>
          <p className="text-muted-foreground text-sm">
            Tasks, calls and meetings for {workspace.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={load} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> New Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New activity</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select
                      value={form.activity_type}
                      onValueChange={(v) =>
                        setForm({ ...form, activity_type: v as ActivityType })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(TYPE_META) as ActivityType[]).map((t) => (
                          <SelectItem key={t} value={t}>
                            {TYPE_META[t].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select
                      value={form.priority}
                      onValueChange={(v) => setForm({ ...form, priority: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Subject *</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Call client about borewell report"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Due date & time</Label>
                    <Input
                      type="datetime-local"
                      value={form.due_at}
                      onChange={(e) => setForm({ ...form, due_at: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Duration (min)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.duration_minutes}
                      onChange={(e) =>
                        setForm({ ...form, duration_minutes: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Location</Label>
                    <Input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Site / office"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Reminder (min before)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.reminder_minutes_before}
                      onChange={(e) =>
                        setForm({ ...form, reminder_minutes_before: e.target.value })
                      }
                    />
                  </div>
                </div>

                {form.activity_type === "meeting" && (
                  <div className="space-y-1.5">
                    <Label>Meeting URL</Label>
                    <Input
                      value={form.meeting_url}
                      onChange={(e) => setForm({ ...form, meeting_url: e.target.value })}
                      placeholder="https://meet.google.com/…"
                    />
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Lead</Label>
                    <Select
                      value={form.lead_id || "none"}
                      onValueChange={(v) => setForm({ ...form, lead_id: v === "none" ? "" : v })}
                    >
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {leadOpts.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact</Label>
                    <Select
                      value={form.contact_id || "none"}
                      onValueChange={(v) =>
                        setForm({ ...form, contact_id: v === "none" ? "" : v })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {contactOpts.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Deal</Label>
                    <Select
                      value={form.deal_id || "none"}
                      onValueChange={(v) => setForm({ ...form, deal_id: v === "none" ? "" : v })}
                    >
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {dealOpts.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={create} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="task">Tasks</TabsTrigger>
          <TabsTrigger value="call">Calls</TabsTrigger>
          <TabsTrigger value="meeting">Meetings</TabsTrigger>
          <TabsTrigger value="note">Notes</TabsTrigger>
          <TabsTrigger value="email">Emails</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No activities yet. Click "New Activity" to schedule a task, call or meeting.
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((a) => {
              const meta = TYPE_META[a.activity_type];
              const Icon = meta.icon;
              const done = a.status === "done";
              return (
                <li key={a.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleDone(a)}
                      className="mt-0.5 text-muted-foreground hover:text-primary"
                      aria-label="Toggle done"
                    >
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className={meta.tone}>
                          <Icon className="h-3 w-3 mr-1" />
                          {meta.label}
                        </Badge>
                        <span
                          className={`font-medium truncate ${done ? "line-through text-muted-foreground" : ""}`}
                        >
                          {a.subject}
                        </span>
                        <Badge variant="secondary" className={PRIORITY_TONE[a.priority]}>
                          {a.priority}
                        </Badge>
                      </div>
                      {a.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {a.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {fmtDateTime(a.due_at)}
                        </span>
                        {a.location && <span>📍 {a.location}</span>}
                        {a.duration_minutes ? <span>{a.duration_minutes} min</span> : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default CrmActivities;
