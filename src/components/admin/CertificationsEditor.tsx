import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, Save, Pencil, X } from "lucide-react";
import {
  CERTIFICATION_ICONS,
  CERTIFICATION_ICON_NAMES,
  getCertificationIcon,
} from "@/lib/certificationIcons";
import { cn } from "@/lib/utils";

interface Certification {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  icon_name: string;
  display_order: number;
  is_visible: boolean;
}

interface FormState {
  title: string;
  subtitle: string;
  description: string;
  icon_name: string;
}

const emptyForm: FormState = {
  title: "",
  subtitle: "",
  description: "",
  icon_name: "Award",
};

const IconPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) => (
  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-56 overflow-y-auto p-2 border border-border rounded-lg bg-muted/30">
    {CERTIFICATION_ICON_NAMES.map((name) => {
      const Icon = CERTIFICATION_ICONS[name];
      const active = value === name;
      return (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          title={name}
          className={cn(
            "aspect-square flex items-center justify-center rounded-lg border transition-all",
            active
              ? "border-primary bg-primary text-primary-foreground shadow-sm scale-105"
              : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
          )}
        >
          <Icon className="w-5 h-5" />
        </button>
      );
    })}
  </div>
);

const CertificationsEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<Certification[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("certifications")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      setItems((data as Certification[]) || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setForm(emptyForm);
  };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast({
        title: "Missing fields",
        description: "Title and description are required",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const maxOrder =
        items.length > 0 ? Math.max(...items.map((i) => i.display_order)) + 1 : 0;
      const { error } = await (supabase as any).from("certifications").insert([
        {
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || null,
          description: form.description.trim(),
          icon_name: form.icon_name,
          display_order: maxOrder,
        },
      ]);
      if (error) throw error;
      toast({ title: "Added", description: "Certification added" });
      resetForm();
      await fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editId) return;
    if (!form.title.trim() || !form.description.trim()) {
      toast({
        title: "Missing fields",
        description: "Title and description are required",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("certifications")
        .update({
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || null,
          description: form.description.trim(),
          icon_name: form.icon_name,
        })
        .eq("id", editId);
      if (error) throw error;
      toast({ title: "Saved", description: "Certification updated" });
      resetForm();
      await fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this certification?")) return;
    try {
      const { error } = await (supabase as any).from("certifications").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Certification removed" });
      if (editId === id) resetForm();
      await fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleVisible = async (id: string, value: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from("certifications")
        .update({ is_visible: value })
        .eq("id", id);
      if (error) throw error;
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_visible: value } : i)));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleReorder = async (index: number, direction: "up" | "down") => {
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= items.length) return;
    const a = items[index];
    const b = items[swap];
    try {
      await Promise.all([
        (supabase as any)
          .from("certifications")
          .update({ display_order: b.display_order })
          .eq("id", a.id),
        (supabase as any)
          .from("certifications")
          .update({ display_order: a.display_order })
          .eq("id", b.id),
      ]);
      await fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const startEdit = (c: Certification) => {
    setEditId(c.id);
    setForm({
      title: c.title,
      subtitle: c.subtitle || "",
      description: c.description,
      icon_name: c.icon_name,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const PreviewIcon = getCertificationIcon(form.icon_name);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certifications & Partnerships</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form */}
        <div className="p-4 border border-border rounded-lg space-y-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              {editId ? "Edit Certification" : "Add New Certification"}
            </Label>
            {editId && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="ISO 1901: 2015 Certified Company"
              />
            </div>
            <div className="space-y-1">
              <Label>Subtitle (optional)</Label>
              <Input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="e.g. in Water Sustenance and Rainwater Harvesting"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Short description shown on the card"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Icon</Label>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Selected:</span>
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--secondary)), hsl(42 95% 45%))",
                  }}
                >
                  <PreviewIcon className="w-4 h-4 text-white" />
                </span>
                <span className="font-mono">{form.icon_name}</span>
              </div>
            </div>
            <IconPicker
              value={form.icon_name}
              onChange={(name) => setForm({ ...form, icon_name: name })}
            />
          </div>

          <div className="flex gap-2">
            {editId ? (
              <Button onClick={saveEdit} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            ) : (
              <Button onClick={handleAdd} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Certification
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No certifications yet</p>
        ) : (
          <div className="space-y-3">
            {items.map((c, i) => {
              const Icon = getCertificationIcon(c.icon_name);
              return (
                <div
                  key={c.id}
                  className="p-4 border border-border rounded-lg flex items-start gap-4"
                >
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(var(--secondary)), hsl(42 95% 45%))",
                    }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{c.title}</p>
                    {c.subtitle && (
                      <p className="text-xs text-primary mt-0.5">{c.subtitle}</p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {c.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="flex items-center gap-2 mr-2">
                      <Label className="text-xs">Visible</Label>
                      <Switch
                        checked={c.is_visible}
                        onCheckedChange={(v) => handleToggleVisible(c.id, v)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleReorder(i, "up")}
                      disabled={i === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleReorder(i, "down")}
                      disabled={i === items.length - 1}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(c)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificationsEditor;
