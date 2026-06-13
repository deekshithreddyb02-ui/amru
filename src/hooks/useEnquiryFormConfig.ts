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
  | "fullName"
  | "email"
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
  fullName: "Full Name",
  email: "Email",
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

export const DEFAULT_PLACEHOLDERS: Partial<Record<EnquiryLabelKey, string>> = {
  fullName: "Enter customer's full name",
  email: "name@example.com",
  phoneNumber: "+91 98765 43210",
  mailingCity: "City",
  mailingState: "State",
  service: "e.g. Groundwater Survey",
  description: "Additional notes…",
};

export type LeadDialogFieldKey =
  | "email"
  | "phone"
  | "city"
  | "state"
  | "serviceNeeded"
  | "notes";

export const DEFAULT_LEAD_FIELDS: Record<LeadDialogFieldKey, { visible: boolean; required: boolean }> = {
  email:         { visible: true, required: false },
  phone:         { visible: true, required: false },
  city:          { visible: true, required: false },
  state:         { visible: true, required: false },
  serviceNeeded: { visible: true, required: false },
  notes:         { visible: true, required: false },
};

/* ─────────────────────────────────────────────────────────────
 * Add Lead dialog (in-CRM) — full layout configuration
 * ───────────────────────────────────────────────────────────── */

export type AddLeadSectionKey = "leadDetails" | "addressDetails" | "descriptionDetails";

export type AddLeadFieldKey =
  // Lead Details
  | "bizArea" | "serviceNeeded" | "firstName" | "lastName"
  | "whatsapp" | "primaryPhone" | "mobilePhone" | "primaryEmail"
  | "areaType" | "totalArea" | "expectedClose" | "distanceKm"
  | "shape" | "numScans" | "bizCost" | "company"
  | "gstin" | "industry" | "designation" | "annualRevenue"
  | "leadSource" | "numEmployees" | "secondaryEmail" | "fax"
  | "website" | "emailOptOut" | "leadStatus" | "rating" | "assignedTo"
  // Address Details
  | "street" | "poBox" | "postalCode" | "city"
  | "country" | "state" | "mapsLocation"
  // Description
  | "description";

export const DEFAULT_ADD_LEAD_SECTIONS: Record<AddLeadSectionKey, { visible: boolean; title: string }> = {
  leadDetails:        { visible: true, title: "Lead Details" },
  addressDetails:     { visible: true, title: "Address Details" },
  descriptionDetails: { visible: true, title: "Description Details" },
};

export const ADD_LEAD_FIELDS_BY_SECTION: Record<AddLeadSectionKey, { key: AddLeadFieldKey; label: string }[]> = {
  leadDetails: [
    { key: "bizArea",        label: "BIZ Area" },
    { key: "serviceNeeded",  label: "Service Needed" },
    { key: "firstName",      label: "First Name" },
    { key: "lastName",       label: "Last Name" },
    { key: "whatsapp",       label: "WhatsApp Number" },
    { key: "primaryPhone",   label: "Primary Phone" },
    { key: "mobilePhone",    label: "Mobile Phone" },
    { key: "primaryEmail",   label: "Primary Email" },
    { key: "areaType",       label: "Area Type" },
    { key: "totalArea",      label: "Total Area" },
    { key: "expectedClose",  label: "Expected Close Date" },
    { key: "distanceKm",     label: "Distance in KM" },
    { key: "shape",          label: "Shape" },
    { key: "numScans",       label: "Number of Scans" },
    { key: "bizCost",        label: "Total BIZ Cost" },
    { key: "company",        label: "Company" },
    { key: "gstin",          label: "GSTIN" },
    { key: "industry",       label: "Industry" },
    { key: "designation",    label: "Designation" },
    { key: "annualRevenue",  label: "Annual Revenue" },
    { key: "leadSource",     label: "Lead Source" },
    { key: "numEmployees",   label: "Number of Employees" },
    { key: "secondaryEmail", label: "Secondary Email" },
    { key: "fax",            label: "Fax" },
    { key: "website",        label: "Website" },
    { key: "emailOptOut",    label: "Email Opt Out" },
    { key: "leadStatus",     label: "Lead Status" },
    { key: "rating",         label: "Rating" },
    { key: "assignedTo",     label: "Assigned To" },
  ],
  addressDetails: [
    { key: "street",        label: "Street" },
    { key: "poBox",         label: "PO Box" },
    { key: "postalCode",    label: "Postal Code" },
    { key: "city",          label: "City" },
    { key: "country",       label: "Country" },
    { key: "state",         label: "State" },
    { key: "mapsLocation",  label: "Maps Location" },
  ],
  descriptionDetails: [
    { key: "description",   label: "Description" },
  ],
};

