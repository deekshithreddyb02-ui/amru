import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Mail, FolderOpen } from "lucide-react";
import { PINNED, GROUPS } from "./navConfig";

export default function CrmSidebar({ slug }: { slug: string }) {
  const loc = useLocation();
  const isActiveModule = (to: string) => loc.pathname.startsWith(`/crm/${slug}/${to}`);

  // Track which groups are open. Default: open the group containing the active route.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    GROUPS.forEach((g) => {
      init[g.label] = g.items.some((i) => loc.pathname.startsWith(`/crm/${slug}/${i.to}`));
    });
    return init;
  });

  // Auto-open the group of the active route when path changes
  useEffect(() => {
    setOpenGroups((cur) => {
      const next = { ...cur };
      GROUPS.forEach((g) => {
        if (g.items.some((i) => loc.pathname.startsWith(`/crm/${slug}/${i.to}`))) {
          next[g.label] = true;
        }
      });
      return next;
    });
  }, [loc.pathname, slug]);

  const toggle = (label: string) =>
    setOpenGroups((cur) => ({ ...cur, [label]: !cur[label] }));

  return (
    <aside className="hidden md:flex flex-col w-[230px] shrink-0 bg-[#2c3e50] text-white/90">
      <nav className="flex-1 py-1 overflow-y-auto">
        {PINNED.map((p) => {
          const active = isActiveModule(p.to);
          return (
            <NavLink
              key={p.to}
              to={`/crm/${slug}/${p.to}`}
              className={`flex items-center gap-3 h-11 px-4 text-[13px] tracking-wide transition-colors ${
                active
                  ? "bg-[#1f2d3a] text-white border-l-[3px] border-[hsl(var(--vt-orange))]"
                  : "hover:bg-[#243342]"
              }`}
            >
              <p.icon className="h-4 w-4 shrink-0" />
              <span>{p.label}</span>
            </NavLink>
          );
        })}

        {GROUPS.map((g) => {
          const active = g.items.some((i) => isActiveModule(i.to));
          const open = !!openGroups[g.label];
          return (
            <div key={g.label}>
              <button
                type="button"
                onClick={() => toggle(g.label)}
                className={`w-full flex items-center justify-between h-10 px-4 text-[11px] uppercase tracking-wider transition-colors ${
                  active ? "bg-[#1f2d3a] text-white" : "text-white/70 hover:bg-[#243342]"
                }`}
              >
                <span className="font-semibold truncate">{g.label}</span>
                <ChevronDown className={`h-3.5 w-3.5 opacity-70 transition-transform ${open ? "" : "-rotate-90"}`} />
              </button>
              {open && (
                <div className="bg-[#26384a]">
                  {g.items.map((it, idx) => {
                    const itActive = isActiveModule(it.to);
                    return (
                      <NavLink
                        key={`${g.label}-${it.to}-${idx}`}
                        to={`/crm/${slug}/${it.to}`}
                        className={`flex items-center gap-3 h-9 pl-9 pr-4 text-[13px] transition-colors ${
                          itActive
                            ? "bg-[#1f2d3a] text-white border-l-[3px] border-[hsl(var(--vt-orange))]"
                            : "hover:bg-[#2c3e50] text-white/85"
                        }`}
                      >
                        <it.icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                        <span className="truncate">{it.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="border-t border-white/10 my-1" />

        <NavLink
          to={`/crm/${slug}/email-templates`}
          className={({ isActive }) =>
            `flex items-center gap-3 h-11 px-4 text-[13px] transition-colors ${
              isActive ? "bg-[#1f2d3a]" : "hover:bg-[#243342]"
            }`
          }
        >
          <Mail className="h-4 w-4 shrink-0" />
          <span>Mail Manager</span>
        </NavLink>
        <NavLink
          to={`/crm/${slug}/documents`}
          className={({ isActive }) =>
            `flex items-center gap-3 h-11 px-4 text-[13px] transition-colors ${
              isActive ? "bg-[#1f2d3a]" : "hover:bg-[#243342]"
            }`
          }
        >
          <FolderOpen className="h-4 w-4 shrink-0" />
          <span>Documents</span>
        </NavLink>
      </nav>
    </aside>
  );
}
