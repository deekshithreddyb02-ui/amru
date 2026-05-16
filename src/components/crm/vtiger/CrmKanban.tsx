import { ReactNode, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";

export type KanbanColumn = { id: string; label: string; tone?: string };

type Props<T extends { id: string }> = {
  columns: KanbanColumn[];
  items: T[];
  groupBy: (row: T) => string;
  renderCard: (row: T) => ReactNode;
  onMove: (rowId: string, toColumn: string) => void;
  onCardClick?: (row: T) => void;
};

function Card<T extends { id: string }>({
  row,
  children,
  onClick,
}: { row: T; children: ReactNode; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: row.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-card border rounded-md p-2 text-xs cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {children}
    </div>
  );
}

function Column({ id, label, tone, count, children }: any) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-w-[260px] w-[260px] flex flex-col rounded-md border bg-muted/20 ${
        isOver ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="px-3 py-2 border-b flex items-center justify-between bg-card sticky top-0 z-10 rounded-t-md">
        <div className="flex items-center gap-2">
          {tone && <span className={`h-2 w-2 rounded-full ${tone}`} />}
          <span className="text-[12px] font-medium uppercase tracking-wide">{label}</span>
        </div>
        <Badge variant="secondary" className="text-[10px]">{count}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[calc(100vh-16rem)]">
        {children}
      </div>
    </div>
  );
}

export default function CrmKanban<T extends { id: string }>({
  columns,
  items,
  groupBy,
  renderCard,
  onMove,
  onCardClick,
}: Props<T>) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const grouped = useMemo(() => {
    const map = new Map<string, T[]>();
    columns.forEach((c) => map.set(c.id, []));
    items.forEach((it) => {
      const k = groupBy(it);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    });
    return map;
  }, [columns, items, groupBy]);

  const handleDragEnd = (e: DragEndEvent) => {
    if (!e.over) return;
    const id = String(e.active.id);
    const to = String(e.over.id);
    const item = items.find((i) => i.id === id);
    if (item && groupBy(item) !== to) onMove(id, to);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {columns.map((c) => {
          const rows = grouped.get(c.id) || [];
          return (
            <Column key={c.id} id={c.id} label={c.label} tone={c.tone} count={rows.length}>
              {rows.map((r) => (
                <Card key={r.id} row={r} onClick={() => onCardClick?.(r)}>
                  {renderCard(r)}
                </Card>
              ))}
              {rows.length === 0 && (
                <div className="text-[11px] text-muted-foreground text-center py-6">Drop here</div>
              )}
            </Column>
          );
        })}
      </div>
    </DndContext>
  );
}
