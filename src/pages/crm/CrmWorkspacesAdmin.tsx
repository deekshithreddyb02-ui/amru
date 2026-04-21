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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, UserPlus, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  email?: string;
};

const CRM_ROLES = [
  "crm_admin",
  "crm_sales_mgr",
  "crm_sales_rep",
  "crm_support",
  "crm_marketing",
  "crm_technician",
  "crm_viewer",
] as const;

const CrmWorkspacesAdmin = () => {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  // Add member form
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("crm_sales_rep");
  const [adding, setAdding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (!roleLoading && role !== "super_admin") {
      navigate("/crm", { replace: true });
    }
  }, [role, roleLoading, navigate]);

  const load = async () => {
    setLoading(true);
    const [{ data: ws }, { data: m }, { data: u }] = await Promise.all([
      supabase.from("crm_workspaces").select("*").order("name"),
      supabase.from("crm_workspace_members").select("*"),
      supabase.rpc("get_users_with_emails"),
    ]);
    setWorkspaces((ws as Workspace[]) || []);
    setMembers((m as MemberRow[]) || []);
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

  const addMember = async () => {
    if (!selected || !newEmail.trim()) return;
    setAdding(true);
    try {
      // Find user by email
      const userId = Object.entries(emails).find(
        ([, e]) => e.toLowerCase() === newEmail.trim().toLowerCase()
      )?.[0];
      if (!userId) {
        toast({
          title: "User not found",
          description: "That user must sign up first. Use Super Admin → Employees to create them.",
          variant: "destructive",
        });
        return;
      }
      const { error } = await supabase
        .from("crm_workspace_members")
        .insert({ workspace_id: selected, user_id: userId, crm_role: newRole as never });
      if (error) throw error;
      toast({ title: "Member added" });
      setNewEmail("");
      setAddOpen(false);
      load();
    } catch (e) {
      toast({
        title: "Failed",
        description: e instanceof Error ? e.message : "Could not add member",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

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

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const selectedWs = workspaces.find((w) => w.id === selected);
  const wsMembers = members.filter((m) => m.workspace_id === selected);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/crm")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-serif">CRM Workspaces</h1>
              <p className="text-muted-foreground text-sm">Super Admin · manage members</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-4">
          {/* Workspace list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Workspaces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {workspaces.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelected(w.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selected === w.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <div className="font-medium">{w.name}</div>
                  <div
                    className={`text-xs ${
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">
                Members{selectedWs ? ` · ${selectedWs.name}` : ""}
              </CardTitle>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
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
                        User must already have an account. Create them in Super Admin → Employees first.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="role">CRM role</Label>
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CRM_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={addMember} disabled={adding || !newEmail.trim()}>
                      {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
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
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-left">
                        <th className="px-4 py-2 font-medium">Email</th>
                        <th className="px-4 py-2 font-medium">Role</th>
                        <th className="px-4 py-2 font-medium w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {wsMembers.map((m) => (
                        <tr key={m.id} className="border-t">
                          <td className="px-4 py-2">
                            {emails[m.user_id] || (
                              <Badge variant="outline">unknown user</Badge>
                            )}
                          </td>
                          <td className="px-4 py-2">
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
                                    {r}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-2">
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
      </div>
    </div>
  );
};

export default CrmWorkspacesAdmin;
