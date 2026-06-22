import { ReactNode } from "react";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

export type SummaryField = { label: string; value: ReactNode };
export type RelatedTab = { id: string; label: string; icon?: LucideIcon; count?: number; content: ReactNode };

type Props = {
  backTo?: string;
  title: string;
  subtitle?: string;
  status?: { label: string; tone?: "default" | "primary" | "success" | "warning" | "danger" };
  avatar?: ReactNode;
  summary: SummaryField[];
  actions?: ReactNode;
  tabs: RelatedTab[];
  defaultTab?: string;
};

const toneClass: Record<string, string> = {
  default: "bg-muted text-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-destructive/10 text-destructive",
};

export default function CrmRecordView({
  backTo,
  title,
  subtitle,
  status,
  avatar,
  summary,
  actions,
  tabs,
  defaultTab,
}: Props) {
  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {backTo && (
          <Button variant="ghost" size="sm" className="h-8 -ml-2 gap-1" onClick={() => navigate(backTo)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        )}
        <div className="ml-auto flex items-center gap-1.5">{actions}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <aside className="border rounded-md bg-card p-4 space-y-4 lg:sticky lg:top-[6.5rem] self-start">
          <div className="flex items-start gap-3">
            {avatar && <div className="shrink-0">{avatar}</div>}
            <div className="min-w-0">
              <h1 className="font-serif text-xl leading-tight truncate">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
              {status && (
                <Badge className={`mt-1.5 ${toneClass[status.tone || "default"]}`} variant="secondary">
                  {status.label}
                </Badge>
              )}
            </div>
          </div>
          <div className="border-t pt-3 space-y-2.5">
            {summary.map((f, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-muted-foreground col-span-1">{f.label}</div>
                <div className="col-span-2 font-medium break-words">{f.value || "—"}</div>
              </div>
            ))}
          </div>
        </aside>

        <section className="border rounded-md bg-card">
          <Tabs defaultValue={defaultTab || tabs[0]?.id}>
            <TabsList className="w-full justify-start rounded-none bg-muted/30 border-b h-auto p-0 overflow-x-auto thin-scrollbar">
              {tabs.map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2.5 py-1.5 text-[12px] gap-1"
                >
                  {t.icon && <t.icon className="h-3 w-3" />}
                  {t.label}
                  {typeof t.count === "number" && (
                    <span className="text-[10px] text-muted-foreground">({t.count})</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((t) => (
              <TabsContent key={t.id} value={t.id} className="p-4 mt-0">
                {t.content}
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </div>
    </div>
  );
}
