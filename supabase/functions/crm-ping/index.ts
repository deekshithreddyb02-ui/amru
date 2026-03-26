import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load CRM settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "crm_settings")
      .maybeSingle();

    interface CrmConfig {
      state_key: string;
      label: string;
      crm_url: string;
      enabled: boolean;
    }

    let crms: CrmConfig[] = [];
    if (settings?.value) {
      const v = settings.value as any;
      if (Array.isArray(v.crms)) {
        crms = v.crms.filter((c: CrmConfig) => c.enabled && c.crm_url);
      }
    }

    const results: any[] = [];

    for (const crm of crms) {
      const startTime = performance.now();
      let status = "offline";
      let statusCode: number | null = null;
      let errorMessage: string | null = null;
      let responseTimeMs: number | null = null;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(crm.crm_url, {
          method: "HEAD",
          signal: controller.signal,
        });

        clearTimeout(timeout);
        responseTimeMs = Math.round(performance.now() - startTime);
        statusCode = response.status;
        status = response.ok || response.status < 500 ? "online" : "offline";
      } catch (err: any) {
        responseTimeMs = Math.round(performance.now() - startTime);
        errorMessage = err.name === "AbortError" ? "Timeout (10s)" : (err.message || "Unknown error");
        status = "offline";
      }

      const record = {
        state_key: crm.state_key,
        crm_label: crm.label,
        crm_url: crm.crm_url,
        status,
        response_time_ms: responseTimeMs,
        status_code: statusCode,
        error_message: errorMessage,
      };

      results.push(record);

      // Store in DB
      await supabase.from("crm_ping_history").insert(record);
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("crm-ping error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
