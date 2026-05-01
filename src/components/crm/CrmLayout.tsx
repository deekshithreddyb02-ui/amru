import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { Building2, LayoutDashboard, Users, Briefcase, FileText, Loader2, ChevronDown, UserRound, Building, ListChecks, CalendarDays, LifeBuoy, Droplet, FolderOpen, FileSpreadsheet, Receipt, Mic, History, BarChart3, Menu, ClipboardList, TrendingUp, Package, Truck, ShoppingCart, ClipboardCheck, Megaphone, FormInput, Mail, Workflow, Timer, Link2, MapPin, Warehouse, Wallet, ReceiptText, MessageCircle, Award, FileSignature } from "lucide-react";
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

const NAV = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "leads", label: "Leads", icon: Users },
  { to: "contacts", label: "Contacts", icon: UserRound },
  { to: "organizations", label: "Organizations", icon: Building },
  { to: "deals", label: "Deals", icon: Briefcase },
  { to: "activities", label: "Activities", icon: ListChecks },
  { to: "calendar", label: "Calendar", icon: CalendarDays },
  { to: "tickets", label: "Support", icon: LifeBuoy },
  { to: "hydrogeo", label: "HydroGeo", icon: Droplet },
  { to: "field-visits", label: "Field Visits", icon: MapPin },
  { to: "documents", label: "Documents", icon: FolderOpen },
  { to: "quotations", label: "Quotations", icon: FileSpreadsheet },
  { to: "sales-orders", label: "Sales Orders", icon: ShoppingCart },
  { to: "invoices", label: "Invoices", icon: Receipt },
  { to: "payments", label: "Payments", icon: Wallet },
  { to: "expenses", label: "Expenses", icon: ReceiptText },
  { to: "products", label: "Products", icon: Package },
  { to: "inventory", label: "Inventory", icon: Warehouse },
  { to: "vendors", label: "Vendors", icon: Truck },
  { to: "purchase-orders", label: "Purchase Orders", icon: ClipboardCheck },
  { to: "campaigns", label: "Campaigns", icon: Megaphone },
  { to: "web-forms", label: "Web Forms", icon: FormInput },
  { to: "email-templates", label: "Email Templates", icon: Mail },
  { to: "meetings", label: "Meetings", icon: Mic },
  { to: "reports", label: "AI Reports", icon: FileText },
  { to: "project-reports", label: "Project Reports", icon: ClipboardList },
  { to: "performance", label: "Performance", icon: TrendingUp },
  { to: "reporting-hub", label: "Reporting Hub", icon: BarChart3 },
  { to: "workflows", label: "Workflows", icon: Workflow },
  { to: "approvals", label: "Approvals", icon: ClipboardCheck },
  { to: "sla", label: "SLA Policies", icon: Timer },
  { to: "customer-portal", label: "Customer Portal", icon: Link2 },
  { to: "feedback", label: "Feedback", icon: MessageCircle },
  { to: "commissions", label: "Commissions", icon: Award },
  { to: "contracts", label: "Contracts/AMC", icon: FileSignature },
  { to: "audit", label: "Audit log", icon: History },
];

const CrmLayout = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { role, loading: roleLoading, userId } = useUserRole();
  const { workspaces, loading: wsLoading, roleInWorkspace } = useCrmWorkspaces();

  // Auto-close mobile nav on route change
  useEffect(() => { setMobileNavOpen(false); }, [location.pathname]);

  const current = useMemo(
    () => workspaces.find((w) => w.slug === slug) || null,
    [workspaces, slug]
  );

  const loading = roleLoading || wsLoading;

  // Redirect if not signed in
  useEffect(() => {
    if (!roleLoading && !userId) navigate("/auth", { replace: true });
  }, [roleLoading, userId, navigate]);

  // If no slug, send to first available workspace
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

  const sidebarNav = (
    <nav className="p-3 space-y-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={`/crm/${current.slug}/${to}`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            }`
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="flex items-center justify-between gap-2 px-3 sm:px-6 h-14">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile hamburger */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-2" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-card">
                <div className="h-14 px-4 flex items-center gap-2 border-b">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-serif text-base">Amruta Geo CRM</span>
                </div>
                {sidebarNav}
                <div className="p-3 border-t text-xs text-muted-foreground">
                  <div>Role</div>
                  <div className="font-medium text-foreground">{myRole}</div>
                </div>
              </SheetContent>
            </Sheet>
            <Building2 className="h-5 w-5 text-primary shrink-0" />
            <span className="font-serif text-base sm:text-lg truncate">
              <span className="hidden sm:inline">Amruta Geo </span>CRM
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <CrmNotificationBell workspaceSlug={current.slug} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 px-2 sm:px-3 max-w-[140px] sm:max-w-none">
                  <span className="font-medium truncate">{current.name}</span>
                  <ChevronDown className="h-4 w-4 shrink-0" />
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

            <Button
              variant="ghost"
              size="sm"
              className="px-2 sm:px-3"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/");
              }}
            >
              <span className="hidden sm:inline">Sign out</span>
              <span className="sm:hidden text-xs">Exit</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r bg-card min-h-[calc(100vh-3.5rem)] sticky top-14">
          {sidebarNav}
          <div className="mt-auto p-3 border-t text-xs text-muted-foreground">
            <div>Role</div>
            <div className="font-medium text-foreground">{myRole}</div>
          </div>
        </aside>

        <main className="flex-1 p-3 sm:p-6 max-w-full overflow-x-hidden">
          <Outlet context={{ workspace: current, myRole }} />
        </main>
      </div>
    </div>
  );
};

export default CrmLayout;
