import {
  LayoutDashboard, Users, Contact, Building2, Target, Activity,
  FileText, Receipt, CreditCard, Package, Boxes,
  LifeBuoy, MapPin, FileSignature, Star, CheckSquare,
  Settings, Shield, GitBranch, ClipboardCheck, Award, ScrollText, ShoppingBag, Mail, FolderOpen,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon };
export type NavGroup = { label: string; icon: LucideIcon; items: NavItem[] };

export const PINNED: NavItem[] = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "mail", label: "Mail Manager", icon: Mail },
  { to: "documents", label: "Documents", icon: FolderOpen },
  { to: "integrations", label: "Extension Store", icon: ShoppingBag },
  { to: "website-settings/crm-config", label: "CRM Settings", icon: Settings },
];

export const GROUPS: NavGroup[] = [
  {
    label: "Sales", icon: Target,
    items: [
      { to: "leads", label: "Leads", icon: Users },
      { to: "contacts", label: "Contacts", icon: Contact },
      { to: "organizations", label: "Organizations", icon: Building2 },
      { to: "deals", label: "Deals", icon: Target },
      { to: "activities", label: "Activities", icon: Activity },
    ],
  },
  {
    label: "Quote to Cash", icon: Receipt,
    items: [
      { to: "quotations", label: "Quotations", icon: FileText },
      { to: "invoices", label: "Invoices", icon: Receipt },
      { to: "payments", label: "Payments", icon: CreditCard },
    ],
  },
  {
    label: "Inventory", icon: Package,
    items: [
      { to: "products", label: "Products", icon: Package },
      { to: "stock", label: "Stock Movements", icon: Boxes },
    ],
  },
  {
    label: "Support", icon: LifeBuoy,
    items: [
      { to: "tickets", label: "Support Tickets", icon: LifeBuoy },
      { to: "field-visits", label: "Field Visits", icon: MapPin },
      { to: "contracts", label: "Contracts", icon: FileSignature },
      { to: "feedback", label: "Feedback / NPS", icon: Star },
    ],
  },
  {
    label: "Tasks & Time", icon: CheckSquare,
    items: [
      { to: "tasks", label: "Tasks", icon: CheckSquare },
      { to: "time-logs", label: "Time Logs", icon: Activity },
    ],
  },
  {
    label: "Settings", icon: Settings,
    items: [
      { to: "website-settings/crm-config", label: "CRM Settings", icon: Settings },
      { to: "members", label: "Workspace Members", icon: Users },
      { to: "permissions", label: "Role Permissions", icon: Shield },
      { to: "workflows", label: "Workflow Rules", icon: GitBranch },
      { to: "approvals", label: "Approvals", icon: ClipboardCheck },
      { to: "commissions", label: "Commissions", icon: Award },
      { to: "audit-log", label: "Audit Log", icon: ScrollText },
      { to: "integrations", label: "Integrations", icon: ShoppingBag },
    ],
  },
];
