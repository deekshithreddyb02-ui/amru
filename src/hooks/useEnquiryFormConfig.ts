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

export type EnquiryLabelKey =
  | "intro"
  | "firstName"
  | "lastName"
  | "expectedClose"
  | "whatsapp"
  | "phoneNumber"
  | "getLocation"
  | "bizArea"
  | "distance"
  | "service"
  | "scans"
  | "areaType"
  | "totalArea"
  | "description"
  | "mailingStreet"
  | "mailingCity"
  | "mailingState"
  | "pinCode"
  | "submit";

export const DEFAULT_LABELS: Record<EnquiryLabelKey, string> = {
  intro: "",
  firstName: "First Name",
  lastName: "Last Name",
  expectedClose: "Expected Close Date",
  whatsapp: "WhatsApp Number",
  phoneNumber: "Phone Number",
  getLocation: "Get My Location",
  bizArea: "BIZ Area",
  distance: "Distance",
  service: "Service",
  scans: "Scans",
  areaType: "Area Type",
  totalArea: "Total Area",
  description: "Description",
  mailingStreet: "Mailing Street",
  mailingCity: "Mailing City",
  mailingState: "State",
  pinCode: "PIN Code",
  submit: "Submit Enquiry",
};

export type EnquiryRoutingKey =
  | "Maharashtra"
  | "Telangana"
  | "AndhraPradesh"
  | "Karnataka"
  | "OtherIndia"
  | "OtherCountry";

export type EnquiryFormConfig = {
  intro: string;
  thank_you: string;
  fields: Record<EnquiryFieldKey, { visible: boolean; required: boolean }>;
  labels: Record<EnquiryLabelKey, string>;
  routing?: Record<EnquiryRoutingKey, string>;
  routing_assignees?: Record<EnquiryRoutingKey, string[]>;
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
  labels: DEFAULT_LABELS,
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
          labels: { ...DEFAULT_LABELS, ...(meta.labels || {}) } as EnquiryFormConfig["labels"],
          routing: meta.routing,
          routing_assignees: meta.routing_assignees,
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
