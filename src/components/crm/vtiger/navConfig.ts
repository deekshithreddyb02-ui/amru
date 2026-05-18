import {
  LayoutDashboard, Users, UserRound, Building, Briefcase, ListChecks, CalendarDays,
  LifeBuoy, FolderOpen, FileSpreadsheet, ShoppingCart, Receipt, Package,
  Warehouse, Truck, ClipboardCheck, Megaphone, Mail, FileText, ClipboardList,
  Wrench, BookOpen, MessageSquare, HelpCircle, FileSignature, Diamond,
  Rss, Globe, Trash2, Phone, Coins, Contact2, Building2,
  Palette, LayoutList, BarChart3, Navigation, PanelBottom, Sparkles, Info,
  MessageSquareQuote, Image as ImageIcon, Award, MapPin, ExternalLink, Shield, Scale,
  ShoppingBag, Settings, UserCog, Database,
} from "lucide-react";
import type { ModuleItem, ModuleGroup } from "./CrmModuleNav";

export const PINNED: ModuleItem[] = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export const GROUPS: ModuleGroup[] = [
  {
    label: "Marketing",
    items: [
      { to: "campaigns",     label: "Campaigns",     icon: Megaphone },
      { to: "leads",         label: "Leads",         icon: Contact2 },
      { to: "contacts",      label: "Contacts",      icon: UserRound },
      { to: "organizations", label: "Organizations", icon: Building2 },
    ],
  },
  {
    label: "Sales",
    items: [
      { to: "deals",         label: "Opportunities", icon: Coins },
      { to: "quotations",    label: "Quotes",        icon: FileSpreadsheet },
      { to: "products",      label: "Products",      icon: Package },
      { to: "products",      label: "Services",      icon: Wrench },
      { to: "messages",      label: "SMS Notifier",  icon: MessageSquare },
      { to: "contacts",      label: "Contacts",      icon: UserRound },
      { to: "organizations", label: "Organizations", icon: Building2 },
    ],
  },
  {
    label: "Inventory",
    items: [
      { to: "products",        label: "Products",        icon: Package },
      { to: "products",        label: "Services",        icon: Wrench },
      { to: "products",        label: "Price Books",     icon: BookOpen },
      { to: "invoices",        label: "Invoices",        icon: Receipt },
      { to: "sales-orders",    label: "Sales Orders",    icon: ShoppingCart },
      { to: "purchase-orders", label: "Purchase Orders", icon: ClipboardCheck },
      { to: "vendors",         label: "Vendors",         icon: Truck },
      { to: "contacts",        label: "Contacts",        icon: UserRound },
      { to: "organizations",   label: "Organizations",   icon: Building2 },
    ],
  },
  {
    label: "Support",
    items: [
      { to: "tickets",          label: "Tickets",          icon: LifeBuoy },
      { to: "tickets",          label: "FAQ",              icon: HelpCircle },
      { to: "contracts",        label: "Service Contracts",icon: FileSignature },
      { to: "inventory",        label: "Assets",           icon: Warehouse },
      { to: "messages",         label: "SMS Notifier",     icon: MessageSquare },
      { to: "contacts",         label: "Contacts",         icon: UserRound },
      { to: "organizations",    label: "Organizations",    icon: Building2 },
    ],
  },
  {
    label: "Projects",
    items: [
      { to: "project-reports", label: "Projects",          icon: Briefcase },
      { to: "activities",      label: "Project Tasks",     icon: ListChecks },
      { to: "project-reports", label: "Project Milestones",icon: Diamond },
      { to: "contacts",        label: "Contacts",          icon: UserRound },
      { to: "organizations",   label: "Organizations",     icon: Building2 },
    ],
  },
  {
    label: "Tools",
    items: [
      { to: "email-templates", label: "Email Templates", icon: Mail },
      { to: "activity-feed",   label: "Rss",             icon: Rss },
      { to: "integrations",    label: "Our Sites",       icon: Globe },
      { to: "audit",           label: "Recycle Bin",     icon: Trash2 },
      { to: "messages",        label: "PBX Manager",     icon: Phone },
    ],
  },
  {
    label: "Website Settings",
    items: [
      { to: "website-settings/branding",       label: "Branding & Assets",  icon: Palette },
      { to: "website-settings/page-layout",    label: "Page Layout",        icon: LayoutList },
      { to: "website-settings/site-stats",     label: "Site Statistics",    icon: BarChart3 },
      { to: "website-settings/navbar",         label: "Navigation Bar",     icon: Navigation },
      { to: "website-settings/footer",         label: "Footer",             icon: PanelBottom },
      { to: "website-settings/hero",           label: "Hero Banner",        icon: Sparkles },
      { to: "website-settings/about",          label: "About Us",           icon: Info },
      { to: "website-settings/whyus",          label: "Why Choose Us",      icon: HelpCircle },
      { to: "website-settings/services",       label: "Services",           icon: Wrench },
      { to: "website-settings/testimonials",   label: "Testimonials",       icon: MessageSquareQuote },
      { to: "website-settings/feedback",       label: "Customer Feedback",  icon: BarChart3 },
      { to: "website-settings/gallery",        label: "Project Gallery",    icon: ImageIcon },
      { to: "website-settings/certifications", label: "Certifications",     icon: Award },
      { to: "website-settings/offices",        label: "Office Locations",   icon: MapPin },
      { to: "website-settings/contacts",       label: "Contact Info",       icon: Phone },
      { to: "website-settings/crm-config",     label: "CRM Config",         icon: ExternalLink },
      { to: "website-settings/login-security", label: "Login Security",     icon: Shield },
      { to: "website-settings/legal",          label: "Legal Notice",       icon: Scale },
    ],
  },
  {
    label: "Settings",
    items: [
      { to: "admin-center",                    label: "Admin Center",       icon: ShieldCheck },
      { to: "website-settings/crm-config",     label: "CRM Settings",       icon: Settings },
      { to: "admin/workspaces",                label: "Manage Users",       icon: UserCog },
      { to: "admin/analytics",                 label: "Cross Analytics",    icon: BarChart3 },
      { to: "admin/db-analytics",              label: "Database Analytics", icon: Database },
      { to: "audit",                           label: "Audit Log",          icon: Shield },
      { to: "integrations",                    label: "Integrations",       icon: ExternalLink },
      { to: "workflows",                       label: "Workflows",          icon: Sparkles },
      { to: "approvals",                       label: "Approvals",          icon: ClipboardCheck },
      { to: "territories",                     label: "Territories",        icon: MapPin },
      { to: "data-quality",                    label: "Data Quality",       icon: Shield },
      { to: "import",                          label: "Import / Export",    icon: FolderOpen },
    ],
  },
];

export const EXTRA_PINNED: ModuleItem[] = [
  { to: "integrations", label: "Extension Store", icon: ShoppingBag },
];

export const ALL_MODULES: ModuleItem[] = [
  ...PINNED,
  ...GROUPS.flatMap((g) => g.items),
];
