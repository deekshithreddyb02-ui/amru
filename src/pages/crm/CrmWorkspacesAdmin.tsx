import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AddMemberDialog } from "@/components/crm/AddMemberDialog";

type Workspace = {
  id: string;
  slug: string;
  name: string;
  region_key: string;
  is_active: boolean;
};

type MemberRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  crm_role: string;
  manager_user_id: string | null;
  department: string | null;
  email?: string;
};

type PermRow = {
  id: string;
  workspace_id: string;
  role: string;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
};

const PERM_MODULES = [
  "leads", "contacts", "organizations", "deals", "activities",
  "tickets", "hydrogeo", "documents", "quotations", "invoices",
  "payments", "reports", "project_reports", "performance",
] as const;

const PERMS = ["view", "create", "edit", "delete", "approve"] as const;

const CRM_ROLES = [
  "crm_admin",
  "crm_ceo",
  "crm_sales_mgr",
  "crm_sales_rep",
  "crm_support_mgr",
  "crm_support",
  "crm_marketing_mgr",
  "crm_marketing",
  "crm_ops_mgr",
  "crm_accountant",
  "crm_technician",
  "crm_field_staff",
  "crm_viewer",
] as const;

const ROLE_LABEL: Record<string, string> = {
  crm_admin: "CRM Admin",
  crm_ceo: "CEO",
  crm_sales_mgr: "Sales Manager",
  crm_sales_rep: "Sales Executive",
  crm_support_mgr: "Support Manager",
  crm_support: "Support Executive",
  crm_marketing_mgr: "Marketing Manager",
  crm_marketing: "Marketing Executive",
  crm_ops_mgr: "Operations Manager",
  crm_accountant: "Accountant",
  crm_technician: "Technician",
  crm_field_staff: "Field Staff",
  crm_viewer: "Viewer",
};

