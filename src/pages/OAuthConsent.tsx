import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Helmet } from "react-helmet-async";

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthDetails = {
  client?: { name?: string; redirect_uri?: string; client_uri?: string } | null;
  scopes?: string[] | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
  user?: { email?: string | null } | null;
};
type OAuthResult = { data: OAuthDetails | null; error: { message: string } | null };
type OAuthAPI = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthAPI }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id in URL.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/auth?next=${encodeURIComponent(next)}`;
        return;
      }
      setUserEmail(sess.session.user?.email ?? null);
      if (!oauth?.getAuthorizationDetails) {
        setError("OAuth is not available on this project.");
        return;
      }
      const { data, error: err } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (err) return setError(err.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (err) {
      setBusy(false);
      return setError(err.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("No redirect returned by the authorization server.");
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "an app";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Helmet>
        <title>Authorize {clientName} — Amruta CRM</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {error ? (
              <ShieldAlert className="h-6 w-6 text-destructive" />
            ) : (
              <ShieldCheck className="h-6 w-6 text-primary" />
            )}
          </div>
          <CardTitle className="font-serif text-xl">
            {error ? "Authorization error" : `Connect ${clientName} to Amruta CRM`}
          </CardTitle>
          <CardDescription>
            {error
              ? error
              : `${clientName} will be able to call this app's tools while you are signed in.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!error && !details && (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          )}
          {!error && details && (
            <>
              <div className="rounded-md border p-3 text-sm space-y-1">
                <div><span className="text-muted-foreground">Signed in as:</span> <strong>{userEmail ?? "you"}</strong></div>
                {details.client?.redirect_uri && (
                  <div className="break-all"><span className="text-muted-foreground">Redirects to:</span> {details.client.redirect_uri}</div>
                )}
              </div>
              <ul className="text-sm list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Share your basic profile and email.</li>
                <li>Call the CRM tools available to your account.</li>
                <li>This does not bypass this app's permissions or backend policies.</li>
              </ul>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={() => decide(true)} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => decide(false)} disabled={busy}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
