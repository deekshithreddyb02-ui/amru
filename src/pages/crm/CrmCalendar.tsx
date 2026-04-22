import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Phone, CalendarDays, ListTodo, StickyNote, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type ActivityType = "task" | "call" | "meeting" | "note" | "email";

type CalActivity = {
  id: string;
  activity_type: ActivityType;
  subject: string;
  due_at: string;
  status: string;
  priority: string;
};

const TYPE_ICON: Record<ActivityType, typeof ListTodo> = {
  task: ListTodo,
  call: Phone,
  meeting: CalendarDays,
  note: StickyNote,
  email: Mail,
};

const TYPE_TONE: Record<ActivityType, string> = {
  task: "bg-primary/15 text-primary",
  call: "bg-[hsl(var(--teal))]/15 text-[hsl(var(--teal))]",
  meeting: "bg-secondary/30 text-secondary-foreground",
  note: "bg-muted text-foreground",
  email: "bg-accent text-accent-foreground",
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

const CrmCalendar = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [month, setMonth] = useState<Date>(new Date());
  const [selected, setSelected] = useState<Date>(new Date());
  const [items, setItems] = useState<CalActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const start = startOfMonth(month).toISOString();
    const end = endOfMonth(month).toISOString();
    const { data, error } = await supabase
      .from("crm_activities")
      .select("id,activity_type,subject,due_at,status,priority")
      .eq("workspace_id", workspace.id)
      .not("due_at", "is", null)
      .gte("due_at", start)
      .lte("due_at", end)
      .order("due_at", { ascending: true });
    if (error) console.error(error);
    setItems((data as CalActivity[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id, month]);

  const daysWithActivity = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (!i.due_at) return;
      const d = new Date(i.due_at);
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return set;
  }, [items]);

  const dayOfSelected = useMemo(
    () => items.filter((i) => sameDay(new Date(i.due_at), selected)),
    [items, selected]
  );

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif">Calendar</h1>
          <p className="text-muted-foreground text-sm">
            {workspace.name} · {todayStr}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setMonth(new Date()); setSelected(new Date()); }}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4">
        <Card className="p-2">
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={(d) => d && setSelected(d)}
            modifiers={{
              hasActivity: (d) =>
                daysWithActivity.has(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`),
            }}
            modifiersClassNames={{
              hasActivity:
                "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
            }}
            className="pointer-events-auto"
          />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-xl">
              {selected.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </h2>
            <Badge variant="secondary">{dayOfSelected.length} activities</Badge>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : dayOfSelected.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Nothing scheduled for this day.
            </div>
          ) : (
            <ul className="divide-y">
              {dayOfSelected.map((a) => {
                const Icon = TYPE_ICON[a.activity_type];
                const done = a.status === "done";
                return (
                  <li key={a.id} className="py-3 flex items-start gap-3">
                    <div
                      className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${TYPE_TONE[a.activity_type]}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-medium ${done ? "line-through text-muted-foreground" : ""}`}
                      >
                        {a.subject}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(a.due_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {a.priority}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CrmCalendar;
