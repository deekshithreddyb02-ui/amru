import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, Mail, FolderOpen, ShoppingBag, Settings, type LucideIcon } from "lucide-react";
import { PINNED, GROUPS } from "./navConfig";

const STORAGE_KEY = "crm.sidebar.collapsed";

const groupIcon = (label: string): LucideIcon => {
  const m = GROUPS.find((g) => g.label === label);
  return m?.items[0]?.icon || ChevronRight;
};

const resolveTo = (slug: string, to: string) => (to.startsWith("/") ? to : `/crm/${slug}/${to}`);

export default function CrmSidebar({ slug }: { slug: string }) {
  const loc = useLocation();
  const isActiveModule = (to: string) => loc.pathname.startsWith(resolveTo(slug, to));

  // Default: hidden. Hamburger toggles an overlay panel.
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const hidden = collapsed;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  // Auto-collapse whenever the user navigates to another module
  useEffect(() => {
    setCollapsed(true);
  }, [loc.pathname]);

  // Listen for external toggle (from header hamburger)
  useEffect(() => {
    const onToggle = () => setCollapsed((c) => !c);
    window.addEventListener("crm:toggle-sidebar", onToggle);
    return () => window.removeEventListener("crm:toggle-sidebar", onToggle);
  }, []);

  // Inline-expanded groups (when sidebar is expanded)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    GROUPS.forEach((g) => {
      init[g.label] = g.items.some((i) => loc.pathname.startsWith(`/crm/${slug}/${i.to}`));
    });
    return init;
  });

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

  const toggleGroup = (label: string) =>
    setOpenGroups((cur) => ({ ...cur, [label]: !cur[label] }));

  // Collapsed-mode flyout
  const [flyout, setFlyout] = useState<string | null>(null);
  const wrapRef = useRef<HTMLElement>(null);

  useEffect(() => { setFlyout(null); }, [loc.pathname]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setFlyout(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const flyoutItems = flyout ? GROUPS.find((g) => g.label === flyout)?.items ?? [] : [];

  return (
    <div className="hidden md:block relative w-0 shrink-0">
    {hidden ? null : (
    <aside
      ref={wrapRef}
      className="absolute left-0 top-0 bottom-0 z-40 flex flex-col bg-[#2c3e50] text-white/90 shadow-lg w-[230px]"
    >
      <nav className="flex-1 py-1 overflow-y-auto overflow-x-hidden">
        {PINNED.map((p) => {
          const active = isActiveModule(p.to);
          return (
            <NavLink
              key={p.to}
              to={`/crm/${slug}/${p.to}`}
              onClick={() => setFlyout(null)}
              title={collapsed ? p.label : undefined}
              className={`flex items-center gap-3 h-11 px-4 text-[13px] tracking-wide transition-colors ${
                active
                  ? "bg-[#1f2d3a] text-white border-l-[3px] border-[hsl(var(--vt-orange))]"
                  : "hover:bg-[#243342]"
              }`}
            >
              <p.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{p.label}</span>}
            </NavLink>
          );
        })}

        {GROUPS.map((g) => {
          const Icon = groupIcon(g.label);
          const active = g.items.some((i) => isActiveModule(i.to));
          const flyoutOpen = flyout === g.label;

          return (
            <button
              key={g.label}
              type="button"
              onClick={() => setFlyout((cur) => (cur === g.label ? null : g.label))}
              title={collapsed ? g.label : undefined}
              className={`w-full flex items-center h-11 transition-colors ${
                collapsed ? "justify-center" : "justify-between px-4 gap-3"
              } ${
                active || flyoutOpen ? "bg-[#1f2d3a] text-white" : "text-white/85 hover:bg-[#243342]"
              } ${active ? "border-l-[3px] border-[hsl(var(--vt-orange))]" : ""}`}
            >
              {collapsed ? (
                <Icon className="h-4 w-4 shrink-0" />
              ) : (
                <>
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon className="h-4 w-4 shrink-0 opacity-80" />
                    <span className="text-[13px] tracking-wide truncate">{g.label}</span>
                  </span>
                  <ChevronRight className={`h-3.5 w-3.5 opacity-70 transition-transform ${flyoutOpen ? "rotate-90" : ""}`} />
                </>
              )}
            </button>
          );
        })}

        <div className="border-t border-white/10 my-1" />

        <NavLink
          to={`/crm/${slug}/email-templates`}
          onClick={() => setFlyout(null)}
          title={collapsed ? "Mail Manager" : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 h-11 ${collapsed ? "justify-center" : "px-4"} text-[13px] transition-colors ${
              isActive ? "bg-[#1f2d3a]" : "hover:bg-[#243342]"
            }`
          }
        >
          <Mail className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Mail Manager</span>}
        </NavLink>
        <NavLink
          to={`/crm/${slug}/integrations`}
          onClick={() => setFlyout(null)}
          title={collapsed ? "Extension Store" : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 h-11 ${collapsed ? "justify-center" : "px-4"} text-[13px] transition-colors ${
              isActive ? "bg-[#1f2d3a]" : "hover:bg-[#243342]"
            }`
          }
        >
          <ShoppingBag className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Extension Store</span>}
        </NavLink>
        <NavLink
          to={`/crm/${slug}/documents`}
          onClick={() => setFlyout(null)}
          title={collapsed ? "Documents" : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 h-11 ${collapsed ? "justify-center" : "px-4"} text-[13px] transition-colors ${
              isActive ? "bg-[#1f2d3a]" : "hover:bg-[#243342]"
            }`
          }
        >
          <FolderOpen className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Documents</span>}
      </NavLink>
      </nav>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => { setCollapsed((c) => !c); setFlyout(null); }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="h-9 border-t border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-[#243342] transition-colors"
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </button>

      {/* Collapsed-mode flyout panel */}
      {flyout && (
        <div className="absolute left-full top-0 z-40 w-[230px] bg-[#34495e] text-white/90 shadow-xl border-l border-black/20 py-1 max-h-full overflow-y-auto">
          <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-white/60 font-semibold">
            {flyout}
          </div>
          {flyoutItems.map((it, idx) => {
            const itActive = isActiveModule(it.to);
            return (
              <NavLink
                key={`${it.to}-${idx}`}
                to={`/crm/${slug}/${it.to}`}
                onClick={() => setFlyout(null)}
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
    )}
    </div>
  );
}
