import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";

const iconOptions = ["Award", "Building2", "Users", "MapPin"];

interface Stat {
  icon: string;
  value: string;
  label: string;
}

const AboutEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("section_key", "about")
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setId(data.id);
        setTitle(data.title || "");
        setContent(data.content || "");
        const meta = data.metadata as any;
        setStats(meta?.stats || []);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const metadata = { stats } as unknown as import("@/integrations/supabase/types").Json;
      const payload = { title, content, metadata, updated_at: new Date().toISOString() };

      if (id) {
        const { error } = await supabase.from("site_content").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_content").insert([{ section_key: "about" as const, ...payload }]);
        if (error) throw error;
      }

      toast({ title: "Saved", description: "About section updated successfully" });
      await fetchAbout();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addStat = () => setStats([...stats, { icon: "Award", value: "", label: "" }]);
  const removeStat = (i: number) => setStats(stats.filter((_, idx) => idx !== i));
  const updateStat = (i: number, field: keyof Stat, val: string) => {
    const copy = [...stats];
    copy[i] = { ...copy[i], [field]: val };
    setStats(copy);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>About Us Section</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="About Us" />
        </div>

        <div className="space-y-2">
          <Label>Content (use double newlines for paragraphs, **bold** for emphasis)</Label>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="About us content..." />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Statistics</Label>
            <Button variant="outline" size="sm" onClick={addStat}><Plus className="w-4 h-4 mr-1" /> Add Stat</Button>
          </div>
          {stats.map((stat, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                value={stat.icon}
                onChange={(e) => updateStat(i, "icon", e.target.value)}
                className="px-2 py-2 text-sm rounded-md border border-input bg-background"
              >
                {iconOptions.map(icon => <option key={icon} value={icon}>{icon}</option>)}
              </select>
              <Input value={stat.value} onChange={(e) => updateStat(i, "value", e.target.value)} placeholder="Value (e.g. 35+)" className="w-24" />
              <Input value={stat.label} onChange={(e) => updateStat(i, "label", e.target.value)} placeholder="Label" className="flex-1" />
              <Button variant="ghost" size="icon" onClick={() => removeStat(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
};

export default AboutEditor;
