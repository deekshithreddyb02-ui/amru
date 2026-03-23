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
  Search, RefreshCw, Trash2, Eye, EyeOff, Calendar, Download,
  MapPin, Loader2, ChevronLeft, ChevronRight, AlertTriangle,
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

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const parsedLeads = useMemo(() =>
    leads.map((lead) => {
      const locMatch = lead.message.match(/\[Location: (.+?)\]\s?/);
      const mapMatch = lead.message.match(/\[Map: (https?:\/\/[^\]]+)\]\s?/);
      let clean = lead.message;
      if (locMatch) clean = clean.replace(locMatch[0], "");
      if (mapMatch) clean = clean.replace(mapMatch[0], "");
      return {
        ...lead,
        location: locMatch ? locMatch[1] : null,
        mapUrl: mapMatch ? mapMatch[1] : null,
        cleanMessage: clean.trim(),
      };
    }), [leads]);

  const filtered = useMemo(() => {
    return parsedLeads.filter((lead) => {
      if (tab === "unread" && lead.is_read) return false;
      if (tab === "read" && !lead.is_read) return false;
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
        if (
          !lead.name.toLowerCase().includes(q) &&
          !lead.email.toLowerCase().includes(q) &&
          !(lead.phone || "").toLowerCase().includes(q) &&
          !(lead.service || "").toLowerCase().includes(q) &&
          !lead.cleanMessage.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [parsedLeads, tab, dateFrom, dateTo, search]);

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
      // Get the oldest N leads by timestamp (last = oldest)
      const { data: toDelete, error: fetchErr } = await supabase
        .from("contact_messages")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(n);
      if (fetchErr) throw fetchErr;
      if (!toDelete || toDelete.length === 0) {
        toast({ title: "Info", description: "No leads to delete" });
        return;
      }
      const ids = toDelete.map((r) => r.id);
      const { error } = await supabase.from("contact_messages").delete().in("id", ids);
      if (error) throw error;
      toast({ title: "Success", description: `Deleted ${ids.length} oldest leads` });
      await fetchLeads();
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const deleteByRange = async () => {
    if (!deleteRangeFrom || !deleteRangeTo) return;
    setDeleting(true);
    try {
      const { data: toDelete, error: fetchErr } = await supabase
        .from("contact_messages")
        .select("id")
        .gte("created_at", deleteRangeFrom + "T00:00:00")
        .lte("created_at", deleteRangeTo + "T23:59:59");
      if (fetchErr) throw fetchErr;
      if (!toDelete || toDelete.length === 0) {
        toast({ title: "Info", description: "No leads in this date range" });
        setDeleting(false);
        return;
      }
      const ids = toDelete.map((r) => r.id);
      const { error } = await supabase.from("contact_messages").delete().in("id", ids);
      if (error) throw error;
      toast({ title: "Success", description: `Deleted ${ids.length} leads from range` });
      await fetchLeads();
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const deleteAll = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      // Delete in batches
      const { data: allIds, error: fetchErr } = await supabase
        .from("contact_messages")
        .select("id");
      if (fetchErr) throw fetchErr;
      if (!allIds || allIds.length === 0) {
        toast({ title: "Info", description: "No leads to delete" });
        setDeleting(false);
        return;
      }
      const ids = allIds.map((r) => r.id);
      const { error } = await supabase.from("contact_messages").delete().in("id", ids);
      if (error) throw error;
      toast({ title: "Success", description: `All ${ids.length} leads deleted` });
      setDeleteConfirmText("");
      await fetchLeads();
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => {
    const header = "Name,Email,Phone,Service,Location,Message,Date,Status\n";
    const rows = filtered
      .map((m) =>
        [
          m.name,
          m.email,
          m.phone || "",
          m.service || "",
          m.location || "",
          '"' + m.cleanMessage.replace(/"/g, '""') + '"',
          new Date(m.created_at).toLocaleDateString(),
          m.is_read ? "Read" : "New",
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const unreadCount = leads.filter((l) => !l.is_read).length;

  const tabs = [
    { key: "all", label: "All Leads", count: leads.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "read", label: "Read", count: leads.length - unreadCount },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Leads</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Total: <strong>{leads.length}</strong> leads · <strong>{unreadCount}</strong> unread
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
          <Input
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" />
          <span className="text-muted-foreground text-sm">to</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" />
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1 p-1.5 bg-primary/5 border border-primary/10 rounded-xl">
        {tabs.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab(t.key)}
            className={`rounded-lg text-xs gap-1.5 ${tab === t.key ? "shadow-md" : ""}`}
          >
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-primary-foreground/20" : "bg-muted"}`}>
              {t.count}
            </span>
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
            {/* Delete Last N */}
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={deleting}>
                    Delete oldest
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Oldest Leads</AlertDialogTitle>
                    <AlertDialogDescription>
                      How many of the oldest leads should be permanently deleted?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    type="number"
                    value={bulkDeleteCount}
                    onChange={(e) => setBulkDeleteCount(e.target.value)}
                    placeholder="500"
                    min={1}
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteLastN} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete {bulkDeleteCount} leads
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Delete by Date Range */}
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={deleting}>
                    Delete by range
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Leads by Date Range</AlertDialogTitle>
                    <AlertDialogDescription>All leads within this date range will be permanently deleted.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex gap-2 items-center">
                    <Input type="date" value={deleteRangeFrom} onChange={(e) => setDeleteRangeFrom(e.target.value)} />
                    <span className="text-sm">to</span>
                    <Input type="date" value={deleteRangeTo} onChange={(e) => setDeleteRangeTo(e.target.value)} />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteByRange}
                      disabled={!deleteRangeFrom || !deleteRangeTo}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete leads in range
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Delete All */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deleting}>
                  Delete ALL
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>⚠️ Delete ALL Leads</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete ALL {leads.length} leads. Type <strong>DELETE</strong> to confirm.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder='Type "DELETE" to confirm'
                />
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAll}
                    disabled={deleteConfirmText !== "DELETE"}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Permanently Delete All
                  </AlertDialogAction>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email / Phone</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((lead) => (
                      <TableRow key={lead.id} className={!lead.is_read ? "bg-primary/5" : ""}>
                        <TableCell>
                          <Badge variant={lead.is_read ? "secondary" : "default"}>
                            {lead.is_read ? "Read" : "New"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">{lead.email}</div>
                          {lead.phone && <div className="text-xs text-muted-foreground">{lead.phone}</div>}
                        </TableCell>
                        <TableCell>{lead.service || "-"}</TableCell>
                        <TableCell>
                          {lead.location ? (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline">{lead.location}</Badge>
                              {lead.mapUrl && (
                                <a href={lead.mapUrl} target="_blank" rel="noopener noreferrer">
                                  <MapPin className="w-3 h-3 text-primary" />
                                </a>
                              )}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{lead.cleanMessage}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(lead.created_at).toLocaleDateString()}
                          <div className="text-xs text-muted-foreground">
                            {new Date(lead.created_at).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => toggleRead(lead.id, lead.is_read)}>
                              {lead.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteSingle(lead.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                  <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
                    <SelectTrigger className="w-[80px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEADS_PER_PAGE_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>per page</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
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
