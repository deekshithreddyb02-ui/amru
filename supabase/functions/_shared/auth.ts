// Shared auth helpers for edge functions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-mirror-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/**
 * Returns the authenticated user id, or null if the request isn't authenticated.
 * Allows internal callers passing the service-role bearer token (cron / triggers).
 */
export async function getCallerUserId(req: Request): Promise<{ userId: string | null; isService: boolean }> {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return { userId: null, isService: false };
  const token = auth.slice(7);
  if (token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
    return { userId: null, isService: true };
  }
  const sb = adminClient();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return { userId: null, isService: false };
  return { userId: data.user.id, isService: false };
}

export async function requireAdmin(req: Request): Promise<{ ok: true; userId: string | null; isService: boolean } | { ok: false; response: Response }> {
  const { userId, isService } = await getCallerUserId(req);
  if (isService) return { ok: true, userId: null, isService };
  if (!userId) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }
  const sb = adminClient();
  const { data } = await sb.from("user_roles").select("role").eq("user_id", userId).in("role", ["admin", "super_admin"]);
  if (!data || data.length === 0) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }
  return { ok: true, userId, isService: false };
}

export async function requireAuthenticated(req: Request): Promise<{ ok: true; userId: string; isService: boolean } | { ok: false; response: Response }> {
  const { userId, isService } = await getCallerUserId(req);
  if (isService) return { ok: true, userId: "service", isService };
  if (!userId) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }
  return { ok: true, userId, isService: false };
}
