import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Edit2, X } from "lucide-react";
import { SiteContent, useAllSiteContent } from "@/hooks/useSiteContent";

const sectionLabels: Record<string, string> = {
  hero: "Hero Section",
  about: "About Us",
  whyus: "Why Choose Us",
};

const ContentEditor = () => {
  const { data: contents, loading, updateContent, refetch } = useAllSiteContent();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<SiteContent>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const startEdit = (content: SiteContent) => {
    setEditingId(content.id);
    setEditData({
      title: content.title,
      content: content.content,
      metadata: content.metadata,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    const result = await updateContent(id, editData);
    setSaving(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Content updated successfully" });
      setEditingId(null);
      setEditData({});
    }
  };

  const updateMetadataField = (key: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      metadata: {
        ...(prev.metadata as Record<string, any> || {}),
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {contents.map((content) => {
        const isEditing = editingId === content.id;
        const metadata = (isEditing ? editData.metadata : content.metadata) as Record<string, any> | null;

        return (
          <Card key={content.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {sectionLabels[content.section_key] || content.section_key}
              </CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => startEdit(content)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={cancelEdit}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSave(content.id)} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                {isEditing ? (
                  <Input
                    value={editData.title || ""}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">{content.title || "-"}</p>
                )}
              </div>

              <div>
                <Label>Content</Label>
                {isEditing ? (
                  <Textarea
                    value={editData.content || ""}
                    onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                    className="mt-1 min-h-[100px]"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {content.content || "-"}
                  </p>
                )}
              </div>

              {/* Hero-specific fields */}
              {content.section_key === "hero" && (
                <div>
                  <Label>Background Image URL</Label>
                  {isEditing ? (
                    <Input
                      value={metadata?.backgroundImage || ""}
                      onChange={(e) => updateMetadataField("backgroundImage", e.target.value)}
                      className="mt-1"
                      placeholder="https://..."
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {(content.metadata as any)?.backgroundImage || "-"}
                    </p>
                  )}
                </div>
              )}

              {content.section_key === "hero" && (
                <div>
                  <Label>Services (one per line)</Label>
                  {isEditing ? (
                    <Textarea
                      value={(metadata?.services || []).join("\n")}
                      onChange={(e) => updateMetadataField("services", e.target.value.split("\n").filter(Boolean))}
                      className="mt-1 min-h-[150px]"
                    />
                  ) : (
                    <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside">
                      {((content.metadata as any)?.services || []).map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(content.updated_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ContentEditor;
