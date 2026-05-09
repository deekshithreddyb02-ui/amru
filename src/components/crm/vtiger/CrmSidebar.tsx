import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight, Mail, FolderOpen, type LucideIcon } from "lucide-react";
import { PINNED, GROUPS } from "./navConfig";

type Entry =
  | { kind: "item"; to: string; label: string; icon: LucideIcon }
  | { kind: "group"; key: string; label: string; icon: LucideIcon; items: { to: string; label: string; icon: LucideIcon }[] };

const groupIcon = (label: string): LucideIcon => {
  const m = GROUPS.find((g) => g.label === label);
  return m?.items[0]?.icon || ChevronRight;
};

export default function CrmSidebar({ slug }: { slug: string }) {
  const loc = useLocation();
  const [hovered, setHovered] = useState<string | null>(null);

  // Build the sidebar entries: Dashboard pinned, then group categories, then Mail/Documents pinned at bottom
  const entries: Entry[] = [
    { kind: "item", to: "dashboard", label: "Dashboard", icon: PINNED[0].icon },
    ...GROUPS.map((g) => ({
      kind: "group" as const,
      key: g.label,
      label: g.label,
      icon: groupIcon(g.label),
      items: g.items,
    })),
  ];

  const isActiveModule = (to: string) => loc.pathname.startsWith(`/crm/${slug}/${to}`);
  const isActiveGroup = (g: { items: { to: string }[] }) =>
    g.items.some((i) => isActiveModule(i.to));

  return (
    <aside
      className="hidden md:flex flex-col w-[220px] shrink-0 bg-[#2c3e50] text-white/90 relative"
      onMouseLeave={() => setHovered(null)}
    >
      <nav className="flex-1 py-1 overflow-y-auto">
        {entries.map((e) => {
          if (e.kind === "item") {
            const active = isActiveModule(e.to);
            return (
              <NavLink
                key={e.to}
                to={`/crm/${slug}/${e.to}`}
                onMouseEnter={() => setHovered(null)}
                className={`flex items-center gap-3 h-11 px-4 text-[13px] tracking-wide transition-colors ${
                  active ? "bg-[#1f2d3a] text-white border-l-[3px] border-[hsl(var(--vt-orange))]" : "hover:bg-[#243342]"
                }`}
              >
                <e.icon className="h-4 w-4 shrink-0" />
                <span>{e.label}</span>
              </NavLink>
            );
          }
          const active = isActiveGroup(e);
          const open = hovered === e.key;
          return (
            <div
              key={e.key}
              onMouseEnter={() => setHovered(e.key)}
              className={`relative flex items-center justify-between h-11 px-4 text-[12.5px] uppercase tracking-wider cursor-default transition-colors ${
                active || open ? "bg-[#1f2d3a]" : "hover:bg-[#243342]"
              } ${active ? "border-l-[3px] border-[hsl(var(--vt-orange))]" : ""}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <e.icon className="h-4 w-4 shrink-0" />
                <span className="font-semibold truncate">{e.label}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 opacity-70" />

              {open && (
                <div className="absolute left-full top-0 z-40 w-[230px] bg-[#34495e] text-white/90 shadow-xl border-l border-black/20 py-1">
                  {e.items.map((it) => (
                    <NavLink
                      key={it.to}
                      to={`/crm/${slug}/${it.to}`}
                      className={({ isActive }) =>
                        `flex items-center gap-3 h-10 px-4 text-[13px] transition-colors ${
                          isActive
                            ? "bg-[#2c3e50] text-white"
                            : "hover:bg-[#2c3e50]"
                        }`
                      }
                    >
                      <it.icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                      <span className="truncate">{it.label}</span>
                    </NavLink>
                  ))}
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
