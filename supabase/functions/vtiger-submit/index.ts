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

interface CrmConfig {
  label: string;
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
    const { formData } = body;

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

    // Load CRM configs from DB
    let crmConfigs: CrmConfig[] = [];
    try {
      const { data: crmSettings } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "crm_settings")
        .maybeSingle();

      if (crmSettings?.value) {
        const v = crmSettings.value as any;
        if (Array.isArray(v.crms)) {
          crmConfigs = (v.crms as CrmConfig[]).filter(c => c.enabled && c.crm_url);
        } else if (v.crm_url) {
          // Legacy single-CRM format
          crmConfigs = [{
            label: "Primary",
            crm_url: v.crm_url,
            token: v.token || "",
            public_id: v.public_id || "",
            form_name: v.form_name || "",
            enabled: true,
          }];
        }
      }
    } catch { /* fallback below */ }

    // Fallback if no CRM configured
    if (crmConfigs.length === 0) {
      crmConfigs = [{
        label: "Default",
        crm_url: "https://appscomsolutions.com/VTCRM/modules/Webforms/capture.php",
        token: "sid:c13e250974b2e7ea0ef70de7fecdcc0cc6191ec5,1773737516",
        public_id: "85432a838b51f53a6bc4ec937b64ee40",
        form_name: "Enquiry Form: Telangana - Amruta HydroGeo Services",
        enabled: true,
      }];
    }

    // Submit to all enabled CRMs
    const results: { label: string; success: boolean; status: number }[] = [];

    for (const crm of crmConfigs) {
      try {
        // Build params with CRM-specific token/publicid/name
        const params = new URLSearchParams();
        for (const [key, value] of entries) {
          if (!ALLOWED_FIELDS.has(key)) continue;
          // Override CRM-specific fields
          if (key === '__vtrftk') { params.append(key, crm.token); continue; }
          if (key === 'publicid') { params.append(key, crm.public_id); continue; }
          if (key === 'name') { params.append(key, crm.form_name); continue; }
          const strValue = String(value ?? "").substring(0, MAX_FIELD_VALUE_LENGTH);
          params.append(key, strValue);
        }
        // Ensure CRM fields are present even if not in formData
        if (!params.has('__vtrftk')) params.append('__vtrftk', crm.token);
        if (!params.has('publicid')) params.append('publicid', crm.public_id);
        if (!params.has('name')) params.append('name', crm.form_name);

        const response = await fetch(crm.crm_url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
          body: params.toString(),
        });

        const responseText = await response.text();
        console.log(`CRM [${crm.label}] response: ${response.status}, body: ${responseText.length} chars`);
        results.push({ label: crm.label, success: response.ok, status: response.status });
      } catch (err) {
        console.error(`CRM [${crm.label}] error:`, err);
        results.push({ label: crm.label, success: false, status: 0 });
      }
    }

    const anySuccess = results.some(r => r.success);
    const allSuccess = results.every(r => r.success);

    return new Response(
      JSON.stringify({
        success: anySuccess,
        allSuccess,
        results,
        message: allSuccess
          ? "Enquiry submitted to all CRMs successfully"
          : anySuccess
            ? "Enquiry submitted to some CRMs. Check admin for details."
            : "Failed to submit to any CRM. Please try again later.",
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
