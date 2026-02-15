import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";

const iconOptions = ["Users", "Lightbulb", "Search", "Shield", "Clock", "HeartHandshake"];

interface Reason {
  icon: string;
  title: string;
  description: string;
}

const WhyUsEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [reasons, setReasons] = useState<Reason[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("section_key", "whyus")
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setId(data.id);
        setTitle(data.title || "");
        setSubtitle(data.content || "");
        const meta = data.metadata as any;
        setReasons(meta?.reasons || []);
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
      const metadata = { reasons } as unknown as import("@/integrations/supabase/types").Json;
      const payload = { title, content: subtitle, metadata, updated_at: new Date().toISOString() };

      if (id) {
        const { error } = await supabase.from("site_content").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_content").insert([{ section_key: "whyus" as const, ...payload }]);
        if (error) throw error;
      }

      toast({ title: "Saved", description: "Why Choose Us section updated successfully" });
      await fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addReason = () => setReasons([...reasons, { icon: "Users", title: "", description: "" }]);
  const removeReason = (i: number) => setReasons(reasons.filter((_, idx) => idx !== i));
  const updateReason = (i: number, field: keyof Reason, val: string) => {
    const copy = [...reasons];
    copy[i] = { ...copy[i], [field]: val };
    setReasons(copy);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Why Choose Us Section</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Why Choose Us" />
        </div>

        <div className="space-y-2">
          <Label>Subtitle</Label>
          <Textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} rows={3} placeholder="Subtitle text..." />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Reasons</Label>
            <Button variant="outline" size="sm" onClick={addReason}><Plus className="w-4 h-4 mr-1" /> Add Reason</Button>
          </div>
          {reasons.map((reason, i) => (
            <div key={i} className="p-3 border border-border rounded-lg space-y-2">
              <div className="flex gap-2 items-center">
                <select
                  value={reason.icon}
                  onChange={(e) => updateReason(i, "icon", e.target.value)}
                  className="px-2 py-2 text-sm rounded-md border border-input bg-background"
                >
                  {iconOptions.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                </select>
                <Input value={reason.title} onChange={(e) => updateReason(i, "title", e.target.value)} placeholder="Reason title" className="flex-1" />
                <Button variant="ghost" size="icon" onClick={() => removeReason(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
              <Textarea value={reason.description} onChange={(e) => updateReason(i, "description", e.target.value)} rows={2} placeholder="Description..." />
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

export default WhyUsEditor;
