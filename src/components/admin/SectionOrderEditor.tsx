import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { GripVertical, ArrowUp, ArrowDown, Loader2, Save, RotateCcw } from "lucide-react";

export interface SectionConfig {
  key: string;
  label: string;
  visible: boolean;
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  { key: "services", label: "Services", visible: true },
  { key: "about", label: "About Us", visible: true },
  { key: "whyus", label: "Why Us", visible: true },
  { key: "certifications", label: "Certifications", visible: true },
  { key: "testimonials", label: "Testimonials", visible: true },
  { key: "gallery", label: "Gallery", visible: true },
  { key: "contact", label: "Contact", visible: true },
  { key: "offices", label: "Office Locations", visible: true },
  { key: "legal", label: "Legal Notice", visible: true },
  { key: "feedback", label: "Customer Feedback", visible: true },
];

const SectionOrderEditor = () => {
  const { toast } = useToast();
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "homepage_sections")
        .maybeSingle();

      if (error) throw error;
      if (data?.value) {
        const saved = (typeof data.value === "string" ? JSON.parse(data.value) : data.value) as SectionConfig[];
        // Merge with defaults to pick up any new sections
        const savedKeys = new Set(saved.map((s: SectionConfig) => s.key));
        const merged = [
          ...saved,
          ...DEFAULT_SECTIONS.filter((d) => !savedKeys.has(d.key)),
        ];
        setSections(merged);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
  };

  const toggleVisibility = (index: number) => {
    const next = [...sections];
    next[index] = { ...next[index], visible: !next[index].visible };
    setSections(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upsert into site_settings
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "homepage_sections")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: sections as any, updated_at: new Date().toISOString() })
          .eq("key", "homepage_sections");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({ key: "homepage_sections", value: sections as any });
        if (error) throw error;
      }

      toast({ title: "Saved", description: "Section order updated. Refresh the homepage to see changes." });
    } catch (err: any) {
      toast({ title: "Error", description: sanitizeError(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSections(DEFAULT_SECTIONS);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
            Homepage Section Order
          </h3>
          <p className="text-sm text-muted-foreground">
            Reorder sections and toggle their visibility on the homepage.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        {sections.map((section, index) => (
          <div
            key={section.key}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              section.visible
                ? "bg-card border-border"
                : "bg-muted/30 border-border/50 opacity-60"
            }`}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />

            <span className="flex-1 text-sm font-medium text-foreground">{section.label}</span>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => moveSection(index, -1)}
                disabled={index === 0}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => moveSection(index, 1)}
                disabled={index === sections.length - 1}
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </Button>
            </div>

            <Switch
              checked={section.visible}
              onCheckedChange={() => toggleVisibility(index)}
            />
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Note: Hero, Navbar, Footer, and ChatBot are always shown and cannot be reordered here.
      </p>
    </div>
  );
};

export default SectionOrderEditor;
