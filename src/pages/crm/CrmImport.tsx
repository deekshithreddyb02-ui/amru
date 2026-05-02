import { useMemo, useRef, useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Upload, FileUp, Download, Loader2, CheckCircle2, XCircle, Database, Trash2 } from "lucide-react";

type Workspace = { id: string; slug: string; name: string };
type Ctx = { workspace: Workspace; myRole: string };

type EntityType = "leads" | "contacts" | "organizations";

type FieldDef = { key: string; label: string; required?: boolean };

const ENTITY_FIELDS: Record<EntityType, FieldDef[]> = {
  leads: [
    { key: "full_name", label: "Full name", required: true },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "country", label: "Country" },
    { key: "pincode", label: "Pincode" },
    { key: "service_needed", label: "Service needed" },
    { key: "biz_area", label: "Business area" },
    { key: "biz_cost", label: "Business cost" },
    { key: "stage", label: "Stage" },
    { key: "status", label: "Status" },
    { key: "notes", label: "Notes" },
  ],
  contacts: [
    { key: "full_name", label: "Full name", required: true },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "country", label: "Country" },
    { key: "notes", label: "Notes" },
  ],
  organizations: [
    { key: "name", label: "Name", required: true },
    { key: "industry", label: "Industry" },
    { key: "website", label: "Website" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "country", label: "Country" },
    { key: "annual_revenue", label: "Annual revenue" },
    { key: "employee_count", label: "Employee count" },
    { key: "notes", label: "Notes" },
  ],
};

const TABLE_NAMES: Record<EntityType, "crm_leads" | "crm_contacts" | "crm_organizations"> = {
  leads: "crm_leads",
  contacts: "crm_contacts",
  organizations: "crm_organizations",
};

const NUMERIC_FIELDS = new Set(["biz_cost", "annual_revenue", "employee_count"]);

// Minimal but solid CSV parser supporting quoted fields and embedded commas/newlines.
const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        cur.push(field); rows.push(cur); cur = []; field = "";
      } else { field += c; }
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  // Drop trailing empty rows
  const cleaned = rows.filter((r) => r.some((v) => (v ?? "").trim() !== ""));
  if (cleaned.length === 0) return { headers: [], rows: [] };
  const [headers, ...body] = cleaned;
  return { headers: headers.map((h) => h.trim()), rows: body };
};

const buildSampleCSV = (entity: EntityType) => {
  const fields = ENTITY_FIELDS[entity];
  const headers = fields.map((f) => f.key);
  const example = fields.map((f) => {
    if (f.key === "full_name") return "John Doe";
    if (f.key === "name") return "Acme Pvt Ltd";
    if (f.key === "email") return "john@example.com";
    if (f.key === "phone" || f.key === "whatsapp") return "+919876543210";
    if (f.key === "country") return "India";
    if (f.key === "state") return "Maharashtra";
    if (f.key === "city") return "Mumbai";
    if (NUMERIC_FIELDS.has(f.key)) return "100000";
    return "";
  });
  return headers.join(",") + "\n" + example.join(",") + "\n";
};

const autoMap = (headers: string[], fields: FieldDef[]): Record<string, string> => {
  const map: Record<string, string> = {};
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  fields.forEach((f) => {
    const target = norm(f.key);
    const targetLabel = norm(f.label);
    const found = headers.find((h) => {
      const n = norm(h);
      return n === target || n === targetLabel || n.includes(target) || target.includes(n);
    });
    if (found) map[f.key] = found;
  });
  return map;
};

type Job = {
  id: string;
  entity_type: string;
  file_name: string | null;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  status: string;
  errors: any;
  created_at: string;
};

