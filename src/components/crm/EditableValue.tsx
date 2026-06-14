import { ReactNode, useEffect, useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type EditableValueConfig = {
  table: string;
  id: string;
  column: string;
  type?: "text" | "number" | "date" | "textarea" | "select";
  options?: { value: string; label: string }[];
  /** raw current value used to populate the input (defaults to displayed text) */
  current?: any;
};

type Props = {
  display: ReactNode;
  canEdit: boolean;
  config?: EditableValueConfig;
  onSaved?: () => void;
};

export default function EditableValue({ display, canEdit, config, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState<string>(config?.current == null ? "" : String(config.current));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setVal(config?.current == null ? "" : String(config.current));
  }, [config?.current]);

  if (!canEdit || !config) {
    return <>{display || ""}</>;
  }

  const save = async () => {
    setSaving(true);
    let payload: any = val;
    if (config.type === "number") payload = val === "" ? null : Number(val);
    if (config.type === "date") payload = val || null;
    if (payload === "") payload = null;
    const { error } = await supabase
      .from(config.table as any)
      .update({ [config.column]: payload } as any)
      .eq("id", config.id);
    setSaving(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Saved" });
      setOpen(false);
      onSaved?.();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span className="group/edit inline-flex items-center gap-1 cursor-pointer rounded hover:bg-primary/5 px-0.5 -mx-0.5">
          <span>{display || <span className="text-muted-foreground italic">empty</span>}</span>
          <Pencil className="h-3 w-3 opacity-0 group-hover/edit:opacity-60 transition-opacity" />
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Edit value</div>
        {config.type === "textarea" ? (
          <Textarea value={val} onChange={(e) => setVal(e.target.value)} rows={4} className="text-sm" />
        ) : config.type === "select" ? (
          <Select value={val} onValueChange={setVal}>
            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {(config.options || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type={config.type === "number" ? "number" : config.type === "date" ? "date" : "text"}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); }}
            className="h-8 text-sm"
          />
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
