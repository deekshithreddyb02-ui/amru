import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "crm_settings")
      .maybeSingle();

    const crms: { state_key: string; label: string; crm_url: string; enabled: boolean; field_mappings?: Record<string, string> }[] = [];
    let recaptcha_site_key = "";
    let turnstile_site_key = "";

    if (data?.value) {
      const v = data.value as any;
      if (v.recaptcha_site_key) recaptcha_site_key = v.recaptcha_site_key;
      if (v.turnstile_site_key) turnstile_site_key = v.turnstile_site_key;
      if (Array.isArray(v.crms)) {
        for (const c of v.crms) {
          crms.push({
            state_key: c.state_key || "",
            label: c.label || "",
            crm_url: c.crm_url || "",
            enabled: !!c.enabled,
            field_mappings: c.field_mappings || undefined,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ crms, recaptcha_site_key, turnstile_site_key }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("crm-urls error:", error);
    return new Response(
      JSON.stringify({ crms: [], recaptcha_site_key: "", turnstile_site_key: "" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
