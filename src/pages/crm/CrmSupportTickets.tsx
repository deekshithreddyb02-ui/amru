import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";
import CrmListView, { type Column, type SavedView } from "@/components/crm/vtiger/CrmListView";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Ticket = {
  id: string;
  subject: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  due_at: string | null;
  resolved_at: string | null;
  created_at: string;
};

const statusBadge: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  in_progress: "bg-amber-100 text-amber-800",
  waiting_customer: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-muted text-muted-foreground",
};

const priorityBadge: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-secondary/40",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-destructive/15 text-destructive",
};

const blank = {
  subject: "", description: "", category: "general", priority: "medium",
  customer_name: "", customer_email: "", customer_phone: "",
};

const CrmSupportTickets = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(blank);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_support_tickets")
      .select("id,subject,description,category,priority,status,customer_name,customer_email,customer_phone,due_at,resolved_at,created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) console.error(error);
    setTickets((data as Ticket[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workspace.id]);

  const handleCreate = async () => {
    if (!form.subject.trim()) { toast.error("Subject is required"); return; }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("crm_support_tickets").insert({
      workspace_id: workspace.id,
      created_by: session?.user.id ?? null,
      subject: form.subject.trim(),
      description: form.description.trim() || null,
      category: form.category, priority: form.priority, status: "open",
      customer_name: form.customer_name.trim() || null,
      customer_email: form.customer_email.trim() || null,
      customer_phone: form.customer_phone.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Ticket created");
    setForm(blank); setOpen(false); load();
  };

  const updateStatus = async (id: string, status: string) => {
    const patch: Record<string, unknown> = { status };
    if (status === "resolved" || status === "closed") patch.resolved_at = new Date().toISOString();
    const { error } = await supabase.from("crm_support_tickets").update(patch as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status, resolved_at: (patch.resolved_at as string) ?? t.resolved_at } : t)));
  };

  const savedViews: SavedView[] = [
    { id: "all", label: "All Tickets" },
    { id: "open", label: "Open", filter: (t: Ticket) => t.status === "open" },
    { id: "in_progress", label: "In Progress", filter: (t: Ticket) => t.status === "in_progress" },
    { id: "waiting", label: "Waiting Customer", filter: (t: Ticket) => t.status === "waiting_customer" },
    { id: "urgent", label: "Urgent & High", filter: (t: Ticket) => ["urgent", "high"].includes(t.priority) && !["resolved", "closed"].includes(t.status) },
    { id: "resolved", label: "Resolved", filter: (t: Ticket) => t.status === "resolved" },
    { id: "closed", label: "Closed", filter: (t: Ticket) => t.status === "closed" },
  ];

  const columns: Column<Ticket>[] = [
    {
      key: "subject", label: "Subject",
      render: (t) => (
        <div className="min-w-0 max-w-xs">
          <div className="font-medium truncate">{t.subject}</div>
          {t.description && <div className="text-xs text-muted-foreground truncate">{t.description}</div>}
        </div>
      ),
    },
    {
      key: "customer", label: "Customer",
      render: (t) => (
        <div>
          <div className="text-xs">{t.customer_name || "—"}</div>
          <div className="text-xs text-muted-foreground">{t.customer_email || t.customer_phone || ""}</div>
        </div>
      ),
    },
    { key: "category", label: "Category", render: (t) => <span className="capitalize text-xs">{t.category}</span> },
    {
      key: "priority", label: "Priority",
      render: (t) => <Badge variant="secondary" className={priorityBadge[t.priority] || ""}>{t.priority}</Badge>,
    },
    {
      key: "status", label: "Status",
      render: (t) => (
        <div data-no-row-click>
          <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v)}>
            <SelectTrigger className={`h-7 text-xs w-36 ${statusBadge[t.status] || ""}`}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="waiting_customer">Waiting customer</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
    },
    { key: "created_at", label: "Created", render: (t) => new Date(t.created_at).toLocaleDateString("en-IN") },
  ];

  return (
    <>
      <CrmListView<Ticket>
        title="Support Tickets"
        subtitle={workspace.name}
        rows={tickets}
        loading={loading}
        columns={columns}
        savedViews={savedViews}
        defaultViewId="all"
        searchKeys={["subject", "customer_name", "customer_email"]}
        onRefresh={load}
        onCreate={() => setOpen(true)}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create support ticket</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Subject *</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="warranty">Warranty</SelectItem>
                    <SelectItem value="hydrogeo">HydroGeo</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Customer name</Label>
                <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CrmSupportTickets;
