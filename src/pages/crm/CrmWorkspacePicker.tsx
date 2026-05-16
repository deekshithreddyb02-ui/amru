import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, ArrowRight, Loader2 } from "lucide-react";

type Workspace = { id: string; slug: string; name: string };

export default function CrmWorkspacePicker() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { nav("/auth?redirect=/crm"); return; }

      // Check admin
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", session.user.id);
      const isAdmin = roles?.some(r => r.role === "admin" || r.role === "super_admin");
      if (!isAdmin) { setError("Admin access required."); setLoading(false); return; }

      const { data, error: e } = await supabase
        .from("crm_workspaces").select("id, slug, name").order("name");
      if (e) setError(e.message);
      else setWorkspaces(data || []);
      setLoading(false);
    })();
  }, [nav]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a1118] text-white">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1118] text-white p-6">
      <div className="max-w-3xl mx-auto pt-16">
        <h1 className="text-3xl font-bold mb-2">Choose a Workspace</h1>
        <p className="text-white/60 mb-8">Select the regional CRM workspace to enter.</p>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-md mb-4">{error}</div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          {workspaces.map(w => (
            <Link
              key={w.id}
              to={`/crm/${w.slug}/dashboard`}
              className="group bg-[#0f1923] border border-white/5 hover:border-white/20 rounded-lg p-5 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-[#243342] flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <div className="font-semibold">{w.name}</div>
                  <div className="text-xs text-white/40 uppercase">{w.slug}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
