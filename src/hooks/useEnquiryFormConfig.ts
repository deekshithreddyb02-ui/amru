import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type EnquiryFieldKey =
  | "firstName"
  | "phoneNumber"
  | "expectedClose"
  | "distance"
  | "scans"
  | "areaType"
  | "getLocation";

export type EnquiryFormConfig = {
  intro: string;
  thank_you: string;
  fields: Record<EnquiryFieldKey, { visible: boolean; required: boolean }>;
};

const DEFAULTS: EnquiryFormConfig = {
  intro: "",
  thank_you: "Thank you! Our team will contact you soon.",
  fields: {
    firstName:     { visible: true, required: false },
    phoneNumber:   { visible: true, required: false },
    expectedClose: { visible: true, required: true },
    distance:      { visible: true, required: true },
    scans:         { visible: true, required: true },
    areaType:      { visible: true, required: true },
    getLocation:   { visible: true, required: false },
  },
};

let cache: EnquiryFormConfig | null = null;

export const useEnquiryFormConfig = () => {
  const [cfg, setCfg] = useState<EnquiryFormConfig>(cache ?? DEFAULTS);
  useEffect(() => {
    if (cache) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("site_content")
          .select("metadata")
          .eq("section_key", "enquiry_form")
          .maybeSingle();
        const meta = (data?.metadata as Partial<EnquiryFormConfig>) || {};
        const merged: EnquiryFormConfig = {
          intro: meta.intro ?? DEFAULTS.intro,
          thank_you: meta.thank_you ?? DEFAULTS.thank_you,
          fields: { ...DEFAULTS.fields, ...(meta.fields || {}) } as EnquiryFormConfig["fields"],
        };
        cache = merged;
        setCfg(merged);
      } catch {
        /* defaults */
      }
    })();
  }, []);
  return cfg;
};