export type AddLeadFieldConfig = { visible: boolean; label?: string; options?: string[] };

const buildDefaultAddLeadFields = (): Record<AddLeadFieldKey, AddLeadFieldConfig> => {
  const out = {} as Record<AddLeadFieldKey, AddLeadFieldConfig>;
  (Object.keys(ADD_LEAD_FIELDS_BY_SECTION) as AddLeadSectionKey[]).forEach((s) => {
    ADD_LEAD_FIELDS_BY_SECTION[s].forEach(({ key }) => {
      out[key] = { visible: true };
    });
  });
  return out;
};

export const DEFAULT_ADD_LEAD_FIELDS = buildDefaultAddLeadFields();

/** Default dropdown options for select-type Add Lead fields. Used when no custom list is configured. */
export const ADD_LEAD_DROPDOWN_OPTIONS: Partial<Record<AddLeadFieldKey, string[]>> = {
  bizArea:      ["Maharashtra", "Telangana", "Andhra Pradesh", "Karnataka", "Other India", "Other Country"],
  serviceNeeded:["GWS", "Geological Survey", "Soil Testing", "Other"],
  areaType:     ["OPEN PLOT", "FARM LAND", "INDUSTRIAL", "RESIDENTIAL"],
  distanceKm:   ["0 - 30 KM", "30 - 60 KM", "60 - 100 KM", "100+ KM"],
  shape:        ["Serial", "Parallel", "Mixed"],
  numScans:     ["1","2","3","4","5","6","7","8","9","10"],
  industry:     ["Agriculture", "Construction", "Government", "Real Estate", "Other"],
  leadSource:   ["JDH", "Website", "Referral", "Walk-in", "Campaign"],
  leadStatus:   ["Contacted", "Attempted Contact", "Cold", "Hot", "Junk", "Qualified", "Lost"],
  rating:       ["Acquired", "Active", "Market Failed", "Project Cancelled", "Shutdown"],
};

export const DEFAULT_SALUTATIONS = ["None", "Mr.", "Mrs.", "Ms.", "Dr."];

export type AddLeadDialogConfig = {
  sections: Record<AddLeadSectionKey, { visible: boolean; title: string }>;
  fields: Record<AddLeadFieldKey, AddLeadFieldConfig>;
  salutations?: string[];
};

export const DEFAULT_ADD_LEAD_DIALOG: AddLeadDialogConfig = {
  sections: DEFAULT_ADD_LEAD_SECTIONS,
  fields: DEFAULT_ADD_LEAD_FIELDS,
  salutations: DEFAULT_SALUTATIONS,
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
  placeholders: Partial<Record<EnquiryLabelKey, string>>;
  leadFields: Record<LeadDialogFieldKey, { visible: boolean; required: boolean }>;
  addLeadDialog: AddLeadDialogConfig;
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
  placeholders: DEFAULT_PLACEHOLDERS,
  leadFields: DEFAULT_LEAD_FIELDS,
  addLeadDialog: DEFAULT_ADD_LEAD_DIALOG,
};

let cache: EnquiryFormConfig | null = null;

const mergeAddLeadDialog = (m?: Partial<AddLeadDialogConfig>): AddLeadDialogConfig => ({
  sections: {
    ...DEFAULT_ADD_LEAD_SECTIONS,
    ...((m?.sections || {}) as any),
  } as AddLeadDialogConfig["sections"],
  fields: {
    ...DEFAULT_ADD_LEAD_FIELDS,
    ...((m?.fields || {}) as any),
  } as AddLeadDialogConfig["fields"],
});

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
          placeholders: { ...DEFAULT_PLACEHOLDERS, ...(meta.placeholders || {}) },
          leadFields: { ...DEFAULT_LEAD_FIELDS, ...(meta.leadFields || {}) } as EnquiryFormConfig["leadFields"],
          addLeadDialog: mergeAddLeadDialog(meta.addLeadDialog),
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
