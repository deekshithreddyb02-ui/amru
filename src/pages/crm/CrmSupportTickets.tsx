import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, RefreshCw, Search, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

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

const STATUS_TABS = ["all", "open", "in_progress", "waiting_customer", "resolved", "closed"];

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
  subject: "",
  description: "",
  category: "general",
  priority: "medium",
  customer_name: "",
  customer_email: "",
  customer_phone: "",
};

const CrmSupportTickets = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id]);

  const filtered = tickets.filter((t) => {
    if (tab !== "all" && t.status !== tab) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      t.subject?.toLowerCase().includes(s) ||
      t.customer_name?.toLowerCase().includes(s) ||
      t.customer_email?.toLowerCase().includes(s)
    );
  });

  const handleCreate = async () => {
    if (!form.subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("crm_support_tickets").insert({
      workspace_id: workspace.id,
      created_by: session?.user.id ?? null,
      subject: form.subject.trim(),
      description: form.description.trim() || null,
      category: form.category,
      priority: form.priority,
      status: "open",
      customer_name: form.customer_name.trim() || null,
      customer_email: form.customer_email.trim() || null,
      customer_phone: form.customer_phone.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Ticket created");
    setForm(blank);
    setOpen(false);
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    const patch: Record<string, unknown> = { status };
    if (status === "resolved" || status === "closed") {
      patch.resolved_at = new Date().toISOString();
    }
    const { error } = await supabase.from("crm_support_tickets").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status, resolved_at: (patch.resolved_at as string) ?? t.resolved_at } : t)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif flex items-center gap-2">
            <LifeBuoy className="h-7 w-7 text-primary" /> Support Tickets
          </h1>
          <p className="text-muted-foreground text-sm">{workspace.name}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 w-56" />
          </div>
          <Button variant="outline" size="icon" onClick={load} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New ticket</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create support ticket</DialogTitle>
              </DialogHeader>
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
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          {STATUS_TABS.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">{s.replace("_", " ")}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No tickets yet. New "support" enquiries from {workspace.name} will appear here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium max-w-xs">
                      <div className="truncate">{t.subject}</div>
                      {t.description && (
                        <div className="text-xs text-muted-foreground truncate">{t.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">{t.customer_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{t.customer_email || t.customer_phone || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize">{t.category}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={priorityBadge[t.priority] || ""}>
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v)}>
                        <SelectTrigger className={`h-7 text-xs w-36 ${statusBadge[t.status] || ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In progress</SelectItem>
                          <SelectItem value="waiting_customer">Waiting customer</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CrmSupportTickets;
