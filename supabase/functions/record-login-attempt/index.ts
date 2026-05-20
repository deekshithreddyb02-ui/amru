// SECURITY: Anonymous callers must not be able to clear failed-login attempts
// (otherwise the brute-force lockout is trivially bypassed).
// Login attempt accounting now happens inside the `admin-signin` edge function.
// This endpoint is kept for backwards compatibility but requires a valid admin JWT.
import { corsHeaders, requireAdmin } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { email, success } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const cleanEmail = email.toLowerCase().trim();
    if (success) {
      await sb.from("login_attempts").delete().eq("email", cleanEmail);
    } else {
      await sb.from("login_attempts").insert({ email: cleanEmail });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
