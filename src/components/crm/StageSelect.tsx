import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStageConfig, STAGE_COLOR_CLASSES } from "@/hooks/useStageConfig";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Inline stage selector with optimistic UI. Writes to crm_deals.stage.
 * Realtime subscribers everywhere will see the change.
 */
export default function StageSelect({
  workspaceId,
  dealId,
  value,
  onChanged,
  disabled,
  size = "sm",
}: {
  workspaceId: string | undefined;
  dealId: string;
  value: string | null | undefined;
  onChanged?: (next: string) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const { stages, get } = useStageConfig(workspaceId);
  const [saving, setSaving] = useState(false);
  const [optimistic, setOptimistic] = useState<string | null>(null);
  const current = get(optimistic ?? value);
  const tone = STAGE_COLOR_CLASSES[current.color] || STAGE_COLOR_CLASSES.gray;

  const change = async (nextKey: string) => {
    if (nextKey === (optimistic ?? value)) return;
    const prev = value;
    setOptimistic(nextKey);
    setSaving(true);
    const nextStage = get(nextKey);
    const { error } = await supabase
      .from("crm_deals")
      .update({ stage: nextKey, probability: nextStage.probability })
      .eq("id", dealId);
    setSaving(false);
    if (error) {
      setOptimistic(prev ?? null);
      toast({ title: "Could not update stage", description: error.message, variant: "destructive" });
      return;
    }
    setOptimistic(null);
    onChanged?.(nextKey);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled || saving}>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center gap-1 rounded border px-2 py-0.5 hover:opacity-90 disabled:opacity-60",
            tone,
            size === "sm" ? "text-[11px]" : "text-xs"
          )}
          data-no-row-click
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          <span className="font-medium">{current.label}</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
        {stages.map((s) => {
          const t = STAGE_COLOR_CLASSES[s.color] || STAGE_COLOR_CLASSES.gray;
          const active = s.key === (optimistic ?? value);
          return (
            <DropdownMenuItem
              key={s.key}
              onClick={(e) => { e.stopPropagation(); change(s.key); }}
              className="flex items-center justify-between gap-2"
            >
              <Badge variant="secondary" className={cn(t, "border")}>{s.label}</Badge>
              <span className="text-[10px] text-muted-foreground">{s.probability}%</span>
              {active && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
