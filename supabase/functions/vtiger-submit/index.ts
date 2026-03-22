import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
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

    // Build URL-encoded form body
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(formData)) {
      params.append(key, String(value ?? ""));
    }

    const vtigerUrl = "https://appscomsolutions.com/VTCRM/modules/Webforms/capture.php";

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
          : `CRM returned status ${response.status}`,
        crmResponse: responseText.substring(0, 500),
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
