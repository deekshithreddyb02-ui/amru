import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Loader2,
  History,
  Share2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Doc = {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  version: number;
  parent_document_id: string | null;
  is_shared: boolean;
  share_token: string | null;
  lead_id: string | null;
  deal_id: string | null;
  ticket_id: string | null;
  created_at: string;
};

const formatBytes = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const CrmDocuments = () => {
  const { workspace, myRole } = useOutletContext<Ctx>();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [versionOf, setVersionOf] = useState<Doc | null>(null);
  const [deleting, setDeleting] = useState<Doc | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const canDelete = myRole === "crm_admin" || myRole === "super_admin";

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_documents")
      .select("*")
      .eq("workspace_id", workspace.id)
      .is("parent_document_id", null) // only root versions in main list
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) console.error(error);
    setDocs((data as Doc[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id]);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Pick a file");
      return;
    }
    setUploading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;

    let version = 1;
    let parentId: string | null = null;
    if (versionOf) {
      // find max version in chain
      const { data: chain } = await supabase
        .from("crm_documents")
        .select("version")
        .or(`id.eq.${versionOf.id},parent_document_id.eq.${versionOf.id}`)
        .order("version", { ascending: false })
        .limit(1);
      version = (chain?.[0]?.version || versionOf.version) + 1;
      parentId = versionOf.id;
    }

    const safeName = file.name.replace(/[^\w.\-]/g, "_");
    const filePath = `${workspace.id}/${Date.now()}_v${version}_${safeName}`;

    const { error: upErr } = await supabase.storage
      .from("crm-documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
    if (upErr) {
      toast.error(upErr.message);
      setUploading(false);
      return;
    }

    const { error: dbErr } = await supabase.from("crm_documents").insert({
      workspace_id: workspace.id,
      uploaded_by: userId ?? null,
      name: versionOf ? versionOf.name : file.name,
      description: description.trim() || null,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      version,
      parent_document_id: parentId,
    });

    setUploading(false);
    if (dbErr) {
      toast.error(dbErr.message);
      return;
    }
    toast.success(versionOf ? `Version ${version} uploaded` : "File uploaded");
    setUploadOpen(false);
    setVersionOf(null);
    setDescription("");
    if (fileRef.current) fileRef.current.value = "";
    load();
  };

  const download = async (doc: Doc) => {
    const { data, error } = await supabase.storage
      .from("crm-documents")
      .createSignedUrl(doc.file_path, 60);
    if (error || !data) {
      toast.error("Download failed");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const toggleShare = async (doc: Doc) => {
    if (doc.is_shared && doc.share_token) {
      await supabase
        .from("crm_documents")
        .update({ is_shared: false, share_token: null })
        .eq("id", doc.id);
      toast.success("Sharing disabled");
    } else {
      const token = crypto.randomUUID();
      await supabase
        .from("crm_documents")
        .update({ is_shared: true, share_token: token })
        .eq("id", doc.id);
      const { data } = await supabase.storage
        .from("crm-documents")
        .createSignedUrl(doc.file_path, 60 * 60 * 24 * 7); // 7 days
      if (data) {
        await navigator.clipboard.writeText(data.signedUrl);
        toast.success("7-day share link copied to clipboard");
      }
    }
    load();
  };

  const copyLink = async (doc: Doc) => {
    const { data } = await supabase.storage
      .from("crm-documents")
      .createSignedUrl(doc.file_path, 60 * 60 * 24);
    if (data) {
      await navigator.clipboard.writeText(data.signedUrl);
      toast.success("24h link copied");
    }
  };

  const remove = async (doc: Doc) => {
    // delete from storage + DB (children cascade-set null on parent)
    await supabase.storage.from("crm-documents").remove([doc.file_path]);
    const { error } = await supabase.from("crm_documents").delete().eq("id", doc.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    setDeleting(null);
    load();
  };

  const filtered = docs.filter(
    (d) => !q || d.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" /> Documents
          </h1>
          <p className="text-muted-foreground text-sm">{workspace.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8 w-56"
            />
          </div>
          <Button
            onClick={() => {
              setVersionOf(null);
              setUploadOpen(true);
            }}
            className="gap-2"
          >
            <Upload className="h-4 w-4" /> Upload
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No documents yet. Upload contracts, surveys, photos, or any project files.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Version</th>
                  <th className="px-4 py-3 font-medium">Uploaded</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-medium truncate">{d.name}</div>
                      {d.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {d.description}
                        </div>
                      )}
                      <div className="flex gap-1 mt-1">
                        {d.is_shared && (
                          <Badge variant="secondary" className="text-[10px] h-4 gap-1">
                            <Share2 className="h-2.5 w-2.5" /> Shared
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{formatBytes(d.file_size)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">v{d.version}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => download(d)} title="Download">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => copyLink(d)} title="Copy 24h link">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleShare(d)}
                          title={d.is_shared ? "Disable sharing" : "Enable 7-day share"}
                        >
                          <Share2 className={`h-4 w-4 ${d.is_shared ? "text-primary" : ""}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setVersionOf(d);
                            setUploadOpen(true);
                          }}
                          title="Upload new version"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => setDeleting(d)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {versionOf ? `Upload new version of "${versionOf.name}"` : "Upload document"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>File</Label>
              <Input ref={fileRef} type="file" />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this file?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={upload} disabled={uploading}>
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.name}" will be permanently removed from storage. Versions linked to it will lose their parent reference.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && remove(deleting)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CrmDocuments;
