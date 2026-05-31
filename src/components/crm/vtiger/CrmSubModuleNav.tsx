import { NavLink, useLocation } from "react-router-dom";
import { GROUPS } from "./navConfig";

const resolveTo = (slug: string, to: string) =>
  to.startsWith("/") ? to : `/crm/${slug}/${to}`;

export default function CrmSubModuleNav({ slug }: { slug: string }) {
  const loc = useLocation();
  const moduleSeg = loc.pathname.split("/")[3];
  if (!moduleSeg) return null;

  // Find the first group that contains the current module
  const group = GROUPS.find((g) =>
    g.items.some((i) => !i.to.startsWith("/") && i.to === moduleSeg)
  );
  if (!group) return null;

  // De-duplicate items by `to` (some groups list the same route twice with different labels)
  const seen = new Set<string>();
  const items = group.items.filter((i) => {
    const key = `${i.to}|${i.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="bg-white border-b border-[hsl(var(--vt-bar-border))]">
      <nav
        aria-label={`${group.label} submodules`}
        className="flex items-stretch h-10 overflow-x-auto"
      >
        {items.map((m) => (
          <NavLink
            key={`${m.to}-${m.label}`}
            to={resolveTo(slug, m.to)}
            end={false}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 px-4 text-[13px] whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-[hsl(var(--vt-orange))] text-[hsl(var(--vt-orange))] font-medium bg-[hsl(var(--vt-orange)/0.06)]"
                  : "border-transparent text-[hsl(var(--vt-text))]/80 hover:text-[hsl(var(--vt-orange))] hover:bg-[hsl(var(--vt-row-hover))]"
              }`
            }
          >
            <m.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span>{m.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
