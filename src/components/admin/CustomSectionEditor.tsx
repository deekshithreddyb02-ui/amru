import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
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
} from "@/components/ui/dialog";
import { Plus, Loader2, Save, Trash2, Edit, Type, Image, Video, MousePointerClick, Search } from "lucide-react";

interface CustomSectionRow {
  id: string;
  section_key: string;
  section_type: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  button_text: string | null;
  button_link: string | null;
  background_color: string | null;
  text_color: string | null;
}

const SECTION_TYPES = [
  { value: "text", label: "Text / Content Block", icon: Type, description: "Heading and paragraph content" },
  { value: "banner", label: "Image Banner", icon: Image, description: "Full-width image with optional overlay" },
  { value: "video", label: "Video Embed", icon: Video, description: "Embed a YouTube or other video" },
  { value: "cta", label: "Call to Action", icon: MousePointerClick, description: "Highlighted block with button" },
  { value: "hero_banner", label: "Hero Banner", icon: Image, description: "Large hero-style banner with text" },
  { value: "features", label: "Features Grid", icon: Type, description: "Grid of feature cards with icons" },
  { value: "stats", label: "Statistics / Counters", icon: Type, description: "Animated number counters" },
  { value: "faq", label: "FAQ / Accordion", icon: Type, description: "Expandable questions and answers" },
  { value: "team", label: "Team / People", icon: Type, description: "Team member profiles with photos" },
  { value: "pricing", label: "Pricing Table", icon: Type, description: "Compare pricing plans side by side" },
  { value: "timeline", label: "Timeline / History", icon: Type, description: "Chronological milestones or steps" },
  { value: "logos", label: "Logo / Client Wall", icon: Image, description: "Display partner or client logos" },
  { value: "map", label: "Map Embed", icon: Type, description: "Embed a Google Maps location" },
  { value: "download", label: "Download / Resource", icon: Type, description: "Downloadable file or resource link" },
  { value: "newsletter", label: "Newsletter Signup", icon: Type, description: "Email subscription call-to-action" },
  { value: "divider", label: "Divider / Spacer", icon: Type, description: "Visual separator between sections" },
];