const CrmWorkspacesAdmin = () => {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [perms, setPerms] = useState<PermRow[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const [newRole] = useState<string>("crm_sales_rep");

  useEffect(() => {
    if (!roleLoading && role !== "super_admin") {
      navigate("/crm", { replace: true });
    }
  }, [role, roleLoading, navigate]);

  const load = async () => {
    setLoading(true);
    const [{ data: ws }, { data: m }, { data: u }, { data: p }] = await Promise.all([
      supabase.from("crm_workspaces").select("*").order("name"),
      supabase.from("crm_workspace_members").select("*"),
      supabase.rpc("get_users_with_emails"),
      supabase.from("crm_role_permissions").select("*"),
    ]);
    setWorkspaces((ws as Workspace[]) || []);
    setMembers((m as MemberRow[]) || []);
    setPerms((p as PermRow[]) || []);
    const map: Record<string, string> = {};
    (u || []).forEach((row: { user_id: string; email: string }) => {
      map[row.user_id] = row.email;
    });
    setEmails(map);
    if (!selected && ws && ws.length > 0) setSelected(ws[0].id);
    setLoading(false);
  };

  useEffect(() => {
    if (role === "super_admin") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);


  const removeMember = async (id: string) => {
    if (!confirm("Remove this member from the workspace?")) return;
    const { error } = await supabase.from("crm_workspace_members").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Member removed" });
      load();
    }
  };

  const updateRole = async (id: string, newRole: string) => {
    const { error } = await supabase
      .from("crm_workspace_members")
      .update({ crm_role: newRole as never })
      .eq("id", id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role updated" });
      load();
    }
  };

  const updateMemberField = async (id: string, patch: Partial<MemberRow>) => {
    const { error } = await supabase
      .from("crm_workspace_members")
      .update(patch as never)
      .eq("id", id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      load();
    }
  };

  const togglePerm = async (row: PermRow, key: "can_view" | "can_create" | "can_edit" | "can_delete" | "can_approve") => {
    const next = !row[key];
    setPerms((prev) => prev.map((p) => (p.id === row.id ? { ...p, [key]: next } : p)));
    const { error } = await supabase
      .from("crm_role_permissions")
      .update({ [key]: next } as any)
      .eq("id", row.id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      load();
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const selectedWs = workspaces.find((w) => w.id === selected);
  const wsMembers = members.filter((m) => m.workspace_id === selected);
  const wsPerms = perms.filter((p) => p.workspace_id === selected);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-6 min-w-0">
        <div className="flex items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/crm")} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-serif break-words">CRM Workspaces</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">Super Admin · manage members</p>
            </div>
          </div>
        </div>


        <div className="grid md:grid-cols-[280px_minmax(0,1fr)] gap-4 min-w-0">
          {/* Workspace list */}
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="text-sm">Workspaces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {workspaces.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelected(w.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors min-w-0 ${
                    selected === w.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <div className="font-medium break-words">{w.name}</div>
                  <div
                    className={`text-xs break-all ${
                      selected === w.id ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    /crm/{w.slug}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>


          {/* Members */}
          <Card className="min-w-0">

            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">
                Members{selectedWs ? ` · ${selectedWs.name}` : ""}
              </CardTitle>
              <Dialog
                open={addOpen}
                onOpenChange={(o) => {
                  setAddOpen(o);
                  if (!o) resetAddForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add member to {selectedWs?.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label htmlFor="email">User email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter an existing user's email, or enable "Create new employee" below to provision a new account.
                      </p>
                    </div>
                    <label className="flex items-start gap-2 rounded-md border p-3 cursor-pointer hover:bg-accent/40">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={needsCreate}
                        onChange={(e) => {
                          const on = e.target.checked;
                          setNeedsCreate(on);
                          if (on) {
                            const local = newEmail.split("@")[0] || "";
                            setCreateUsername((u) => u || local.toLowerCase());
                            setCreateFullName((n) => n || local);
                          }
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium">Create new employee</div>
                        <div className="text-xs text-muted-foreground">
                          As super admin, create a brand-new employee account and add them to this workspace in one step.
                        </div>
                      </div>
                    </label>
                    <div>
                      <Label htmlFor="role">CRM role</Label>
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CRM_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABEL[r] || r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {needsCreate && (
                      <div className="space-y-3 rounded-md border border-dashed p-3 bg-muted/30">
                        <p className="text-xs font-medium">
                          New employee details (account will be created)
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="c_name">Full name *</Label>
                            <Input
                              id="c_name"
                              value={createFullName}
                              onChange={(e) => setCreateFullName(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="c_user">Username *</Label>
                            <Input
                              id="c_user"
                              value={createUsername}
                              onChange={(e) => setCreateUsername(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="c_phone">Phone</Label>
                            <Input
                              id="c_phone"
                              value={createPhone}
                              onChange={(e) => setCreatePhone(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="c_pwd">Temp password *</Label>
                            <Input
                              id="c_pwd"
                              type="text"
                              value={createTempPassword}
                              onChange={(e) => setCreateTempPassword(e.target.value)}
                              placeholder="min 8 chars"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          The user will be required to change this password on first login.
                        </p>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={addMember} disabled={adding || !newEmail.trim()}>
                      {adding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : needsCreate ? (
                        "Create & Add"
                      ) : (
                        "Add"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

            </CardHeader>
            <CardContent className="p-0">
              {wsMembers.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No members yet. Click <strong>Add</strong> to invite someone.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                  <table className="text-sm min-w-[760px] w-full">
                    <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-medium min-w-[200px]">Email</th>
                        <th className="px-3 py-2 font-medium min-w-[180px]">Role</th>
                        <th className="px-3 py-2 font-medium min-w-[180px]">Reports to</th>
                        <th className="px-3 py-2 font-medium min-w-[160px]">Department</th>
                        <th className="px-3 py-2 font-medium w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {wsMembers.map((m) => (
                        <tr key={m.id} className="border-t">
                          <td className="px-3 py-2 whitespace-nowrap">
                            {emails[m.user_id] || (
                              <Badge variant="outline">unknown user</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <Select
                              value={m.crm_role}
                              onValueChange={(v) => updateRole(m.id, v)}
                            >
                              <SelectTrigger className="h-8 w-44">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CRM_ROLES.map((r) => (
                                  <SelectItem key={r} value={r}>
                                    {ROLE_LABEL[r] || r}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2">
                            <Select
                              value={m.manager_user_id || "none"}
                              onValueChange={(v) =>
                                updateMemberField(m.id, { manager_user_id: v === "none" ? null : v })
                              }
                            >
                              <SelectTrigger className="h-8 w-44">
                                <SelectValue placeholder="—" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">— none —</SelectItem>
                                {wsMembers
                                  .filter((mm) => mm.user_id !== m.user_id)
                                  .map((mm) => (
                                    <SelectItem key={mm.user_id} value={mm.user_id}>
                                      {emails[mm.user_id] || mm.user_id.slice(0, 8)}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              className="h-8 w-36"
                              defaultValue={m.department || ""}
                              placeholder="e.g. Sales"
                              onBlur={(e) => {
                                const v = e.target.value.trim() || null;
                                if (v !== (m.department || null)) {
                                  updateMemberField(m.id, { department: v });
                                }
                              }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMember(m.id)}
                              aria-label="Remove"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              )}
            </CardContent>
          </Card>
        </div>

        {/* Permissions matrix */}
        {selectedWs && (
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="text-sm">
                Permissions matrix · {selectedWs.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Toggle per-role × per-module access. Super Admin and CRM Admin always have full access.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="text-xs min-w-[640px] w-full">
                  <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium min-w-[160px]">Role</th>
                      <th className="px-3 py-2 text-left font-medium min-w-[140px]">Module</th>
                      {PERMS.map((p) => (
                        <th key={p} className="px-2 py-2 font-medium capitalize text-center w-16 min-w-[64px]">{p}</th>
                      ))}
                    </tr>
                  </thead>

                <tbody>
                  {CRM_ROLES.filter((r) => r !== "crm_admin").map((roleKey) =>
                    PERM_MODULES.map((mod) => {
                      const row = wsPerms.find((p) => p.role === roleKey && p.module === mod);
                      if (!row) return null;
                      return (
                        <tr key={`${roleKey}-${mod}`} className="border-t hover:bg-muted/30">
                          <td className="px-3 py-1.5 whitespace-nowrap">{ROLE_LABEL[roleKey]}</td>
                          <td className="px-3 py-1.5 capitalize text-muted-foreground">{mod.replace("_", " ")}</td>
                          {(["can_view","can_create","can_edit","can_delete","can_approve"] as const).map((k) => (
                            <td key={k} className="px-2 py-1.5 text-center">
                              <input
                                type="checkbox"
                                checked={row[k]}
                                onChange={() => togglePerm(row, k)}
                                className="h-4 w-4 cursor-pointer accent-primary"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
                </table>
              </div>
            </CardContent>

          </Card>
        )}
      </div>
    </div>
  );
};

export default CrmWorkspacesAdmin;
