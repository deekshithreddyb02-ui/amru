import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { Loader2, Plus, Trash2, Edit2, Save, X } from "lucide-react";

interface QuickLink {
  label: string;
  url: string;
  emoji: string;
}

interface FooterData {
  description: string;
  tagline_quote: string;
  head_office_label: string;
  head_office_address: string;
  locations_text: string;
  locations_subtext: string;
  email: string;
  website: string;
  phone_numbers: string[];
  help_email: string;
  help_website: string;
  quick_links: QuickLink[];
  tagline: string;
  version: string;
}

const defaultFooter: FooterData = {
  description: "Leading the World's Sustainable Water Revolution for over 35 years.",
  tagline_quote: '"Meeting the Challenge of Nature" - Not Just a Slogan, A Way of Life.',
  head_office_label: "Head Office:",
  head_office_address: "Off: 207, Bhoomi Allium, Kokane Chowk, Pimple Soudagar, Pune, Maharashtra-411027, INDIA",
  locations_text: "PUNE | MUMBAI | HYDERABAD | BANGALORE",
  locations_subtext: "INDIA & REST OF THE WORLD",
  email: "rain@amrutawater.com",
  website: "www.amrutawater.com",
  phone_numbers: ["+91-741-0030-418", "+91-741-0030-417"],
  help_email: "rain@amrutawater.com",
  help_website: "www.amrutawater.com",
  quick_links: [
    { label: "Simple Calculator", url: "https://rain.amrutageo.com/", emoji: "📊" },
    { label: "Expert Tool", url: "https://rain.amrutageo.com/", emoji: "🔮" },
    { label: "Project Dashboard", url: "https://rain.amrutageo.com/", emoji: "📁" },
    { label: "Login Portal", url: "https://rain.amrutageo.com/", emoji: "🔐" },
    { label: "JustDial", url: "https://www.justdial.com/", emoji: "📞" },
  ],
  tagline: "Start Now — Let Every Drop Count",
  version: "1.0.0.2601232241",
};

const FooterEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [footer, setFooter] = useState<FooterData>(defaultFooter);
  const [editData, setEditData] = useState<FooterData>(defaultFooter);

  useEffect(() => {
    fetchFooter();
  }, []);

  const fetchFooter = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_content")
        .select("metadata")
        .eq("section_key", "footer")
        .single();

      if (!error && data?.metadata) {
        const meta = data.metadata as unknown as FooterData;
        setFooter({ ...defaultFooter, ...meta });
        setEditData({ ...defaultFooter, ...meta });
      }
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setEditData({ ...footer });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditData({ ...footer });
    setIsEditing(false);
  };

  const saveFooter = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("site_content")
        .select("id")
        .eq("section_key", "footer")
        .single();

      if (existing) {
        const { error } = await supabase
          .from("site_content")
          .update({ metadata: editData as any, updated_at: new Date().toISOString() })
          .eq("section_key", "footer");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_content")
          .insert({ section_key: "footer", metadata: editData as any });
        if (error) throw error;
      }

      setFooter({ ...editData });
      setIsEditing(false);
      toast({ title: "Saved", description: "Footer updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof FooterData, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const updateQuickLink = (index: number, field: keyof QuickLink, value: string) => {
    const links = [...editData.quick_links];
    links[index] = { ...links[index], [field]: value };
    updateField("quick_links", links);
  };

  const addQuickLink = () => {
    updateField("quick_links", [...editData.quick_links, { label: "", url: "", emoji: "🔗" }]);
  };

  const removeQuickLink = (index: number) => {
    updateField("quick_links", editData.quick_links.filter((_, i) => i !== index));
  };

  const updatePhone = (index: number, value: string) => {
    const phones = [...editData.phone_numbers];
    phones[index] = value;
    updateField("phone_numbers", phones);
  };

  const addPhone = () => {
    updateField("phone_numbers", [...editData.phone_numbers, ""]);
  };

  const removePhone = (index: number) => {
    updateField("phone_numbers", editData.phone_numbers.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Footer Content</CardTitle>
        {isEditing ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={cancelEditing} disabled={saving}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={saveFooter} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={startEditing}>
            <Edit2 className="w-4 h-4 mr-1" /> Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Brand Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase">Brand Section</h3>
          <div>
            <Label>Description</Label>
            <Textarea value={editData.description} onChange={e => updateField("description", e.target.value)} disabled={!isEditing} className="mt-1" />
          </div>
          <div>
            <Label>Tagline Quote (italic)</Label>
            <Input value={editData.tagline_quote} onChange={e => updateField("tagline_quote", e.target.value)} disabled={!isEditing} className="mt-1" />
          </div>
        </div>

        {/* Head Office */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase">Head Office</h3>
          <div>
            <Label>Label</Label>
            <Input value={editData.head_office_label} onChange={e => updateField("head_office_label", e.target.value)} disabled={!isEditing} className="mt-1" />
          </div>
          <div>
            <Label>Address</Label>
            <Textarea value={editData.head_office_address} onChange={e => updateField("head_office_address", e.target.value)} disabled={!isEditing} className="mt-1" />
          </div>
        </div>

        {/* Locations */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase">Locations</h3>
          <div>
            <Label>Locations Text</Label>
            <Input value={editData.locations_text} onChange={e => updateField("locations_text", e.target.value)} disabled={!isEditing} className="mt-1" />
          </div>
          <div>
            <Label>Sub-text</Label>
            <Input value={editData.locations_subtext} onChange={e => updateField("locations_subtext", e.target.value)} disabled={!isEditing} className="mt-1" />
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase">Contact Info</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input value={editData.email} onChange={e => updateField("email", e.target.value)} disabled={!isEditing} className="mt-1" />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={editData.website} onChange={e => updateField("website", e.target.value)} disabled={!isEditing} className="mt-1" />
            </div>
          </div>
        </div>

        {/* Get Expert Help */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase">Get Expert Help</h3>
          <div>
            <Label>Phone Numbers</Label>
            {editData.phone_numbers.map((phone, i) => (
              <div key={i} className="flex gap-2 mt-1">
                <Input value={phone} onChange={e => updatePhone(i, e.target.value)} disabled={!isEditing} />
                {isEditing && (
                  <Button variant="ghost" size="icon" onClick={() => removePhone(i)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            {isEditing && (
              <Button variant="outline" size="sm" onClick={addPhone} className="mt-2">
                <Plus className="w-4 h-4 mr-1" /> Add Phone
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Help Email</Label>
              <Input value={editData.help_email} onChange={e => updateField("help_email", e.target.value)} disabled={!isEditing} className="mt-1" />
            </div>
            <div>
              <Label>Help Website</Label>
              <Input value={editData.help_website} onChange={e => updateField("help_website", e.target.value)} disabled={!isEditing} className="mt-1" />
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase">Quick Links</h3>
          {editData.quick_links.map((link, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="w-16">
                <Label className="text-xs">Emoji</Label>
                <Input value={link.emoji} onChange={e => updateQuickLink(i, "emoji", e.target.value)} disabled={!isEditing} className="mt-1" />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Label</Label>
                <Input value={link.label} onChange={e => updateQuickLink(i, "label", e.target.value)} disabled={!isEditing} className="mt-1" />
              </div>
              <div className="flex-1">
                <Label className="text-xs">URL</Label>
                <Input value={link.url} onChange={e => updateQuickLink(i, "url", e.target.value)} disabled={!isEditing} className="mt-1" />
              </div>
              {isEditing && (
                <Button variant="ghost" size="icon" onClick={() => removeQuickLink(i)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          {isEditing && (
            <Button variant="outline" size="sm" onClick={addQuickLink}>
              <Plus className="w-4 h-4 mr-1" /> Add Link
            </Button>
          )}
        </div>

        {/* Bottom */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase">Bottom Section</h3>
          <div>
            <Label>Tagline</Label>
            <Input value={editData.tagline} onChange={e => updateField("tagline", e.target.value)} disabled={!isEditing} className="mt-1" />
          </div>
          <div>
            <Label>Version</Label>
            <Input value={editData.version} onChange={e => updateField("version", e.target.value)} disabled={!isEditing} className="mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FooterEditor;
