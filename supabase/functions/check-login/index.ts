import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { username, email: directEmail } = body;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let email = directEmail;

    // If username provided, resolve to email server-side
    if (username && !email) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("username", username.toLowerCase().trim())
        .limit(1)
        .maybeSingle();

      if (!profiles?.user_id) {
        // Return generic "not allowed" to avoid username enumeration
        return new Response(
          JSON.stringify({
            allowed: false,
            attempts_remaining: 0,
            max_attempts: 3,
            email: null,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Lookup email from auth.users via admin client
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profiles.user_id);
      if (!userData?.user?.email) {
        return new Response(
          JSON.stringify({
            allowed: false,
            attempts_remaining: 0,
            max_attempts: 3,
            email: null,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      email = userData.user.email;
    }

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Username or email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get max attempts setting
    const { data: setting } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "max_login_attempts")
      .maybeSingle();

    const maxAttempts = setting?.value ? Number(setting.value) : 3;

    // Count recent failed attempts (last 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count } = await supabaseAdmin
      .from("login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("email", email.toLowerCase().trim())
      .gte("attempted_at", oneHourAgo);

    const attemptCount = count ?? 0;
    const isBlocked = attemptCount >= maxAttempts;

    // Cleanup old attempts
    await supabaseAdmin.rpc("cleanup_old_login_attempts");

    return new Response(
      JSON.stringify({
        allowed: !isBlocked,
        attempts_remaining: Math.max(0, maxAttempts - attemptCount),
        max_attempts: maxAttempts,
        // Return email server-side so client can use it for signIn without calling RPC
        email: email,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
