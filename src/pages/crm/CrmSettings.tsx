import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Settings, Users, Shield, Layers, Workflow, Clock, FileCog,
  Cog, Megaphone, Mail, Package, Receipt, User as UserIcon,
  Plug, Puzzle, MoreHorizontal, ChevronRight, ChevronDown,
  Search, FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Item = { label: string; to?: string; description?: string };
type Group = { key: string; label: string; icon: any; items: Item[] };

const GROUPS: Group[] = [
  {
    key: "user-management", label: "USER MANAGEMENT", icon: Users,
    items: [
      { label: "Users", to: "/crm/admin/workspaces", description: "Manage CRM users, roles and access." },
      { label: "Roles", to: "admin-center", description: "Define roles and hierarchy." },
      { label: "Profiles", to: "admin-center", description: "Profile-level permissions." },
      { label: "Groups", to: "admin-center", description: "User groups for sharing and assignment." },
      { label: "Login History", to: "audit", description: "Track CRM login activity." },
    ],
  },
  {
    key: "module-management", label: "MODULE MANAGEMENT", icon: Layers,
    items: [
      { label: "Module Manager", description: "Enable, disable and configure modules." },
      { label: "Picklist Editor", description: "Manage dropdown values per module." },
      { label: "Picklist Dependency", description: "Setup dependent picklists." },
      { label: "Workflows", to: "workflows", description: "Automate actions on records." },
    ],
  },
  {
    key: "automation", label: "AUTOMATION", icon: Workflow,
    items: [
      { label: "Webforms", to: "web-forms", description: "Capture leads through public web forms." },
      { label: "Scheduler", description: "Schedule recurring jobs and reminders." },
      { label: "Workflows", to: "workflows", description: "Trigger-based business automation." },
    ],
  },
  {
    key: "configuration", label: "CONFIGURATION", icon: Cog,
    items: [
      { label: "Company Details", to: "website-settings/branding", description: "Logo, address and branding." },
      { label: "Currency", description: "Default currency and conversion rates." },
      { label: "Tax Calculations", description: "GST and tax slabs." },
      { label: "Outgoing Server", description: "SMTP configuration for emails." },
      { label: "Default Module View", description: "Choose List or Kanban as default." },
    ],
  },
  {
    key: "marketing-sales", label: "MARKETING & SALES", icon: Megaphone,
    items: [
      { label: "Email Templates", to: "email-templates", description: "Reusable email templates." },
      { label: "Campaigns", to: "campaigns", description: "Marketing campaign settings." },
      { label: "Lead Assignment", to: "territories", description: "Routing rules for new leads." },
      { label: "Approval Process", to: "approvals", description: "Multi-step approval workflows." },
    ],
  },
  {
    key: "inventory", label: "INVENTORY", icon: Package,
    items: [
      { label: "Inventory Terms & Conditions", description: "Default T&C on quotes and invoices." },
      { label: "Tax Management", description: "Product and shipping taxes." },
      { label: "Invoice Numbering", to: "invoices", description: "Customise invoice number format." },
    ],
  },
  {
    key: "my-preferences", label: "MY PREFERENCES", icon: UserIcon,
    items: [
      { label: "My Profile", description: "Personal profile and signature." },
      { label: "Notifications", to: "notifications", description: "Per-user notification preferences." },
      { label: "Calendar Settings", to: "calendar", description: "Default calendar view and reminders." },
    ],
  },
  {
    key: "integration", label: "INTEGRATION", icon: Plug,
    items: [
      { label: "Integrations", to: "integrations", description: "Connect external services." },
      { label: "CRM Config", to: "website-settings/crm-config", description: "Vtiger web form routing." },
      { label: "API Access", to: "admin-center", description: "API keys and tokens." },
    ],
  },
  {
    key: "extensions", label: "EXTENSIONS", icon: Puzzle,
    items: [
      { label: "Extension Store", to: "integrations", description: "Browse and install extensions." },
      { label: "Installed Extensions", description: "Manage installed add-ons." },
    ],
  },
  {
    key: "other-settings", label: "OTHER SETTINGS", icon: MoreHorizontal,
    items: [
      { label: "Audit Log", to: "audit", description: "Full audit trail of changes." },
      { label: "Data Quality", to: "data-quality", description: "Duplicates and data hygiene." },
      { label: "Import / Export", to: "import", description: "Bulk import and export records." },
      { label: "Legal Notice", to: "website-settings/legal", description: "Privacy and legal text." },
      { label: "Recycle Bin", to: "audit", description: "Recover deleted records." },
    ],
  },
];

const CrmSettings = () => {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState<string>(GROUPS[0].key);
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({ [GROUPS[0].key]: true });
  const [query, setQuery] = useState("");

  const active = useMemo(
    () => GROUPS.find((g) => g.key === activeKey) ?? GROUPS[0],
    [activeKey]
  );

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return GROUPS;
    const q = query.toLowerCase();
    return GROUPS
      .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0 || g.label.toLowerCase().includes(q));
  }, [query]);

  const go = (item: Item) => {
    if (item.to) navigate(item.to.startsWith("/") ? item.to : `/crm/${slug}/${item.to}`);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-card flex flex-col">
        <div className="h-14 flex items-center gap-2 px-4 border-b border-border bg-primary/5">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Settings className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold">CRM Settings</div>
            <div className="text-[10px] text-muted-foreground">Admin configuration</div>
          </div>
        </div>
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search settings"
              className="h-8 pl-7 text-xs"
            />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-1">
          {filteredGroups.map((g) => {
            const open = openKeys[g.key] ?? false;
            const isActive = activeKey === g.key;
            const Icon = g.icon;
            return (
              <div key={g.key}>
                <button
                  onClick={() => {
                    setActiveKey(g.key);
                    setOpenKeys((p) => ({ ...p, [g.key]: !p[g.key] }));
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold tracking-wide transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-foreground/80 hover:bg-muted border-l-2 border-transparent"
                  )}
                >
                  {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <Icon className="w-3.5 h-3.5" />
                  <span className="flex-1 text-left">{g.label}</span>
                </button>
                {open && (
                  <div className="pb-1">
                    {g.items.map((i) => (
                      <button
                        key={i.label}
                        onClick={() => { setActiveKey(g.key); go(i); }}
                        className="w-full text-left pl-11 pr-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {i.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-14 flex items-center gap-2 px-6 border-b border-border bg-card text-sm">
          <Link to={`/crm/${slug}/dashboard`} className="text-muted-foreground hover:text-foreground">HOME</Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Settings</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium text-foreground">{active.label}</span>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <active.icon className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">{active.label}</h1>
              <p className="text-xs text-muted-foreground">
                Configure {active.label.toLowerCase()} for this CRM workspace.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.items.map((i) => (
              <button
                key={i.label}
                onClick={() => go(i)}
                className={cn(
                  "text-left rounded-lg border border-border bg-card p-4 transition-all",
                  i.to ? "hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : "opacity-70 cursor-default"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  {i.to ? (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      Soon
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-foreground">{i.label}</div>
                {i.description && (
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{i.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CrmSettings;
