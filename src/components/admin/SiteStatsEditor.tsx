import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Plus, Trash2, MapPin, Award, Building2, Users, LucideIcon, Info } from "lucide-react";

const iconOptions = ["Award", "Building2", "Users", "MapPin"];
const iconMap: Record<string, LucideIcon> = { Award, Building2, Users, MapPin };

interface Stat {
  icon: string;
  value: string;
  label: string;
}

/** Sections where each stat appears, keyed by label keyword */
const statUsageMap: Record<string, string[]> = {
  experience: ["Hero Section", "About Us Section", "Services Section"],
  years: ["Hero Section", "About Us Section", "Services Section"],
  projects: ["Hero Section", "About Us Section", "Testimonials Section"],
  completed: ["Hero Section", "About Us Section", "Testimonials Section"],
  coverage: ["Hero Section", "About Us Section"],
  offices: ["About Us Section"],
  locations: ["About Us Section"],
};

const getUsedIn = (label: string): string[] => {
  const lower = label.toLowerCase();
  for (const [keyword, sections] of Object.entries(statUsageMap)) {
    if (lower.includes(keyword)) return sections;
  }
  return ["About Us Section"];
};

const SiteStatsEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [stats, setStats] = useState<Stat[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

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

      toast({ title: "Saved", description: "Site statistics updated across all sections" });
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
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Centralized Statistics Manager</p>
              <p>Changes here automatically update across all sections of your website — Hero, About Us, Services, and Testimonials. Each stat shows where it appears.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Site Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Statistics</Label>
            <Button variant="outline" size="sm" onClick={addStat}>
              <Plus className="w-4 h-4 mr-1" /> Add Stat
            </Button>
          </div>

          {stats.map((stat, i) => {
            const IconComp = iconMap[stat.icon] || Award;
            const usedIn = getUsedIn(stat.label);
            return (
              <Card key={i} className="border-border/50">
                <CardContent className="pt-4 pb-3 space-y-3">
                  <div className="flex gap-2 items-center">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComp className="w-4 h-4 text-primary" />
                    </div>
                    <select
                      value={stat.icon}
                      onChange={(e) => updateStat(i, "icon", e.target.value)}
                      className="px-2 py-2 text-sm rounded-md border border-input bg-background"
                    >
                      {iconOptions.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                    <Input
                      value={stat.value}
                      onChange={(e) => updateStat(i, "value", e.target.value)}
                      placeholder="Value (e.g. 35+)"
                      className="w-28"
                    />
                    <Input
                      value={stat.label}
                      onChange={(e) => updateStat(i, "label", e.target.value)}
                      placeholder="Label"
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeStat(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pl-11">
                    <span className="text-xs text-muted-foreground">Appears in:</span>
                    {usedIn.map((section) => (
                      <Badge key={section} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {section}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save & Update All Sections
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteStatsEditor;
