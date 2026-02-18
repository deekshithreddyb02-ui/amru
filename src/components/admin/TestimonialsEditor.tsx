import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  organization: string;
  text: string;
  display_order: number;
  is_visible: boolean;
}

const TestimonialsEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", organization: "", text: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      setTestimonials(data || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.name || !form.text) {
      toast({ title: "Error", description: "Name and text are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const maxOrder = testimonials.length > 0 ? Math.max(...testimonials.map(t => t.display_order)) + 1 : 0;
      const { error } = await supabase.from("testimonials").insert([{
        name: form.name,
        organization: form.organization,
        text: form.text,
        display_order: maxOrder,
      }]);
      if (error) throw error;
      setForm({ name: "", organization: "", text: "" });
      toast({ title: "Success", description: "Testimonial added" });
      await fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Testimonial>) => {
    try {
      const { error } = await supabase.from("testimonials").update(updates).eq("id", id);
      if (error) throw error;
      setTestimonials(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Testimonial deleted" });
      await fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleReorder = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= testimonials.length) return;
    const a = testimonials[index];
    const b = testimonials[swapIndex];
    try {
      await Promise.all([
        supabase.from("testimonials").update({ display_order: b.display_order }).eq("id", a.id),
        supabase.from("testimonials").update({ display_order: a.display_order }).eq("id", b.id),
      ]);
      await fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const startEdit = (t: Testimonial) => {
    setEditId(t.id);
    setForm({ name: t.name, organization: t.organization, text: t.text });
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("testimonials").update({
        name: form.name,
        organization: form.organization,
        text: form.text,
      }).eq("id", editId);
      if (error) throw error;
      setEditId(null);
      setForm({ name: "", organization: "", text: "" });
      toast({ title: "Success", description: "Testimonial updated" });
      await fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({ name: "", organization: "", text: "" });
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Testimonials Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add / Edit Form */}
        <div className="p-4 border border-border rounded-lg space-y-3">
          <Label className="text-base font-semibold">{editId ? "Edit Testimonial" : "Add New Testimonial"}</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Customer name" />
            </div>
            <div className="space-y-1">
              <Label>Organization</Label>
              <Input value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} placeholder="Company / Society name" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Testimonial Text *</Label>
            <Textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} rows={4} placeholder="What the customer said..." />
          </div>
          <div className="flex gap-2">
            {editId ? (
              <>
                <Button onClick={saveEdit} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
              </>
            ) : (
              <Button onClick={handleAdd} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Testimonial
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        {testimonials.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No testimonials yet</p>
        ) : (
          <div className="space-y-3">
            {testimonials.map((t, i) => (
              <div key={t.id} className="p-4 border border-border rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{t.name}{t.organization && <span className="text-muted-foreground font-normal"> — {t.organization}</span>}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{t.text}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="flex items-center gap-2 mr-2">
                      <Label className="text-xs">Visible</Label>
                      <Switch checked={t.is_visible} onCheckedChange={v => handleUpdate(t.id, { is_visible: v })} />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleReorder(i, "up")} disabled={i === 0}>
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleReorder(i, "down")} disabled={i === testimonials.length - 1}>
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(t)}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestimonialsEditor;
