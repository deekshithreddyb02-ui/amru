import {
  Plus, Megaphone, Contact2, UserRound, Building2, Coins, Briefcase,
  ClipboardList, FileSignature, Package, Wrench, BookOpen, Truck,
  CalendarDays, CheckSquare, FileText, ListChecks, Diamond,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

// 17 modules in the exact order from the Vtiger reference, 3-column grid.
const ITEMS: { to: string; label: string; icon: any }[] = [
  { to: "campaigns",       label: "Campaign",         icon: Megaphone },
  { to: "leads",           label: "Lead",             icon: Contact2 },
  { to: "contacts",        label: "Contact",          icon: UserRound },
  { to: "organizations",   label: "Organization",     icon: Building2 },
  { to: "deals",           label: "Opportunity",      icon: Coins },
  { to: "project-reports", label: "Project",          icon: Briefcase },
  { to: "inventory",       label: "Asset",            icon: ClipboardList },
  { to: "contracts",       label: "Service Contract", icon: FileSignature },
  { to: "products",        label: "Product",          icon: Package },
  { to: "products",        label: "Service",          icon: Wrench },
  { to: "products",        label: "Price Book",       icon: BookOpen },
  { to: "vendors",         label: "Vendor",           icon: Truck },
  { to: "calendar",        label: "Event",            icon: CalendarDays },
  { to: "tasks",           label: "Task",             icon: CheckSquare },
  { to: "documents",       label: "Document",         icon: FileText },
  { to: "activities",      label: "Project Task",     icon: ListChecks },
  { to: "project-reports", label: "Project Milestone",icon: Diamond },
];

export default function CrmQuickCreate({ slug }: { slug: string }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          className="h-8 w-8 rounded-full bg-[hsl(var(--vt-orange))] hover:bg-[hsl(var(--vt-orange-hover))] text-white shadow-none"
          aria-label="Quick Create"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[420px] p-0 bg-popover border border-[hsl(var(--vt-bar-border))] shadow-lg rounded-md"
      >
        <div className="px-4 py-2.5 text-[13px] font-semibold text-[hsl(var(--vt-text))] border-b border-[hsl(var(--vt-bar-border))]">
          Quick Create
        </div>
        <div className="grid grid-cols-3 gap-y-1 gap-x-2 p-3">
          {ITEMS.map((it, i) => (
            <button
              key={i}
              onClick={() => navigate(`/crm/${slug}/${it.to}?new=1`)}
              className="flex items-center gap-2 px-2 py-2 rounded text-left text-[12.5px] text-[hsl(var(--vt-text))] hover:bg-[hsl(var(--vt-row-hover))] transition-colors min-w-0"
            >
              <it.icon className="h-4 w-4 shrink-0 text-[hsl(var(--vt-muted))]" strokeWidth={1.5} />
              <span className="truncate leading-tight">{it.label}</span>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
