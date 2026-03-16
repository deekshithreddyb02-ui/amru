import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Save, Trash2, Edit2, X, Upload, ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceDeviceConfig from "./ServiceDeviceConfig";

interface Service {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string | null;
  is_main: boolean;
  display_order: number;
}

const ServiceEditor = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Service>>({});
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    image: "",
    link: "",
    is_main: false,
  });
  const newFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `services/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("main").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("main").getPublicUrl(path);
      return data.publicUrl;
    } catch (error: any) {
      toast({ title: "Upload failed", description: sanitizeError(error), variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (file: File, target: "new" | "edit") => {
    const url = await uploadImage(file);
    if (!url) return;
    if (target === "new") {
      setNewService((prev) => ({ ...prev, image: url }));
    } else {
      setEditData((prev) => ({ ...prev, image: url }));
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("display_order");

    if (error) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setEditData({ ...service });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("services")
      .update({
        title: editData.title,
        description: editData.description,
        image: editData.image,
        link: editData.link || null,
        is_main: editData.is_main,
        display_order: editData.display_order,
      })
      .eq("id", id);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Service updated" });
      setEditingId(null);
      setEditData({});
      fetchServices();
    }
  };

  const handleAdd = async () => {
    if (!newService.title || !newService.description || !newService.image) {
      toast({ title: "Error", description: "Title, description and image are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    const maxOrder = services.length > 0 ? Math.max(...services.map((s) => s.display_order)) : 0;
    const { error } = await supabase.from("services").insert({
      title: newService.title,
      description: newService.description,
      image: newService.image,
      link: newService.link || null,
      is_main: newService.is_main,
      display_order: maxOrder + 1,
    });

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Service added" });
      setNewService({ title: "", description: "", image: "", link: "", is_main: false });
      setAdding(false);
      fetchServices();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Service deleted" });
      fetchServices();
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
    <div className="space-y-4">
      <Tabs defaultValue="manage">
        <TabsList className="w-full">
          <TabsTrigger value="manage" className="flex-1">Manage Services</TabsTrigger>
          <TabsTrigger value="device" className="flex-1">Device Views</TabsTrigger>
        </TabsList>
        <TabsContent value="device">
          <ServiceDeviceConfig />
        </TabsContent>
        <TabsContent value="manage">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Services ({services.length})</h3>
        <Button size="sm" onClick={() => setAdding(!adding)}>
          {adding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {adding ? "Cancel" : "Add Service"}
        </Button>
      </div>

      {adding && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base">New Service</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input value={newService.title} onChange={(e) => setNewService({ ...newService, title: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Image *</Label>
              <div className="mt-1 space-y-2">
                <input
                  ref={newFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "new");
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => newFileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Choose Image
                </Button>
                {newService.image && (
                  <div className="flex items-center gap-2">
                    <img src={newService.image} alt="Preview" className="w-16 h-12 object-cover rounded border" />
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">{newService.image.split("/").pop()}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>Link (optional)</Label>
              <Input value={newService.link} onChange={(e) => setNewService({ ...newService, link: e.target.value })} className="mt-1" placeholder="https://..." />
            </div>
            <Button onClick={handleAdd} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Service
            </Button>
          </CardContent>
        </Card>
      )}

      {services.map((service) => {
        const isEditing = editingId === service.id;

        return (
          <Card key={service.id}>
            <CardContent className="p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label>Title</Label>
                    <Input value={editData.title || ""} onChange={(e) => setEditData({ ...editData, title: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={editData.description || ""} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Image</Label>
                    <div className="mt-1 space-y-2">
                      <input
                        ref={editFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "edit");
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => editFileRef.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Change Image
                      </Button>
                      {editData.image && (
                        <div className="flex items-center gap-2">
                          <img src={editData.image} alt="Preview" className="w-16 h-12 object-cover rounded border" />
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{editData.image.split("/").pop()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Link (optional)</Label>
                    <Input value={editData.link || ""} onChange={(e) => setEditData({ ...editData, link: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Display Order</Label>
                    <Input type="number" value={editData.display_order || 0} onChange={(e) => setEditData({ ...editData, display_order: parseInt(e.target.value) })} className="mt-1 w-24" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={editData.is_main || false} onCheckedChange={(v) => setEditData({ ...editData, is_main: v })} />
                    <Label>Show in main row</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSave(service.id)} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <img src={service.image} alt={service.title} className="w-16 h-12 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">{service.title}</h4>
                      {service.is_main && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Main</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{service.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Order: {service.display_order}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(service)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceEditor;
