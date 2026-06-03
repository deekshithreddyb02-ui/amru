import { memo, useEffect, useMemo, useState, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { GROUPS } from "./navConfig";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const resolveTo = (slug: string, to: string) =>
  to.startsWith("/") ? to : `/crm/${slug}/${to}`;

const STORAGE_KEY = "crm.submodulenav.collapsed";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> };

const SidebarRow = memo(function SidebarRow({
  to, label, Icon, isActive, collapsed,
}: { to: string; label: string; Icon: Item["icon"]; isActive: boolean; collapsed: boolean }) {
  const link = (
    <NavLink
      to={to}
      end={false}
      className={`flex items-center gap-3 h-11 ${
        collapsed ? "justify-center px-0" : "px-4"
      } text-[13px] border-l-2 ${
        isActive
          ? "border-[hsl(var(--vt-orange))] text-[hsl(var(--vt-orange))] font-medium bg-[hsl(var(--vt-orange)/0.06)]"
          : "border-transparent text-[hsl(var(--vt-text))]/80 hover:text-[hsl(var(--vt-orange))] hover:bg-[hsl(var(--vt-row-hover))]"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
});

function CrmSubModuleNavImpl({ slug }: { slug: string }) {
  const loc = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(STORAGE_KEY) !== "0";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const moduleSeg = loc.pathname.split("/")[3];

  const group = useMemo(
    () =>
      moduleSeg
        ? GROUPS.find((g) =>
            g.items.some((i) => !i.to.startsWith("/") && i.to.split("/")[0] === moduleSeg)
          )
        : undefined,
    [moduleSeg]
  );

  const items = useMemo<Item[]>(() => {
    if (!group) return [];
    const seen = new Set<string>();
    return group.items.filter((i) => {
      const key = `${i.to}|${i.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [group]);

  const activeKey = useMemo(() => {
    const currentPath = loc.pathname.replace(/\/+$/, "");
    let key: string | null = null;
    let len = -1;
    for (const i of items) {
      const resolved = resolveTo(slug, i.to).replace(/\/+$/, "");
      const matches = currentPath === resolved || currentPath.startsWith(resolved + "/");
      if (matches && resolved.length > len) {
        len = resolved.length;
        key = `${i.to}|${i.label}`;
      }
    }
    return key;
  }, [items, loc.pathname, slug]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  if (!group) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        aria-label={`${group.label} submodules`}
        className={`hidden md:flex shrink-0 flex-col bg-white border-r border-[hsl(var(--vt-bar-border))] sticky top-[96px] self-start h-[calc(100vh-96px-32px)] z-20 ${
          collapsed ? "w-12" : "w-48"
        }`}
        style={{ contain: "layout paint" }}
      >
        <nav className="flex-1 flex flex-col py-1 overflow-y-auto">
          {items.map((m) => {
            const key = `${m.to}|${m.label}`;
            return (
              <SidebarRow
                key={key}
                to={resolveTo(slug, m.to)}
                label={m.label}
                Icon={m.icon}
                isActive={activeKey === key}
                collapsed={collapsed}
              />
            );
          })}
        </nav>

        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand submodule labels" : "Collapse to icons only"}
          className="h-9 border-t border-[hsl(var(--vt-bar-border))] flex items-center justify-center text-[hsl(var(--vt-muted))] hover:text-[hsl(var(--vt-orange))] hover:bg-[hsl(var(--vt-row-hover))]"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </aside>
    </TooltipProvider>
  );
}

export default memo(CrmSubModuleNavImpl);
