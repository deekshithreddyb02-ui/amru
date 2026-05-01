import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, MessageSquare, Send, Copy, Trash2, ExternalLink } from "lucide-react";

type Workspace = { id: string; slug: string; name: string };
type Ctx = { workspace: Workspace; myRole: string };

type Template = {
  id: string;
  name: string;
  channel: string;
  category: string | null;
  language: string | null;
  body: string;
  variables: string[] | null;
  is_active: boolean;
  created_at: string;
};

type Message = {
  id: string;
  channel: string;
  direction: string;
  recipient_name: string | null;
  recipient_phone: string;
  template_id: string | null;
  body: string;
  status: string;
  provider: string | null;
  related_entity_type: string | null;
  sent_at: string | null;
  created_at: string;
};

const VAR_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

const extractVars = (body: string): string[] => {
  const vars = new Set<string>();
  let m;
  while ((m = VAR_REGEX.exec(body)) !== null) vars.add(m[1]);
  return Array.from(vars);
};

const renderBody = (body: string, values: Record<string, string>) =>
  body.replace(VAR_REGEX, (_, k) => values[k] ?? `{{${k}}}`);

const buildWaUrl = (phone: string, text: string) => {
  const cleaned = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
};

const buildSmsUrl = (phone: string, text: string) =>
  `sms:${phone}?body=${encodeURIComponent(text)}`;

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default",
  delivered: "default",
  clicked: "default",
  read: "default",
  queued: "secondary",
  failed: "destructive",
};

