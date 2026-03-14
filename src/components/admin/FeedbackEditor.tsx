import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Plus, Eye, EyeOff, RefreshCw, Upload, Image, Video, GripVertical, Link } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface FeedbackItem {
  id: string;
  title: string | null;
  description: string | null;
  media_type: string;
  media_url: string;
  display_order: number;
  is_visible: boolean;
}

const FeedbackEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", media_type: "image" as "image" | "video" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [mediaUrl, setMediaUrl] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customer_feedback")
      .select("*")
      .order("display_order");
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadMode === "file" && !selectedFile) {
      toast({ title: "Error", description: "Please select a file", variant: "destructive" });
      return;
    }
    if (uploadMode === "url" && !mediaUrl.trim()) {
      toast({ title: "Error", description: "Please enter a URL", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      let finalUrl = mediaUrl.trim();

      if (uploadMode === "file" && selectedFile) {
        const ext = selectedFile.name.split(".").pop();
        const fileName = `feedback/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("main").upload(fileName, selectedFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("main").getPublicUrl(fileName);
        finalUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase.from("customer_feedback").insert({
        title: formData.title || null,
        description: formData.description || null,
        media_type: formData.media_type,
        media_url: finalUrl,
        display_order: items.length,
      });
      if (insertError) throw insertError;

      toast({ title: "Feedback added successfully" });
      setFormData({ title: "", description: "", media_type: "image" });
      setSelectedFile(null);
      setMediaUrl("");
      setShowForm(false);
      fetchItems();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const toggleVisibility = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("customer_feedback")
      .update({ is_visible: !current })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_visible: !current } : i)));
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this feedback item?")) return;
    const { error } = await supabase.from("customer_feedback").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Deleted" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Customer Feedback</h3>
          <p className="text-sm text-muted-foreground">{items.length} items · Upload images & videos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchItems} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="bg-muted/50 rounded-xl p-5 border border-border space-y-4">
          <div className="flex gap-3">
            <Button
              type="button"
              variant={formData.media_type === "image" ? "default" : "outline"}
              size="sm"
              onClick={() => setFormData({ ...formData, media_type: "image" })}
              className="gap-2"
            >
              <Image className="w-4 h-4" /> Image
            </Button>
            <Button
              type="button"
              variant={formData.media_type === "video" ? "default" : "outline"}
              size="sm"
              onClick={() => setFormData({ ...formData, media_type: "video" })}
              className="gap-2"
            >
              <Video className="w-4 h-4" /> Video
            </Button>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant={uploadMode === "file" ? "default" : "outline"}
              size="sm"
              onClick={() => setUploadMode("file")}
              className="gap-2"
            >
              <Upload className="w-4 h-4" /> From File
            </Button>
            <Button
              type="button"
              variant={uploadMode === "url" ? "default" : "outline"}
              size="sm"
              onClick={() => setUploadMode("url")}
              className="gap-2"
            >
              <Link className="w-4 h-4" /> From URL
            </Button>
          </div>

          {uploadMode === "file" ? (
            <div>
              <label className="text-sm font-medium mb-1 block">
                {formData.media_type === "image" ? "Image" : "Video"} File *
              </label>
              <input
                ref={fileRef}
                type="file"
                accept={formData.media_type === "image" ? "image/*" : "video/*"}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-sm border border-input rounded-md p-2 bg-background"
              />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium mb-1 block">
                {formData.media_type === "image" ? "Image" : "Video"} URL *
              </label>
              <Input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/media.jpg"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1 block">Title (optional)</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="E.g. Project completion at Site X"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Description (optional)</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setSelectedFile(null); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading} className="gap-2">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload
            </Button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No feedback items yet. Click "Add" to upload.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {item.media_type === "video" ? (
                  <video src={item.media_url} className="w-full h-full object-cover" muted preload="metadata" />
                ) : (
                  <img src={item.media_url} alt={item.title || ""} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 right-2 bg-background/80 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                  {item.media_type}
                </div>
              </div>
              <div className="p-3 space-y-2">
                {item.title && <p className="font-medium text-sm truncate">{item.title}</p>}
                {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.is_visible}
                      onCheckedChange={() => toggleVisibility(item.id, item.is_visible)}
                    />
                    <span className="text-xs text-muted-foreground">{item.is_visible ? "Visible" : "Hidden"}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteItem(item.id)}
                    className="text-destructive hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackEditor;
