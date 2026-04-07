import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_FIELD_VALUE_LENGTH = 2000;
const MAX_FIELDS = 40;

const STATE_KEY_MAP: Record<string, string> = {
  maharashtra: "maharashtra",
  telangana: "telangana",
  andhrapradesh: "andhrapradesh",
  karnataka: "karnataka",
  others: "others",
};

// Default field mappings (Telangana original)
const DEFAULT_FIELD_MAPPINGS: Record<string, string> = {
  lastname: "lastname",
  expected_close: "cf_1044",
  whatsapp: "cf_1022",
  biz_area: "cf_990",
  distance: "cf_998",
  service_needed: "cf_994",
  num_scans: "cf_1014",
  area_type: "cf_1002",
  total_area: "cf_1006",
  biz_cost: "cf_1020",
  description: "description",
  mailing_street: "mailingstreet",
  mailing_city: "mailingcity",
  mailing_pincode: "mailingpobox",
};

interface CrmConfig {
  label: string;
  state_key: string;
  crm_url: string;
  token: string;
  public_id: string;
  form_name: string;
  enabled: boolean;
  field_mappings?: Record<string, string>;
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
    const rateLimitEmail = email && email.includes('@') && !email.endsWith('@enquiry.amrutageo.com') ? email : null;
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

    // Load CRM settings
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
          label: "Default",
          state_key: "telangana",
          crm_url: "https://appscomsolutions.com/VTCRM/modules/Webforms/capture.php",
          token: "sid:c13e250974b2e7ea0ef70de7fecdcc0cc6191ec5,1773737516",
          public_id: "85432a838b51f53a6bc4ec937b64ee40",
          form_name: "Enquiry Form: Telangana - Amruta HydroGeo Services",
          enabled: true,
        };
      }

      crmLabel = matchedCrm.label;

      // Get field mappings for this CRM (merge with defaults)
      const fm = { ...DEFAULT_FIELD_MAPPINGS, ...(matchedCrm.field_mappings || {}) };

      try {
        const params = new URLSearchParams();
        
        // Build form data using per-CRM field mappings
        // formData uses logical field names; we map them to CRM-specific field IDs
        for (const [logicalKey, crmFieldId] of Object.entries(fm)) {
          const value = formData[logicalKey];
          if (value !== undefined && value !== null) {
            const strValue = String(value).substring(0, MAX_FIELD_VALUE_LENGTH);
            params.append(crmFieldId, strValue);
          }
        }

        // Also pass through any raw cf_* fields from formData that aren't in the mapping
        // (for backward compatibility)
        for (const [key, value] of entries) {
          if (key.startsWith('cf_') || key === 'urlencodeenable') {
            if (!params.has(key)) {
              const strValue = String(value ?? "").substring(0, MAX_FIELD_VALUE_LENGTH);
              params.append(key, strValue);
            }
          }
        }

        // Always set CRM auth fields
        params.set('__vtrftk', matchedCrm.token);
        params.set('publicid', matchedCrm.public_id);
        params.set('name', matchedCrm.form_name);
        if (!params.has('urlencodeenable')) params.set('urlencodeenable', '1');

        // Pass through reCAPTCHA response if present
        if (formData['g-recaptcha-response']) {
          params.set('g-recaptcha-response', String(formData['g-recaptcha-response']));
        }

        console.log(`CRM [${matchedCrm.label}] sending to ${matchedCrm.crm_url} with ${params.toString().length} bytes`);

        const response = await fetch(matchedCrm.crm_url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
          body: params.toString(),
        });

        const responseText = await response.text();
        console.log(`CRM [${matchedCrm.label}] (state: ${stateKey}) response: ${response.status}, body: ${responseText.substring(0, 500)}`);

        if (response.ok) {
          try {
            const responseJson = JSON.parse(responseText);
            if (responseJson.success === false) {
              console.error(`CRM [${matchedCrm.label}] rejected: ${responseJson.error?.message || 'Unknown error'}`);
              crmSuccess = false;
            } else {
              crmSuccess = true;
            }
          } catch {
            crmSuccess = true;
          }
        } else {
          crmSuccess = false;
        }
      } catch (err) {
        console.error(`CRM [${crmLabel}] error:`, err);
      }

      // Update CRM status in DB
      if (dbSaveSuccess && dbRecord?.email) {
        const newStatus = crmSuccess ? "success" : "failed";
        await supabase
          .from("contact_messages")
          .update({ crm_status: newStatus, crm_label: crmLabel })
          .eq("email", dbRecord.email)
          .order("created_at", { ascending: false })
          .limit(1);
      }
    }

    const overallSuccess = (routing.store_in_db ? dbSaveSuccess : true) && (routing.send_to_crm ? crmSuccess : true);
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
