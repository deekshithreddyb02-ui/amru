import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, MoreHorizontal, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ModuleItem = { to: string; label: string; icon: LucideIcon };
export type ModuleGroup = { label: string; items: ModuleItem[] };

type Props = {
  slug: string;
  pinned: ModuleItem[];
  groups: ModuleGroup[];
};

const resolveTo = (slug: string, to: string) => (to.startsWith("/") ? to : `/crm/${slug}/${to}`);

export default function CrmModuleNav({ slug, pinned, groups }: Props) {
  const loc = useLocation();
  const isActive = (to: string) => loc.pathname.startsWith(resolveTo(slug, to));

  return (
    <nav
      className="hidden md:flex items-stretch gap-0 h-10 border-b bg-card overflow-x-auto"
      aria-label="CRM modules"
    >
      {pinned.map((m) => (
        <NavLink
          key={m.to}
          to={resolveTo(slug, m.to)}
          className={({ isActive }) =>
            `inline-flex items-center gap-1.5 px-3 text-[13px] whitespace-nowrap border-b-2 transition-colors ${
              isActive
                ? "border-primary text-primary font-medium bg-primary/5"
                : "border-transparent text-foreground/80 hover:text-foreground hover:bg-muted/60"
            }`
          }
        >
          <m.icon className="h-3.5 w-3.5" />
          {m.label}
        </NavLink>
      ))}

      {groups.map((g) => {
        const active = g.items.some((i) => isActive(i.to));
        return (
          <DropdownMenu key={g.label}>
            <DropdownMenuTrigger
              className={`inline-flex items-center gap-1 px-3 text-[13px] whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? "border-primary text-primary font-medium bg-primary/5"
                  : "border-transparent text-foreground/80 hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {g.label}
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-popover">
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {g.label}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {g.items.map((m) => (
                <DropdownMenuItem key={m.to} asChild className="cursor-pointer">
                  <NavLink to={resolveTo(slug, m.to)} className="flex items-center gap-2">
                    <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{m.label}</span>
                  </NavLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </nav>
  );
}