const CrmMessages = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [tab, setTab] = useState("send");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Send composer
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [customBody, setCustomBody] = useState("");

  // Template editor
  const [tplOpen, setTplOpen] = useState(false);
  const [tplForm, setTplForm] = useState({
    name: "",
    channel: "whatsapp",
    category: "general",
    language: "en",
    body: "",
  });

  const load = async () => {
    setLoading(true);
    const [tplRes, msgRes] = await Promise.all([
      supabase.from("crm_message_templates").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }),
      supabase.from("crm_messages").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(200),
    ]);
    if (tplRes.error) toast({ title: "Failed to load templates", description: tplRes.error.message, variant: "destructive" });
    else setTemplates((tplRes.data || []) as Template[]);
    if (msgRes.error) toast({ title: "Failed to load messages", description: msgRes.error.message, variant: "destructive" });
    else setMessages((msgRes.data || []) as Message[]);
    setLoading(false);
  };

  useEffect(() => {
    if (workspace?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  const selectedTpl = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  const previewBody = useMemo(() => {
    const base = selectedTpl ? selectedTpl.body : customBody;
    return renderBody(base, varValues);
  }, [selectedTpl, customBody, varValues]);

  const stats = useMemo(() => {
    const total = messages.length;
    const sent = messages.filter((m) => ["sent", "delivered", "read", "clicked"].includes(m.status)).length;
    const failed = messages.filter((m) => m.status === "failed").length;
    const unique = new Set(messages.map((m) => m.recipient_phone)).size;
    return { total, sent, failed, unique };
  }, [messages]);

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (t) {
      const vars = extractVars(t.body);
      const next: Record<string, string> = {};
      vars.forEach((v) => (next[v] = varValues[v] || ""));
      setVarValues(next);
      setChannel(t.channel === "sms" ? "sms" : "whatsapp");
    }
  };

  const sendMessage = async () => {
    if (!recipientPhone.trim()) {
      toast({ title: "Recipient phone required", variant: "destructive" });
      return;
    }
    if (!previewBody.trim()) {
      toast({ title: "Message body is empty", variant: "destructive" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const url = channel === "whatsapp" ? buildWaUrl(recipientPhone, previewBody) : buildSmsUrl(recipientPhone, previewBody);

    // Log message first
    const { error } = await supabase.from("crm_messages").insert({
      workspace_id: workspace.id,
      channel,
      direction: "outbound",
      recipient_name: recipientName || null,
      recipient_phone: recipientPhone,
      template_id: selectedTemplateId || null,
      body: previewBody,
      status: "sent",
      provider: "click_to_chat",
      sent_by: user?.id ?? null,
      sent_at: new Date().toISOString(),
    });
    if (error) {
      toast({ title: "Failed to log message", description: error.message, variant: "destructive" });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    toast({ title: "Opening " + (channel === "whatsapp" ? "WhatsApp" : "SMS") + "…" });
    load();
  };

  const copyLink = () => {
    if (!recipientPhone || !previewBody) return;
    const url = channel === "whatsapp" ? buildWaUrl(recipientPhone, previewBody) : buildSmsUrl(recipientPhone, previewBody);
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied" });
  };

  const saveTemplate = async () => {
    if (!tplForm.name.trim() || !tplForm.body.trim()) {
      toast({ title: "Name and body required", variant: "destructive" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("crm_message_templates").insert({
      workspace_id: workspace.id,
      name: tplForm.name,
      channel: tplForm.channel,
      category: tplForm.category,
      language: tplForm.language,
      body: tplForm.body,
      variables: extractVars(tplForm.body),
      created_by: user?.id ?? null,
    });
    if (error) {
      toast({ title: "Failed to save template", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Template saved" });
    setTplOpen(false);
    setTplForm({ name: "", channel: "whatsapp", category: "general", language: "en", body: "" });
    load();
  };

  const toggleTemplate = async (t: Template) => {
    const { error } = await supabase
      .from("crm_message_templates")
      .update({ is_active: !t.is_active })
      .eq("id", t.id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else load();
  };

  const deleteTemplate = async (t: Template) => {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    const { error } = await supabase.from("crm_message_templates").delete().eq("id", t.id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            WhatsApp / SMS Hub
          </h1>
          <p className="text-sm text-muted-foreground">Send messages, manage templates, and track conversation history.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total messages</div><div className="text-2xl font-semibold">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Sent</div><div className="text-2xl font-semibold text-primary">{stats.sent}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Failed</div><div className="text-2xl font-semibold text-destructive">{stats.failed}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Unique recipients</div><div className="text-2xl font-semibold">{stats.unique}</div></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="send">Send</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* SEND */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Compose message</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Channel</Label>
                  <Select value={channel} onValueChange={(v) => setChannel(v as "whatsapp" | "sms")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Recipient name</Label>
                  <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Optional" />
                </div>
                <div>
                  <Label>Phone (with country code)</Label>
                  <Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="+919876543210" />
                </div>
              </div>

              <div>
                <Label>Template (optional)</Label>
                <Select value={selectedTemplateId || "none"} onValueChange={(v) => handleTemplateSelect(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Choose a template" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Custom message —</SelectItem>
                    {templates.filter((t) => t.is_active).map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name} ({t.channel})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!selectedTpl ? (
                <div>
                  <Label>Message body</Label>
                  <Textarea rows={4} value={customBody} onChange={(e) => setCustomBody(e.target.value)} placeholder="Type your message…" />
                </div>
              ) : (
                <>
                  {extractVars(selectedTpl.body).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {extractVars(selectedTpl.body).map((v) => (
                        <div key={v}>
                          <Label>{v}</Label>
                          <Input
                            value={varValues[v] || ""}
                            onChange={(e) => setVarValues({ ...varValues, [v]: e.target.value })}
                            placeholder={`Value for {{${v}}}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div>
                <Label>Preview</Label>
                <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap min-h-[80px]">
                  {previewBody || <span className="text-muted-foreground">Nothing to preview yet…</span>}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={sendMessage} disabled={!recipientPhone || !previewBody}>
                  <Send className="h-4 w-4 mr-2" /> Open & log
                </Button>
                <Button variant="outline" onClick={copyLink} disabled={!recipientPhone || !previewBody}>
                  <Copy className="h-4 w-4 mr-2" /> Copy link
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Opens WhatsApp/SMS in a new tab using a click-to-chat link. Message is logged in History.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={tplOpen} onOpenChange={setTplOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" /> New template</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>New message template</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Name *</Label>
                    <Input value={tplForm.name} onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Channel</Label>
                      <Select value={tplForm.channel} onValueChange={(v) => setTplForm({ ...tplForm, channel: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Category</Label>
                      <Select value={tplForm.category} onValueChange={(v) => setTplForm({ ...tplForm, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="greeting">Greeting</SelectItem>
                          <SelectItem value="follow_up">Follow-up</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Body *</Label>
                    <Textarea rows={5} value={tplForm.body} onChange={(e) => setTplForm({ ...tplForm, body: e.target.value })}
                      placeholder="Hi {{name}}, your invoice {{invoice_number}} is due on {{due_date}}." />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use <code>{"{{variable}}"}</code> placeholders. Detected: {extractVars(tplForm.body).join(", ") || "none"}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTplOpen(false)}>Cancel</Button>
                  <Button onClick={saveTemplate}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : templates.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No templates yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Variables</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell><Badge variant="outline">{t.channel}</Badge></TableCell>
                        <TableCell className="text-xs">{t.category}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{(t.variables || []).join(", ") || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={t.is_active ? "default" : "outline"}>{t.is_active ? "active" : "inactive"}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => toggleTemplate(t)}>
                            {t.is_active ? "Disable" : "Enable"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteTemplate(t)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : messages.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No messages logged yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Body</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(m.sent_at || m.created_at).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline">{m.channel}</Badge></TableCell>
                        <TableCell className="text-sm">
                          {m.recipient_name && <div>{m.recipient_name}</div>}
                          <div className="text-xs text-muted-foreground">{m.recipient_phone}</div>
                        </TableCell>
                        <TableCell className="text-xs max-w-md truncate">{m.body}</TableCell>
                        <TableCell><Badge variant={STATUS_VARIANT[m.status] || "outline"}>{m.status}</Badge></TableCell>
                        <TableCell>
                          <a
                            href={m.channel === "whatsapp" ? buildWaUrl(m.recipient_phone, m.body) : buildSmsUrl(m.recipient_phone, m.body)}
                            target="_blank" rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                          >
                            <ExternalLink className="h-3 w-3" /> Reopen
                          </a>
                        </TableCell>
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

export default CrmMessages;
