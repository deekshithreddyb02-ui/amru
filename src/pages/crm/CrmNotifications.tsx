import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, Trash2, Settings, Loader2, Inbox } from "lucide-react";
import { toast } from "sonner";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
  workspace_id: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
};

type Prefs = {
  email_enabled: boolean;
  in_app_enabled: boolean;
  digest_frequency: string;
  muted_types: string[];
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
};

const DEFAULT_PREFS: Prefs = {
  email_enabled: true,
  in_app_enabled: true,
  digest_frequency: "daily",
  muted_types: [],
  quiet_hours_start: null,
  quiet_hours_end: null,
};

const KNOWN_TYPES = [
  "reminder",
  "sla_breach",
  "workflow",
  "approval",
  "assignment",
  "mention",
  "system",
];

const CrmNotifications = () => {
  const navigate = useNavigate();
  const { workspace } = useOutletContext<{ workspace: { id: string; slug: string } }>();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    setUserId(session.user.id);

    let q = supabase
      .from("crm_notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (workspace?.id) q = q.eq("workspace_id", workspace.id);

    const { data, error } = await q;
    if (error) toast.error("Failed to load notifications");
    setItems((data as Notification[]) || []);

    const { data: prefRow } = await supabase
      .from("crm_notification_preferences")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (prefRow) {
      setPrefs({
        email_enabled: prefRow.email_enabled,
        in_app_enabled: prefRow.in_app_enabled,
        digest_frequency: prefRow.digest_frequency,
        muted_types: prefRow.muted_types || [],
        quiet_hours_start: prefRow.quiet_hours_start,
        quiet_hours_end: prefRow.quiet_hours_end,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  // Realtime new notifications
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`notif-page-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "crm_notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setItems((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId]);

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (filter === "unread" && n.is_read) return false;
      if (filter === "read" && !n.is_read) return false;
      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!n.title.toLowerCase().includes(q) && !(n.body || "").toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [items, filter, typeFilter, search]);

  const types = useMemo(() => {
    const s = new Set<string>(KNOWN_TYPES);
    items.forEach((i) => s.add(i.type));
    return Array.from(s);
  }, [items]);

  const unreadCount = items.filter((i) => !i.is_read).length;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((n) => n.id)));
  };

  const markRead = async (ids: string[], read = true) => {
    if (!ids.length) return;
    const { error } = await supabase
      .from("crm_notifications")
      .update({ is_read: read, read_at: read ? new Date().toISOString() : null })
      .in("id", ids);
    if (error) return toast.error("Failed to update");
    setItems((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: read } : n))
    );
    setSelected(new Set());
  };

  const deleteIds = async (ids: string[]) => {
    if (!ids.length) return;
    const { error } = await supabase.from("crm_notifications").delete().in("id", ids);
    if (error) return toast.error("Failed to delete");
    setItems((prev) => prev.filter((n) => !ids.includes(n.id)));
    setSelected(new Set());
    toast.success(`Deleted ${ids.length} notification(s)`);
  };

  const markAllRead = async () => {
    const ids = items.filter((n) => !n.is_read).map((n) => n.id);
    await markRead(ids, true);
    toast.success("All marked as read");
  };

  const openNotification = async (n: Notification) => {
    if (!n.is_read) await markRead([n.id], true);
    if (n.link) {
      const link = n.link.replace("__SLUG__", workspace?.slug || "");
      navigate(link);
    }
  };

  const savePrefs = async () => {
    if (!userId) return;
    setSavingPrefs(true);
    const { error } = await supabase
      .from("crm_notification_preferences")
      .upsert(
        {
          user_id: userId,
          workspace_id: workspace?.id || null,
          ...prefs,
        },
        { onConflict: "user_id" }
      );
    setSavingPrefs(false);
    if (error) return toast.error("Failed to save preferences");
    toast.success("Preferences saved");
  };

  const toggleMuted = (t: string) => {
    setPrefs((p) => ({
      ...p,
      muted_types: p.muted_types.includes(t)
        ? p.muted_types.filter((x) => x !== t)
        : [...p.muted_types, t],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-serif flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" /> Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount} unread · {items.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={!unreadCount}>
            <CheckCheck className="h-4 w-4 mr-1.5" /> Mark all read
          </Button>
        </div>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">
            <Inbox className="h-4 w-4 mr-1.5" /> Inbox
          </TabsTrigger>
          <TabsTrigger value="prefs">
            <Settings className="h-4 w-4 mr-1.5" /> Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-3 mt-4">
          <Card>
            <CardContent className="p-3 flex flex-wrap gap-2 items-center">
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {types.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selected.size > 0 && (
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" variant="outline" onClick={() => markRead(Array.from(selected), true)}>
                    Mark read ({selected.size})
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => markRead(Array.from(selected), false)}>
                    Mark unread
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteIds(Array.from(selected))}>
                    <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-2 opacity-40" />
                  <p>No notifications match your filters.</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[65vh]">
                  <div className="px-3 py-2 border-b flex items-center gap-2">
                    <Checkbox
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onCheckedChange={selectAll}
                    />
                    <span className="text-xs text-muted-foreground">
                      Select all visible ({filtered.length})
                    </span>
                  </div>
                  <ul className="divide-y">
                    {filtered.map((n) => (
                      <li
                        key={n.id}
                        className={`flex items-start gap-3 px-3 py-3 hover:bg-muted/40 transition-colors ${
                          !n.is_read ? "bg-primary/5" : ""
                        }`}
                      >
                        <Checkbox
                          checked={selected.has(n.id)}
                          onCheckedChange={() => toggleSelect(n.id)}
                          className="mt-1"
                        />
                        <button
                          onClick={() => openNotification(n)}
                          className="flex-1 text-left min-w-0"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            {!n.is_read && (
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            )}
                            <span className="font-medium truncate">{n.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {n.type}
                            </Badge>
                          </div>
                          {n.body && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {n.body}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </p>
                        </button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => deleteIds([n.id])}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prefs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">In-app notifications</Label>
                  <p className="text-sm text-muted-foreground">Show alerts in the bell menu and inbox</p>
                </div>
                <Switch
                  checked={prefs.in_app_enabled}
                  onCheckedChange={(v) => setPrefs((p) => ({ ...p, in_app_enabled: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Email notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications by email</p>
                </div>
                <Switch
                  checked={prefs.email_enabled}
                  onCheckedChange={(v) => setPrefs((p) => ({ ...p, email_enabled: v }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Email digest frequency</Label>
                <Select
                  value={prefs.digest_frequency}
                  onValueChange={(v) => setPrefs((p) => ({ ...p, digest_frequency: v }))}
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instant</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily digest</SelectItem>
                    <SelectItem value="weekly">Weekly digest</SelectItem>
                    <SelectItem value="off">Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 max-w-md">
                <div className="space-y-2">
                  <Label>Quiet hours start</Label>
                  <Input
                    type="time"
                    value={prefs.quiet_hours_start || ""}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, quiet_hours_start: e.target.value || null }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quiet hours end</Label>
                  <Input
                    type="time"
                    value={prefs.quiet_hours_end || ""}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, quiet_hours_end: e.target.value || null }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mute notification types</Label>
                <div className="flex flex-wrap gap-2">
                  {KNOWN_TYPES.map((t) => {
                    const muted = prefs.muted_types.includes(t);
                    return (
                      <Button
                        key={t}
                        type="button"
                        size="sm"
                        variant={muted ? "default" : "outline"}
                        onClick={() => toggleMuted(t)}
                      >
                        {muted ? "Muted: " : ""}
                        {t}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Button onClick={savePrefs} disabled={savingPrefs}>
                {savingPrefs && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Save preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CrmNotifications;
