import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SectionConfig {
  key: string;
  label: string;
  visible: boolean;
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  { key: "services", label: "Services", visible: true },
  { key: "about", label: "About Us", visible: true },
  { key: "whyus", label: "Why Us", visible: true },
  { key: "certifications", label: "Certifications", visible: true },
  { key: "testimonials", label: "Testimonials", visible: true },
  { key: "gallery", label: "Gallery", visible: true },
  { key: "contact", label: "Contact", visible: true },
  { key: "offices", label: "Office Locations", visible: true },
  { key: "legal", label: "Legal Notice", visible: true },
  { key: "feedback", label: "Customer Feedback", visible: true },
];

export const useSectionOrder = () => {
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "homepage_sections")
          .maybeSingle();

        if (!error && data?.value) {
          const saved = (typeof data.value === "string" ? JSON.parse(data.value) : data.value) as SectionConfig[];
          const savedKeys = new Set(saved.map((s) => s.key));
          setSections([
            ...saved,
            ...DEFAULT_SECTIONS.filter((d) => !savedKeys.has(d.key)),
          ]);
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { sections, loading };
};
