import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Briefcase, MapPin, Bell, Activity } from "lucide-react";

const ITEMS = [
  { to: "dashboard", label: "Home", icon: LayoutDashboard },
  { to: "leads", label: "Leads", icon: Users },
  { to: "deals", label: "Deals", icon: Briefcase },
  { to: "field-mode", label: "Field", icon: MapPin },
  { to: "activity-feed", label: "Feed", icon: Activity },
  { to: "notifications", label: "Alerts", icon: Bell },
];

export default function CrmMobileBottomNav({ slug }: { slug: string }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-6">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={`/crm/${slug}/${to}`}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 text-[10px] gap-0.5 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
