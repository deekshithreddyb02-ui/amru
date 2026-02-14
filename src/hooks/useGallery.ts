import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export const useGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      console.error("Error fetching gallery:", err);
    } finally {
      setLoading(false);
    }
  };

  return { images, loading, refetch: fetchImages };
};

export const useAdminGallery = () => {
  const { images, loading, refetch } = useGallery();

  const addImage = async (imageUrl: string, caption?: string) => {
    const maxOrder = images.length > 0 ? Math.max(...images.map(i => i.display_order)) + 1 : 0;
    const { error } = await supabase
      .from("gallery_images")
      .insert({ image_url: imageUrl, caption: caption || null, display_order: maxOrder });

    if (error) return { error: error.message };
    await refetch();
    return { error: null };
  };

  const deleteImage = async (id: string) => {
    const { error } = await supabase.from("gallery_images").delete().eq("id", id);
    if (error) return { error: error.message };
    await refetch();
    return { error: null };
  };

  const toggleVisibility = async (id: string, isVisible: boolean) => {
    const { error } = await supabase
      .from("gallery_images")
      .update({ is_visible: !isVisible })
      .eq("id", id);

    if (error) return { error: error.message };
    await refetch();
    return { error: null };
  };

  const updateCaption = async (id: string, caption: string) => {
    const { error } = await supabase
      .from("gallery_images")
      .update({ caption })
      .eq("id", id);

    if (error) return { error: error.message };
    await refetch();
    return { error: null };
  };

  return { images, loading, refetch, addImage, deleteImage, toggleVisibility, updateCaption };
};
