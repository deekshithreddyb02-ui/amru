import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  emailSchema,
  validateCreateEmployee,
  type FieldErrors,
} from "@/lib/employeeValidation";

export type AddMemberDialogProps = {
  workspaceId: string;
  workspaceName?: string;
  isSuperAdmin: boolean;
  emails: Record<string, string>;
  crmRoles: readonly string[];
  roleLabels: Record<string, string>;
  onAdded: () => void;
};

export function AddMemberDialog({
  workspaceId,
  workspaceName,
  isSuperAdmin,
  emails,
  crmRoles,
  roleLabels,
  onAdded,
}: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("crm_sales_rep");
  const [adding, setAdding] = useState(false);
  const [needsCreate, setNeedsCreate] = useState(false);
  const [createFullName, setCreateFullName] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createTempPassword, setCreateTempPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const reset = () => {
    setNewEmail("");
    setNeedsCreate(false);
    setCreateFullName("");
    setCreateUsername("");
    setCreatePhone("");
    setCreateTempPassword("");
    setErrors({});
    setFormError(null);
  };

  const findUserId = () =>
    Object.entries(emails).find(
      ([, e]) => e.toLowerCase() === newEmail.trim().toLowerCase(),
    )?.[0];

  const submit = async () => {
    setFormError(null);
    setErrors({});

    const emailCheck = emailSchema.safeParse(newEmail);
    if (!emailCheck.success) {
      setErrors({ email: emailCheck.error.issues[0].message });
      return;
    }

    setAdding(true);
    try {
      let userId = findUserId();

      if (needsCreate) {
        if (!isSuperAdmin) {
          setFormError("Only super admins can create new employees.");
          return;
        }
        if (userId) {
          setFormError(
            "An account with this email already exists. Uncheck 'Create new employee' to add them.",
          );
          return;
        }
        const fieldErrs = validateCreateEmployee({
          email: newEmail,
          fullName: createFullName,
          username: createUsername,
          phone: createPhone,
          tempPassword: createTempPassword,
        });
        if (Object.keys(fieldErrs).length > 0) {
          setErrors(fieldErrs);
          return;
        }

        const { data: cre, error: ceErr } = await supabase.functions.invoke(
          "create-employee",
          {
            body: {
              email: newEmail.trim(),
              full_name: createFullName.trim(),
              username: createUsername.trim().toLowerCase(),
              phone: createPhone.trim(),
              temp_password: createTempPassword,
              role: "employee",
              workspace_id: workspaceId,
            },
          },
        );
        if (ceErr) {
          setFormError(ceErr.message || "Failed to create employee. Please try again.");
          return;
        }
        if (!cre?.success || !cre?.user_id) {
          const msg = String(cre?.error || "Failed to create employee");
          if (/username/i.test(msg)) {
            setErrors({ username: msg });
          } else {
            setFormError(msg);
          }
          return;
        }
        userId = cre.user_id as string;

        // Best-effort audit entry (RPC is super-admin gated server-side).
        try {
          await supabase.rpc("log_employee_created_audit" as never, {
            _workspace_id: workspaceId,
            _target_user_id: userId,
            _email: newEmail.trim(),
            _full_name: createFullName.trim(),
            _username: createUsername.trim().toLowerCase(),
          } as never);
        } catch {
          // Audit log failure must not block the flow.
        }
      } else if (!userId) {
        setFormError(
          isSuperAdmin
            ? "No user found with that email. Enable 'Create new employee' to provision an account."
            : "No user found with that email. Ask a super admin to create the account first.",
        );
        return;
      }

      const { error } = await supabase
        .from("crm_workspace_members")
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          crm_role: newRole as never,
        });
      if (error) {
        setFormError(error.message || "Failed to add member.");
        return;
      }

      toast({ title: needsCreate ? "Employee created and added" : "Member added" });
      reset();
      setOpen(false);
      onAdded();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Unexpected error. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add member{workspaceName ? ` to ${workspaceName}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="add-member-email">User email</Label>
            <Input
              id="add-member-email"
              type="email"
              placeholder="user@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-1" role="alert">
                {errors.email}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {isSuperAdmin
                ? "Enter an existing user's email, or enable 'Create new employee' below."
                : "Enter the email of an existing user to add them to this workspace."}
            </p>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <label
                  className={`flex items-start gap-2 rounded-md border p-3 ${
                    isSuperAdmin
                      ? "cursor-pointer hover:bg-accent/40"
                      : "cursor-not-allowed opacity-60"
                  } ${!isSuperAdmin ? "hidden md:flex" : ""}`}
                  data-testid="create-employee-toggle"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={needsCreate}
                    disabled={!isSuperAdmin}
                    aria-label="Create new employee"
                    onChange={(e) => {
                      const on = e.target.checked;
                      setNeedsCreate(on);
                      setErrors({});
                      setFormError(null);
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
                      {isSuperAdmin
                        ? "Provision a brand-new employee account and add them in one step."
                        : "Only super admins can create new employee accounts."}
                    </div>
                  </div>
                </label>
              </TooltipTrigger>
              {!isSuperAdmin && (
                <TooltipContent>
                  Restricted to super admins. Ask a super admin to create the account.
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <div>
            <Label htmlFor="add-member-role">CRM role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger id="add-member-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {crmRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleLabels[r] || r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsCreate && isSuperAdmin && (
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
                    aria-invalid={!!errors.fullName}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive mt-1" role="alert">
                      {errors.fullName}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="c_user">Username *</Label>
                  <Input
                    id="c_user"
                    value={createUsername}
                    onChange={(e) => setCreateUsername(e.target.value)}
                    aria-invalid={!!errors.username}
                  />
                  {errors.username && (
                    <p className="text-xs text-destructive mt-1" role="alert">
                      {errors.username}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="c_phone">Phone</Label>
                  <Input
                    id="c_phone"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    aria-invalid={!!errors.phone}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive mt-1" role="alert">
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="c_pwd">Temp password *</Label>
                  <Input
                    id="c_pwd"
                    type="text"
                    value={createTempPassword}
                    onChange={(e) => setCreateTempPassword(e.target.value)}
                    placeholder="min 8 chars, letters + digits"
                    aria-invalid={!!errors.tempPassword}
                  />
                  {errors.tempPassword && (
                    <p className="text-xs text-destructive mt-1" role="alert">
                      {errors.tempPassword}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                The user will be required to change this password on first login.
              </p>
            </div>
          )}

          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={adding || !newEmail.trim()}
            data-testid="add-member-submit"
          >
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
  );
}
