import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, Clock, Loader2, Pause, Play, Plus, Trash2, AlertCircle, ListTodo, Timer, Activity } from "lucide-react";
import { format, isAfter, isBefore, parseISO, startOfToday } from "date-fns";

type Task = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  progress: number | null;
  tags: string[] | null;
  assigned_to: string | null;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
};

type TimeLog = {
  id: string;
  task_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
};

const STATUSES = ["todo", "in_progress", "blocked", "done", "cancelled"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

const priorityColor = (p: string) =>
  p === "urgent" ? "destructive" : p === "high" ? "default" : p === "low" ? "secondary" : "outline";

const statusIcon = (s: string) => {
  if (s === "done") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (s === "in_progress") return <Activity className="h-4 w-4 text-blue-500" />;
  if (s === "blocked") return <AlertCircle className="h-4 w-4 text-red-500" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
};

const CrmTasks = () => {
  const { workspace } = useOutletContext<{ workspace: { id: string; slug: string } }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "mine" | "today" | "overdue">("mine");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [activeTimer, setActiveTimer] = useState<{ taskId: string; logId: string; startedAt: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    estimated_hours: "",
    tags: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [tRes, lRes] = await Promise.all([
      supabase.from("crm_tasks").select("*").eq("workspace_id", workspace.id).order("due_date", { ascending: true, nullsFirst: false }),
      supabase.from("crm_task_time_logs").select("*").eq("workspace_id", workspace.id).order("started_at", { ascending: false }),
    ]);
    if (tRes.error) toast({ title: "Failed to load tasks", description: tRes.error.message, variant: "destructive" });
    else setTasks((tRes.data || []) as Task[]);
    if (!lRes.error) {
      const logs = (lRes.data || []) as TimeLog[];
      setTimeLogs(logs);
      const running = logs.find((l) => !l.ended_at && l.user_id === userId);
      if (running) setActiveTimer({ taskId: running.task_id, logId: running.id, startedAt: running.started_at });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (workspace?.id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id, userId]);

  const filtered = useMemo(() => {
    const today = startOfToday();
    return tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (filter === "mine") return t.assigned_to === userId || t.created_by === userId;
      if (filter === "today") return t.due_date && format(parseISO(t.due_date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
      if (filter === "overdue")
        return t.due_date && isBefore(parseISO(t.due_date), today) && t.status !== "done" && t.status !== "cancelled";
      return true;
    });
  }, [tasks, filter, statusFilter, userId]);

  const kpis = useMemo(() => {
    const mine = tasks.filter((t) => t.assigned_to === userId || t.created_by === userId);
    const today = startOfToday();
    return {
      total: tasks.length,
      mine: mine.length,
      done: mine.filter((t) => t.status === "done").length,
      overdue: mine.filter(
        (t) => t.due_date && isBefore(parseISO(t.due_date), today) && t.status !== "done" && t.status !== "cancelled",
      ).length,
      hoursLogged: timeLogs
        .filter((l) => l.user_id === userId && l.duration_minutes)
        .reduce((acc, l) => acc + (l.duration_minutes || 0), 0) / 60,
    };
  }, [tasks, timeLogs, userId]);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const payload = {
      workspace_id: workspace.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      due_date: form.due_date || null,
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
      assigned_to: userId,
      created_by: userId,
      status: "todo",
    };
    const { error } = await supabase.from("crm_tasks").insert(payload);
    if (error) {
      toast({ title: "Failed to create task", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Task created" });
    setOpenCreate(false);
    setForm({ title: "", description: "", priority: "medium", due_date: "", estimated_hours: "", tags: "" });
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("crm_tasks").update({ status }).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else fetchData();
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    const { error } = await supabase.from("crm_tasks").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Task deleted" });
      fetchData();
    }
  };

  const startTimer = async (taskId: string) => {
    if (activeTimer) {
      toast({ title: "Stop the running timer first", variant: "destructive" });
      return;
    }
    if (!userId) return;
    const { data, error } = await supabase
      .from("crm_task_time_logs")
      .insert({ workspace_id: workspace.id, task_id: taskId, user_id: userId, started_at: new Date().toISOString() })
      .select()
      .single();
    if (error) toast({ title: "Could not start timer", description: error.message, variant: "destructive" });
    else if (data) {
      setActiveTimer({ taskId, logId: data.id, startedAt: data.started_at });
      // also bump task to in_progress
      await supabase.from("crm_tasks").update({ status: "in_progress" }).eq("id", taskId).eq("status", "todo");
      fetchData();
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    const { error } = await supabase
      .from("crm_task_time_logs")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", activeTimer.logId);
    if (error) toast({ title: "Could not stop timer", description: error.message, variant: "destructive" });
    else {
      setActiveTimer(null);
      toast({ title: "Time logged" });
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif">Tasks & Productivity</h1>
          <p className="text-sm text-muted-foreground">Personal task board with time tracking</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTimer && (
            <Button variant="destructive" size="sm" onClick={stopTimer}>
              <Pause className="h-4 w-4 mr-2" />
              Stop timer
            </Button>
          )}
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Estimated hours</Label>
                    <Input type="number" step="0.25" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })} />
                  </div>
                  <div>
                    <Label>Tags (comma-sep)</Label>
                    <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-semibold flex items-center gap-2"><ListTodo className="h-4 w-4" />{kpis.total}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">My tasks</div><div className="text-2xl font-semibold">{kpis.mine}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Done</div><div className="text-2xl font-semibold text-green-600">{kpis.done}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Overdue</div><div className="text-2xl font-semibold text-destructive">{kpis.overdue}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Hours logged</div><div className="text-2xl font-semibold flex items-center gap-2"><Timer className="h-4 w-4" />{kpis.hoursLogged.toFixed(1)}</div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="mine">Mine</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban-ish board grouped by status */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {["todo", "in_progress", "blocked", "done"].map((status) => {
          const items = filtered.filter((t) => t.status === status);
          return (
            <Card key={status}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between capitalize">
                  <span className="flex items-center gap-2">{statusIcon(status)}{status.replace("_", " ")}</span>
                  <Badge variant="outline">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {items.length === 0 && <div className="text-xs text-muted-foreground py-4 text-center">No tasks</div>}
                {items.map((t) => {
                  const overdue = t.due_date && isBefore(parseISO(t.due_date), startOfToday()) && t.status !== "done";
                  const isRunning = activeTimer?.taskId === t.id;
                  return (
                    <Card key={t.id} className="border-l-4" style={{ borderLeftColor: t.priority === "urgent" ? "hsl(var(--destructive))" : t.priority === "high" ? "hsl(var(--primary))" : "hsl(var(--muted))" }}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium text-sm leading-tight">{t.title}</div>
                          <Badge variant={priorityColor(t.priority) as any} className="text-[10px] capitalize">{t.priority}</Badge>
                        </div>
                        {t.description && <div className="text-xs text-muted-foreground line-clamp-2">{t.description}</div>}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {t.due_date && (
                            <span className={overdue ? "text-destructive font-medium" : ""}>
                              <Clock className="h-3 w-3 inline mr-1" />
                              {format(parseISO(t.due_date), "MMM d")}
                            </span>
                          )}
                          {(t.actual_hours ?? 0) > 0 && <span><Timer className="h-3 w-3 inline mr-1" />{t.actual_hours}h</span>}
                        </div>
                        {t.tags && t.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {t.tags.map((tag) => <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>)}
                          </div>
                        )}
                        <div className="flex items-center gap-1 pt-1">
                          <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v)}>
                            <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                          {t.status !== "done" && t.status !== "cancelled" && (
                            isRunning ? (
                              <Button size="sm" variant="destructive" className="h-7 px-2" onClick={stopTimer}><Pause className="h-3 w-3" /></Button>
                            ) : (
                              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => startTimer(t.id)} disabled={!!activeTimer}><Play className="h-3 w-3" /></Button>
                            )
                          )}
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => deleteTask(t.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CrmTasks;
