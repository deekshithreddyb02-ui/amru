import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { Building2, Loader2, ChevronDown, Menu, BarChart3, LogOut, User as UserIcon } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useCrmWorkspaces } from "@/hooks/useCrmWorkspaces";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import CrmNotificationBell from "./CrmNotificationBell";
import CrmMobileBottomNav from "./CrmMobileBottomNav";
import CrmCopilotDrawer from "./CrmCopilotDrawer";
import CrmModuleNav from "./vtiger/CrmModuleNav";
import CrmQuickCreate from "./vtiger/CrmQuickCreate";
import CrmGlobalSearch from "./vtiger/CrmGlobalSearch";
import { PINNED, GROUPS, ALL_MODULES } from "./vtiger/navConfig";

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
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

  return (
    <div className="min-h-screen bg-background">
      {/* Top utility bar */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="flex items-center gap-2 px-3 sm:px-4 h-12">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden -ml-2 h-8 w-8" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-card">
              <div className="h-12 px-4 flex items-center gap-2 border-b">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-serif text-base">Amruta Geo CRM</span>
              </div>
              <nav className="p-2 space-y-0.5 overflow-y-auto h-[calc(100vh-3rem)]">
                {ALL_MODULES.map((m) => (
                  <NavLink
                    key={m.to}
                    to={`/crm/${current.slug}/${m.to}`}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
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

          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-serif text-base sm:text-lg truncate">
              <span className="hidden sm:inline">Amruta Geo </span>CRM
            </span>
          </div>

          <div className="flex-1 max-w-md mx-2 hidden sm:block">
            <CrmGlobalSearch workspaceId={current.id} slug={current.slug} />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <CrmQuickCreate slug={current.slug} />
            <CrmCopilotDrawer workspaceId={current.id} />
            <CrmNotificationBell workspaceSlug={current.slug} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 px-2 max-w-[120px] sm:max-w-none">
                  <span className="font-medium truncate text-xs">{current.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-popover">
                <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {workspaces.map((w) => (
                  <DropdownMenuItem
                    key={w.id}
                    onClick={() => navigate(`/crm/${w.slug}/dashboard`)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{w.name}</span>
                      <span className="text-xs text-muted-foreground">/{w.slug}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                {role === "super_admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/crm/admin/analytics")} className="cursor-pointer">
                      <BarChart3 className="h-4 w-4 mr-2" />Cross-CRM analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/crm/admin/workspaces")} className="cursor-pointer">
                      Manage workspaces…
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted">
                  <UserIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover">
                <DropdownMenuLabel className="text-xs">
                  <div className="font-medium">Your role</div>
                  <div className="text-muted-foreground">{myRole}</div>
                </DropdownMenuLabel>
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

        {/* Vtiger module bar */}
        <CrmModuleNav slug={current.slug} pinned={PINNED} groups={GROUPS} />
      </header>

      <main className="p-3 sm:p-5 pb-20 md:pb-5 max-w-full overflow-x-hidden">
        <Outlet context={{ workspace: current, myRole }} />
      </main>

      <CrmMobileBottomNav slug={current.slug} />
    </div>
  );
};

export default CrmLayout;
