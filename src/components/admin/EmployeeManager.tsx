import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { Loader2, UserPlus, ClipboardList, RefreshCw, Trash2, FolderTree, KeyRound, Pencil } from "lucide-react";

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

const ALL_INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh", "Puducherry",
  "Andaman and Nicobar Islands", "Dadra and Nagar Haveli", "Daman and Diu", "Lakshadweep",
  "Others"
];

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

  // Edit employee
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["employee", "admin"]);

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



      const { data: regionData } = await supabase
        .from("lead_region_assignments")
        .select("*");
      setRegionAssignments((regionData || []) as RegionAssignment[]);

      // Fetch lead counts by biz_area
      const { data: leads } = await supabase
        .from("contact_messages")
        .select("biz_area, country");
      const counts: Record<string, number> = {};
      let total = 0;
      let indiaCount = 0;
      let otherCountryCount = 0;
      (leads || []).forEach((l: any) => {
        const area = l.biz_area || "Others";
        const country = (l.country || "").trim().toLowerCase();
        const knownIndianAreas = ALL_INDIAN_STATES.map(s => s.toLowerCase());
        const isIndia = !country || country === "india" || knownIndianAreas.includes(area.toLowerCase());
        
        if (isIndia) indiaCount++;
        else otherCountryCount++;

        const matched = ALL_INDIAN_STATES.find(r => r.toLowerCase() === area.toLowerCase()) || "Others";
        counts[matched] = (counts[matched] || 0) + 1;
        total++;
      });
      counts["__total__"] = total;
      counts["__india__"] = indiaCount;
      counts["__other_countries__"] = otherCountryCount;
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
        await supabase.from("lead_region_assignments").delete().eq("biz_area", biz_area);
        setRegionAssignments(prev => prev.filter(r => r.biz_area !== biz_area));
      } else {
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

      toast({ title: "Account Created", description: `${newName} can now log in with username "${newUsername}".` });
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

  const openEditDialog = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditName(emp.full_name);
    setEditPhone(emp.phone);
    setShowEditDialog(true);
  };

  const saveEditEmployee = async () => {
    if (!editingEmployee || !editName.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: editName.trim(), phone: editPhone.trim() })
        .eq("user_id", editingEmployee.user_id);
      if (error) throw error;
      toast({ title: "Updated", description: `${editName} details saved.` });
      setShowEditDialog(false);
      setEditingEmployee(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setSavingEdit(false);
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



  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get states that have leads (for region display)
  const statesWithLeads = ALL_INDIAN_STATES.filter(s => (regionLeadCounts[s] || 0) > 0 || regionAssignments.some(r => r.biz_area === s));
  const allRegionsToShow = [...new Set([...statesWithLeads, ...ALL_INDIAN_STATES.filter(s => regionAssignments.some(r => r.biz_area === s))])];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-primary">Admin Management</h2>
          </div>
          <p className="text-sm text-muted-foreground">Create admin accounts and manage lead regions</p>
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
                <DialogDescription>Create a new admin account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input placeholder="Full Name *" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <div>
                  <Input placeholder="Username *" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                  {newUsername.trim() && (
                    <p className="text-xs mt-1 text-amber-600">
                      ⚠️ Make sure this username is unique.
                    </p>
                  )}
                </div>
                <Input type="email" placeholder="Email *" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                <Input placeholder="Phone (optional)" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                <Input type="password" placeholder="Temporary Password * (min 8 chars)" value={newTempPassword} onChange={(e) => setNewTempPassword(e.target.value)} />
                <Select value={newRole} onValueChange={(v) => setNewRole(v as "employee" | "admin")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Admin</SelectItem>
                    <SelectItem value="admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {newRole === "admin" ? "This user will have full super admin access." : "Admin will log in with their username and must change password on first login."}
                </p>
                <Button onClick={createEmployee} disabled={creating} className="w-full">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Create Account
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Admin Details</DialogTitle>
                <DialogDescription>Update name and phone for {editingEmployee?.full_name}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email (read-only)</label>
                  <Input value={editingEmployee?.email || ""} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="mt-1" />
                </div>
                <Button onClick={saveEditEmployee} disabled={savingEdit} className="w-full">
                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}
                  Save Changes
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
                            {emp.role === "admin" ? "Super Admin" : "Admin"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" title="Edit Details" onClick={() => openEditDialog(emp)}>
                              <Pencil className="w-4 h-4 text-primary" />
                            </Button>
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



      {/* Lead Regions Tab */}
      {tab === "regions" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FolderTree className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Lead Regions</h3>
          </div>

          {/* Summary counts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-primary">{regionLeadCounts["__total__"] || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">All Leads</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-green-600">{regionLeadCounts["__india__"] || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">🇮🇳 India</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{regionLeadCounts["__other_countries__"] || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">🌍 Other Countries</p>
              </CardContent>
            </Card>
          </div>

          {/* Lead counts by state */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-base">Leads by State / Region</h4>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {ALL_INDIAN_STATES.filter(s => (regionLeadCounts[s] || 0) > 0).map((region) => {
                  const count = regionLeadCounts[region] || 0;
                  const total = regionLeadCounts["__total__"] || 1;
                  const pct = Math.round((count / total) * 100) || 0;
                  return (
                    <div key={region} className="flex items-center gap-3">
                      <span className="w-44 text-sm font-medium truncate">{region}</span>
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
                {ALL_INDIAN_STATES.filter(s => (regionLeadCounts[s] || 0) > 0).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No leads by region yet.</p>
                )}
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
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Region / State</TableHead>
                          <TableHead>Leads</TableHead>
                          <TableHead>Assigned Admin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ALL_INDIAN_STATES.map((region) => (
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
                  </div>
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
