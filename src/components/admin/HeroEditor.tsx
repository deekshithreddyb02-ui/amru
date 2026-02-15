import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Save } from "lucide-react";

const HeroEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [services, setServices] = useState<string[]>([]);

  useEffect(() => {
    fetchHero();
  }, []);

  const fetchHero = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("section_key", "hero")
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setId(data.id);
        setTitle(data.title || "");
        const meta = data.metadata as any;
        setBackgroundImage(meta?.backgroundImage || "");
        setServices(meta?.services || []);
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
      const metadata = { backgroundImage, services } as unknown as import("@/integrations/supabase/types").Json;
      const payload = { title, metadata, updated_at: new Date().toISOString() };

      if (id) {
        const { error } = await supabase.from("site_content").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_content").insert([{ section_key: "hero" as const, ...payload }]);
        if (error) throw error;
      }

      toast({ title: "Saved", description: "Hero section updated successfully" });
      await fetchHero();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addService = () => setServices([...services, ""]);
  const removeService = (i: number) => setServices(services.filter((_, idx) => idx !== i));
  const updateService = (i: number, val: string) => {
    const copy = [...services];
    copy[i] = val;
    setServices(copy);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Section</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Hero title" />
        </div>

        <div className="space-y-2">
          <Label>Background Image URL</Label>
          <Input value={backgroundImage} onChange={(e) => setBackgroundImage(e.target.value)} placeholder="https://..." />
          {backgroundImage && (
            <img src={backgroundImage} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-md" />
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Service Highlights</Label>
            <Button variant="outline" size="sm" onClick={addService}><Plus className="w-4 h-4 mr-1" /> Add</Button>
          </div>
          {services.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input value={s} onChange={(e) => updateService(i, e.target.value)} placeholder="Service name" />
              <Button variant="ghost" size="icon" onClick={() => removeService(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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

export default HeroEditor;
