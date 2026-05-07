import { Plus, UserRound, Users, Building, Briefcase, ListChecks, FileSpreadsheet, Receipt, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const ITEMS = [
  { to: "leads", label: "Lead", icon: Users },
  { to: "contacts", label: "Contact", icon: UserRound },
  { to: "organizations", label: "Organization", icon: Building },
  { to: "deals", label: "Deal", icon: Briefcase },
  { to: "activities", label: "Task", icon: ListChecks },
  { to: "quotations", label: "Quotation", icon: FileSpreadsheet },
  { to: "invoices", label: "Invoice", icon: Receipt },
  { to: "tickets", label: "Ticket", icon: LifeBuoy },
];

export default function CrmQuickCreate({ slug }: { slug: string }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 px-2.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Quick Create
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ITEMS.map((it) => (
          <DropdownMenuItem
            key={it.to}
            className="cursor-pointer"
            onClick={() => navigate(`/crm/${slug}/${it.to}?new=1`)}
          >
            <it.icon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <span className="text-sm">{it.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
