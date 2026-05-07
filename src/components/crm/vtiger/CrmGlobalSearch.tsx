import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Hit = {
  module: "Leads" | "Contacts" | "Organizations" | "Deals";
  id: string;
  label: string;
  sub?: string;
  to: string;
};

export default function CrmGlobalSearch({ workspaceId, slug }: { workspaceId: string; slug: string }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q.trim() || q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const term = `%${q.trim()}%`;
      const [leads, contacts, orgs, deals] = await Promise.all([
        supabase.from("crm_leads").select("id,full_name,email").eq("workspace_id", workspaceId).or(`full_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`).limit(5),
        supabase.from("crm_contacts").select("id,full_name,email").eq("workspace_id", workspaceId).or(`full_name.ilike.${term},email.ilike.${term}`).limit(5),
        supabase.from("crm_organizations").select("id,name,industry").eq("workspace_id", workspaceId).ilike("name", term).limit(5),
        supabase.from("crm_deals").select("id,title,stage").eq("workspace_id", workspaceId).ilike("title", term).limit(5),
      ]);
      const out: Hit[] = [];
      (leads.data || []).forEach((r: any) => out.push({ module: "Leads", id: r.id, label: r.full_name, sub: r.email, to: `/crm/${slug}/leads/${r.id}` }));
      (contacts.data || []).forEach((r: any) => out.push({ module: "Contacts", id: r.id, label: r.full_name, sub: r.email, to: `/crm/${slug}/contacts` }));
      (orgs.data || []).forEach((r: any) => out.push({ module: "Organizations", id: r.id, label: r.name, sub: r.industry, to: `/crm/${slug}/organizations` }));
      (deals.data || []).forEach((r: any) => out.push({ module: "Deals", id: r.id, label: r.title, sub: r.stage, to: `/crm/${slug}/deals` }));
      setHits(out);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, workspaceId, slug]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search leads, contacts, deals…"
        className="pl-8 h-8 text-sm"
      />
      {open && q.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-96 overflow-auto">
          {loading ? (
            <div className="p-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Searching…
            </div>
          ) : hits.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground text-center">No results</div>
          ) : (
            <div className="py-1">
              {hits.map((h) => (
                <button
                  key={`${h.module}-${h.id}`}
                  onClick={() => { setOpen(false); setQ(""); navigate(h.to); }}
                  className="w-full text-left px-3 py-2 hover:bg-muted flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm truncate">{h.label}</div>
                    {h.sub && <div className="text-[11px] text-muted-foreground truncate">{h.sub}</div>}
                  </div>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">{h.module}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
