import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, MapPin, Loader2, IdCard } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  leadId: string | null;
  workspaceSlug: string;
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
  created_by: string | null;
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

export default function LeadSidePanel({
  leadId, workspaceSlug, onClose, onPrev, onNext, hasPrev, hasNext,
}: Props) {
  const [lead, setLead] = useState<any | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!leadId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: l } = await supabase.from("crm_leads").select("*").eq("id", leadId).maybeSingle();
      const { data: a } = await supabase
        .from("crm_activities")
        .select("id,activity_type,subject,description,status,created_at,created_by")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (cancelled) return;
      setLead(l);
      setActivities((a as any) || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [leadId]);

  if (!leadId) return null;

  const fields: [string, any][] = lead ? [
    ["BIZ Area", lead.biz_area],
    ["Service Needed", lead.service_needed],
    ["First Name", (lead.full_name || "").split(/\s+/)[0]],
    ["Last Name", (lead.full_name || "").split(/\s+/).slice(1).join(" ")],
    ["WhatsApp Num", lead.whatsapp],
    ["Total Area", lead.total_area],
    ["Expected Close Date", lead.expected_close],
    ["Distance In KM", lead.distance_km],
    ["Number of Scans", lead.num_scans],
    ["Total BIZ COST", fmtMoney(lead.biz_cost)],
    ["Company", lead.company],
    ["GSTIN", lead.gstin],
    ["Lead Source", lead.lead_source ? (
      <span className="inline-block bg-green-600 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded">
        {lead.lead_source}
      </span>
    ) : ""],
    ["Website", lead.website],
    ["Assigned To", lead.assigned_to_name ? (
      <span className="text-primary">{lead.assigned_to_name}</span>
    ) : ""],
    ["Street", lead.street],
    ["City", lead.city],
    ["State", lead.state],
    ["Maps Location", lead.maps_location],
    ["Description", lead.description || lead.notes],
  ] : [];

  return (
    <aside className="w-full sm:w-[460px] shrink-0 border-l bg-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b">
        <div className="h-14 w-14 rounded bg-orange-500 text-white flex items-center justify-center shrink-0">
          <IdCard className="h-7 w-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold truncate">{lead?.full_name || "—"}</div>
          {lead?.phone && (
            <a href={`tel:${lead.phone}`} className="text-[12px] text-primary hover:underline block">
              {lead.phone}
            </a>
          )}
          {lead?.maps_location && (
            <a href={lead.maps_location} target="_blank" rel="noreferrer"
               className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Show Map
            </a>
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
          <Link to={`/crm/${workspaceSlug}/leads/${leadId}`}>View Details</Link>
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
                    {v == null || v === "" ? "" : String(v)}
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
                        <div className="h-6 w-6 rounded-full bg-orange-400 text-white text-[10px] flex items-center justify-center shrink-0 relative z-10">
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
