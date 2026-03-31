import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search, RefreshCw, Trash2, Download,
  MapPin, Loader2, ChevronLeft, ChevronRight, AlertTriangle, ExternalLink, Send,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  whatsapp: string | null;
  biz_area: string | null;
  distance: string | null;
  service_needed: string | null;
  num_scans: string | null;
  area_type: string | null;
  area_value: string | null;
  mailing_street: string | null;
  mailing_city: string | null;
  mailing_pincode: string | null;
  latitude: string | null;
  longitude: string | null;
  country: string | null;
  expected_close: string | null;
  crm_status: string | null;
}

interface LeadsManagerProps {
  onRefresh?: () => void;
}

const AREA_UNITS = ["Sq.ft", "Sq.m", "Sq.y", "Acres", "Guntas"] as const;
const AREA_FACTORS: Record<string, number> = {
  "Sq.ft": 1,
  "Sq.m": 0.092903,
  "Sq.y": 0.111111,
  "Acres": 0.0000229568,
  "Guntas": 0.000920833,
};

const AreaConvert = ({ value, type }: { value: string; type: string | null }) => {
  const [open, setOpen] = useState(false);
  const numVal = parseFloat(value);
  if (isNaN(numVal)) return <span>{value}</span>;

  const fromUnit = type && AREA_FACTORS[type] ? type : "Sq.ft";
  const baseSqft = numVal / AREA_FACTORS[fromUnit];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-primary underline underline-offset-2 text-sm cursor-pointer hover:text-primary/80"
      >
        {value}
      </button>
      {open && (
        <div className="absolute z-50 top-6 left-0 bg-popover border border-border rounded-md shadow-lg p-2 min-w-[150px]">
          {AREA_UNITS.map((unit) => (
            <div key={unit} className={`text-xs py-0.5 flex justify-between gap-3 ${unit === fromUnit ? "font-bold text-primary" : "text-foreground"}`}>
              <span>{unit}:</span>
              <span>{(baseSqft * AREA_FACTORS[unit]).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const COUNTRY_TABS = ["All", "India", "Other Countries"] as const;
const BIZ_AREA_TABS = ["All", "Maharashtra", "Telangana", "Andhra Pradesh", "Karnataka", "Others"] as const;

const LEADS_PER_PAGE_OPTIONS = [50, 100];

const LeadsManager = ({ onRefresh }: LeadsManagerProps) => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [sendingCrm, setSendingCrm] = useState(false);
  const [sendingSingleCrmId, setSendingSingleCrmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [countryTab, setCountryTab] = useState<string>("All");
  const [tab, setTab] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [bulkDeleteCount, setBulkDeleteCount] = useState("500");
  const [deleteRangeFrom, setDeleteRangeFrom] = useState("");
  const [deleteRangeTo, setDeleteRangeTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLeads((data as Lead[]) || []);
      setSelectedIds(new Set());
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const isIndiaLead = (lead: Lead) => {
    const country = (lead.country || "").trim().toLowerCase();
    // If country is empty, check biz_area — known Indian states mean India
    const knownIndianAreas = ["maharashtra", "telangana", "andhra pradesh", "karnataka"];
    const area = (lead.biz_area || "").trim().toLowerCase();
    if (!country || country === "india") return true;
    if (knownIndianAreas.includes(area)) return true;
    return false;
  };

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      // Country tab filter
      if (countryTab === "India") {
        if (!isIndiaLead(lead)) return false;
      } else if (countryTab === "Other Countries") {
        if (isIndiaLead(lead)) return false;
      }

      // BIZ Area sub-tab filter (only applies when viewing India)
      if (countryTab !== "Other Countries" && tab !== "All") {
        const area = (lead.biz_area || "").trim();
        if (tab === "Others") {
          const knownAreas = ["Maharashtra", "Telangana", "Andhra Pradesh", "Karnataka"];
          if (knownAreas.includes(area)) return false;
        } else {
          if (area !== tab) return false;
        }
      }

      if (dateFrom) {
        const d = new Date(lead.created_at).toISOString().split("T")[0];
        if (d < dateFrom) return false;
      }
      if (dateTo) {
        const d = new Date(lead.created_at).toISOString().split("T")[0];
        if (d > dateTo) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const searchable = [lead.name, lead.email, lead.phone, lead.service, lead.whatsapp, lead.biz_area, lead.mailing_city, lead.service_needed, lead.message].filter(Boolean).join(" ").toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [leads, countryTab, tab, dateFrom, dateTo, search]);

  const countryCounts = useMemo(() => {
    let india = 0;
    let other = 0;
    leads.forEach((lead) => {
      if (isIndiaLead(lead)) india++;
      else other++;
    });
    return { All: leads.length, India: india, "Other Countries": other };
  }, [leads]);

  const tabCounts = useMemo(() => {
    const indiaLeads = leads.filter(isIndiaLead);
    const counts: Record<string, number> = { All: indiaLeads.length };
    const knownAreas = ["Maharashtra", "Telangana", "Andhra Pradesh", "Karnataka"];
    knownAreas.forEach((a) => { counts[a] = 0; });
    counts["Others"] = 0;
    indiaLeads.forEach((lead) => {
      const area = (lead.biz_area || "").trim();
      if (knownAreas.includes(area)) {
        counts[area] = (counts[area] || 0) + 1;
      } else {
        counts["Others"] += 1;
      }
    });
    return counts;
  }, [leads]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [search, dateFrom, dateTo, countryTab, tab, perPage]);

  // Selection helpers
  const allPageSelected = paginated.length > 0 && paginated.every((l) => selectedIds.has(l.id));
  const somePageSelected = paginated.some((l) => selectedIds.has(l.id));

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allPageSelected) {
      paginated.forEach((l) => next.delete(l.id));
    } else {
      paginated.forEach((l) => next.add(l.id));
    }
    setSelectedIds(next);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const deleteSingle = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    try {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      toast({ title: "Deleted", description: "Lead removed successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase.from("contact_messages").delete().in("id", ids);
      if (error) throw error;
      toast({ title: "Success", description: `Deleted ${ids.length} leads` });
      await fetchLeads();
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally { setDeleting(false); }
  };

  const sendSingleToCrm = async (lead: Lead) => {
    setSendingSingleCrmId(lead.id);
    try {
      const formData: Record<string, string> = {
        lastname: lead.name || "", email: lead.email || "",
        phone: lead.whatsapp || lead.phone || "", mobile: lead.whatsapp || lead.phone || "",
        description: lead.message || "", cf_990: lead.biz_area || "Others",
        cf_994: lead.distance || "", cf_998: lead.service_needed || lead.service || "",
        cf_1002: lead.num_scans || "", cf_1006: lead.area_type || "",
        cf_1014: lead.area_value || "", mailingstreet: lead.mailing_street || "",
        mailingcity: lead.mailing_city || "", mailingpobox: lead.mailing_pincode || "",
        closingdate: lead.expected_close || "", __vtrftk: "", publicid: "", urlencodeenable: "1", name: "",
      };
      const { data, error } = await supabase.functions.invoke("vtiger-submit", {
        body: { formData, bizArea: lead.biz_area || "Others", dbRecord: null },
      });
      if (error) throw error;
      const newStatus = data?.crmSent === true ? "success" : "failed";
      await supabase.from("contact_messages").update({ crm_status: newStatus }).eq("id", lead.id);
      await fetchLeads();
      toast({ title: newStatus === "success" ? "Sent to CRM" : "CRM Failed", variant: newStatus === "success" ? "default" : "destructive" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally { setSendingSingleCrmId(null); }
  };

  const sendSelectedToCrm = async () => {
    if (selectedIds.size === 0) return;
    setSendingCrm(true);
    const selectedLeads = leads.filter((l) => selectedIds.has(l.id));
    let successCount = 0;
    let failCount = 0;

    for (const lead of selectedLeads) {
      try {
        const formData: Record<string, string> = {
          lastname: lead.name || "",
          email: lead.email || "",
          phone: lead.whatsapp || lead.phone || "",
          mobile: lead.whatsapp || lead.phone || "",
          description: lead.message || "",
          cf_990: lead.biz_area || "Others",
          cf_994: lead.distance || "",
          cf_998: lead.service_needed || lead.service || "",
          cf_1002: lead.num_scans || "",
          cf_1006: lead.area_type || "",
          cf_1014: lead.area_value || "",
          mailingstreet: lead.mailing_street || "",
          mailingcity: lead.mailing_city || "",
          mailingpobox: lead.mailing_pincode || "",
          closingdate: lead.expected_close || "",
          __vtrftk: "",
          publicid: "",
          urlencodeenable: "1",
          name: "",
        };

        const dbRecord = {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          whatsapp: lead.whatsapp,
          message: lead.message,
          service: lead.service,
          service_needed: lead.service_needed,
          biz_area: lead.biz_area,
          distance: lead.distance,
          num_scans: lead.num_scans,
          area_type: lead.area_type,
          area_value: lead.area_value,
          mailing_street: lead.mailing_street,
          mailing_city: lead.mailing_city,
          mailing_pincode: lead.mailing_pincode,
          latitude: lead.latitude,
          longitude: lead.longitude,
          country: lead.country,
          expected_close: lead.expected_close,
        };

        const { data, error } = await supabase.functions.invoke("vtiger-submit", {
          body: {
            formData,
            bizArea: lead.biz_area || "Others",
            dbRecord: null, // Don't re-save to DB, just send to CRM
          },
        });

        if (error) throw error;

        // Update CRM status in local state and DB
        const newStatus = data?.crmSent === true ? "success" : "failed";
        await supabase.from("contact_messages").update({ crm_status: newStatus }).eq("id", lead.id);

        if (data?.crmSent === true) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setSendingCrm(false);
    setSelectedIds(new Set());
    await fetchLeads();
    toast({
      title: "CRM Sync Complete",
      description: `Sent: ${successCount}, Failed: ${failCount}`,
      variant: failCount > 0 ? "destructive" : "default",
    });
  };

  const deleteLastN = async () => {
    const n = parseInt(bulkDeleteCount);
    if (isNaN(n) || n <= 0) return;
    setDeleting(true);
    try {
      const { data: toDelete, error: fetchErr } = await supabase
        .from("contact_messages").select("id").order("created_at", { ascending: true }).limit(n);
      if (fetchErr) throw fetchErr;
      if (!toDelete?.length) { toast({ title: "Info", description: "No leads to delete" }); return; }
      const { error } = await supabase.from("contact_messages").delete().in("id", toDelete.map(r => r.id));
      if (error) throw error;
      toast({ title: "Success", description: `Deleted ${toDelete.length} oldest leads` });
      await fetchLeads();
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally { setDeleting(false); }
  };

  const deleteByRange = async () => {
    if (!deleteRangeFrom || !deleteRangeTo) return;
    setDeleting(true);
    try {
      const { data: toDelete, error: fetchErr } = await supabase
        .from("contact_messages").select("id")
        .gte("created_at", deleteRangeFrom + "T00:00:00")
        .lte("created_at", deleteRangeTo + "T23:59:59");
      if (fetchErr) throw fetchErr;
      if (!toDelete?.length) { toast({ title: "Info", description: "No leads in range" }); setDeleting(false); return; }
      const { error } = await supabase.from("contact_messages").delete().in("id", toDelete.map(r => r.id));
      if (error) throw error;
      toast({ title: "Success", description: `Deleted ${toDelete.length} leads` });
      await fetchLeads();
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally { setDeleting(false); }
  };

  const deleteAll = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const { data: allIds, error: fetchErr } = await supabase.from("contact_messages").select("id");
      if (fetchErr) throw fetchErr;
      if (!allIds?.length) { toast({ title: "Info", description: "No leads" }); setDeleting(false); return; }
      const { error } = await supabase.from("contact_messages").delete().in("id", allIds.map(r => r.id));
      if (error) throw error;
      toast({ title: "Success", description: `All ${allIds.length} leads deleted` });
      setDeleteConfirmText("");
      await fetchLeads();
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally { setDeleting(false); }
  };

  const exportCSV = () => {
    const headers = ["Name","WhatsApp","Service","BIZ Area","Distance","Scans","Area Type","Area Value","Mailing Street","City","PIN","Latitude","Longitude","Country","Expected Close","CRM Status","Description","Date"];
    const header = headers.join(",") + "\n";
    const rows = filtered.map((m) =>
      [m.name, m.whatsapp||"", m.service_needed||m.service||"", m.biz_area||"", m.distance||"", m.num_scans||"", m.area_type||"", m.area_value||"", `"${(m.mailing_street||"").replace(/"/g,'""')}"`, m.mailing_city||"", m.mailing_pincode||"", m.latitude||"", m.longitude||"", m.country||"", m.expected_close||"", m.crm_status||"", `"${(m.message||"").replace(/"/g,'""')}"`, new Date(m.created_at).toLocaleDateString()].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const getMapsUrl = (lat: string | null, lng: string | null) => {
    if (!lat || !lng) return null;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  const crmBadge = (status: string | null) => {
    if (status === "success") return <Badge className="bg-green-500/10 text-green-700 border-green-300 text-[10px] whitespace-nowrap">CRM ✓</Badge>;
    if (status === "failed") return <Badge variant="destructive" className="text-[10px] whitespace-nowrap">CRM ✗</Badge>;
    return <Badge variant="outline" className="text-[10px] whitespace-nowrap">Pending</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Leads</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Total: <strong>{leads.length}</strong>
            {selectedIds.size > 0 && <span className="ml-2 text-primary font-semibold">• {selectedIds.size} selected</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { fetchLeads(); onRefresh?.(); }} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Selection Actions Bar */}
      {selectedIds.size > 0 && (
        <Card>
          <CardContent className="py-3 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-foreground">{selectedIds.size} lead{selectedIds.size > 1 ? "s" : ""} selected</span>
            <div className="flex gap-2 ml-auto">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default" size="sm" disabled={sendingCrm} className="gap-1.5">
                    {sendingCrm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send to CRM
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Send to CRM</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will send {selectedIds.size} selected lead{selectedIds.size > 1 ? "s" : ""} to the configured CRM. Leads will be routed based on their BIZ Area / state.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={sendSelectedToCrm}>Send {selectedIds.size} to CRM</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={deleting} className="gap-1.5">
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Selected Leads</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to permanently delete {selectedIds.size} selected lead{selectedIds.size > 1 ? "s" : ""}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete {selectedIds.size}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Country Folder Tabs */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {COUNTRY_TABS.map((t) => (
            <Button
              key={t}
              variant={countryTab === t ? "default" : "outline"}
              size="sm"
              onClick={() => { setCountryTab(t); setTab("All"); }}
              className="gap-1.5"
            >
              {t === "All" ? "📁 All" : t === "India" ? "🇮🇳 India" : "🌍 Other Countries"}
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{countryCounts[t] ?? 0}</Badge>
            </Button>
          ))}
        </div>

        {/* BIZ Area Sub-Tabs (only visible for All or India) */}
        {countryTab !== "Other Countries" && (
          <div className="flex flex-wrap gap-2 pl-6 border-l-2 border-primary/20">
            {BIZ_AREA_TABS.map((t) => (
              <Button
                key={t}
                variant={tab === t ? "default" : "ghost"}
                size="sm"
                onClick={() => setTab(t)}
                className="gap-1.5 h-7 text-xs"
              >
                {t}
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{tabCounts[t] ?? 0}</Badge>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name, whatsapp, city, service..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" />
          <span className="text-muted-foreground text-sm">to</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" />
          {(dateFrom || dateTo) && <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</Button>}
        </div>
      </div>

      {/* Bulk Actions */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" /> Bulk Actions
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deleting}>Delete oldest</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete Oldest Leads</AlertDialogTitle>
                <AlertDialogDescription>How many of the oldest leads to permanently delete?</AlertDialogDescription></AlertDialogHeader>
                <Input type="number" value={bulkDeleteCount} onChange={(e) => setBulkDeleteCount(e.target.value)} placeholder="500" min={1} />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteLastN} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete {bulkDeleteCount}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deleting}>Delete by range</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete by Date Range</AlertDialogTitle>
                <AlertDialogDescription>All leads in this range will be permanently deleted.</AlertDialogDescription></AlertDialogHeader>
                <div className="flex gap-2 items-center">
                  <Input type="date" value={deleteRangeFrom} onChange={(e) => setDeleteRangeFrom(e.target.value)} />
                  <span className="text-sm">to</span>
                  <Input type="date" value={deleteRangeTo} onChange={(e) => setDeleteRangeTo(e.target.value)} />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteByRange} disabled={!deleteRangeFrom || !deleteRangeTo} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete in range</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deleting}>Delete ALL</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>⚠️ Delete ALL Leads</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete ALL {leads.length} leads. Type <strong>DELETE</strong> to confirm.</AlertDialogDescription></AlertDialogHeader>
                <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder='Type "DELETE" to confirm' />
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAll} disabled={deleteConfirmText !== "DELETE"} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Permanently Delete All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {deleting && <Loader2 className="w-4 h-4 animate-spin text-destructive" />}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No leads found</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[1600px]">
                  <TableHeader>
                    <TableRow className="h-9">
                      <TableHead className="w-[40px] py-1.5">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all on page"
                          className={somePageSelected && !allPageSelected ? "opacity-60" : ""}
                        />
                      </TableHead>
                      <TableHead className="py-1.5 min-w-[100px]">Date</TableHead>
                      <TableHead className="py-1.5 min-w-[130px]">Name</TableHead>
                      <TableHead className="py-1.5 min-w-[120px]">Mobile</TableHead>
                      <TableHead className="py-1.5 min-w-[120px]">WhatsApp</TableHead>
                      <TableHead className="py-1.5 min-w-[140px]">Service</TableHead>
                      <TableHead className="py-1.5 min-w-[90px]">Area Type</TableHead>
                      <TableHead className="py-1.5 min-w-[120px]">Area</TableHead>
                      <TableHead className="py-1.5 min-w-[80px]">Distance</TableHead>
                      <TableHead className="py-1.5 min-w-[90px]">Country</TableHead>
                      <TableHead className="py-1.5 min-w-[110px]">BIZ Area</TableHead>
                      <TableHead className="py-1.5 min-w-[160px]">Location</TableHead>
                      <TableHead className="py-1.5 min-w-[80px]">Map</TableHead>
                      <TableHead className="py-1.5 min-w-[80px]">CRM</TableHead>
                      <TableHead className="py-1.5 w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((lead) => {
                      const mapsUrl = getMapsUrl(lead.latitude, lead.longitude);
                      const isExpanded = expandedId === lead.id;
                      const isSelected = selectedIds.has(lead.id);
                      return (
                        <>
                          <TableRow key={lead.id} className={`cursor-pointer h-9 ${isSelected ? "bg-primary/5" : ""}`} onClick={() => setExpandedId(isExpanded ? null : lead.id)}>
                            <TableCell className="py-1.5" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelect(lead.id)}
                                aria-label={`Select ${lead.name}`}
                              />
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm py-1.5">
                              {new Date(lead.created_at).toLocaleDateString()}
                              <div className="text-[10px] text-muted-foreground">{new Date(lead.created_at).toLocaleTimeString()}</div>
                            </TableCell>
                            <TableCell className="font-medium whitespace-nowrap py-1.5">{lead.name}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm py-1.5">{lead.phone || "-"}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm py-1.5">{lead.whatsapp || "-"}</TableCell>
                            <TableCell className="text-sm py-1.5">
                              <div className="max-w-[140px] truncate" title={lead.service_needed || lead.service || "-"}>
                                {lead.service_needed || lead.service || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm py-1.5 whitespace-nowrap">{lead.area_type && lead.area_type !== "Open Plot" ? lead.area_type : "-"}</TableCell>
                            <TableCell className="text-sm py-1.5" onClick={(e) => e.stopPropagation()}>
                              {lead.area_value ? (
                                <AreaConvert value={lead.area_value} type={lead.area_type} />
                              ) : "-"}
                            </TableCell>
                            <TableCell className="text-sm py-1.5 whitespace-nowrap">{lead.distance || "-"}</TableCell>
                            <TableCell className="text-sm whitespace-nowrap py-1.5">{lead.country || "-"}</TableCell>
                            <TableCell className="text-sm py-1.5">{lead.biz_area || "-"}</TableCell>
                            <TableCell className="text-sm py-1.5">
                              <div className="max-w-[160px] truncate" title={[lead.mailing_street, lead.mailing_city, lead.mailing_pincode].filter(Boolean).join(", ")}>
                                {[lead.mailing_street, lead.mailing_city, lead.mailing_pincode].filter(Boolean).join(", ") || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="py-1.5">
                              {mapsUrl ? (
                                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-primary hover:underline text-xs">
                                  <MapPin className="w-3 h-3" /> Map
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="py-1.5">{crmBadge(lead.crm_status)}</TableCell>
                            <TableCell className="py-1.5">
                              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-6 w-6" title="Send to CRM" disabled={sendingSingleCrmId === lead.id} onClick={() => sendSingleToCrm(lead)}>
                                  {sendingSingleCrmId === lead.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 text-primary" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" title="Delete" onClick={() => deleteSingle(lead.id)}>
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${lead.id}-detail`}>
                              <TableCell colSpan={15} className="bg-muted/30 p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div><span className="text-muted-foreground text-xs">Scans:</span> <span className="font-medium">{lead.num_scans || "-"}</span></div>
                                  <div><span className="text-muted-foreground text-xs">Expected Close:</span> <span className="font-medium">{lead.expected_close || "-"}</span></div>
                                  <div><span className="text-muted-foreground text-xs">PIN Code:</span> <span className="font-medium">{lead.mailing_pincode || "-"}</span></div>
                                  <div><span className="text-muted-foreground text-xs">Country:</span> <span className="font-medium">{lead.country || "-"}</span></div>
                                  {lead.latitude && lead.longitude && (
                                    <div className="col-span-2"><span className="text-muted-foreground text-xs">GPS:</span> <span className="font-mono text-xs">{lead.latitude}, {lead.longitude}</span></div>
                                  )}
                                  <div className="col-span-2 md:col-span-4">
                                    <span className="text-muted-foreground text-xs">Street:</span>
                                    <p className="text-xs mt-0.5">{lead.mailing_street || "-"}</p>
                                  </div>
                                  <div className="col-span-2 md:col-span-4">
                                    <span className="text-muted-foreground text-xs">Description:</span>
                                    <pre className="text-xs mt-0.5 whitespace-pre-wrap font-sans bg-background/50 p-2 rounded border border-border/30">{lead.message}</pre>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                  <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
                    <SelectTrigger className="w-[80px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEADS_PER_PAGE_OPTIONS.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span>per page</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                  <span className="text-sm">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadsManager;
