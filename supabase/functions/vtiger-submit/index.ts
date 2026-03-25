import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://amru.lovable.app',
  'https://amrutahydrogeoservices.lovable.app',
  'https://id-preview--0777c7b6-982c-43cb-bf7c-8d4b1cc406fd.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

const getCorsHeaders = (origin: string | null) => {
  const allowOrigin = origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o) || origin === o)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

const ALLOWED_FIELDS = new Set([
  'lastname', 'firstname', 'email', 'phone', 'mobile',
  'company', 'designation', 'leadsource', 'description',
  'cf_990', 'cf_994', 'cf_998', 'cf_1002', 'cf_1006', 'cf_1014', 'cf_1020', 'cf_1022', 'cf_1044',
  'assigned_user_id', 'salutationtype', 'closingdate',
  '__vtrftk', 'publicid', 'urlencodeenable', 'name',
  'mailingstreet', 'mailingcity', 'mailingpobox',
]);

const MAX_FIELD_VALUE_LENGTH = 2000;
const MAX_FIELDS = 30;

// Map BIZ Area values to state_key used in CRM settings
const STATE_KEY_MAP: Record<string, string> = {
  maharashtra: "maharashtra",
  telangana: "telangana",
  andhrapradesh: "andhrapradesh",
  karnataka: "karnataka",
  others: "others",
};

interface CrmConfig {
  label: string;
  state_key: string;
  crm_url: string;
  token: string;
  public_id: string;
  form_name: string;
  enabled: boolean;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { formData, bizArea } = body;

    if (!formData || typeof formData !== "object") {
      return new Response(
        JSON.stringify({ success: false, message: "Missing form data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const entries = Object.entries(formData);
    if (entries.length > MAX_FIELDS) {
      return new Response(
        JSON.stringify({ success: false, message: "Too many fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting
    const email = formData.email ? String(formData.email) : null;
    if (email) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('email', email)
        .gte('created_at', oneHourAgo);

      if (count !== null && count >= 5) {
        return new Response(
          JSON.stringify({ success: false, message: "Too many submissions. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Resolve state_key from bizArea
    const rawBizArea = (bizArea || formData.cf_990 || "Others").toLowerCase().replace(/\s+/g, "");
    const stateKey = STATE_KEY_MAP[rawBizArea] || "others";

    // Load CRM configs from DB
    let crmConfigs: CrmConfig[] = [];
    let matchedCrm: CrmConfig | null = null;

    try {
      const { data: crmSettings } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "crm_settings")
        .maybeSingle();

      if (crmSettings?.value) {
        const v = crmSettings.value as any;
        if (Array.isArray(v.crms)) {
          crmConfigs = v.crms as CrmConfig[];
          // Find CRM matching the state
          matchedCrm = crmConfigs.find(c => c.state_key === stateKey && c.enabled && c.crm_url) || null;
          // Fallback to "others" if no match
          if (!matchedCrm) {
            matchedCrm = crmConfigs.find(c => c.state_key === "others" && c.enabled && c.crm_url) || null;
          }
          // Fallback to any enabled CRM
          if (!matchedCrm) {
            matchedCrm = crmConfigs.find(c => c.enabled && c.crm_url) || null;
          }
        } else if (v.crm_url) {
          // Legacy single-CRM format
          matchedCrm = {
            label: "Primary",
            state_key: "telangana",
            crm_url: v.crm_url,
            token: v.token || "",
            public_id: v.public_id || "",
            form_name: v.form_name || "",
            enabled: true,
          };
        }
      }
    } catch { /* fallback below */ }

    // Fallback if no CRM configured
    if (!matchedCrm) {
      matchedCrm = {
        label: "Default",
        state_key: "telangana",
        crm_url: "https://appscomsolutions.com/VTCRM/modules/Webforms/capture.php",
        token: "sid:c13e250974b2e7ea0ef70de7fecdcc0cc6191ec5,1773737516",
        public_id: "85432a838b51f53a6bc4ec937b64ee40",
        form_name: "Enquiry Form: Telangana - Amruta HydroGeo Services",
        enabled: true,
      };
    }

    // Submit to the matched CRM only
    const crm = matchedCrm;
    let result = { label: crm.label, success: false, status: 0 };

    try {
      const params = new URLSearchParams();
      for (const [key, value] of entries) {
        if (!ALLOWED_FIELDS.has(key)) continue;
        if (key === '__vtrftk') { params.append(key, crm.token); continue; }
        if (key === 'publicid') { params.append(key, crm.public_id); continue; }
        if (key === 'name') { params.append(key, crm.form_name); continue; }
        const strValue = String(value ?? "").substring(0, MAX_FIELD_VALUE_LENGTH);
        params.append(key, strValue);
      }
      if (!params.has('__vtrftk')) params.append('__vtrftk', crm.token);
      if (!params.has('publicid')) params.append('publicid', crm.public_id);
      if (!params.has('name')) params.append('name', crm.form_name);

      const response = await fetch(crm.crm_url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
        body: params.toString(),
      });

      const responseText = await response.text();
      console.log(`CRM [${crm.label}] (state: ${stateKey}) response: ${response.status}, body: ${responseText.length} chars`);
      result = { label: crm.label, success: response.ok, status: response.status };
    } catch (err) {
      console.error(`CRM [${crm.label}] error:`, err);
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        crmLabel: result.label,
        stateKey,
        message: result.success
          ? `Enquiry submitted to ${crm.label} CRM successfully`
          : "Failed to submit to CRM. Please try again later.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Vtiger proxy error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to connect to CRM system. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
