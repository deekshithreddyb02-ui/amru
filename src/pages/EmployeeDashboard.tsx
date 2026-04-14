import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { motion } from "framer-motion";
import { Loader2, LogOut, ClipboardList, Clock, CheckCircle2, AlertCircle, ChevronDown, Users, MapPin } from "lucide-react";
import defaultLogo from "@/assets/logo-small.webp";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  assigned_by_name?: string;
}

interface AssignedLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  created_at: string;
  biz_area: string | null;
  country: string | null;
  mailing_city: string | null;
  crm_status: string | null;
  whatsapp: string | null;
}

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  urgent: "bg-destructive/10 text-destructive",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  in_progress: <AlertCircle className="w-4 h-4" />,
  completed: <CheckCircle2 className="w-4 h-4" />,
  cancelled: <AlertCircle className="w-4 h-4 text-muted-foreground" />,
};

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { role, loading: roleLoading, mustChangePassword } = useUserRole();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<string | null>(null);
  const [assignedLeads, setAssignedLeads] = useState<AssignedLead[]>([]);
  const [activeTab, setActiveTab] = useState<"tasks" | "leads">("tasks");

  useEffect(() => {
    if (!roleLoading) {
      if (mustChangePassword) {
        navigate("/change-password");
        return;
      }
      if (role !== "employee" && role !== "admin") {
        navigate("/");
      }
    }
  }, [role, roleLoading, mustChangePassword, navigate]);

  useEffect(() => {
    if (role === "employee" || role === "admin") {
      fetchTasks();
      fetchAssignedLeads();
    }
  }, [role]);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const { data, error } = await supabase
        .from("employee_tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks((data || []) as Task[]);
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoadingTasks(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("employee_tasks")
        .update({ status: newStatus } as any)
        .eq("id", taskId);

      if (error) throw error;
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      toast({ title: "Status Updated" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
  };

  const saveTaskNotes = async (taskId: string) => {
    setSavingNotes(taskId);
    try {
      const { error } = await supabase
        .from("employee_tasks")
        .update({ notes: taskNotes[taskId] || "" } as any)
        .eq("id", taskId);

      if (error) throw error;
      setTasks(tasks.map(t => t.id === taskId ? { ...t, notes: taskNotes[taskId] || "" } : t));
      toast({ title: "Notes Saved" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setSavingNotes(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (roleLoading || loadingTasks) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredTasks = tasks.filter(t => filter === "all" || t.status === filter);
  const taskCounts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={defaultLogo} alt="Logo" className="w-10 h-10 object-contain rounded-full bg-white/10 p-0.5" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">Employee Dashboard</span>
              <span className="text-xs text-primary-foreground/70">Task Management</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10">
            <LogOut className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Tasks", count: taskCounts.all, icon: ClipboardList, color: "text-primary" },
              { label: "Pending", count: taskCounts.pending, icon: Clock, color: "text-yellow-600" },
              { label: "In Progress", count: taskCounts.in_progress, icon: AlertCircle, color: "text-blue-600" },
              { label: "Completed", count: taskCounts.completed, icon: CheckCircle2, color: "text-green-600" },
            ].map(({ label, count, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <Icon className={`w-8 h-8 ${color}`} />
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filter */}
          <div className="flex flex-wrap gap-1 p-1.5 bg-primary/5 border border-primary/10 rounded-xl mb-6">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "in_progress", label: "In Progress" },
              { key: "completed", label: "Completed" },
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={filter === key ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(key)}
                className={`flex-1 py-2.5 rounded-lg transition-all ${filter === key ? "shadow-md" : "text-muted-foreground"}`}
              >
                {label} ({taskCounts[key as keyof typeof taskCounts] ?? 0})
              </Button>
            ))}
          </div>

          {/* Tasks */}
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No tasks found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {statusIcons[task.status]}
                          <h3 className="font-semibold truncate">{task.title}</h3>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={priorityColors[task.priority] || ""}>
                            {task.priority}
                          </Badge>
                          {task.due_date && (
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={task.status} onValueChange={(v) => updateTaskStatus(task.id, v)}>
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setExpandedTask(expandedTask === task.id ? null : task.id);
                            if (!taskNotes[task.id] && task.notes) {
                              setTaskNotes(prev => ({ ...prev, [task.id]: task.notes || "" }));
                            }
                          }}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedTask === task.id ? "rotate-180" : ""}`} />
                        </Button>
                      </div>
                    </div>

                    {expandedTask === task.id && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Notes</label>
                          <Textarea
                            value={taskNotes[task.id] ?? task.notes ?? ""}
                            onChange={(e) => setTaskNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                            placeholder="Add notes about this task..."
                            rows={3}
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => saveTaskNotes(task.id)}
                          disabled={savingNotes === task.id}
                        >
                          {savingNotes === task.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                          Save Notes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
