import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { crmSupabase } from "@/integrations/external-supabase/client";
import { Loader2, LogIn } from "lucide-react";

export default function CrmLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    crmSupabase.auth.getSession().then(({ data }) => {
      if (data.session) nav("/crm", { replace: true });
    });
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setInfo(null);
    try {
      if (mode === "signin") {
        const { error } = await crmSupabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav("/crm", { replace: true });
      } else {
        const { error } = await crmSupabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/crm/login` },
        });
        if (error) throw error;
        setInfo("Check your email to confirm your account.");
      }
    } catch (e: any) {
      setError(e.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1118] text-white flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm bg-[#0f1923] border border-white/5 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <LogIn className="w-5 h-5" />
          <h1 className="text-xl font-bold">CRM {mode === "signin" ? "Sign in" : "Sign up"}</h1>
        </div>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full bg-[#1a2530] border border-white/10 rounded px-3 py-2 text-sm"
        />
        <input
          type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full bg-[#1a2530] border border-white/10 rounded px-3 py-2 text-sm"
        />
        {error && <div className="text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded px-3 py-2">{error}</div>}
        {info && <div className="text-emerald-300 text-sm bg-emerald-500/10 border border-emerald-500/30 rounded px-3 py-2">{info}</div>}
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded py-2 text-sm font-semibold flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
        <button type="button" onClick={() => { setMode(m => m === "signin" ? "signup" : "signin"); setError(null); setInfo(null); }}
          className="w-full text-xs text-white/60 hover:text-white">
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
