import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight, ChevronDown, Mail, FolderOpen, type LucideIcon } from "lucide-react";
import { PINNED, GROUPS } from "./navConfig";

const groupIcon = (label: string): LucideIcon => {
  const m = GROUPS.find((g) => g.label === label);
  return m?.items[0]?.icon || ChevronRight;
};

export default function CrmSidebar({ slug }: { slug: string }) {
  const loc = useLocation();
  const isActiveModule = (to: string) => loc.pathname.startsWith(`/crm/${slug}/${to}`);

  // Auto-open the group containing the active route
  const activeGroup = GROUPS.find((g) => g.items.some((i) => isActiveModule(i.to)));
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroup?.label ?? null);

  useEffect(() => {
    if (activeGroup) setOpenGroup(activeGroup.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname]);

  const toggle = (label: string) =>
    setOpenGroup((cur) => (cur === label ? null : label));

  return (
    <aside className="hidden md:flex flex-col w-[220px] shrink-0 bg-[#2c3e50] text-white/90">
      <nav className="flex-1 py-1 overflow-y-auto">
        {/* Pinned: Dashboard */}
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
          const Icon = groupIcon(g.label);
          const active = g.items.some((i) => isActiveModule(i.to));
          const open = openGroup === g.label;
          return (
            <div key={g.label}>
              <button
                type="button"
                onClick={() => toggle(g.label)}
                className={`w-full flex items-center justify-between h-11 px-4 text-[12.5px] uppercase tracking-wider transition-colors ${
                  active || open ? "bg-[#1f2d3a]" : "hover:bg-[#243342]"
                } ${active ? "border-l-[3px] border-[hsl(var(--vt-orange))]" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="font-semibold truncate">{g.label}</span>
                </div>
                {open ? (
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                )}
              </button>

              {open && (
                <div className="bg-[#243342]/60">
                  {g.items.map((it, idx) => {
                    const itActive = isActiveModule(it.to);
                    return (
                      <NavLink
                        key={`${it.to}-${idx}`}
                        to={`/crm/${slug}/${it.to}`}
                        className={`flex items-center gap-3 h-10 pl-11 pr-4 text-[13px] transition-colors ${
                          itActive
                            ? "bg-[#1f2d3a] text-white border-l-[3px] border-[hsl(var(--vt-orange))]"
                            : "hover:bg-[#2c3e50]"
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
