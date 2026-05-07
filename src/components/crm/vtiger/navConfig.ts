import {
  LayoutDashboard, Users, UserRound, Building, Briefcase, ListChecks, CalendarDays,
  LifeBuoy, Droplet, MapPin, FolderOpen, FileSpreadsheet, ShoppingCart, Receipt, Wallet,
  ReceiptText, Package, Warehouse, Truck, ClipboardCheck, Megaphone, FormInput, Mail,
  Mic, FileText, ClipboardList, TrendingUp, BarChart3, Workflow, Timer, Link2,
  MessageCircle, Award, FileSignature, MessageSquare, Database, CheckSquare, Bell,
  Activity, Map, Target, Users2, History,
} from "lucide-react";
import type { ModuleItem, ModuleGroup } from "./CrmModuleNav";

export const PINNED: ModuleItem[] = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "leads", label: "Leads", icon: Users },
  { to: "contacts", label: "Contacts", icon: UserRound },
  { to: "organizations", label: "Organizations", icon: Building },
  { to: "deals", label: "Deals", icon: Briefcase },
];

export const GROUPS: ModuleGroup[] = [
  {
    label: "Sales",
    items: [
      { to: "quotations", label: "Quotations", icon: FileSpreadsheet },
      { to: "sales-orders", label: "Sales Orders", icon: ShoppingCart },
      { to: "invoices", label: "Invoices", icon: Receipt },
      { to: "payments", label: "Payments", icon: Wallet },
      { to: "expenses", label: "Expenses", icon: ReceiptText },
      { to: "forecast", label: "Forecast & Quotas", icon: Target },
      { to: "territories", label: "Territories", icon: Map },
      { to: "commissions", label: "Commissions", icon: Award },
      { to: "contracts", label: "Contracts/AMC", icon: FileSignature },
    ],
  },
  {
    label: "Marketing",
    items: [
      { to: "campaigns", label: "Campaigns", icon: Megaphone },
      { to: "web-forms", label: "Web Forms", icon: FormInput },
      { to: "email-templates", label: "Email Templates", icon: Mail },
      { to: "messages", label: "WhatsApp/SMS", icon: MessageSquare },
    ],
  },
  {
    label: "Inventory",
    items: [
      { to: "products", label: "Products", icon: Package },
      { to: "inventory", label: "Inventory", icon: Warehouse },
      { to: "vendors", label: "Vendors", icon: Truck },
      { to: "purchase-orders", label: "Purchase Orders", icon: ClipboardCheck },
    ],
  },
  {
    label: "Support",
    items: [
      { to: "tickets", label: "Tickets", icon: LifeBuoy },
      { to: "sla", label: "SLA Policies", icon: Timer },
      { to: "feedback", label: "Feedback (NPS)", icon: MessageCircle },
      { to: "customer-portal", label: "Customer Portal", icon: Link2 },
    ],
  },
  {
    label: "Projects",
    items: [
      { to: "activities", label: "Activities", icon: ListChecks },
      { to: "calendar", label: "Calendar", icon: CalendarDays },
      { to: "tasks", label: "My Tasks", icon: CheckSquare },
      { to: "hydrogeo", label: "HydroGeo", icon: Droplet },
      { to: "field-visits", label: "Field Visits", icon: MapPin },
      { to: "field-mode", label: "Field Mode", icon: MapPin },
      { to: "documents", label: "Documents", icon: FolderOpen },
      { to: "meetings", label: "Meetings", icon: Mic },
      { to: "project-reports", label: "Project Reports", icon: ClipboardList },
    ],
  },
  {
    label: "Analytics",
    items: [
      { to: "reports", label: "AI Reports", icon: FileText },
      { to: "reporting-hub", label: "Reporting Hub", icon: BarChart3 },
      { to: "dashboards", label: "Custom Dashboards", icon: BarChart3 },
      { to: "performance", label: "Performance", icon: TrendingUp },
      { to: "activity-feed", label: "Activity Feed", icon: Activity },
    ],
  },
  {
    label: "Tools",
    items: [
      { to: "workflows", label: "Workflows", icon: Workflow },
      { to: "approvals", label: "Approvals", icon: ClipboardCheck },
      { to: "data-quality", label: "Data Quality", icon: Users2 },
      { to: "integrations", label: "Integrations", icon: Link2 },
      { to: "import", label: "Import / Migrate", icon: Database },
      { to: "notifications", label: "Notifications", icon: Bell },
      { to: "audit", label: "Audit Log", icon: History },
    ],
  },
];

export const ALL_MODULES: ModuleItem[] = [
  ...PINNED,
  ...GROUPS.flatMap((g) => g.items),
];
