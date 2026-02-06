import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_WHATSAPP = "917410030418";

export const useWhatsAppNumber = () => {
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNumber = async () => {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("metadata")
          .eq("section_key", "settings")
          .maybeSingle();

        if (!error && data?.metadata) {
          const metadata = data.metadata as Record<string, string>;
          if (metadata.whatsapp_number) {
            setWhatsappNumber(metadata.whatsapp_number);
          }
        }
      } catch {
        // Use default on error
      } finally {
        setLoading(false);
      }
    };

    fetchNumber();
  }, []);

  return { whatsappNumber, loading };
};
