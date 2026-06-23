import { lazy, Suspense, useEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { Loader2, BarChart3, LogOut, User as UserIcon, CalendarDays, CheckSquare, LayoutDashboard, Menu, Lock, Mail } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useCrmWorkspaces } from "@/hooks/useCrmWorkspaces";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { supabase } from "@/integrations/supabase/client";
import CrmMobileBottomNav from "./CrmMobileBottomNav";
import CrmSidebar from "./vtiger/CrmSidebar";
import CrmSubModuleNav from "./vtiger/CrmSubModuleNav";
import { ALL_MODULES } from "./vtiger/navConfig";
import logoImg from "@/assets/logo-optimized.webp";

const CrmNotificationBell = lazy(() => import("./CrmNotificationBell"));
const CrmCopilotDrawer = lazy(() => import("./CrmCopilotDrawer"));
const CrmQuickCreate = lazy(() => import("./vtiger/CrmQuickCreate"));
const CrmGlobalSearch = lazy(() => import("./vtiger/CrmGlobalSearch"));

const CrmLayout = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { role, loading: roleLoading, userId } = useUserRole();
  const { workspaces, loading: wsLoading, roleInWorkspace } = useCrmWorkspaces();

  const current = useMemo(
    () => workspaces.find((w) => w.slug === slug) || null,
    [workspaces, slug]
  );

  const authPending = roleLoading && !userId;
  const loading = authPending || wsLoading;

  useEffect(() => {
    if (!roleLoading && !userId) navigate("/auth", { replace: true });
  }, [roleLoading, userId, navigate]);

  // Maharashtra ("mh") is the primary workspace — always default to it when available.
  const defaultWorkspace = useMemo(
    () => workspaces.find((w) => w.slug === "mh") || workspaces[0],
    [workspaces]
  );

  useEffect(() => {
    if (!loading && !slug && defaultWorkspace) {
      navigate(`/crm/${defaultWorkspace.slug}/dashboard`, { replace: true });
    }
  }, [loading, slug, defaultWorkspace, navigate]);

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
    const isMh = slug === "mh";
    const wsLabel = isMh ? "Maharashtra CRM" : `the "${slug}" workspace`;
    const subject = encodeURIComponent(`CRM Access Request — ${isMh ? "Maharashtra" : slug}`);
    const body = encodeURIComponent(
      `Hello Admin,\n\nI would like to request access to ${wsLabel}.\n\nMy account: ${userId || "(unknown)"}\n\nThank you.`
    );
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-background to-muted/30">
        <div className="max-w-md w-full text-center space-y-5 p-8 rounded-2xl border bg-card shadow-lg">
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center bg-[hsl(var(--vt-orange))]/10">
            <Lock className="h-6 w-6" style={{ color: "hsl(var(--vt-orange))" }} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-serif">Access required</h1>
            <p className="text-sm text-muted-foreground">
              You don't have permission to view <strong className="text-foreground">{wsLabel}</strong>.
              {isMh && " Maharashtra is the primary workspace and access is granted by a Super Admin."}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full gap-2"
              style={{ backgroundColor: "hsl(var(--vt-orange))", color: "white" }}
              onClick={() =>
                window.open(`mailto:amrutha.wd2014@gmail.com?subject=${subject}&body=${body}`, "_blank")
              }
            >
              <Mail className="h-4 w-4" /> Request access
            </Button>
            {defaultWorkspace && defaultWorkspace.slug !== slug && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/crm/${defaultWorkspace.slug}/dashboard`, { replace: true })}
              >
                Go to {defaultWorkspace.name}
              </Button>
            )}
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => navigate("/")}>
              Back to site
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const myRole = roleInWorkspace(current.id)
    || (role === "super_admin" ? "crm_admin" : roleLoading ? "Loading…" : "—");

  const ActiveIcon = activeModule.icon;

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(210_25%_97%)]">
      {/* === Vtiger top bar === */}
      <header className="sticky top-0 z-30">
        {/* Row 1: white utility bar */}
        <div className="bg-white border-b border-[hsl(var(--vt-bar-border))]">
          <div className="flex items-center h-12 pl-3 pr-3 sm:pr-4">

            {/* Hamburger: toggles sidebar (desktop) */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("crm:toggle-sidebar"))}
              aria-label="Toggle sidebar"
              className="hidden md:flex h-8 w-8 mr-2 items-center justify-center rounded text-[hsl(var(--vt-muted))] hover:text-[hsl(var(--vt-orange))] hover:bg-[hsl(var(--vt-row-hover))]"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>

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
              <Suspense fallback={<div className="h-8" />}>
                <CrmGlobalSearch workspaceId={current.id} slug={current.slug} />
              </Suspense>
            </div>

            {/* Right utility icons */}
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <Suspense fallback={<div className="h-8 w-8 shrink-0" />}>
                <CrmQuickCreate slug={current.slug} />
              </Suspense>
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

              <Suspense fallback={<div className="h-8 w-[94px] shrink-0" />}>
                <CrmCopilotDrawer workspaceId={current.id} />
              </Suspense>
              <Suspense fallback={<div className="h-8 w-8 shrink-0" />}>
                <CrmNotificationBell workspaceSlug={current.slug} />
              </Suspense>

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
        <CrmSubModuleNav slug={current.slug} />
        <main className="flex-1 px-3 sm:px-5 py-4 pb-20 md:pb-6 max-w-full overflow-x-hidden">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "hsl(var(--vt-orange))" }} />
              </div>
            }
          >
            <Outlet context={{ workspace: current, myRole }} />
          </Suspense>
        </main>
      </div>

      {/* Vtiger-style footer */}
      <footer className="sticky bottom-0 z-20 bg-white border-t border-[hsl(var(--vt-bar-border))] py-2 text-center text-[11px] text-[hsl(var(--vt-muted))]">
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
