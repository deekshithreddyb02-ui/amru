import { ReactNode, useState, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";

type Props = {
  /** raw stored label (or null) */
  value: string | null | undefined;
  /** displayed fallback when value is empty */
  fallback: string;
  /** stable key inside scope */
  labelKey: string;
  /** can current user edit? */
  canEdit: boolean;
  /** save handler */
  onSave: (key: string, label: string | null, extra?: Record<string, any>) => Promise<any>;
  /** optional extra fields editor (e.g. color, visible) */
  extra?: Record<string, any>;
  extraFields?: ("color" | "visible")[];
  className?: string;
  /** custom render of the display node (e.g. badge). Receives the resolved label. */
  render?: (label: string) => ReactNode;
  /** wrapper element */
  as?: "span" | "div";
};

const COLORS = [
  { key: "amber", cls: "bg-amber-100 text-amber-800" },
  { key: "blue", cls: "bg-blue-100 text-blue-800" },
  { key: "indigo", cls: "bg-indigo-100 text-indigo-800" },
  { key: "yellow", cls: "bg-yellow-100 text-yellow-800" },
  { key: "green", cls: "bg-green-100 text-green-800" },
  { key: "red", cls: "bg-red-100 text-red-700" },
  { key: "gray", cls: "bg-muted text-foreground" },
  { key: "purple", cls: "bg-purple-100 text-purple-800" },
];

export default function EditableLabel({
  value,
  fallback,
  labelKey,
  canEdit,
  onSave,
  extra = {},
  extraFields = [],
  className = "",
  render,
  as = "span",
}: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value ?? fallback);
  const [color, setColor] = useState<string>(extra.color || "");
  const [visible, setVisible] = useState<boolean>(extra.visible !== false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setText(value ?? fallback);
    setColor(extra.color || "");
    setVisible(extra.visible !== false);
  }, [value, fallback, extra.color, extra.visible]);

  const resolved = value || fallback;
  const Wrapper = as as any;

  const save = async () => {
    setSaving(true);
    const trimmed = text.trim();
    const extraPatch: Record<string, any> = {};
    if (extraFields.includes("color")) extraPatch.color = color || null;
    if (extraFields.includes("visible")) extraPatch.visible = visible;
    const err = await onSave(labelKey, trimmed === fallback ? null : trimmed, extraPatch);
    setSaving(false);
    if (err) toast({ title: "Save failed", description: (err as any).message, variant: "destructive" });
    else {
      toast({ title: "Saved" });
      setOpen(false);
    }
  };

  if (!canEdit) {
    return <Wrapper className={className}>{render ? render(resolved) : resolved}</Wrapper>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Wrapper
          className={`group/edit relative inline-flex items-center gap-1 cursor-pointer rounded hover:bg-primary/5 ${className}`}
          onClick={(e: any) => { e.stopPropagation(); }}
        >
          {render ? render(resolved) : <span>{resolved}</span>}
          <Pencil className="h-3 w-3 opacity-0 group-hover/edit:opacity-60 transition-opacity" />
        </Wrapper>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Edit label</div>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); }}
          placeholder={fallback}
          className="h-8 text-sm"
        />
        {extraFields.includes("color") && (
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">Color</div>
            <div className="flex flex-wrap gap-1">
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  className={`h-6 px-2 rounded text-[10px] font-semibold border ${c.cls} ${color === c.key ? "ring-2 ring-primary" : ""}`}
                >
                  Aa
                </button>
              ))}
              <button type="button" onClick={() => setColor("")} className="h-6 px-2 rounded text-[10px] border">Reset</button>
            </div>
          </div>
        )}
        {extraFields.includes("visible") && (
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            Show
          </label>
        )}
        <div className="flex items-center justify-end gap-1 pt-1">
          <Button size="sm" variant="ghost" className="h-7" onClick={() => setOpen(false)}>
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-7" onClick={save} disabled={saving}>
            <Check className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const COLOR_TONE_MAP: Record<string, string> = Object.fromEntries(
  COLORS.map((c) => [c.key, c.cls])
);
