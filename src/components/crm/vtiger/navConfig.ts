import {
  LayoutDashboard, Users, UserRound, Building, Briefcase, ListChecks, CalendarDays,
  LifeBuoy, FolderOpen, FileSpreadsheet, ShoppingCart, Receipt, Package,
  Warehouse, Truck, ClipboardCheck, Megaphone, Mail, FileText, ClipboardList,
  Wrench, BookOpen, MessageSquare, HelpCircle, FileSignature, Diamond,
  Rss, Globe, Trash2, Phone, Coins, Contact2, Building2,
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
];

export const ALL_MODULES: ModuleItem[] = [
  ...PINNED,
  ...GROUPS.flatMap((g) => g.items),
];
