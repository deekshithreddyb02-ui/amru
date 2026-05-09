import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { Loader2, Menu, BarChart3, LogOut, User as UserIcon, CalendarDays, CheckSquare, LayoutDashboard } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useCrmWorkspaces } from "@/hooks/useCrmWorkspaces";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import CrmNotificationBell from "./CrmNotificationBell";
import CrmMobileBottomNav from "./CrmMobileBottomNav";
import CrmCopilotDrawer from "./CrmCopilotDrawer";
import CrmQuickCreate from "./vtiger/CrmQuickCreate";
import CrmGlobalSearch from "./vtiger/CrmGlobalSearch";
import CrmSidebar from "./vtiger/CrmSidebar";
import { ALL_MODULES } from "./vtiger/navConfig";
import logoImg from "@/assets/logo-optimized.webp";

const CrmLayout = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { role, loading: roleLoading, userId } = useUserRole();
  const { workspaces, loading: wsLoading, roleInWorkspace } = useCrmWorkspaces();

  useEffect(() => { setMobileNavOpen(false); }, [location.pathname]);

  const current = useMemo(
    () => workspaces.find((w) => w.slug === slug) || null,
    [workspaces, slug]
  );

  const loading = roleLoading || wsLoading;

  useEffect(() => {
    if (!roleLoading && !userId) navigate("/auth", { replace: true });
  }, [roleLoading, userId, navigate]);

  useEffect(() => {
    if (!loading && !slug && workspaces.length > 0) {
      navigate(`/crm/${workspaces[0].slug}/dashboard`, { replace: true });
    }
  }, [loading, slug, workspaces, navigate]);

  // Derive current module label + icon from path for breadcrumb bar
  const moduleSeg = location.pathname.split("/")[3] || "dashboard";
  const activeModule = ALL_MODULES.find((m) => m.to === moduleSeg)
    || { to: "dashboard", label: "Dashboard", icon: LayoutDashboard };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "hsl(var(--vt-orange))" }} />
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-serif">No CRM workspace</h1>
          <p className="text-muted-foreground">
            You don't have access to any CRM workspace yet. Ask a Super Admin to add you.
          </p>
          <Button onClick={() => navigate("/")}>Back to site</Button>
        </div>
      </div>
    );
  }

  if (slug && !current) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-serif">Workspace not found</h1>
          <p className="text-muted-foreground">You don't have access to "{slug}".</p>
          <Button onClick={() => navigate(`/crm/${workspaces[0].slug}/dashboard`)}>
            Go to {workspaces[0].name}
          </Button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const myRole = roleInWorkspace(current.id) || (role === "super_admin" ? "crm_admin" : "—");

  const ActiveIcon = activeModule.icon;

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(210_25%_97%)]">
      {/* === Vtiger top bar === */}
      <header className="sticky top-0 z-30">
        {/* Row 1: white utility bar */}
        <div className="bg-white border-b border-[hsl(var(--vt-bar-border))]">
          <div className="flex items-center h-12 pr-3 sm:pr-4">
            {/* Hamburger */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <button
                  className="h-12 w-12 flex items-center justify-center text-[hsl(var(--vt-text))] hover:bg-[hsl(var(--vt-row-hover))]"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-card">
                <div className="h-12 px-4 flex items-center gap-2 border-b">
                  <span className="font-semibold text-base">All Modules</span>
                </div>
                <nav className="p-2 space-y-0.5 overflow-y-auto h-[calc(100vh-3rem)]">
                  {ALL_MODULES.map((m) => (
                    <NavLink
                      key={m.to}
                      to={`/crm/${current.slug}/${m.to}`}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive
                            ? "bg-[hsl(var(--vt-orange))] text-white"
                            : "text-foreground hover:bg-muted"
                        }`
                      }
                    >
                      <m.icon className="h-4 w-4 shrink-0" />
                      {m.label}
                    </NavLink>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo block: logo + AMRUTA + orange CRM tile */}
            <button
              onClick={() => navigate(`/crm/${current.slug}/dashboard`)}
              className="flex items-stretch h-12 select-none"
              aria-label="Go to dashboard"
            >
              <div className="flex items-center pr-2">
                <img src={logoImg} alt="Amruta" className="h-7 w-7 object-contain" loading="eager" />
              </div>
              <div className="flex items-center font-bold tracking-wide text-[15px] text-[hsl(var(--vt-text))]">
                AMRUTA
              </div>
              <div className="ml-1 my-2 px-2 flex items-center bg-[hsl(var(--vt-orange))] text-white font-bold tracking-wide text-[13px] rounded-sm">
                CRM
              </div>
            </button>

            {/* Search */}
            <div className="flex-1 max-w-[520px] mx-3 hidden sm:block">
              <CrmGlobalSearch workspaceId={current.id} slug={current.slug} />
            </div>

            {/* Right utility icons */}
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <CrmQuickCreate slug={current.slug} />
              <button
                onClick={() => navigate(`/crm/${current.slug}/calendar`)}
                className="hidden sm:flex h-8 w-8 items-center justify-center rounded text-[hsl(var(--vt-muted))] hover:text-[hsl(var(--vt-orange))] hover:bg-[hsl(var(--vt-row-hover))]"
                aria-label="Calendar"
              >
                <CalendarDays className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
              <button
                onClick={() => navigate(`/crm/${current.slug}/dashboards`)}
                className="hidden sm:flex h-8 w-8 items-center justify-center rounded text-[hsl(var(--vt-muted))] hover:text-[hsl(var(--vt-orange))] hover:bg-[hsl(var(--vt-row-hover))]"
                aria-label="Reports"
              >
                <BarChart3 className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
              <button
                onClick={() => navigate(`/crm/${current.slug}/tasks`)}
                className="hidden sm:flex h-8 w-8 items-center justify-center rounded text-[hsl(var(--vt-muted))] hover:text-[hsl(var(--vt-orange))] hover:bg-[hsl(var(--vt-row-hover))]"
                aria-label="My Tasks"
              >
                <CheckSquare className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>

              <CrmCopilotDrawer workspaceId={current.id} />
              <CrmNotificationBell workspaceSlug={current.slug} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="h-8 w-8 flex items-center justify-center rounded text-[hsl(var(--vt-muted))] hover:text-[hsl(var(--vt-orange))] hover:bg-[hsl(var(--vt-row-hover))]"
                    aria-label="Account"
                  >
                    <UserIcon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover">
                  <DropdownMenuLabel className="text-xs">
                    <div className="font-medium">{current.name}</div>
                    <div className="text-muted-foreground">Role: {myRole}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Switch workspace
                  </DropdownMenuLabel>
                  {workspaces.map((w) => (
                    <DropdownMenuItem
                      key={w.id}
                      onClick={() => navigate(`/crm/${w.slug}/dashboard`)}
                      className="cursor-pointer text-sm"
                    >
                      {w.name}
                    </DropdownMenuItem>
                  ))}
                  {role === "super_admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/crm/admin/analytics")} className="cursor-pointer text-sm">
                        Cross-CRM analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/crm/admin/workspaces")} className="cursor-pointer text-sm">
                        Manage workspaces
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/change-password")} className="cursor-pointer text-sm">
                    Change password
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}
                    className="cursor-pointer text-sm"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Row 2: orange accent strip */}
        <div className="h-[3px] bg-[hsl(var(--vt-orange))]" aria-hidden="true" />

        {/* Row 3: breadcrumb bar */}
        <div className="bg-white border-b border-[hsl(var(--vt-bar-border))]">
          <div className="flex items-stretch h-9">
            <div className="w-12 h-9 flex items-center justify-center bg-[hsl(var(--vt-orange))] text-white">
              <ActiveIcon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </div>
            <div className="flex items-center px-4 text-[12px] font-semibold tracking-[0.08em] uppercase text-[hsl(var(--vt-muted))]">
              {activeModule.label}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <CrmSidebar slug={current.slug} />
        <main className="flex-1 px-3 sm:px-5 py-4 pb-20 md:pb-6 max-w-full overflow-x-hidden">
          <Outlet context={{ workspace: current, myRole }} />
        </main>
      </div>

      {/* Vtiger-style footer */}
      <footer className="bg-white border-t border-[hsl(var(--vt-bar-border))] py-2 text-center text-[11px] text-[hsl(var(--vt-muted))]">
        Powered by <span className="font-semibold text-[hsl(var(--vt-text))]">Amruta CRM</span>
        {" "}— © {new Date().getFullYear()} Amruta Hydro Geo Services
        {" | "}
        <button onClick={() => navigate("/legal-notice")} className="hover:underline hover:text-[hsl(var(--vt-orange))]">
          Privacy Policy
        </button>
      </footer>

      <CrmMobileBottomNav slug={current.slug} />
    </div>
  );
};

export default CrmLayout;
