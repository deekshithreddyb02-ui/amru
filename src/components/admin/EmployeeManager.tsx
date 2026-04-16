import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { Loader2, Plus, UserPlus, ClipboardList, RefreshCw, Trash2, Calendar, FolderTree, KeyRound } from "lucide-react";

interface Employee {
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  status: string;
  priority: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

interface RegionAssignment {
  id: string;
  employee_id: string;
  biz_area: string;
}

const KNOWN_REGIONS = ["Maharashtra", "Telangana", "Andhra Pradesh", "Karnataka", "Others"];

const EmployeeManager = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"employees" | "tasks" | "regions">("employees");

  // Create employee form
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newTempPassword, setNewTempPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<"employee" | "admin">("employee");

  // Create task form
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueDate, setTaskDueDate] = useState("");

  // Region assignments
  const [regionAssignments, setRegionAssignments] = useState<RegionAssignment[]>([]);
  const [savingRegion, setSavingRegion] = useState(false);
  const [regionLeadCounts, setRegionLeadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users with 'employee' or 'admin' role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["employee", "admin"]);

      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (roles && roles.length > 0) {
        const allIds = roles.map(r => r.user_id);
        const roleMap = new Map<string, string>();
        roles.forEach(r => roleMap.set(r.user_id, r.role));

        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, phone")
          .in("user_id", allIds);

        const { data: usersData } = await supabase.rpc("get_users_with_emails");

        const emailMap = new Map<string, string>();
        if (usersData) {
          (usersData as any[]).forEach(u => emailMap.set(u.user_id, u.email));
        }

        const emps: Employee[] = (profiles || []).map(p => ({
          user_id: p.user_id,
          email: emailMap.get(p.user_id) || "",
          full_name: p.full_name || "",
          phone: p.phone || "",
          role: roleMap.get(p.user_id) || "employee",
        }));
        setEmployees(emps);
      } else {
        setEmployees([]);
      }

      // Fetch all tasks
      const { data: taskData, error: taskError } = await supabase
        .from("employee_tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (taskError) throw taskError;
      setTasks((taskData || []) as Task[]);

      // Fetch region assignments
      const { data: regionData } = await supabase
        .from("lead_region_assignments")
        .select("*");
      setRegionAssignments((regionData || []) as RegionAssignment[]);

      // Fetch lead counts by biz_area
      const { data: leads } = await supabase
        .from("contact_messages")
        .select("biz_area");
      const counts: Record<string, number> = {};
      let total = 0;
      (leads || []).forEach((l: any) => {
        const area = l.biz_area || "Others";
        const matched = KNOWN_REGIONS.find(r => r.toLowerCase() === area.toLowerCase()) || "Others";
        counts[matched] = (counts[matched] || 0) + 1;
        total++;
      });
      counts["__total__"] = total;
      setRegionLeadCounts(counts);
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveRegionAssignment = async (biz_area: string, employeeId: string | null) => {
    setSavingRegion(true);
    try {
      if (!employeeId) {
        // Remove assignment
        await supabase.from("lead_region_assignments").delete().eq("biz_area", biz_area);
        setRegionAssignments(prev => prev.filter(r => r.biz_area !== biz_area));
      } else {
        // Upsert assignment
        const { data, error } = await supabase
          .from("lead_region_assignments")
          .upsert({ biz_area, employee_id: employeeId } as any, { onConflict: "biz_area" })
          .select()
          .single();
        if (error) throw error;
        setRegionAssignments(prev => {
          const filtered = prev.filter(r => r.biz_area !== biz_area);
          return [...filtered, data as RegionAssignment];
        });
      }
      toast({ title: "Region Assignment Updated" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setSavingRegion(false);
    }
  };

  const getRegionEmployee = (biz_area: string) => {
    const assignment = regionAssignments.find(r => r.biz_area === biz_area);
    return assignment?.employee_id || "";
  };

  const createEmployee = async () => {
    if (!newEmail || !newName || !newTempPassword || !newUsername) {
      toast({ title: "Error", description: "Fill in all required fields (including username)", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-employee", {
        body: { email: newEmail, full_name: newName, phone: newPhone, temp_password: newTempPassword, username: newUsername, role: newRole },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Admin Created", description: `${newName} can now log in with username "${newUsername}".` });
      setShowCreateDialog(false);
      setNewEmail("");
      setNewName("");
      setNewPhone("");
      setNewTempPassword("");
      setNewUsername("");
      setNewRole("employee");
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const deleteAdmin = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    try {
      const { data, error } = await supabase.rpc("admin_delete_user", { _target_user_id: userId });
      if (error) throw error;
      toast({ title: "Deleted", description: `${name} has been removed.` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
  };

  const resetPassword = async (email: string, name: string) => {
    if (!confirm(`Send a password reset email to ${name} (${email})?`)) return;
    try {
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: { email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Password Reset Sent", description: `Reset email sent to ${email}.` });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
  };

  const createTask = async () => {
    if (!taskTitle || !taskAssignee) {
      toast({ title: "Error", description: "Title and assignee are required", variant: "destructive" });
      return;
    }
    setCreatingTask(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("employee_tasks").insert({
        title: taskTitle,
        description: taskDesc || null,
        assigned_to: taskAssignee,
        assigned_by: user!.id,
        priority: taskPriority as any,
        due_date: taskDueDate || null,
      } as any);

      if (error) throw error;

      toast({ title: "Task Created" });
      setShowTaskDialog(false);
      setTaskTitle("");
      setTaskDesc("");
      setTaskAssignee("");
      setTaskPriority("medium");
      setTaskDueDate("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setCreatingTask(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      const { error } = await supabase.from("employee_tasks").delete().eq("id", taskId);
      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== taskId));
      toast({ title: "Task Deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
  };

  const getEmployeeName = (userId: string) => {
    const emp = employees.find(e => e.user_id === userId);
    return emp?.full_name || userId.slice(0, 8);
  };

  const priorityColors: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    urgent: "bg-destructive/10 text-destructive",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-primary">Admin & Task Management</h2>
          </div>
          <p className="text-sm text-muted-foreground">Create admin accounts and assign tasks</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1.5 bg-primary/5 border border-primary/10 rounded-xl">
        {[
          { key: "employees" as const, label: "Admins", count: employees.length },
          { key: "tasks" as const, label: "Tasks", count: tasks.length },
          { key: "regions" as const, label: "Lead Regions", count: regionAssignments.length },
        ].map(({ key, label, count }) => (
          <Button
            key={key}
            variant={tab === key ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-lg transition-all ${tab === key ? "shadow-md" : "text-muted-foreground"}`}
          >
            {label} ({count})
          </Button>
        ))}
      </div>

      {/* Employees Tab */}
      {tab === "employees" && (
        <div className="space-y-4">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Create Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Account</DialogTitle>
                <DialogDescription>Create a new admin or employee account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input placeholder="Full Name *" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <Input placeholder="Username *" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                <Input type="email" placeholder="Email *" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                <Input placeholder="Phone (optional)" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                <Input type="password" placeholder="Temporary Password * (min 8 chars)" value={newTempPassword} onChange={(e) => setNewTempPassword(e.target.value)} />
                <Select value={newRole} onValueChange={(v) => setNewRole(v as "employee" | "admin")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {newRole === "admin" ? "This user will have full admin access." : "Employee will log in with their username and must change password on first login."}
                </p>
                <Button onClick={createEmployee} disabled={creating} className="w-full">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Create Account
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Card>
            <CardContent className="pt-6">
              {employees.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No admins yet. Create one above.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => (
                      <TableRow key={emp.user_id}>
                        <TableCell className="font-medium">{emp.full_name}</TableCell>
                        <TableCell>{emp.email}</TableCell>
                        <TableCell>{emp.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={emp.role === "admin" ? "default" : "secondary"}>
                            {emp.role === "admin" ? "Super Admin" : "Employee"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {tasks.filter(t => t.assigned_to === emp.user_id).length} tasks
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" title="Reset Password" onClick={() => resetPassword(emp.email, emp.full_name)}>
                              <KeyRound className="w-4 h-4 text-primary" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Delete" onClick={() => deleteAdmin(emp.user_id, emp.full_name)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tasks Tab */}
      {tab === "tasks" && (
        <div className="space-y-4">
          <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={employees.length === 0}>
                <Plus className="w-4 h-4" />
                Assign New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Task to Admin</DialogTitle>
                <DialogDescription>Create and assign a task to an admin</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input placeholder="Task Title *" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                <Textarea placeholder="Description (optional)" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={3} />
                <Select value={taskAssignee} onValueChange={setTaskAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to admin *" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.user_id} value={emp.user_id}>
                        {emp.full_name} ({emp.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="pl-10" placeholder="Due date (optional)" />
                </div>
                <Button onClick={createTask} disabled={creatingTask} className="w-full">
                  {creatingTask ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Card>
            <CardContent className="pt-6">
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No tasks yet. Assign one above.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>{getEmployeeName(task.assigned_to)}</TableCell>
                        <TableCell>
                          <Badge className={priorityColors[task.priority] || ""}>{task.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                            {task.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lead Regions Tab */}
      {tab === "regions" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FolderTree className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Lead Regions</h3>
          </div>

          {/* Lead counts summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-base">Leads by Region</h4>
                <Badge variant="secondary" className="text-sm">Total: {regionLeadCounts["__total__"] || 0}</Badge>
              </div>
              <div className="space-y-2">
                {KNOWN_REGIONS.map((region) => {
                  const count = regionLeadCounts[region] || 0;
                  const total = regionLeadCounts["__total__"] || 1;
                  const pct = Math.round((count / total) * 100) || 0;
                  return (
                    <div key={region} className="flex items-center gap-3">
                      <span className="w-36 text-sm font-medium truncate">{region}</span>
                      <div className="flex-1 h-7 bg-muted rounded-lg overflow-hidden relative">
                        <div
                          className="h-full bg-primary/80 rounded-lg transition-all"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <Badge variant="outline" className="min-w-[40px] justify-center">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Region assignment table */}
          <div>
            <h4 className="font-semibold text-base mb-2">Auto-Route Leads by Region</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Assign each region to an admin. New leads from that region will be automatically assigned.
            </p>
            {employees.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Create admins first before setting up region assignments.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Region (BIZ Area)</TableHead>
                        <TableHead>Leads</TableHead>
                        <TableHead>Assigned Admin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {KNOWN_REGIONS.map((region) => (
                        <TableRow key={region}>
                          <TableCell className="font-medium">{region}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{regionLeadCounts[region] || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={getRegionEmployee(region) || "__none__"}
                              onValueChange={(v) => saveRegionAssignment(region, v === "__none__" ? null : v)}
                              disabled={savingRegion}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Unassigned" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Unassigned</SelectItem>
                                {employees.map((emp) => (
                                  <SelectItem key={emp.user_id} value={emp.user_id}>
                                    {emp.full_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;
