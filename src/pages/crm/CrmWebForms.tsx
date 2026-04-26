import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Search, FormInput, Pencil, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type WebForm = {
  id: string; name: string; slug: string; is_active: boolean;
  total_submissions: number; default_lead_source: string | null;
  thank_you_message: string | null; redirect_url: string | null;
};

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const empty = {
  id: "" as string | "", name: "", slug: "", default_lead_source: "web_form",
  thank_you_message: "Thank you for your enquiry. We will get back to you shortly.",
  redirect_url: "", is_active: true,
};

const CrmWebForms = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<WebForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_web_forms")
      .select("id,name,slug,is_active,total_submissions,default_lead_source,thank_you_message,redirect_url")
      .eq("workspace_id", workspace.id)
      .order("name");
    setRows((data as WebForm[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workspace.id]);

  const openNew = () => { setForm(empty); setOpen(true); };
  const openEdit = (f: WebForm) => {
    setForm({
      id: f.id, name: f.name, slug: f.slug,
      default_lead_source: f.default_lead_source || "web_form",
      thank_you_message: f.thank_you_message || "",
      redirect_url: f.redirect_url || "",
      is_active: f.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    const slug = (form.slug || slugify(form.name)).trim();
    if (!slug) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const payload = {
      workspace_id: workspace.id,
      name: form.name.trim(), slug,
      default_lead_source: form.default_lead_source || null,
      thank_you_message: form.thank_you_message || null,
      redirect_url: form.redirect_url || null,
      is_active: form.is_active,
      fields: [
        { name: "full_name", label: "Full name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel", required: false },
        { name: "message", label: "Message", type: "textarea", required: false },
      ],
    };
    const { error } = form.id
      ? await supabase.from("crm_web_forms").update(payload).eq("id", form.id)
      : await supabase.from("crm_web_forms").insert({ ...payload, created_by: session?.user.id });
    setSaving(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: form.id ? "Updated" : "Form created" });
    setOpen(false); setForm(empty); load();
  };

  const copyEmbed = (slug: string) => {
    const url = `${window.location.origin}/forms/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Public URL copied", description: url });
  };

  const filtered = rows.filter((r) =>
    !q.trim() || [r.name, r.slug].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif">Web Forms</h1>
          <p className="text-sm text-muted-foreground">Public lead-capture forms — submissions become CRM leads.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New web form</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-card max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit web form" : "New web form"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} /></div>
              <div className="md:col-span-2"><Label>Slug *</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="contact-us" /></div>
              <div><Label>Default lead source</Label><Input value={form.default_lead_source} onChange={(e) => setForm({ ...form, default_lead_source: e.target.value })} /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><span className="text-sm">Active</span></div>
              <div className="md:col-span-2"><Label>Redirect URL on submit (optional)</Label><Input value={form.redirect_url} onChange={(e) => setForm({ ...form, redirect_url: e.target.value })} placeholder="https://example.com/thank-you" /></div>
              <div className="md:col-span-2"><Label>Thank-you message</Label><Textarea rows={2} value={form.thank_you_message} onChange={(e) => setForm({ ...form, thank_you_message: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving || !form.name.trim()}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{form.id ? "Update" : "Save"}</Button>
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
            <FormInput className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No web forms yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Slug</th>
                <th className="p-3 text-right">Submissions</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{f.name}</td>
                  <td className="p-3 text-muted-foreground font-mono text-xs">/forms/{f.slug}</td>
                  <td className="p-3 text-right">{f.total_submissions}</td>
                  <td className="p-3">
                    <Badge variant={f.is_active ? "default" : "outline"}>{f.is_active ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="p-3 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => copyEmbed(f.slug)}><Copy className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
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

export default CrmWebForms;
