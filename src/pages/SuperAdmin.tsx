import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { Loader2, Users, Mail, Trash2, Eye, EyeOff, Search, Settings, RefreshCw, UserCheck, UserX, BarChart3, ShieldCheck, Trash, CheckCircle2, XCircle, MailCheck, UserCog, KeyRound, ClipboardList } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";

import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import LeadsManager from "@/components/admin/LeadsManager";
import SettingsModule from "@/components/admin/SettingsModule";
import AdminHeader from "@/components/admin/AdminHeader";
import EmployeeManager from "@/components/admin/EmployeeManager";
import RegionAssignmentManager from "@/components/admin/RegionAssignmentManager";

interface User {
  id: string;
  email: string;
  created_at: string;
  role: string;
  full_name: string;
  phone: string;
  last_sign_in_at: string | null;
  is_banned: boolean;
  is_approved: boolean;
}

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, loading: adminLoading } = useUserRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [userTab, setUserTab] = useState("active");
  const [messageTab, setMessageTab] = useState("all");
  const [messageSearch, setMessageSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [userMgmtTab, setUserMgmtTab] = useState("users");
  const [verificationMode, setVerificationMode] = useState("admin_approval");
  const [savingVerification, setSavingVerification] = useState(false);
  const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());

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
    setRevealedFields(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const isRevealed = (id: string, field: string) => revealedFields.has(`${id}-${field}`);

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      navigate("/admin-login");
      return;
    }
    // Regular admins are not allowed on the Super Admin dashboard
    if (!isSuperAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [isAdmin, isSuperAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const rolesRes = await supabase.from('user_roles').select('user_id, role, created_at');
      const usersRes = await supabase.rpc('get_users_with_emails');
      const messagesRes = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
      const profilesRes = await supabase.from('profiles').select('*');

      if (rolesRes.error) throw rolesRes.error;

      const emailMap = new Map();
      if (!usersRes.error && usersRes.data) {
        (usersRes.data as any[]).forEach((u) => emailMap.set(u.user_id, { email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at, is_banned: u.is_banned }));
      }

      const profileMap = new Map();
      if (!profilesRes.error && profilesRes.data) {
        (profilesRes.data as any[]).forEach((p) => profileMap.set(p.user_id, { full_name: p.full_name || '', phone: p.phone || '', is_approved: p.is_approved !== false }));
      }

      // Deduplicate users by user_id, keeping highest role (admin > user)
      const userRoleMap = new Map<string, string>();
      (rolesRes.data || []).forEach((r) => {
        const existing = userRoleMap.get(r.user_id);
        if (!existing || r.role === 'admin') {
          userRoleMap.set(r.user_id, r.role as string);
        }
      });

      const usersWithRoles: User[] = Array.from(userRoleMap.entries()).map(([userId, role]) => {
        const firstRole = (rolesRes.data || []).find(r => r.user_id === userId);
        return {
          id: userId,
          email: emailMap.get(userId)?.email || userId,
          created_at: emailMap.get(userId)?.created_at || firstRole?.created_at || '',
          role,
          full_name: profileMap.get(userId)?.full_name || '',
          phone: profileMap.get(userId)?.phone || '',
          last_sign_in_at: emailMap.get(userId)?.last_sign_in_at || null,
          is_banned: emailMap.get(userId)?.is_banned || false,
          is_approved: profileMap.get(userId)?.is_approved !== false,
        };
      });

      setUsers(usersWithRoles);

      if (messagesRes.error) throw messagesRes.error;
      setMessages(messagesRes.data || []);

      // Fetch verification settings
      const { data: settingsData } = await (supabase as any)
        .from('site_settings')
        .select('*')
        .eq('key', 'verification_mode')
        .maybeSingle();
      if (settingsData?.value) {
        const val = typeof settingsData.value === 'string' ? settingsData.value.replace(/"/g, '') : String(settingsData.value);
        setVerificationMode(val);
      }

      // Fetch deleted users
      const { data: deletedData } = await (supabase as any)
        .from('deleted_users')
        .select('*')
        .order('deleted_at', { ascending: false });
      setDeletedUsers(deletedData || []);
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const toggleMessageRead = async (id: string, isRead: boolean) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: !isRead })
        .eq('id', id);

      if (error) throw error;
      
      setMessages(messages.map(m => 
        m.id === id ? { ...m, is_read: !isRead } : m
      ));
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMessages(messages.filter(m => m.id !== id));
      toast({ title: "Success", description: "Message deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
  };

  const makeAdmin = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('admin_update_user_role', {
        _target_user_id: userId,
        _new_role: 'admin'
      });

      if (error) throw error;
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: 'admin' } : u
      ));
      toast({ title: "Success", description: "User promoted to admin" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
  };

  const removeAdmin = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('admin_update_user_role', {
        _target_user_id: userId,
        _new_role: 'user'
      });

      if (error) throw error;
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: 'user' } : u
      ));
      toast({ title: "Success", description: "Admin privileges removed" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
  };

  const saveVerificationMode = async () => {
    setSavingVerification(true);
    try {
      const { error } = await (supabase as any)
        .from('site_settings')
        .update({ value: JSON.stringify(verificationMode), updated_at: new Date().toISOString() })
        .eq('key', 'verification_mode');
      if (error) throw error;
      toast({ title: "Success", description: "Verification settings saved" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setSavingVerification(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      const { error } = await (supabase as any).from('profiles').update({ is_approved: true }).eq('user_id', userId);
      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, is_approved: true } : u));
      toast({ title: "Success", description: "User approved" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (user) {
        await (supabase as any).from('deleted_users').insert({ original_user_id: userId, email: user.email, full_name: user.full_name, phone: user.phone, role: user.role });
      }
      const { error } = await supabase.rpc('admin_delete_user', { _target_user_id: userId });
      if (error) throw error;
      setUsers(users.filter(u => u.id !== userId));
      toast({ title: "Success", description: "User rejected and removed" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
  };

  const [resetCooldowns, setResetCooldowns] = useState<Record<string, number>>({});

  const resetUserPassword = async (userId: string) => {
    const now = Date.now();
    if (resetCooldowns[userId] && now - resetCooldowns[userId] < 60000) {
      const remaining = Math.ceil((60000 - (now - resetCooldowns[userId])) / 1000);
      toast({ title: "Please wait", description: `You can reset this password again in ${remaining}s`, variant: "destructive" });
      return;
    }
    try {
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error("User not found");
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { email: user.email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResetCooldowns(prev => ({ ...prev, [userId]: Date.now() }));
      toast({ title: "Success", description: `Password reset email sent to ${user.email}` });
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
  };

  const deleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      toast({ title: "Error", description: "User not found", variant: "destructive" });
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${user.full_name || user.email}"? They will be moved to the Recycle Bin.`)) {
      return;
    }

    try {
      // First, insert into recycle bin
      const { error: insertError } = await supabase
        .from('deleted_users')
        .insert({
          original_user_id: userId,
          email: user.email,
          full_name: user.full_name || '',
          phone: user.phone || '',
          role: user.role,
          deleted_by: (await supabase.auth.getUser()).data.user?.id || null,
        });

      if (insertError) {
        console.error('Insert to recycle bin error:', insertError);
        toast({ title: "Error", description: "Failed to move user to recycle bin: " + sanitizeError(insertError), variant: "destructive" });
        return;
      }

      // Then delete the user from auth
      const { error } = await supabase.rpc('admin_delete_user', { _target_user_id: userId });
      if (error) throw error;

      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({ title: "Success", description: "User deleted and moved to recycle bin" });
      fetchData();
    } catch (error: any) {
      console.error('Delete user error:', error);
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
  };

  const permanentlyDeleteUser = async (id: string) => {
    try {
      const { error } = await (supabase as any).from('deleted_users').delete().eq('id', id);
      if (error) throw error;
      setDeletedUsers(deletedUsers.filter(u => u.id !== id));
      toast({ title: "Success", description: "Permanently deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
  };


  if (adminLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="leads">
        <AdminHeader subtitle="Super Admin Dashboard" />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <TabsList className="w-full h-auto p-1.5 bg-primary/5 border border-primary/10 rounded-xl flex justify-center gap-1">
              <TabsTrigger value="leads" className="flex-1 gap-1 md:gap-2 py-2.5 md:py-3 px-2 md:px-6 rounded-lg text-xs md:text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all min-w-0">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate">Leads</span>
              </TabsTrigger>
              <TabsTrigger value="employees" className="flex-1 gap-1 md:gap-2 py-2.5 md:py-3 px-2 md:px-6 rounded-lg text-xs md:text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all min-w-0">
                <ClipboardList className="w-4 h-4 shrink-0" />
                <span className="truncate">Admins</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 gap-1 md:gap-2 py-2.5 md:py-3 px-2 md:px-6 rounded-lg text-xs md:text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all min-w-0">
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className="truncate">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="modify" className="flex-1 gap-1 md:gap-2 py-2.5 md:py-3 px-2 md:px-6 rounded-lg text-xs md:text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all min-w-0">
                <Settings className="w-4 h-4 shrink-0" />
                <span className="truncate">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

            <TabsContent value="leads">
              <LeadsManager onRefresh={fetchData} />
            </TabsContent>

            <TabsContent value="modify">
              <SettingsModule />
            </TabsContent>

            <TabsContent value="employees">
              <div className="space-y-8">
                <RegionAssignmentManager />
                <EmployeeManager />
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-6 h-6 text-primary" />
                      <h2 className="text-2xl font-bold text-primary">Users Management</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">Comprehensive user management with advanced analytics and control features</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh Database
                  </Button>
                </div>

                {/* Top-level sub-tabs: Users / Verification / Recycle Bin */}
                <div className="flex flex-wrap gap-1 p-1.5 bg-primary/5 border border-primary/10 rounded-xl">
                  {[
                    { key: "users", label: "Users", icon: Users },
                    { key: "verification", label: "Verification", icon: CheckCircle2 },
                    { key: "recycle", label: "Recycle Bin", icon: Trash },
                  ].map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      variant={userMgmtTab === key ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setUserMgmtTab(key)}
                      className={`flex-1 gap-2 py-2.5 rounded-lg transition-all ${userMgmtTab === key ? "shadow-md" : "text-muted-foreground"}`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Button>
                  ))}
                </div>

                {/* ===== USERS SUB-TAB ===== */}
                {userMgmtTab === "users" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search users by name, email, phone..."
                          value={userSearch}
                          onChange={e => setUserSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="text-foreground">{users.filter(u => !u.is_banned).length} active</span>
                        <span className="text-muted-foreground">{users.filter(u => u.is_banned).length} inactive</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 p-1.5 bg-muted/50 border border-border rounded-xl">
                      {[
                        { key: "active", label: "Active", icon: UserCheck, count: users.filter(u => !u.is_banned).length },
                        { key: "inactive", label: "Inactive", icon: UserX, count: users.filter(u => u.is_banned).length },
                        { key: "all", label: "All Users", icon: Users, count: users.length },
                        { key: "admins", label: "Admins", icon: ShieldCheck, count: users.filter(u => u.role === 'admin').length },
                      ].map(({ key, label, icon: Icon, count }) => (
                        <Button
                          key={key}
                          variant={userTab === key ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setUserTab(key)}
                          className={`flex-1 gap-2 py-2.5 rounded-lg transition-all ${userTab === key ? "shadow-md" : "text-muted-foreground"}`}
                        >
                          <Icon className="w-4 h-4" />
                          {label} ({count})
                        </Button>
                      ))}
                    </div>

                    <Card>
                      <CardContent className="pt-6">
                        {users.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">No users yet</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>User ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {users
                                .filter(u => {
                                  if (userTab === "active") return !u.is_banned;
                                  if (userTab === "inactive") return u.is_banned;
                                  if (userTab === "admins") return u.role === "admin";
                                  return true;
                                })
                                .filter(u => {
                                  if (!userSearch) return true;
                                  const q = userSearch.toLowerCase();
                                  return u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q);
                                })
                                .map((user) => (
                                <TableRow key={user.id}>
                                  <TableCell className="font-mono text-xs">{user.id.slice(0, 8)}...</TableCell>
                                  <TableCell className="font-medium">{user.full_name || "-"}</TableCell>
                                  <TableCell className="text-sm">
                                    <span className="inline-flex items-center gap-1">
                                      {isRevealed(user.id, "email") ? user.email : maskEmail(user.email)}
                                      <button onClick={() => toggleReveal(user.id, "email")} className="text-muted-foreground hover:text-foreground">
                                        {isRevealed(user.id, "email") ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                      </button>
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    <span className="inline-flex items-center gap-1">
                                      {isRevealed(user.id, "phone") ? (user.phone || "-") : maskPhone(user.phone || "-")}
                                      {user.phone && (
                                        <button onClick={() => toggleReveal(user.id, "phone")} className="text-muted-foreground hover:text-foreground">
                                          {isRevealed(user.id, "phone") ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                      )}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {user.last_sign_in_at
                                      ? new Date(user.last_sign_in_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                                      : "Never"}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1">
                                      <Badge variant={user.role === 'admin' ? "default" : "secondary"}>{user.role}</Badge>
                                      {user.is_banned && <Badge variant="destructive" className="text-xs">Banned</Badge>}
                                      {!user.is_approved && <Badge variant="outline" className="text-xs text-warning border-warning/30">Pending</Badge>}
                                    </div>
                                  </TableCell>
                                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    <Select onValueChange={(action) => {
                                      if (action === "make_admin") makeAdmin(user.id);
                                      else if (action === "remove_admin") removeAdmin(user.id);
                                      else if (action === "activate") approveUser(user.id);
                                      else if (action === "deactivate") rejectUser(user.id);
                                      else if (action === "reset_password") resetUserPassword(user.id);
                                      else if (action === "delete") deleteUser(user.id);
                                    }}>
                                      <SelectTrigger className="w-[160px] h-8 text-xs">
                                        <SelectValue placeholder="Actions" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <div className="px-2 py-1.5 text-xs font-semibold text-foreground">User Actions</div>
                                        {!user.is_approved && (
                                          <SelectItem value="activate" className="text-xs">
                                            <span className="flex items-center gap-2"><UserCheck className="w-3.5 h-3.5 text-primary" /> Activate User</span>
                                          </SelectItem>
                                        )}
                                        {user.is_approved && user.role !== 'admin' && (
                                          <SelectItem value="deactivate" className="text-xs">
                                            <span className="flex items-center gap-2"><UserX className="w-3.5 h-3.5 text-muted-foreground" /> Deactivate User</span>
                                          </SelectItem>
                                        )}
                                        {user.role !== 'admin' ? (
                                          <SelectItem value="make_admin" className="text-xs">
                                            <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" /> Make Admin</span>
                                          </SelectItem>
                                        ) : (
                                          <SelectItem value="remove_admin" className="text-xs">
                                            <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" /> Remove Admin</span>
                                          </SelectItem>
                                        )}
                                        <div className="px-2 py-1.5 text-xs font-semibold text-foreground border-t border-border mt-1 pt-1.5">Security Actions</div>
                                        <SelectItem value="reset_password" className="text-xs">
                                          <span className="flex items-center gap-2"><KeyRound className="w-3.5 h-3.5 text-muted-foreground" /> Reset Password</span>
                                        </SelectItem>
                                        {user.role !== 'admin' && (
                                          <SelectItem value="delete" className="text-xs text-destructive">
                                            <span className="flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Delete User</span>
                                          </SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
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

                {/* ===== VERIFICATION SUB-TAB ===== */}
                {userMgmtTab === "verification" && (
                  <div className="space-y-6">
                    <Card>
                      <CardContent className="pt-6 space-y-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold">Signup Verification Controls</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">Control how new user signups are verified and approved.</p>
                        </div>

                        {[
                          { key: "email_only", label: "Email Verification Only", desc: "Users verify their email address to gain access. Standard signup flow.", icon: MailCheck },
                          { key: "admin_approval", label: "Admin Approval Only", desc: "Users can sign up but need admin approval before accessing the app. Shows in Pending Approval tab.", icon: UserCog },
                          { key: "email_and_approval", label: "Email + Admin Approval", desc: "Users must verify email AND receive admin approval. Maximum security.", icon: ShieldCheck },
                        ].map(({ key, label, desc, icon: Icon }) => (
                          <div
                            key={key}
                            onClick={() => setVerificationMode(key)}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              verificationMode === key
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-lg ${verificationMode === key ? "bg-primary/10" : "bg-muted"}`}>
                                <Icon className={`w-5 h-5 ${verificationMode === key ? "text-primary" : "text-muted-foreground"}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{label}</span>
                                  {verificationMode === key && (
                                    <Badge className="bg-primary/20 text-primary text-xs border-0">Active</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{desc}</p>
                              </div>
                            </div>
                            <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                              verificationMode === key ? "bg-primary justify-end" : "bg-muted justify-start"
                            }`}>
                              <div className="w-5 h-5 rounded-full bg-background shadow-sm" />
                            </div>
                          </div>
                        ))}

                        <Button onClick={saveVerificationMode} disabled={savingVerification} className="w-full gap-2">
                          {savingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Save Verification Settings
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Pending Approval Section */}
                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <UserCog className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold">Verification Pending Approval</h3>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Refresh
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">Users who have signed up and are pending admin approval.</p>

                      {(() => {
                        const pendingUsers = users.filter(u => !u.is_approved && u.role !== 'admin');
                        if (pendingUsers.length === 0) {
                          return <Card><CardContent className="py-8 text-center text-muted-foreground">No pending approvals</CardContent></Card>;
                        }
                        return (
                          <Card>
                            <CardContent className="pt-6">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Signed Up</TableHead>
                                    <TableHead>Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {pendingUsers.map(user => (
                                    <TableRow key={user.id}>
                                      <TableCell className="font-medium">{user.full_name || "-"}</TableCell>
                                      <TableCell>
                                        <span className="inline-flex items-center gap-1">
                                          {isRevealed(user.id, "email") ? user.email : maskEmail(user.email)}
                                          <button onClick={() => toggleReveal(user.id, "email")} className="text-muted-foreground hover:text-foreground">
                                            {isRevealed(user.id, "email") ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                          </button>
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        <span className="inline-flex items-center gap-1">
                                          {isRevealed(user.id, "phone") ? (user.phone || "-") : maskPhone(user.phone || "-")}
                                          {user.phone && (
                                            <button onClick={() => toggleReveal(user.id, "phone")} className="text-muted-foreground hover:text-foreground">
                                              {isRevealed(user.id, "phone") ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            </button>
                                          )}
                                        </span>
                                      </TableCell>
                                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                      <TableCell>
                                        <div className="flex gap-2">
                                          <Button size="sm" onClick={() => approveUser(user.id)} className="gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Approve
                                          </Button>
                                          <Button size="sm" variant="destructive" onClick={() => rejectUser(user.id)} className="gap-1">
                                            <XCircle className="w-3 h-3" /> Reject
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* ===== RECYCLE BIN SUB-TAB ===== */}
                {userMgmtTab === "recycle" && (
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <Trash className="w-5 h-5 text-muted-foreground" />
                              Deleted Users
                            </h3>
                            <p className="text-sm text-muted-foreground">Users that have been deleted. You can permanently remove them from here.</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                          </Button>
                        </div>
                        {deletedUsers.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">Recycle bin is empty</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Deleted At</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {deletedUsers.map(user => (
                                <TableRow key={user.id}>
                                  <TableCell className="font-medium">{user.full_name || "-"}</TableCell>
                                  <TableCell>
                                    <span className="inline-flex items-center gap-1">
                                      {isRevealed(user.id, "email") ? user.email : maskEmail(user.email)}
                                      <button onClick={() => toggleReveal(user.id, "email")} className="text-muted-foreground hover:text-foreground">
                                        {isRevealed(user.id, "email") ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                      </button>
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="inline-flex items-center gap-1">
                                      {isRevealed(user.id, "phone") ? (user.phone || "-") : maskPhone(user.phone || "-")}
                                      {user.phone && (
                                        <button onClick={() => toggleReveal(user.id, "phone")} className="text-muted-foreground hover:text-foreground">
                                          {isRevealed(user.id, "phone") ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                      )}
                                    </span>
                                  </TableCell>
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
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>
        </motion.div>
      </main>
      </Tabs>
    </div>
  );
};

export default SuperAdmin;
