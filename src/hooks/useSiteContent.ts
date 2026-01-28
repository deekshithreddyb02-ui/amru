import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface SiteContent {
  id: string;
  section_key: string;
  title: string | null;
  content: string | null;
  metadata: Json | null;
  updated_at: string;
}

export const useSiteContent = (sectionKey: string) => {
  const [data, setData] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, [sectionKey]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data: content, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("section_key", sectionKey)
        .maybeSingle();

      if (error) throw error;
      setData(content);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (updates: Partial<SiteContent>) => {
    if (!data?.id) return { error: "No content found" };

    try {
      const { error } = await supabase
        .from("site_content")
        .update({
          title: updates.title,
          content: updates.content,
          metadata: updates.metadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (error) throw error;
      await fetchContent();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  return { data, loading, error, updateContent, refetch: fetchContent };
};

export const useAllSiteContent = () => {
  const [data, setData] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllContent();
  }, []);

  const fetchAllContent = async () => {
    try {
      setLoading(true);
      const { data: content, error } = await supabase
        .from("site_content")
        .select("*")
        .order("section_key");

      if (error) throw error;
      setData(content || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (id: string, updates: Partial<SiteContent>) => {
    try {
      const { error } = await supabase
        .from("site_content")
        .update({
          title: updates.title,
          content: updates.content,
          metadata: updates.metadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      await fetchAllContent();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  return { data, loading, error, updateContent, refetch: fetchAllContent };
};
