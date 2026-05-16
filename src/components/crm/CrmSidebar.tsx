import { useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { GROUPS, PINNED } from "./navConfig";
import { supabase } from "@/integrations/supabase/client";

export default function CrmSidebar() {
  const { slug } = useParams<{ slug: string }>();
  const [collapsed, setCollapsed] = useState(false);
  const [flyout, setFlyout] = useState<string | null>(null);

  const base = `/crm/${slug}`;
  const widthCls = collapsed ? "w-14" : "w-60";

  const linkCls = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
      active ? "bg-[#1f2d3a] text-white" : "text-white/70 hover:bg-[#243342] hover:text-white"
    } ${collapsed ? "justify-center" : ""}`;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <aside className={`${widthCls} shrink-0 bg-[#0f1923] border-r border-white/5 flex flex-col transition-[width] duration-200 relative`}>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-white/5">
        {!collapsed && <span className="text-white font-semibold text-sm">CRM</span>}
        <button
          onClick={() => { setCollapsed(c => !c); setFlyout(null); }}
          className="text-white/60 hover:text-white p-1 rounded hover:bg-white/5"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {PINNED.map(item => (
          <NavLink
            key={item.to}
            to={`${base}/${item.to}`}
            end={item.to === "dashboard"}
            onClick={() => setFlyout(null)}
            className={({ isActive }) => linkCls(isActive)}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}

        <div className="h-px bg-white/5 my-2" />

        {GROUPS.map(g => {
          const open = flyout === g.label;
          return (
            <div key={g.label} className="relative">
              <button
                onClick={() => setFlyout(open ? null : g.label)}
                className={`w-full ${linkCls(open)} ${collapsed ? "" : "justify-between"}`}
                title={collapsed ? g.label : undefined}
              >
                <span className="flex items-center gap-3">
                  <g.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{g.label}</span>}
                </span>
                {!collapsed && <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`} />}
              </button>

              {open && (
                <div
                  className="fixed z-40 ml-1 w-56 rounded-md border border-white/10 bg-[#1a2530] shadow-2xl py-1"
                  style={{ left: collapsed ? 56 : 240 }}
                >
                  <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-white/40 border-b border-white/5">
                    {g.label}
                  </div>
                  {g.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={`${base}/${item.to}`}
                      onClick={() => setFlyout(null)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 text-sm ${
                          isActive ? "bg-[#243342] text-white" : "text-white/75 hover:bg-[#243342] hover:text-white"
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/5">
        <button
          onClick={handleSignOut}
          className={`w-full ${linkCls(false)}`}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
