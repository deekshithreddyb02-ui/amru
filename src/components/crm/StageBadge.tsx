import { Badge } from "@/components/ui/badge";
import { useStageConfig, STAGE_COLOR_CLASSES } from "@/hooks/useStageConfig";
import { cn } from "@/lib/utils";

export default function StageBadge({
  workspaceId,
  stageKey,
  className,
}: {
  workspaceId: string | undefined;
  stageKey: string | null | undefined;
  className?: string;
}) {
  const { get } = useStageConfig(workspaceId);
  const s = get(stageKey);
  const tone = STAGE_COLOR_CLASSES[s.color] || STAGE_COLOR_CLASSES.gray;
  return (
    <Badge variant="secondary" className={cn(tone, "border", className)}>
      {s.label}
    </Badge>
  );
}
