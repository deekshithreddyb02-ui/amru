import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { GROUPS } from "./navConfig";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const resolveTo = (slug: string, to: string) =>
  to.startsWith("/") ? to : `/crm/${slug}/${to}`;

const STORAGE_KEY = "crm.submodulenav.collapsed";

export default function CrmSubModuleNav({ slug }: { slug: string }) {
  const loc = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(STORAGE_KEY) !== "0";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const moduleSeg = loc.pathname.split("/")[3];
  if (!moduleSeg) return null;

  const group = GROUPS.find((g) =>
    g.items.some((i) => !i.to.startsWith("/") && i.to === moduleSeg)
  );
  if (!group) return null;

  const seen = new Set<string>();
  const items = group.items.filter((i) => {
    const key = `${i.to}|${i.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        aria-label={`${group.label} submodules`}
        className={`hidden md:flex shrink-0 flex-col bg-white border-r border-[hsl(var(--vt-bar-border))] ${
          collapsed ? "w-12" : "w-48"
        } transition-[width] duration-150`}
      >
        <nav className="flex-1 flex flex-col py-1 overflow-y-auto">
          {items.map((m) => {
            const link = (
              <NavLink
                key={`${m.to}-${m.label}`}
                to={resolveTo(slug, m.to)}
                end={false}
                className={({ isActive }) =>
                  `flex items-center gap-3 h-11 ${
                    collapsed ? "justify-center px-0" : "px-4"
                  } text-[13px] border-l-2 transition-colors ${
                    isActive
                      ? "border-[hsl(var(--vt-orange))] text-[hsl(var(--vt-orange))] font-medium bg-[hsl(var(--vt-orange)/0.06)]"
                      : "border-transparent text-[hsl(var(--vt-text))]/80 hover:text-[hsl(var(--vt-orange))] hover:bg-[hsl(var(--vt-row-hover))]"
                  }`
                }
              >
                <m.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {!collapsed && <span className="truncate">{m.label}</span>}
              </NavLink>
            );
            return collapsed ? (
              <Tooltip key={`${m.to}-${m.label}`}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{m.label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand submodule labels" : "Collapse to icons only"}
          className="h-9 border-t border-[hsl(var(--vt-bar-border))] flex items-center justify-center text-[hsl(var(--vt-muted))] hover:text-[hsl(var(--vt-orange))] hover:bg-[hsl(var(--vt-row-hover))]"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </aside>
    </TooltipProvider>
  );
}
