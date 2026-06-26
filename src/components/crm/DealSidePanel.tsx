import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Loader2, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import StageSelect from "@/components/crm/StageSelect";
import StageBadge from "@/components/crm/StageBadge";
import Bulleted from "@/components/crm/Bulleted";

type Props = {
  dealId: string | null;
  workspaceSlug: string;
  workspaceId?: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
};

type Activity = {
  id: string;
  activity_type: string | null;
  subject: string | null;
  description: string | null;
  status: string | null;
  created_at: string;
};


const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d > 365) return `${Math.floor(d / 365)} year${d > 730 ? "s" : ""} ago`;
  if (d > 30) return `${Math.floor(d / 30)} month${d > 60 ? "s" : ""} ago`;
  if (d > 0) return `${d} day${d > 1 ? "s" : ""} ago`;
  const h = Math.floor(diff / 3600000);
  if (h > 0) return `${h}h ago`;
  return "just now";
};

const fmtMoney = (n: any) =>
  n == null || n === "" ? "" : `₹ ${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function DealSidePanel({
  dealId, workspaceSlug, workspaceId, onClose, onPrev, onNext, hasPrev, hasNext,
}: Props) {
  const [deal, setDeal] = useState<any | null>(null);
  const [lead, setLead] = useState<any | null>(null);
  const [org, setOrg] = useState<any | null>(null);
  const [contact, setContact] = useState<any | null>(null);
  const [ownerName, setOwnerName] = useState<string>("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const wsId = workspaceId || deal?.workspace_id;


  useEffect(() => {
    if (!dealId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: d } = await supabase.from("crm_deals").select("*").eq("id", dealId).maybeSingle();
      if (cancelled) return;
      setDeal(d);

      const [l, o, c, a, p] = await Promise.all([
        d?.lead_id
          ? supabase.from("crm_leads").select("*").eq("id", d.lead_id).maybeSingle()
          : Promise.resolve({ data: null }),
        d?.organization_id
          ? supabase.from("crm_organizations").select("*").eq("id", d.organization_id).maybeSingle()
          : Promise.resolve({ data: null }),
        d?.contact_id
          ? supabase.from("crm_contacts").select("*").eq("id", d.contact_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("crm_activities")
          .select("id,activity_type,subject,description,status,created_at")
          .eq("deal_id", dealId)
          .order("created_at", { ascending: false })
          .limit(50),
        d?.owner_id
          ? supabase.from("profiles").select("full_name,username").eq("user_id", d.owner_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      setLead((l as any).data || null);
      setOrg((o as any).data || null);
      setContact((c as any).data || null);
      setActivities(((a as any).data as Activity[]) || []);
      setOwnerName(((p as any).data?.full_name || (p as any).data?.username) || "");
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [dealId]);

  // Live update if the deal row changes elsewhere (Kanban drag, list inline edit, detail page).
  useEffect(() => {
    if (!dealId) return;
    const ch = supabase
      .channel(`deal-side-${dealId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "crm_deals", filter: `id=eq.${dealId}` },
        (payload) => setDeal((d: any) => ({ ...(d || {}), ...(payload.new as any) }))
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [dealId]);


  if (!dealId) return null;

  const contactName = contact?.full_name || lead?.full_name || "";
  const stageKey = deal?.stage || "prospecting";
  const totalAreaLines = lead
    ? `Gunta: ${lead.gunta || ""}\nAcres: ${lead.acres || ""}\nSq.Yrds: ${lead.sq_yards || ""}\nSq.Ft: ${lead.sq_ft || ""}`
    : "";

  const fields: [string, any][] = deal ? [
    ["Opportunity Name", deal.title],
    ["Contact Name", contactName ? <span className="text-primary">{contactName}</span> : ""],
    ["Expected Close Date", deal.expected_close ? new Date(deal.expected_close).toLocaleDateString("en-IN") : ""],
    ["Assigned To", ownerName ? <span className="text-primary">{ownerName}</span> : ""],
    ["BIZ Area", lead?.biz_area],
    ["Service Needed", lead?.service_needed],
    ["Distance in KM", lead?.distance_km],
    ["Total Area", totalAreaLines],
    ["Number of Scans", lead?.num_scans],
    ["Total BIZ COST", fmtMoney(lead?.biz_cost ?? deal.amount)],
    ["Maps Location", lead?.maps_location],
    ["Street", lead?.street || org?.street],
    ["City", lead?.city || org?.city],
    ["State", lead?.state || org?.state],
    ["Probability", deal.probability != null ? `${deal.probability}%` : ""],
    ["Sales Stage", deal?.id && wsId ? <StageSelect workspaceId={wsId} dealId={deal.id} value={stageKey} /> : <StageBadge workspaceId={wsId} stageKey={stageKey} />],
    ["Description", deal.description || lead?.notes],
  ] : [];

  return (
    <aside className="w-full sm:w-[460px] shrink-0 border-l bg-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b">
        <div className="h-14 w-14 rounded bg-green-600 text-white flex items-center justify-center shrink-0">
          <Wallet className="h-7 w-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold truncate">{deal?.title || "—"}</div>
          {org?.name && <div className="text-[12px] text-muted-foreground truncate">{org.name}</div>}
          <div className="text-[12px] mt-0.5">{fmtMoney(deal?.amount)}</div>
          {deal?.stage && (
            <div className="mt-1">
              {deal?.id && wsId ? (
                <StageSelect workspaceId={wsId} dealId={deal.id} value={stageKey} />
              ) : (
                <StageBadge workspaceId={wsId} stageKey={stageKey} />
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
          <div className="inline-flex border rounded overflow-hidden">
            <button onClick={onPrev} disabled={!hasPrev}
              className="h-6 w-6 inline-flex items-center justify-center hover:bg-muted disabled:opacity-40">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button onClick={onNext} disabled={!hasNext}
              className="h-6 w-6 inline-flex items-center justify-center border-l hover:bg-muted disabled:opacity-40">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="px-4 py-2 border-b">
        <Button asChild size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white">
          <Link to={`/crm/${workspaceSlug}/deals/${dealId}`}>View Details</Link>
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="divide-y">
              {fields.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[140px_1fr] gap-3 px-4 py-2 text-[12.5px]">
                  <div className="text-muted-foreground">{k}</div>
                  <div className="text-foreground break-words whitespace-pre-wrap">
                    {v == null || v === "" ? "" : (typeof v === "object" ? v : String(v))}
                  </div>
                </div>
              ))}
            </div>

            {/* Updates */}
            <div className="mt-3">
              <div className="px-4 py-2 bg-muted/50 text-[13px] font-semibold border-y">Updates</div>
              {activities.length === 0 ? (
                <div className="px-4 py-4 text-[12px] text-muted-foreground">No updates yet.</div>
              ) : (
                <ul className="px-4 py-3 space-y-4 relative">
                  <span className="absolute left-[34px] top-3 bottom-3 w-px bg-border" />
                  {activities.map((a) => (
                    <li key={a.id} className="grid grid-cols-[56px_1fr] gap-2 relative">
                      <div className="text-[10.5px] text-muted-foreground pt-1">{timeAgo(a.created_at)}</div>
                      <div className="flex gap-2">
                        <div className="h-6 w-6 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center shrink-0 relative z-10">
                          {(a.activity_type || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="text-[12px] min-w-0">
                          <div>
                            <span className="text-primary font-medium">{a.subject || "Activity"}</span>{" "}
                            <span className="text-muted-foreground">{a.status || a.activity_type}</span>
                          </div>
                          {a.description && (
                            <div className="text-muted-foreground whitespace-pre-wrap break-words mt-0.5">
                              {a.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Recent Comments */}
            <div className="mt-3 mb-6">
              <div className="px-4 py-2 bg-muted/50 text-[13px] font-semibold border-y">Recent Comments</div>
              <div className="mx-4 my-3 border rounded text-center text-[12px] text-muted-foreground py-3">
                No comments
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
