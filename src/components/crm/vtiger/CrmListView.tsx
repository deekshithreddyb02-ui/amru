import { ReactNode, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Columns3, RefreshCw, Loader2, ChevronDown, Plus } from "lucide-react";

export type Column<T> = {
  key: string;
  label: string;
  headerNode?: ReactNode;
  render?: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  defaultVisible?: boolean;
};


export type SavedView = {
  id: string;
  label: string;
  filter?: (row: any) => boolean;
};

type Props<T extends { id: string }> = {
  title: string;
  subtitle?: string;
  rows: T[];
  loading?: boolean;
  columns: Column<T>[];
  savedViews?: SavedView[];
  defaultViewId?: string;
  searchKeys?: (keyof T)[];
  onRefresh?: () => void;
  onRowClick?: (row: T) => void;
  onCreate?: () => void;
  bulkActions?: { label: string; onClick: (ids: string[]) => void; destructive?: boolean }[];
  rightActions?: ReactNode;
};

export default function CrmListView<T extends { id: string }>({
  title,
  subtitle,
  rows,
  loading,
  columns,
  savedViews = [],
  defaultViewId,
  searchKeys = [],
  onRefresh,
  onRowClick,
  onCreate,
  bulkActions = [],
  rightActions,
}: Props<T>) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewId, setViewId] = useState<string | undefined>(defaultViewId || savedViews[0]?.id);
  const [hidden, setHidden] = useState<Set<string>>(
    new Set(columns.filter((c) => c.defaultVisible === false).map((c) => c.key))
  );

  const visibleCols = columns.filter((c) => !hidden.has(c.key));
  const view = savedViews.find((v) => v.id === viewId);

  const filtered = useMemo(() => {
    let out = rows;
    if (view?.filter) out = out.filter(view.filter);
    if (q.trim()) {
      const s = q.toLowerCase();
      out = out.filter((r) =>
        searchKeys.some((k) => String((r as any)[k] || "").toLowerCase().includes(s))
      );
    }
    return out;
  }, [rows, view, q, searchKeys]);

  const allChecked = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const someChecked = selected.size > 0 && !allChecked;

  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {savedViews.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 px-2 -ml-2 gap-1 font-serif text-xl sm:text-2xl truncate">
                  {view?.label || title}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-popover">
                <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Saved views
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {savedViews.map((v) => (
                  <DropdownMenuCheckboxItem
                    key={v.id}
                    checked={viewId === v.id}
                    onCheckedChange={() => setViewId(v.id)}
                  >
                    {v.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <h1 className="font-serif text-xl sm:text-2xl truncate">{title}</h1>
          )}
          {subtitle && <span className="text-xs text-muted-foreground hidden sm:inline">· {subtitle}</span>}
          <Badge variant="secondary" className="text-[10px]">{filtered.length}</Badge>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="h-8 pl-7 w-44 sm:w-56 text-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2 gap-1">
                <Columns3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Show columns
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={!hidden.has(c.key)}
                  onCheckedChange={(v) => {
                    setHidden((prev) => {
                      const n = new Set(prev);
                      v ? n.delete(c.key) : n.add(c.key);
                      return n;
                    });
                  }}
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {onRefresh && (
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onRefresh}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          {rightActions}
          {onCreate && (
            <Button size="sm" className="h-8 gap-1" onClick={onCreate}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">New</span>
            </Button>
          )}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-primary/5 text-xs">
          <span className="font-medium">{selected.size} selected</span>
          <div className="ml-auto flex items-center gap-1">
            {bulkActions.map((a) => (
              <Button
                key={a.label}
                size="sm"
                variant={a.destructive ? "destructive" : "outline"}
                className="h-7 text-xs"
                onClick={() => a.onClick(Array.from(selected))}
              >
                {a.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-md bg-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No records.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr className="text-left">
                  <th className="px-3 py-2 w-8">
                    <Checkbox
                      checked={allChecked ? true : someChecked ? "indeterminate" : false}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  {visibleCols.map((c) => (
                    <th
                      key={c.key}
                      className={`px-3 py-2 font-medium text-[12px] uppercase tracking-wide text-muted-foreground ${c.className || ""}`}
                    >
                      {c.headerNode ?? c.label}
                    </th>
                  ))}

                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const isSel = selected.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={`border-b last:border-b-0 transition-colors ${
                        isSel ? "bg-primary/5" : "hover:bg-muted/30"
                      } ${onRowClick ? "cursor-pointer" : ""}`}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("[data-no-row-click]")) return;
                        onRowClick?.(row);
                      }}
                    >
                      <td className="px-3 py-2" data-no-row-click>
                        <Checkbox
                          checked={isSel}
                          onCheckedChange={() => toggleOne(row.id)}
                          aria-label="Select row"
                        />
                      </td>
                      {visibleCols.map((c) => (
                        <td key={c.key} className={`px-3 py-2 align-middle ${c.className || ""}`}>
                          {c.render ? c.render(row) : (row as any)[c.key] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
