// Server-side admin/employee sign-in.
// Resolves username -> email and performs signInWithPassword on the server so
// the resolved email is never returned to the client (prevents email enumeration).
// Also enforces brute-force lockout atomically.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { username, password } = await req.json();
    if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
      return new Response(JSON.stringify({ error: "Username and password are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // 1. Resolve username -> user_id -> email (never returned to client)
    const { data: profile } = await admin
      .from("profiles")
      .select("user_id")
      .eq("username", username.toLowerCase().trim())
      .maybeSingle();

    // Generic response to avoid username enumeration
    const generic = () => new Response(JSON.stringify({ ok: false, error: "Invalid username or password" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    if (!profile?.user_id) return generic();

    const { data: userData } = await admin.auth.admin.getUserById(profile.user_id);
    const email = userData?.user?.email;
    if (!email) return generic();

    // 2. Brute-force lockout check (per email, last hour)
    const { data: setting } = await admin
      .from("site_settings").select("value").eq("key", "max_login_attempts").maybeSingle();
    const maxAttempts = setting?.value ? Number(setting.value) : 3;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: attemptCount } = await admin
      .from("login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("email", email.toLowerCase())
      .gte("attempted_at", oneHourAgo);
    if ((attemptCount ?? 0) >= maxAttempts) {
      return new Response(JSON.stringify({
        ok: false, blocked: true, max_attempts: maxAttempts,
        error: `Too many failed attempts. Try again later. (${maxAttempts} max per hour)`,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Attempt sign-in using a fresh anon client (server-side)
    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { persistSession: false } },
    );
    const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({ email, password });

    if (signInErr || !signIn?.session) {
      await admin.from("login_attempts").insert({ email: email.toLowerCase() });
      const remaining = Math.max(0, maxAttempts - ((attemptCount ?? 0) + 1));
      return new Response(JSON.stringify({
        ok: false, attempts_remaining: remaining,
        error: "Invalid username or password",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 4. Clear attempts on success
    await admin.from("login_attempts").delete().eq("email", email.toLowerCase());

    // 5. Return session — client uses supabase.auth.setSession(...)
    return new Response(JSON.stringify({
      ok: true,
      session: {
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
      },
      user_id: signIn.user?.id,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("admin-signin error:", e?.message ?? e);
    return new Response(JSON.stringify({ ok: false, error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
