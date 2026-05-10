import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight, Mail, FolderOpen, type LucideIcon } from "lucide-react";
import { PINNED, GROUPS } from "./navConfig";

const groupIcon = (label: string): LucideIcon => {
  const m = GROUPS.find((g) => g.label === label);
  return m?.items[0]?.icon || ChevronRight;
};

export default function CrmSidebar({ slug }: { slug: string }) {
  const loc = useLocation();
  const isActiveModule = (to: string) => loc.pathname.startsWith(`/crm/${slug}/${to}`);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const wrapRef = useRef<HTMLElement>(null);

  // Close flyout on route change
  useEffect(() => { setOpenGroup(null); }, [loc.pathname]);

  // Close when clicking outside
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenGroup(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const toggle = (label: string) =>
    setOpenGroup((cur) => (cur === label ? null : label));

  const activeItems = openGroup ? GROUPS.find((g) => g.label === openGroup)?.items ?? [] : [];

  return (
    <aside
      ref={wrapRef}
      className="hidden md:flex flex-col w-[220px] shrink-0 bg-[#2c3e50] text-white/90 relative"
    >
      <nav className="flex-1 py-1 overflow-y-auto">
        {PINNED.map((p) => {
          const active = isActiveModule(p.to);
          return (
            <NavLink
              key={p.to}
              to={`/crm/${slug}/${p.to}`}
              onClick={() => setOpenGroup(null)}
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
            <button
              key={g.label}
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
              <ChevronRight className={`h-3.5 w-3.5 opacity-70 transition-transform ${open ? "rotate-90" : ""}`} />
            </button>
          );
        })}

        <div className="border-t border-white/10 my-1" />

        <NavLink
          to={`/crm/${slug}/email-templates`}
          onClick={() => setOpenGroup(null)}
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
          onClick={() => setOpenGroup(null)}
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

      {/* Right-side flyout panel */}
      {openGroup && (
        <div className="absolute left-full top-0 bottom-0 z-40 w-[230px] bg-[#34495e] text-white/90 shadow-xl border-l border-black/20 py-1 overflow-y-auto">
          <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-white/60 font-semibold">
            {openGroup}
          </div>
          {activeItems.map((it, idx) => {
            const itActive = isActiveModule(it.to);
            return (
              <NavLink
                key={`${it.to}-${idx}`}
                to={`/crm/${slug}/${it.to}`}
                onClick={() => setOpenGroup(null)}
                className={`flex items-center gap-3 h-10 px-4 text-[13px] transition-colors ${
                  itActive
                    ? "bg-[#2c3e50] text-white border-l-[3px] border-[hsl(var(--vt-orange))]"
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
    </aside>
  );
}
