import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OfficeContact {
  city: string;
  whatsapp: string;
  phone: string;
  email?: string;
}

export const useOfficeContacts = () => {
  const [offices, setOffices] = useState<OfficeContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("metadata")
          .eq("section_key", "contact_details")
          .maybeSingle();

        if (!error && data?.metadata) {
          const meta = data.metadata as Record<string, any>;
          if (Array.isArray(meta.offices)) {
            setOffices(meta.offices);
          }
        }
      } catch {
        // fallback empty
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  return { offices, loading };
};