const CrmImport = () => {
  const { workspace, myRole } = useOutletContext<Ctx>();
  const fileRef = useRef<HTMLInputElement>(null);
  const [entity, setEntity] = useState<EntityType>("leads");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tab, setTab] = useState("import");

  const isAdmin = myRole === "crm_admin";

  const loadJobs = async () => {
    const { data, error } = await supabase
      .from("crm_import_jobs")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error) setJobs((data || []) as Job[]);
  };

  useEffect(() => { if (workspace?.id) loadJobs(); }, [workspace?.id]);

  const fields = ENTITY_FIELDS[entity];

  const onFile = async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    const { headers: h, rows: r } = parseCSV(text);
    if (h.length === 0) {
      toast({ title: "Empty CSV", description: "No rows detected.", variant: "destructive" });
      return;
    }
    setHeaders(h);
    setRows(r);
    setMapping(autoMap(h, fields));
    toast({ title: `Parsed ${r.length} rows`, description: `${h.length} columns detected.` });
  };

  // Re-run automap if entity changes after a file is loaded
  useEffect(() => {
    if (headers.length > 0) setMapping(autoMap(headers, fields));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);

  const downloadTemplate = () => {
    const blob = new Blob([buildSampleCSV(entity)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entity}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const validation = useMemo(() => {
    if (rows.length === 0) return { ok: 0, bad: 0, problems: [] as { row: number; reason: string }[] };
    const required = fields.filter((f) => f.required).map((f) => f.key);
    const problems: { row: number; reason: string }[] = [];
    let ok = 0;
    rows.forEach((r, idx) => {
      const reasons: string[] = [];
      required.forEach((rk) => {
        const src = mapping[rk];
        if (!src) { reasons.push(`Missing mapping for "${rk}"`); return; }
        const colIdx = headers.indexOf(src);
        const val = colIdx >= 0 ? (r[colIdx] || "").trim() : "";
        if (!val) reasons.push(`"${rk}" is empty`);
      });
      // email shape
      const emailSrc = mapping["email"];
      if (emailSrc) {
        const v = (r[headers.indexOf(emailSrc)] || "").trim();
        if (v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) reasons.push("Invalid email");
      }
      if (reasons.length === 0) ok++;
      else problems.push({ row: idx + 2, reason: reasons.join("; ") }); // +2 to account for header + 1-indexed
    });
    return { ok, bad: problems.length, problems: problems.slice(0, 50) };
  }, [rows, headers, mapping, fields]);

  const buildRecord = (r: string[]): Record<string, any> | null => {
    const rec: Record<string, any> = { workspace_id: workspace.id };
    for (const f of fields) {
      const src = mapping[f.key];
      if (!src) continue;
      const idx = headers.indexOf(src);
      if (idx < 0) continue;
      const raw = (r[idx] ?? "").trim();
      if (raw === "") continue;
      if (NUMERIC_FIELDS.has(f.key)) {
        const n = Number(raw.replace(/[, ]/g, ""));
        rec[f.key] = Number.isFinite(n) ? n : null;
      } else {
        rec[f.key] = raw;
      }
    }
    // Required check
    for (const f of fields) {
      if (f.required && !rec[f.key]) return null;
    }
    return rec;
  };

  const runImport = async () => {
    if (rows.length === 0) {
      toast({ title: "No data to import", variant: "destructive" });
      return;
    }
    setImporting(true);
    const { data: { user } } = await supabase.auth.getUser();

    const valid: Record<string, any>[] = [];
    const errors: { row: number; reason: string }[] = [];
    rows.forEach((r, idx) => {
      const rec = buildRecord(r);
      if (rec) valid.push(rec);
      else errors.push({ row: idx + 2, reason: "Missing required field" });
    });

    let success = 0;
    let failed = errors.length;
    const tableName = TABLE_NAMES[entity];

    // Batch in chunks of 100
    for (let i = 0; i < valid.length; i += 100) {
      const batch = valid.slice(i, i + 100);
      const { error, count } = await supabase
        .from(tableName as any)
        .insert(batch, { count: "exact" });
      if (error) {
        failed += batch.length;
        errors.push({ row: i + 2, reason: error.message });
      } else {
        success += count ?? batch.length;
      }
    }

    const status = failed === 0 ? "completed" : success === 0 ? "failed" : "partial";

    await supabase.from("crm_import_jobs").insert({
      workspace_id: workspace.id,
      entity_type: entity,
      file_name: fileName,
      total_rows: rows.length,
      success_rows: success,
      failed_rows: failed,
      status,
      field_mapping: mapping,
      errors: errors.slice(0, 200),
      created_by: user?.id ?? null,
    });

    setImporting(false);
    toast({
      title: `Imported ${success} of ${rows.length}`,
      description: failed > 0 ? `${failed} failed — see History tab` : "All rows imported",
      variant: failed > 0 ? "destructive" : "default",
    });
    if (success > 0) {
      // Reset
      setHeaders([]); setRows([]); setMapping({}); setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    }
    loadJobs();
  };

  const exportEntity = async (e: EntityType) => {
    const tableName = TABLE_NAMES[e];
    const { data, error } = await supabase
      .from(tableName as any)
      .select("*")
      .eq("workspace_id", workspace.id)
      .limit(5000);
    if (error) {
      toast({ title: "Export failed", description: error.message, variant: "destructive" });
      return;
    }
    if (!data || data.length === 0) {
      toast({ title: "Nothing to export" });
      return;
    }
    const cols = Object.keys(data[0]);
    const csv =
      cols.join(",") + "\n" +
      data.map((row: any) =>
        cols.map((c) => {
          const v = row[c];
          if (v === null || v === undefined) return "";
          const s = typeof v === "object" ? JSON.stringify(v) : String(v);
          return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(",")
      ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${e}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `Exported ${data.length} ${e}` });
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Delete this import history entry?")) return;
    const { error } = await supabase.from("crm_import_jobs").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); loadJobs(); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          Bulk Import / Data Migration
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload CSV files to bulk-create leads, contacts, and organizations. Map columns, validate, then import.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* IMPORT */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">1. Choose entity & upload CSV</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Entity type</Label>
                  <Select value={entity} onValueChange={(v) => setEntity(v as EntityType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="contacts">Contacts</SelectItem>
                      <SelectItem value="organizations">Organizations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 flex items-end gap-2">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" /> Download template
                  </Button>
                  <Button variant="outline" onClick={() => fileRef.current?.click()}>
                    <FileUp className="h-4 w-4 mr-2" /> Choose CSV
                  </Button>
                  <input
                    ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                    onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                  />
                  {fileName && <span className="text-sm text-muted-foreground truncate">{fileName}</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {headers.length > 0 && (
            <>
              <Card>
                <CardHeader><CardTitle className="text-lg">2. Map columns</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fields.map((f) => (
                      <div key={f.key} className="flex items-center gap-2">
                        <div className="w-1/2 text-sm">
                          {f.label}
                          {f.required && <span className="text-destructive ml-1">*</span>}
                          <div className="text-xs text-muted-foreground">{f.key}</div>
                        </div>
                        <Select
                          value={mapping[f.key] || "__none__"}
                          onValueChange={(v) => setMapping({ ...mapping, [f.key]: v === "__none__" ? "" : v })}
                        >
                          <SelectTrigger className="flex-1"><SelectValue placeholder="— Skip —" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— Skip —</SelectItem>
                            {headers.map((h) => (
                              <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">3. Validate & import</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="outline" className="text-sm">Total: {rows.length}</Badge>
                    <Badge className="text-sm bg-primary/10 text-primary border-primary/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Valid: {validation.ok}
                    </Badge>
                    <Badge variant="destructive" className="text-sm">
                      <XCircle className="h-3 w-3 mr-1" /> Invalid: {validation.bad}
                    </Badge>
                  </div>

                  {validation.problems.length > 0 && (
                    <div className="rounded-md border bg-muted/30 p-3 max-h-48 overflow-auto text-xs">
                      <div className="font-medium mb-1">Issues (showing first {validation.problems.length}):</div>
                      <ul className="space-y-1">
                        {validation.problems.map((p, i) => (
                          <li key={i}>Row {p.row}: <span className="text-muted-foreground">{p.reason}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preview first 5 rows */}
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {headers.slice(0, 8).map((h) => <TableHead key={h}>{h}</TableHead>)}
                          {headers.length > 8 && <TableHead>…</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.slice(0, 5).map((r, i) => (
                          <TableRow key={i}>
                            {r.slice(0, 8).map((c, j) => <TableCell key={j} className="text-xs max-w-[160px] truncate">{c}</TableCell>)}
                            {headers.length > 8 && <TableCell className="text-xs text-muted-foreground">…</TableCell>}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Button onClick={runImport} disabled={importing || validation.ok === 0}>
                    {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Import {validation.ok} valid rows
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* EXPORT */}
        <TabsContent value="export">
          <Card>
            <CardHeader><CardTitle className="text-lg">Export workspace data</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Download up to 5,000 records as CSV for backup or migration.</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => exportEntity("leads")}>
                  <Download className="h-4 w-4 mr-2" /> Export Leads
                </Button>
                <Button variant="outline" onClick={() => exportEntity("contacts")}>
                  <Download className="h-4 w-4 mr-2" /> Export Contacts
                </Button>
                <Button variant="outline" onClick={() => exportEntity("organizations")}>
                  <Download className="h-4 w-4 mr-2" /> Export Organizations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {jobs.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No imports yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Success</TableHead>
                      <TableHead>Failed</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdmin && <TableHead></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((j) => (
                      <TableRow key={j.id}>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(j.created_at).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline">{j.entity_type}</Badge></TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{j.file_name || "—"}</TableCell>
                        <TableCell>{j.total_rows}</TableCell>
                        <TableCell className="text-primary">{j.success_rows}</TableCell>
                        <TableCell className="text-destructive">{j.failed_rows}</TableCell>
                        <TableCell>
                          <Badge variant={j.status === "completed" ? "default" : j.status === "failed" ? "destructive" : "secondary"}>
                            {j.status}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => deleteJob(j.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CrmImport;