const CustomSectionEditor = () => {
  const { toast } = useToast();
  const [sections, setSections] = useState<CustomSectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<CustomSectionRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState("text");
  const [typeSearch, setTypeSearch] = useState("");

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("custom_sections")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setSections(data as CustomSectionRow[]);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newLabel.trim()) {
      toast({ title: "Error", description: "Please enter a section name", variant: "destructive" });
      return;
    }
    setSaving(true);
    const sectionKey = `custom_${Date.now()}`;
    try {
      const { data, error } = await supabase
        .from("custom_sections")
        .insert({
          section_key: sectionKey,
          section_type: newType,
          title: newLabel.trim(),
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Also add to homepage_sections in site_settings
      const { data: settingsData } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "homepage_sections")
        .maybeSingle();

      const currentSections = settingsData?.value
        ? (typeof settingsData.value === "string" ? JSON.parse(settingsData.value) : settingsData.value)
        : [];

      const updatedSections = [
        ...currentSections,
        { key: sectionKey, label: newLabel.trim(), visible: true },
      ];

      if (settingsData) {
        await supabase
          .from("site_settings")
          .update({ value: updatedSections as any, updated_at: new Date().toISOString() })
          .eq("key", "homepage_sections");
      } else {
        await supabase
          .from("site_settings")
          .insert({ key: "homepage_sections", value: updatedSections as any });
      }

      setSections((prev) => [...prev, data as CustomSectionRow]);
      setNewLabel("");
      setNewType("text");
      setCreateDialogOpen(false);
      toast({ title: "Created", description: "New section added. Edit it to add content, then refresh homepage." });
    } catch (err: any) {
      toast({ title: "Error", description: sanitizeError(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSection) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("custom_sections")
        .update({
          title: editingSection.title,
          content: editingSection.content,
          image_url: editingSection.image_url,
          video_url: editingSection.video_url,
          button_text: editingSection.button_text,
          button_link: editingSection.button_link,
          background_color: editingSection.background_color,
          text_color: editingSection.text_color,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", editingSection.id);
      if (error) throw error;

      // Update label in homepage_sections too
      const { data: settingsData } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "homepage_sections")
        .maybeSingle();

      if (settingsData?.value) {
        const currentSections = typeof settingsData.value === "string" ? JSON.parse(settingsData.value) : settingsData.value;
        const updated = (currentSections as any[]).map((s: any) =>
          s.key === editingSection.section_key ? { ...s, label: editingSection.title || s.label } : s
        );
        await supabase
          .from("site_settings")
          .update({ value: updated as any, updated_at: new Date().toISOString() })
          .eq("key", "homepage_sections");
      }

      setSections((prev) => prev.map((s) => (s.id === editingSection.id ? editingSection : s)));
      setDialogOpen(false);
      toast({ title: "Saved", description: "Section updated. Refresh homepage to see changes." });
    } catch (err: any) {
      toast({ title: "Error", description: sanitizeError(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (section: CustomSectionRow) => {
    if (!confirm(`Delete section "${section.title}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from("custom_sections").delete().eq("id", section.id);
      if (error) throw error;

      // Remove from homepage_sections
      const { data: settingsData } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "homepage_sections")
        .maybeSingle();

      if (settingsData?.value) {
        const currentSections = typeof settingsData.value === "string" ? JSON.parse(settingsData.value) : settingsData.value;
        const filtered = (currentSections as any[]).filter((s: any) => s.key !== section.section_key);
        await supabase
          .from("site_settings")
          .update({ value: filtered as any, updated_at: new Date().toISOString() })
          .eq("key", "homepage_sections");
      }

      setSections((prev) => prev.filter((s) => s.id !== section.id));
      toast({ title: "Deleted", description: "Section removed." });
    } catch (err: any) {
      toast({ title: "Error", description: sanitizeError(err), variant: "destructive" });
    }
  };

  const typeInfo = (type: string) => SECTION_TYPES.find((t) => t.value === type);

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
            Custom Sections
          </h3>
          <p className="text-sm text-muted-foreground">
            Create and manage custom homepage sections.
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Section</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Section Name</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Our Mission"
                />
              </div>
              <div>
                <Label>Section Type</Label>
                <div className="relative mt-2 mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={typeSearch}
                    onChange={(e) => setTypeSearch(e.target.value)}
                    placeholder="Search section types…"
                    className="pl-9"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-xl p-2">
                  {SECTION_TYPES.filter(
                    (t) =>
                      t.label.toLowerCase().includes(typeSearch.toLowerCase()) ||
                      t.description.toLowerCase().includes(typeSearch.toLowerCase())
                  ).map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        onClick={() => setNewType(t.value)}
                        className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-all ${
                          newType === t.value
                            ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20"
                            : "hover:bg-muted/50 border border-transparent"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{t.label}</p>
                          <p className="text-[10px] text-muted-foreground">{t.description}</p>
                        </div>
                      </button>
                    );
                  })}
                  {SECTION_TYPES.filter(
                    (t) =>
                      t.label.toLowerCase().includes(typeSearch.toLowerCase()) ||
                      t.description.toLowerCase().includes(typeSearch.toLowerCase())
                  ).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No matching section types</p>
                  )}
                </div>
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full gap-1.5">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Section
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          No custom sections yet. Click "Add Section" to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((section) => {
            const info = typeInfo(section.section_type);
            const Icon = info?.icon || Type;
            return (
              <div
                key={section.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{section.title || section.section_key}</p>
                  <p className="text-xs text-muted-foreground">{info?.label || section.section_type}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingSection({ ...section });
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(section)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
          </DialogHeader>
          {editingSection && (
            <div className="space-y-4 pt-2">
              <div>
                <Label>Title</Label>
                <Input
                  value={editingSection.title || ""}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                />
              </div>

              {(editingSection.section_type === "text" || editingSection.section_type === "cta" || editingSection.section_type === "video" || editingSection.section_type === "banner") && (
                <div>
                  <Label>Content / Description</Label>
                  <Textarea
                    value={editingSection.content || ""}
                    onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })}
                    rows={4}
                  />
                </div>
              )}

              {(editingSection.section_type === "banner") && (
                <div>
                  <Label>Image URL</Label>
                  <Input
                    value={editingSection.image_url || ""}
                    onChange={(e) => setEditingSection({ ...editingSection, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}

              {editingSection.section_type === "video" && (
                <div>
                  <Label>Video URL (YouTube or embed URL)</Label>
                  <Input
                    value={editingSection.video_url || ""}
                    onChange={(e) => setEditingSection({ ...editingSection, video_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              )}

              {editingSection.section_type === "cta" && (
                <>
                  <div>
                    <Label>Button Text</Label>
                    <Input
                      value={editingSection.button_text || ""}
                      onChange={(e) => setEditingSection({ ...editingSection, button_text: e.target.value })}
                      placeholder="Learn More"
                    />
                  </div>
                  <div>
                    <Label>Button Link</Label>
                    <Input
                      value={editingSection.button_link || ""}
                      onChange={(e) => setEditingSection({ ...editingSection, button_link: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Background Color</Label>
                  <Input
                    value={editingSection.background_color || ""}
                    onChange={(e) => setEditingSection({ ...editingSection, background_color: e.target.value })}
                    placeholder="#f0f0f0 or transparent"
                  />
                </div>
                <div>
                  <Label>Text Color</Label>
                  <Input
                    value={editingSection.text_color || ""}
                    onChange={(e) => setEditingSection({ ...editingSection, text_color: e.target.value })}
                    placeholder="#333333"
                  />
                </div>
              </div>

              <Button onClick={handleSaveEdit} disabled={saving} className="w-full gap-1.5">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomSectionEditor;
