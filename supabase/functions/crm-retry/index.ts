import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load CRM settings
    const { data: crmSettings } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "crm_settings")
      .maybeSingle();

    let crmConfigs: CrmConfig[] = [];
    let sendToCrm = true;

    if (crmSettings?.value) {
      const v = crmSettings.value as any;
      if (v.routing?.send_to_crm === false) sendToCrm = false;
      if (Array.isArray(v.crms)) crmConfigs = v.crms;
    }

    if (!sendToCrm) {
      return new Response(
        JSON.stringify({ success: true, message: "CRM sending disabled", retried: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get failed leads (max 20 at a time)
    const { data: failedLeads, error: fetchErr } = await supabase
      .from("contact_messages")
      .select("*")
      .eq("crm_status", "failed")
      .order("created_at", { ascending: true })
      .limit(20);

    if (fetchErr) throw fetchErr;
    if (!failedLeads?.length) {
      return new Response(
        JSON.stringify({ success: true, message: "No failed leads to retry", retried: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let retriedCount = 0;
    let successCount = 0;

    for (const lead of failedLeads) {
      const rawBizArea = (lead.biz_area || "Others").toLowerCase().replace(/\s+/g, "");
      const stateKey = STATE_KEY_MAP[rawBizArea] || "others";

      let matchedCrm = crmConfigs.find(c => c.state_key === stateKey && c.enabled && c.crm_url) || null;
      if (!matchedCrm) matchedCrm = crmConfigs.find(c => c.state_key === "others" && c.enabled && c.crm_url) || null;
      if (!matchedCrm) matchedCrm = crmConfigs.find(c => c.enabled && c.crm_url) || null;

      if (!matchedCrm) continue;

      try {
        const params = new URLSearchParams();
        params.append('__vtrftk', matchedCrm.token);
        params.append('publicid', matchedCrm.public_id);
        params.append('name', matchedCrm.form_name);
        params.append('urlencodeenable', '1');
        if (lead.name) params.append('lastname', lead.name);
        if (lead.whatsapp) params.append('cf_1022', lead.whatsapp);
        if (lead.biz_area) params.append('cf_990', lead.biz_area);
        if (lead.distance) params.append('cf_998', lead.distance);
        if (lead.service_needed) params.append('cf_994', lead.service_needed);
        if (lead.num_scans) params.append('cf_1014', lead.num_scans);
        if (lead.area_type) params.append('cf_1002', lead.area_type);
        if (lead.area_value) params.append('cf_1006', lead.area_value);
        if (lead.expected_close) params.append('cf_1044', lead.expected_close);
        if (lead.message) params.append('description', lead.message);
        if (lead.mailing_street) params.append('mailingstreet', lead.mailing_street);
        if (lead.mailing_city) params.append('mailingcity', lead.mailing_city);
        if (lead.mailing_pincode) params.append('mailingpobox', lead.mailing_pincode);

        const response = await fetch(matchedCrm.crm_url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
          body: params.toString(),
        });

        retriedCount++;

        if (response.ok) {
          successCount++;
          await supabase
            .from("contact_messages")
            .update({ crm_status: "success" })
            .eq("id", lead.id);
        }
      } catch (err) {
        console.error(`Retry failed for lead ${lead.id}:`, err);
        retriedCount++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, retried: retriedCount, succeeded: successCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("crm-retry error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
