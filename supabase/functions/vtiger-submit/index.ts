import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

interface LeadRouting {
  store_in_db: boolean;
  send_to_crm: boolean;
}

serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { formData, bizArea, dbRecord } = body;

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

    // Rate limiting by email/phone
    const email = formData.email ? String(formData.email) : (dbRecord?.email || null);
    // Ensure email is valid for rate limiting (skip if it's a generated placeholder)
    const rateLimitEmail = email && email.includes('@') && !email.endsWith('@enquiry.amrutageo.com') ? email : null;
    // Rate limit by WhatsApp/phone number
    const rateLimitKey = dbRecord?.whatsapp || dbRecord?.phone || rateLimitEmail;
    if (rateLimitKey) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .or(`whatsapp.eq.${rateLimitKey},phone.eq.${rateLimitKey},email.eq.${rateLimitKey}`)
        .gte('created_at', oneHourAgo);

      if (count !== null && count >= 5) {
        return new Response(
          JSON.stringify({ success: false, message: "Too many submissions. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Load CRM settings (includes routing config)
    let routing: LeadRouting = { store_in_db: true, send_to_crm: true };
    let crmConfigs: CrmConfig[] = [];

    try {
      const { data: crmSettings } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "crm_settings")
        .maybeSingle();

      if (crmSettings?.value) {
        const v = crmSettings.value as any;
        if (v.routing) {
          routing = {
            store_in_db: v.routing.store_in_db !== false,
            send_to_crm: v.routing.send_to_crm !== false,
          };
        }
        if (Array.isArray(v.crms)) {
          crmConfigs = v.crms as CrmConfig[];
        }
      }
    } catch { /* defaults */ }

    let dbSaveSuccess = false;
    let crmSuccess = false;
    let crmLabel = "";
    const rawBizArea = (bizArea || formData.cf_990 || "Others").toLowerCase().replace(/\s+/g, "");
    const stateKey = STATE_KEY_MAP[rawBizArea] || "others";

    // --- Step 1: Save to database if enabled ---
    if (routing.store_in_db && dbRecord && typeof dbRecord === "object") {
      try {
        const sanitized: Record<string, any> = {};
        const allowedDbFields = new Set([
          'name', 'email', 'phone', 'service', 'message', 'whatsapp',
          'biz_area', 'distance', 'service_needed', 'num_scans',
          'area_type', 'area_value', 'mailing_street', 'mailing_city',
          'mailing_pincode', 'latitude', 'longitude', 'country', 'expected_close',
        ]);
        for (const [k, v] of Object.entries(dbRecord)) {
          if (allowedDbFields.has(k)) {
            sanitized[k] = v === undefined ? null : v;
          }
        }
        sanitized.crm_status = routing.send_to_crm ? "pending" : "db_only";
        sanitized.crm_label = null; // Will be updated after CRM match

        const { error: dbErr } = await supabase.from("contact_messages").insert(sanitized);
        if (dbErr) {
          console.error("DB save error:", dbErr);
        } else {
          dbSaveSuccess = true;
        }
      } catch (err) {
        console.error("DB save exception:", err);
      }
    }

    // --- Step 2: Send to CRM if enabled ---
    if (routing.send_to_crm) {
      let matchedCrm: CrmConfig | null = null;

      if (crmConfigs.length > 0) {
        matchedCrm = crmConfigs.find(c => c.state_key === stateKey && c.enabled && c.crm_url) || null;
        if (!matchedCrm) matchedCrm = crmConfigs.find(c => c.state_key === "others" && c.enabled && c.crm_url) || null;
        if (!matchedCrm) matchedCrm = crmConfigs.find(c => c.enabled && c.crm_url) || null;
      }

      // Fallback default
      if (!matchedCrm) {
        matchedCrm = {
          label: "Default (TS-CRM)",
          state_key: "telangana",
          crm_url: "https://appscomsolutions.com/HYD-VTCRM/modules/Webforms/capture.php",
          token: "sid:ee3fcd87c4f067554d85b0375cb53e41f7bdd8dc,1775110829",
          public_id: "25127a10562daa4d6686c790ca52b0dd",
          form_name: "TS-CRM",
          enabled: true,
        };
      }

      crmLabel = matchedCrm.label;

      try {
        const params = new URLSearchParams();
        for (const [key, value] of entries) {
          if (!ALLOWED_FIELDS.has(key)) continue;
          if (key === '__vtrftk') { params.append(key, matchedCrm.token); continue; }
          if (key === 'publicid') { params.append(key, matchedCrm.public_id); continue; }
          if (key === 'name') { params.append(key, matchedCrm.form_name); continue; }
          const strValue = String(value ?? "").substring(0, MAX_FIELD_VALUE_LENGTH);
          params.append(key, strValue);
        }
        if (!params.has('__vtrftk')) params.append('__vtrftk', matchedCrm.token);
        if (!params.has('publicid')) params.append('publicid', matchedCrm.public_id);
        if (!params.has('name')) params.append('name', matchedCrm.form_name);

        const response = await fetch(matchedCrm.crm_url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
          body: params.toString(),
        });

        const responseText = await response.text();
        console.log(`CRM [${matchedCrm.label}] (state: ${stateKey}) response: ${response.status}, body: ${responseText.substring(0, 500)}`);

        // Vtiger capture.php returns HTTP 200 even on failure, so check body
        if (response.ok) {
          try {
            const responseJson = JSON.parse(responseText);
            // Vtiger returns {"success":false,"error":{"message":"..."}} on failure
            if (responseJson.success === false) {
              console.error(`CRM [${matchedCrm.label}] rejected: ${responseJson.error?.message || 'Unknown error'}`);
              crmSuccess = false;
            } else {
              crmSuccess = true;
            }
          } catch {
            // Non-JSON response (e.g. HTML redirect on success) — treat as success
            crmSuccess = true;
          }
        } else {
          crmSuccess = false;
        }
      } catch (err) {
        console.error(`CRM [${crmLabel}] error:`, err);
      }

      // Update CRM status and label in DB if we saved
      if (dbSaveSuccess && dbRecord?.email) {
        const newStatus = crmSuccess ? "success" : "failed";
        await supabase
          .from("contact_messages")
          .update({ crm_status: newStatus, crm_label: crmLabel || null })
          .eq("email", dbRecord.email)
          .order("created_at", { ascending: false })
          .limit(1);
      }
    }

    // Determine overall success
    const overallSuccess = (routing.store_in_db ? dbSaveSuccess : true) && (routing.send_to_crm ? crmSuccess : true);
    // At least one action must be enabled
    const anyAction = routing.store_in_db || routing.send_to_crm;

    return new Response(
      JSON.stringify({
        success: anyAction && overallSuccess,
        stateKey,
        crmLabel,
        dbSaved: routing.store_in_db ? dbSaveSuccess : "skipped",
        crmSent: routing.send_to_crm ? crmSuccess : "skipped",
        message: !anyAction
          ? "Lead routing is disabled. Please contact admin."
          : overallSuccess
            ? "Enquiry submitted successfully"
            : "Submission partially failed. Please try again later.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Vtiger proxy error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to process enquiry. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
