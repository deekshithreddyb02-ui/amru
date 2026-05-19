import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import {
  Loader2, Users, Mail, Trash2, Eye, EyeOff, Search, Settings, RefreshCw, UserCheck, UserX,
  BarChart3, ShieldCheck, Trash, CheckCircle2, XCircle, MailCheck, UserCog, KeyRound, ClipboardList,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import LeadsManager from "@/components/admin/LeadsManager";
import SettingsModule from "@/components/admin/SettingsModule";
import EmployeeManager from "@/components/admin/EmployeeManager";

type VerificationStatus = "pending" | "approved" | "rejected";

interface User {
  id: string; email: string; created_at: string; role: string;
  full_name: string; phone: string; last_sign_in_at: string | null;
  is_banned: boolean; is_approved: boolean;
  verification_status: VerificationStatus;
  verification_note: string | null;
  verified_at: string | null;
}

const CrmAdminCenter = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [userTab, setUserTab] = useState("active");
  const [userMgmtTab, setUserMgmtTab] = useState("users");
  const [verificationMode, setVerificationMode] = useState("admin_approval");
  const [savingVerification, setSavingVerification] = useState(false);
  const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());
  const [resetCooldowns, setResetCooldowns] = useState<Record<string, number>>({});

  const maskEmail = (email: string) => {
    const [local, domain] = email.split("@");
    if (!domain) return "****";
    return local.slice(0, 2) + "****@" + domain;
  };
  const maskPhone = (phone: string) => {
    if (!phone || phone === "-") return "-";
    if (phone.length <= 4) return "****";
    return phone.slice(0, 2) + "****" + phone.slice(-2);
  };
  const toggleReveal = (id: string, field: string) => {
    const key = `${id}-${field}`;
    setRevealedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };
  const isRevealed = (id: string, field: string) => revealedFields.has(`${id}-${field}`);

  useEffect(() => {
    if (!roleLoading && !isAdmin) navigate("/admin-login");
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const rolesRes = await supabase.from("user_roles").select("user_id, role, created_at");
      const usersRes = await supabase.rpc("get_users_with_emails");
      const profilesRes = await supabase.from("profiles").select("*");

      if (rolesRes.error) throw rolesRes.error;

      const emailMap = new Map();
      if (!usersRes.error && usersRes.data) {
        (usersRes.data as any[]).forEach((u) =>
          emailMap.set(u.user_id, { email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at, is_banned: u.is_banned })
        );
      }
      const profileMap = new Map();
      if (!profilesRes.error && profilesRes.data) {
        (profilesRes.data as any[]).forEach((p) =>
          profileMap.set(p.user_id, { full_name: p.full_name || "", phone: p.phone || "", is_approved: p.is_approved !== false })
        );
      }

      const userRoleMap = new Map<string, string>();
      (rolesRes.data || []).forEach((r) => {
        const existing = userRoleMap.get(r.user_id);
        if (!existing || r.role === "admin") userRoleMap.set(r.user_id, r.role as string);
      });

      const usersWithRoles: User[] = Array.from(userRoleMap.entries()).map(([userId, role]) => {
        const firstRole = (rolesRes.data || []).find((r) => r.user_id === userId);
        return {
          id: userId,
          email: emailMap.get(userId)?.email || userId,
          created_at: emailMap.get(userId)?.created_at || firstRole?.created_at || "",
          role,
          full_name: profileMap.get(userId)?.full_name || "",
          phone: profileMap.get(userId)?.phone || "",
          last_sign_in_at: emailMap.get(userId)?.last_sign_in_at || null,
          is_banned: emailMap.get(userId)?.is_banned || false,
          is_approved: profileMap.get(userId)?.is_approved !== false,
        };
      });
      setUsers(usersWithRoles);

      const { data: settingsData } = await (supabase as any).from("site_settings").select("*").eq("key", "verification_mode").maybeSingle();
      if (settingsData?.value) {
        const val = typeof settingsData.value === "string" ? settingsData.value.replace(/"/g, "") : String(settingsData.value);
        setVerificationMode(val);
      }

      const { data: deletedData } = await (supabase as any).from("deleted_users").select("*").order("deleted_at", { ascending: false });
      setDeletedUsers(deletedData || []);
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  };

  const makeAdmin = async (userId: string) => {
    try {
      const { error } = await supabase.rpc("admin_update_user_role", { _target_user_id: userId, _new_role: "admin" });
      if (error) throw error;
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: "admin" } : u)));
      toast({ title: "Success", description: "User promoted to admin" });
    } catch (error: any) { toast({ title: "Error", description: sanitizeError(error), variant: "destructive" }); }
  };
  const removeAdmin = async (userId: string) => {
    try {
      const { error } = await supabase.rpc("admin_update_user_role", { _target_user_id: userId, _new_role: "user" });
      if (error) throw error;
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: "user" } : u)));
      toast({ title: "Success", description: "Admin privileges removed" });
    } catch (error: any) { toast({ title: "Error", description: sanitizeError(error), variant: "destructive" }); }
  };
  const saveVerificationMode = async () => {
    setSavingVerification(true);
    try {
      const { error } = await (supabase as any).from("site_settings")
        .update({ value: JSON.stringify(verificationMode), updated_at: new Date().toISOString() })
        .eq("key", "verification_mode");
      if (error) throw error;
      toast({ title: "Success", description: "Verification settings saved" });
    } catch (error: any) { toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally { setSavingVerification(false); }
  };
  const approveUser = async (userId: string) => {
    try {
      const { error } = await (supabase as any).from("profiles").update({ is_approved: true }).eq("user_id", userId);
      if (error) throw error;
      setUsers(users.map((u) => (u.id === userId ? { ...u, is_approved: true } : u)));
      toast({ title: "Success", description: "User approved" });
    } catch (error: any) { toast({ title: "Error", description: sanitizeError(error), variant: "destructive" }); }
  };
  const rejectUser = async (userId: string) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (user) {
        await (supabase as any).from("deleted_users").insert({
          original_user_id: userId, email: user.email, full_name: user.full_name, phone: user.phone, role: user.role,
        });
      }
      const { error } = await supabase.rpc("admin_delete_user", { _target_user_id: userId });
      if (error) throw error;
      setUsers(users.filter((u) => u.id !== userId));
      toast({ title: "Success", description: "User rejected and removed" });
      fetchData();
    } catch (error: any) { toast({ title: "Error", description: sanitizeError(error), variant: "destructive" }); }
  };
  const resetUserPassword = async (userId: string) => {
    const now = Date.now();
    if (resetCooldowns[userId] && now - resetCooldowns[userId] < 60000) {
      const remaining = Math.ceil((60000 - (now - resetCooldowns[userId])) / 1000);
      toast({ title: "Please wait", description: `You can reset this password again in ${remaining}s`, variant: "destructive" });
      return;
    }
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) throw new Error("User not found");
      const { data, error } = await supabase.functions.invoke("admin-reset-password", { body: { email: user.email } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResetCooldowns((prev) => ({ ...prev, [userId]: Date.now() }));
      toast({ title: "Success", description: `Password reset email sent to ${user.email}` });
    } catch (error: any) { toast({ title: "Error", description: sanitizeError(error), variant: "destructive" }); }
  };
  const deleteUser = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    if (!confirm(`Delete user "${user.full_name || user.email}"? They will be moved to the Recycle Bin.`)) return;
    try {
      const { error: insertError } = await supabase.from("deleted_users").insert({
        original_user_id: userId, email: user.email, full_name: user.full_name || "", phone: user.phone || "", role: user.role,
        deleted_by: (await supabase.auth.getUser()).data.user?.id || null,
      });
      if (insertError) {
        toast({ title: "Error", description: "Failed to move user to recycle bin", variant: "destructive" });
        return;
      }
      const { error } = await supabase.rpc("admin_delete_user", { _target_user_id: userId });
      if (error) throw error;
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast({ title: "Success", description: "User deleted" });
      fetchData();
    } catch (error: any) { toast({ title: "Error", description: sanitizeError(error), variant: "destructive" }); }
  };
  const permanentlyDeleteUser = async (id: string) => {
    try {
      const { error } = await (supabase as any).from("deleted_users").delete().eq("id", id);
      if (error) throw error;
      setDeletedUsers(deletedUsers.filter((u) => u.id !== id));
      toast({ title: "Success", description: "Permanently deleted" });
    } catch (error: any) { toast({ title: "Error", description: sanitizeError(error), variant: "destructive" }); }
  };

  if (roleLoading || loadingData) {
    return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold">Admin Center</h1>
      </div>

      <Tabs defaultValue="leads">
        <TabsList className="w-full h-auto p-1.5 bg-primary/5 border border-primary/10 rounded-xl flex justify-center gap-1">
          <TabsTrigger value="leads" className="flex-1 gap-2 py-2.5"><Mail className="w-4 h-4" /> Leads</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="users" className="flex-1 gap-2 py-2.5"><Users className="w-4 h-4" /> Users</TabsTrigger>}
          <TabsTrigger value="analytics" className="flex-1 gap-2 py-2.5"><BarChart3 className="w-4 h-4" /> Analytics</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="employees" className="flex-1 gap-2 py-2.5"><ClipboardList className="w-4 h-4" /> Admins</TabsTrigger>}
          {isSuperAdmin && <TabsTrigger value="modify" className="flex-1 gap-2 py-2.5"><Settings className="w-4 h-4" /> Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="leads" className="mt-4"><LeadsManager onRefresh={fetchData} /></TabsContent>
        <TabsContent value="modify" className="mt-4"><SettingsModule /></TabsContent>
        <TabsContent value="employees" className="mt-4"><EmployeeManager /></TabsContent>
        <TabsContent value="analytics" className="mt-4"><AnalyticsDashboard /></TabsContent>

        <TabsContent value="users" className="mt-4">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold text-primary">Users Management</h2>
                </div>
                <p className="text-sm text-muted-foreground">Manage users, approvals, and recycle bin</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh
              </Button>
            </div>

            <div className="flex flex-wrap gap-1 p-1.5 bg-primary/5 border border-primary/10 rounded-xl">
              {[
                { key: "users", label: "Users", icon: Users },
                { key: "verification", label: "Verification", icon: CheckCircle2 },
                { key: "recycle", label: "Recycle Bin", icon: Trash },
              ].map(({ key, label, icon: Icon }) => (
                <Button key={key} variant={userMgmtTab === key ? "default" : "ghost"} size="sm"
                  onClick={() => setUserMgmtTab(key)} className="flex-1 gap-2 py-2.5">
                  <Icon className="w-4 h-4" /> {label}
                </Button>
              ))}
            </div>

            {userMgmtTab === "users" && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" placeholder="Search users..." value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-input bg-background" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 p-1.5 bg-muted/50 border border-border rounded-xl">
                  {[
                    { key: "active", label: "Active", icon: UserCheck, count: users.filter((u) => !u.is_banned).length },
                    { key: "inactive", label: "Inactive", icon: UserX, count: users.filter((u) => u.is_banned).length },
                    { key: "all", label: "All", icon: Users, count: users.length },
                    { key: "admins", label: "Admins", icon: ShieldCheck, count: users.filter((u) => u.role === "admin").length },
                  ].map(({ key, label, icon: Icon, count }) => (
                    <Button key={key} variant={userTab === key ? "default" : "ghost"} size="sm"
                      onClick={() => setUserTab(key)} className="flex-1 gap-2 py-2.5">
                      <Icon className="w-4 h-4" /> {label} ({count})
                    </Button>
                  ))}
                </div>

                <Card><CardContent className="pt-6">
                  {users.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No users yet</p>
                  ) : (
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
                        <TableHead>Last Login</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {users
                          .filter((u) => {
                            if (userTab === "active") return !u.is_banned;
                            if (userTab === "inactive") return u.is_banned;
                            if (userTab === "admins") return u.role === "admin";
                            return true;
                          })
                          .filter((u) => {
                            if (!userSearch) return true;
                            const q = userSearch.toLowerCase();
                            return u.email.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q);
                          })
                          .map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.full_name || "-"}</TableCell>
                              <TableCell className="text-sm">
                                <span className="inline-flex items-center gap-1">
                                  {isRevealed(user.id, "email") ? user.email : maskEmail(user.email)}
                                  <button onClick={() => toggleReveal(user.id, "email")}>
                                    {isRevealed(user.id, "email") ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </span>
                              </TableCell>
                              <TableCell className="text-sm">
                                {isRevealed(user.id, "phone") ? (user.phone || "-") : maskPhone(user.phone || "-")}
                              </TableCell>
                              <TableCell className="text-sm">
                                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "Never"}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                                  {user.is_banned && <Badge variant="destructive" className="text-xs">Banned</Badge>}
                                  {!user.is_approved && <Badge variant="outline" className="text-xs">Pending</Badge>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select onValueChange={(action) => {
                                  if (action === "make_admin") makeAdmin(user.id);
                                  else if (action === "remove_admin") removeAdmin(user.id);
                                  else if (action === "activate") approveUser(user.id);
                                  else if (action === "deactivate") rejectUser(user.id);
                                  else if (action === "reset_password") resetUserPassword(user.id);
                                  else if (action === "delete") deleteUser(user.id);
                                }}>
                                  <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Actions" /></SelectTrigger>
                                  <SelectContent>
                                    {!user.is_approved && <SelectItem value="activate" className="text-xs">Activate</SelectItem>}
                                    {user.is_approved && user.role !== "admin" && <SelectItem value="deactivate" className="text-xs">Deactivate</SelectItem>}
                                    {user.role !== "admin"
                                      ? <SelectItem value="make_admin" className="text-xs">Make Admin</SelectItem>
                                      : <SelectItem value="remove_admin" className="text-xs">Remove Admin</SelectItem>}
                                    <SelectItem value="reset_password" className="text-xs">Reset Password</SelectItem>
                                    {user.role !== "admin" && <SelectItem value="delete" className="text-xs text-destructive">Delete</SelectItem>}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent></Card>
              </div>
            )}

            {userMgmtTab === "verification" && (
              <Card><CardContent className="pt-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Signup Verification</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Control how new signups are verified.</p>
                </div>
                {[
                  { key: "email_only", label: "Email Verification Only", desc: "Standard email verification.", icon: MailCheck },
                  { key: "admin_approval", label: "Admin Approval Only", desc: "Requires admin approval to access.", icon: UserCog },
                  { key: "email_and_approval", label: "Email + Admin Approval", desc: "Email verification AND admin approval.", icon: ShieldCheck },
                ].map(({ key, label, desc, icon: Icon }) => (
                  <div key={key} onClick={() => setVerificationMode(key)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      verificationMode === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${verificationMode === key ? "bg-primary/10" : "bg-muted"}`}>
                        <Icon className={`w-5 h-5 ${verificationMode === key ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{label}</span>
                          {verificationMode === key && <Badge className="text-xs">Active</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <Button onClick={saveVerificationMode} disabled={savingVerification} className="w-full gap-2">
                  {savingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Save Verification Settings
                </Button>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Pending Approval</h3>
                  {(() => {
                    const pending = users.filter((u) => !u.is_approved && u.role !== "admin");
                    if (pending.length === 0) return <p className="text-center text-muted-foreground py-4">No pending approvals</p>;
                    return (
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Actions</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {pending.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>{user.full_name || "-"}</TableCell>
                              <TableCell>{maskEmail(user.email)}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => approveUser(user.id)} className="gap-1"><CheckCircle2 className="w-3 h-3" /> Approve</Button>
                                  <Button size="sm" variant="destructive" onClick={() => rejectUser(user.id)} className="gap-1"><XCircle className="w-3 h-3" /> Reject</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    );
                  })()}
                </div>
              </CardContent></Card>
            )}

            {userMgmtTab === "recycle" && (
              <Card><CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Trash className="w-5 h-5" /> Deleted Users</h3>
                  <Button variant="outline" size="sm" onClick={fetchData} className="gap-2"><RefreshCw className="w-4 h-4" /> Refresh</Button>
                </div>
                {deletedUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Recycle bin is empty</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead>
                      <TableHead>Deleted At</TableHead><TableHead>Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {deletedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.full_name || "-"}</TableCell>
                          <TableCell>{maskEmail(user.email)}</TableCell>
                          <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                          <TableCell>{new Date(user.deleted_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="destructive" onClick={() => permanentlyDeleteUser(user.id)} className="gap-1">
                              <Trash2 className="w-3 h-3" /> Delete Permanently
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent></Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CrmAdminCenter;
