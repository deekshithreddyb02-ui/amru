import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Search, Mail, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Tpl = {
  id: string; name: string; subject: string; category: string; is_active: boolean;
  body_html: string; body_text: string | null;
};

const empty = { id: "" as string | "", name: "", subject: "", category: "general", body_html: "", body_text: "" };

const CrmEmailTemplates = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<Tpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_email_templates")
      .select("id,name,subject,category,is_active,body_html,body_text")
      .eq("workspace_id", workspace.id)
      .order("name");
    setRows((data as Tpl[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workspace.id]);

  const openNew = () => { setForm(empty); setOpen(true); };
  const openEdit = (t: Tpl) => {
    setForm({ id: t.id, name: t.name, subject: t.subject, category: t.category, body_html: t.body_html, body_text: t.body_text || "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body_html.trim()) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const payload = {
      workspace_id: workspace.id,
      name: form.name.trim(),
      subject: form.subject.trim(),
      category: form.category,
      body_html: form.body_html,
      body_text: form.body_text || null,
    };
    const { error } = form.id
      ? await supabase.from("crm_email_templates").update(payload).eq("id", form.id)
      : await supabase.from("crm_email_templates").insert({ ...payload, created_by: session?.user.id });
    setSaving(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: form.id ? "Updated" : "Saved" });
    setOpen(false); setForm(empty); load();
  };

  const filtered = rows.filter((r) =>
    !q.trim() || [r.name, r.subject, r.category].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif">Email Templates</h1>
          <p className="text-sm text-muted-foreground">Reusable templates with variables like {"{{name}}"}, {"{{company}}"}.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-card max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit template" : "New email template"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>HTML body *</Label><Textarea rows={8} value={form.body_html} onChange={(e) => setForm({ ...form, body_html: e.target.value })} placeholder="<p>Hi {{name}}, …</p>" /></div>
              <div className="md:col-span-2"><Label>Plain text fallback</Label><Textarea rows={3} value={form.body_text} onChange={(e) => setForm({ ...form, body_text: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving || !form.name.trim() || !form.subject.trim() || !form.body_html.trim()}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{form.id ? "Update" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="p-0 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <Mail className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No templates yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Category</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{t.name}</td>
                  <td className="p-3 text-muted-foreground truncate max-w-md">{t.subject}</td>
                  <td className="p-3"><Badge variant="outline">{t.category}</Badge></td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default CrmEmailTemplates;
