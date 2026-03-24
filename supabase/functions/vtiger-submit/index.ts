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

// Whitelist of allowed VTiger form field names
const ALLOWED_FIELDS = new Set([
  'lastname', 'firstname', 'email', 'phone', 'mobile',
  'company', 'designation', 'leadsource', 'description',
  'cf_990', 'cf_994', 'cf_998', 'cf_1002', 'cf_1006', 'cf_1014', 'cf_1020', 'cf_1022', 'cf_1044',
  'assigned_user_id', 'salutationtype', 'closingdate',
  '__vtrftk', 'publicid', 'urlencodeenable', 'name',
  'mailingstreet', 'mailingcity', 'mailingpobox',
]);

// Max lengths for field values
const MAX_FIELD_VALUE_LENGTH = 2000;
const MAX_FIELDS = 30;

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

    // Validate field count
    const entries = Object.entries(formData);
    if (entries.length > MAX_FIELDS) {
      return new Response(
        JSON.stringify({ success: false, message: "Too many fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build URL-encoded form body with whitelisted fields only
    const params = new URLSearchParams();
    for (const [key, value] of entries) {
      if (!ALLOWED_FIELDS.has(key)) {
        console.warn(`Blocked non-whitelisted field: ${key}`);
        continue;
      }
      const strValue = String(value ?? "").substring(0, MAX_FIELD_VALUE_LENGTH);
      params.append(key, strValue);
    }

    // Rate limiting: check recent submissions via Supabase
    const email = formData.email ? String(formData.email) : null;
    if (email) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Get CRM URL from settings or use default
    let vtigerUrl = "https://appscomsolutions.com/VTCRM/modules/Webforms/capture.php";
    try {
      const { data: crmSettings } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "crm_settings")
        .maybeSingle();
      if (crmSettings?.value && (crmSettings.value as any).crm_url) {
        vtigerUrl = (crmSettings.value as any).crm_url;
      }
    } catch { /* use default */ }

    const response = await fetch(vtigerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      },
      body: params.toString(),
    });

    const responseText = await response.text();
    const isSuccess = response.ok;

    console.log(`Vtiger response status: ${response.status}, body length: ${responseText.length}`);

    return new Response(
      JSON.stringify({
        success: isSuccess,
        status: response.status,
        message: isSuccess
          ? "Enquiry submitted successfully to CRM"
          : "Failed to submit enquiry. Please try again later.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Vtiger proxy error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to connect to CRM system. Please try again later.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
