import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAdminGallery } from "@/hooks/useGallery";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2, Eye, EyeOff, Plus, Upload, Image } from "lucide-react";

const GalleryEditor = () => {
  const { images, loading, addImage, deleteImage, toggleVisibility, updateCaption } = useAdminGallery();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `gallery/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("main")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("main")
        .getPublicUrl(fileName);

      const result = await addImage(urlData.publicUrl, caption);
      if (result.error) throw new Error(result.error);

      toast({ title: "Success", description: "Image uploaded" });
      setCaption("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddUrl = async () => {
    if (!imageUrl.trim()) return;
    setAdding(true);
    const result = await addImage(imageUrl, caption);
    setAdding(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Image added" });
      setImageUrl("");
      setCaption("");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteImage(id);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Image removed" });
    }
  };

  const handleToggle = async (id: string, isVisible: boolean) => {
    const result = await toggleVisibility(id, isVisible);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
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
      {/* Add Image */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Caption (optional)</Label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Image description"
              className="mt-1"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label>Upload File</Label>
              <div className="mt-1">
                <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploading ? "Uploading..." : "Choose image file"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-end text-sm text-muted-foreground">or</div>

            <div className="flex-1">
              <Label>Image URL</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
                <Button onClick={handleAddUrl} disabled={adding || !imageUrl.trim()}>
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Image className="w-5 h-5" /> Gallery Images ({images.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No images yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`relative group rounded-lg overflow-hidden border border-border ${
                    !image.is_visible ? "opacity-50" : ""
                  }`}
                >
                  <div className="aspect-square">
                    <img
                      src={image.image_url}
                      alt={image.caption || "Gallery"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {image.caption && (
                    <p className="text-xs text-muted-foreground p-2 truncate">{image.caption}</p>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggle(image.id, image.is_visible)}
                    >
                      {image.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(image.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GalleryEditor;
