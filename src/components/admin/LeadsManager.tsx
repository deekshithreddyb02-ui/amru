import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Search, RefreshCw, Trash2, Eye, EyeOff, Download,
  MapPin, Loader2, ChevronLeft, ChevronRight, AlertTriangle, ExternalLink,
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

const LEADS_PER_PAGE_OPTIONS = [50, 100];

const LeadsManager = ({ onRefresh }: LeadsManagerProps) => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [bulkDeleteCount, setBulkDeleteCount] = useState("500");
  const [deleteRangeFrom, setDeleteRangeFrom] = useState("");
  const [deleteRangeTo, setDeleteRangeTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLeads((data as Lead[]) || []);
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
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
  }, [leads, tab, dateFrom, dateTo, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [search, dateFrom, dateTo, tab, perPage]);

  const toggleRead = async (id: string, isRead: boolean) => {
    try {
      const { error } = await supabase.from("contact_messages").update({ is_read: !isRead }).eq("id", id);
      if (error) throw error;
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, is_read: !isRead } : l)));
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
  };

  const deleteSingle = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    try {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Deleted", description: "Lead removed successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
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
    const headers = ["Name","WhatsApp","Service","BIZ Area","Distance","Scans","Area Type","Area Value","Mailing Street","City","PIN","Latitude","Longitude","Country","Expected Close","CRM Status","Description","Date","Status"];
    const header = headers.join(",") + "\n";
    const rows = filtered.map((m) =>
      [m.name, m.whatsapp||"", m.service_needed||m.service||"", m.biz_area||"", m.distance||"", m.num_scans||"", m.area_type||"", m.area_value||"", `"${(m.mailing_street||"").replace(/"/g,'""')}"`, m.mailing_city||"", m.mailing_pincode||"", m.latitude||"", m.longitude||"", m.country||"", m.expected_close||"", m.crm_status||"", `"${(m.message||"").replace(/"/g,'""')}"`, new Date(m.created_at).toLocaleDateString(), m.is_read?"Read":"New"].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const tabs = [
    { key: "all", label: "All Leads", count: leads.length },
  ];

  const getMapsUrl = (lat: string | null, lng: string | null) => {
    if (!lat || !lng) return null;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  const crmBadge = (status: string | null) => {
    if (status === "success") return <Badge className="bg-green-500/10 text-green-700 border-green-300 text-[10px]">CRM ✓</Badge>;
    if (status === "failed") return <Badge variant="destructive" className="text-[10px]">CRM ✗</Badge>;
    return <Badge variant="outline" className="text-[10px]">Pending</Badge>;
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

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1 p-1.5 bg-primary/5 border border-primary/10 rounded-xl">
        {tabs.map((t) => (
          <Button key={t.key} variant={tab === t.key ? "default" : "ghost"} size="sm" onClick={() => setTab(t.key)}
            className={`rounded-lg text-xs gap-1.5 ${tab === t.key ? "shadow-md" : ""}`}>
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-primary-foreground/20" : "bg-muted"}`}>{t.count}</span>
          </Button>
        ))}
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      
                      <TableHead>Name</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>BIZ Area</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>CRM</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((lead) => {
                      const mapsUrl = getMapsUrl(lead.latitude, lead.longitude);
                      const isExpanded = expandedId === lead.id;
                      return (
                        <>
                          <TableRow key={lead.id} className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : lead.id)}>
                            <TableCell className="font-medium whitespace-nowrap">{lead.name}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">{lead.whatsapp || lead.phone || "-"}</TableCell>
                            <TableCell className="text-sm">{lead.service_needed || lead.service || "-"}</TableCell>
                            <TableCell className="text-sm">{lead.biz_area || "-"}</TableCell>
                            <TableCell className="text-sm">{lead.distance || "-"}</TableCell>
                            <TableCell className="text-sm">
                              <div>{lead.area_type || "-"}</div>
                              {lead.area_value && <div className="text-[10px] text-muted-foreground">{lead.area_value}</div>}
                            </TableCell>
                            <TableCell>
                              {mapsUrl ? (
                                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-primary hover:underline text-xs">
                                  <MapPin className="w-3 h-3" /> Map
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">{lead.mailing_city || "-"}</TableCell>
                            <TableCell>{crmBadge(lead.crm_status)}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {new Date(lead.created_at).toLocaleDateString()}
                              <div className="text-[10px] text-muted-foreground">{new Date(lead.created_at).toLocaleTimeString()}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteSingle(lead.id)}>
                                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${lead.id}-detail`}>
                              <TableCell colSpan={12} className="bg-muted/30 p-4">
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
