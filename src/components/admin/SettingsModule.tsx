import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutList, BarChart3, Sparkles, Info, HelpCircle, MessageSquareQuote,
  Wrench, Image, Navigation, MapPin, PanelBottom, Scale, Phone,
  ExternalLink, ChevronRight, Settings, Globe, Layers, Shield, Palette,
  Award,
  type LucideIcon,
} from "lucide-react";

import ServiceEditor from "@/components/admin/ServiceEditor";
import GalleryEditor from "@/components/admin/GalleryEditor";
import NavbarEditor from "@/components/admin/NavbarEditor";
import OfficeEditor from "@/components/admin/OfficeEditor";
import FooterEditor from "@/components/admin/FooterEditor";
import HeroEditor from "@/components/admin/HeroEditor";
import AboutEditor from "@/components/admin/AboutEditor";
import WhyUsEditor from "@/components/admin/WhyUsEditor";
import TestimonialsEditor from "@/components/admin/TestimonialsEditor";
import LegalNoticeEditor from "@/components/admin/LegalNoticeEditor";
import ContactEditor from "@/components/admin/ContactEditor";
import FeedbackEditor from "@/components/admin/FeedbackEditor";
import CrmSettingsEditor from "@/components/admin/CrmSettingsEditor";
import CrmPingDashboard from "@/components/admin/CrmPingDashboard";
import SectionOrderEditor from "@/components/admin/SectionOrderEditor";
import CustomSectionEditor from "@/components/admin/CustomSectionEditor";
import SiteStatsEditor from "@/components/admin/SiteStatsEditor";
import BrandingEditor from "@/components/admin/BrandingEditor";
import LoginSecurityEditor from "@/components/admin/LoginSecurityEditor";
import CertificationsEditor from "@/components/admin/CertificationsEditor";

interface SettingsItem {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

interface SettingsGroup {
  title: string;
  icon: LucideIcon;
  items: SettingsItem[];
}

const settingsGroups: SettingsGroup[] = [
  {
    title: "Page Structure",
    icon: Layers,
    items: [
      { key: "branding", label: "Branding & Assets", icon: Palette, description: "Logos, favicon & brand identity" },
      { key: "page-layout", label: "Page Layout", icon: LayoutList, description: "Section ordering & custom sections" },
      { key: "site-stats", label: "Site Statistics", icon: BarChart3, description: "Centralized metrics across all pages" },
      { key: "navbar", label: "Navigation Bar", icon: Navigation, description: "Menu items, logo & nav styling" },
      { key: "footer", label: "Footer", icon: PanelBottom, description: "Footer content, links & branding" },
    ],
  },
  {
    title: "Content Sections",
    icon: Globe,
    items: [
      { key: "hero", label: "Hero Banner", icon: Sparkles, description: "Main hero area, CTA & visuals" },
      { key: "about", label: "About Us", icon: Info, description: "Company story & mission" },
      { key: "whyus", label: "Why Choose Us", icon: HelpCircle, description: "Key differentiators & trust signals" },
      { key: "services", label: "Services", icon: Wrench, description: "Service cards & detailed views" },
      { key: "testimonials", label: "Testimonials", icon: MessageSquareQuote, description: "Client reviews & ratings" },
      { key: "feedback", label: "Customer Feedback", icon: BarChart3, description: "Feedback media & highlights" },
      { key: "gallery", label: "Project Gallery", icon: Image, description: "Photos from field & projects" },
      { key: "certifications", label: "Certifications & Partnerships", icon: Award, description: "Edit certification cards & icons" },
    ],
  },
  {
    title: "Locations & Contact",
    icon: MapPin,
    items: [
      { key: "offices", label: "Office Locations", icon: MapPin, description: "Map coordinates & office details" },
      { key: "contacts", label: "Contact Info", icon: Phone, description: "Phone, email & WhatsApp" },
    ],
  },
  {
    title: "Integrations & Legal",
    icon: Shield,
    items: [
      { key: "crm", label: "CRM Settings", icon: ExternalLink, description: "CRM routing, ping & status" },
      { key: "login-security", label: "Login Security", icon: Shield, description: "Login attempt limits & lockout" },
      { key: "legal", label: "Legal Notice", icon: Scale, description: "Terms, privacy & disclaimers" },
    ],
  },
];

const allItems = settingsGroups.flatMap(g => g.items);

const SettingsModule = () => {
  const [activeKey, setActiveKey] = useState("branding");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const activeItem = allItems.find(i => i.key === activeKey);

  return (
    <div className="flex h-[calc(100vh-10rem)] border border-border rounded-xl overflow-hidden bg-card">
      {/* Sidebar */}
      <aside
        className={cn(
          "border-r border-border bg-muted/30 shrink-0 transition-all duration-300 flex flex-col",
          sidebarCollapsed ? "w-14" : "w-64"
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Settings</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            title={sidebarCollapsed ? "Expand" : "Collapse"}
          >
            <ChevronRight className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              !sidebarCollapsed && "rotate-180"
            )} />
          </button>
        </div>

        {/* Groups */}
        <nav className="py-2 flex-1 overflow-y-auto">
          {settingsGroups.map((group) => (
            <div key={group.title} className="mb-1">
              {!sidebarCollapsed && (
                <div className="px-3 py-2 flex items-center gap-2">
                  <group.icon className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                    {group.title}
                  </span>
                </div>
              )}
              {sidebarCollapsed && (
                <div className="h-px bg-border mx-2 my-2" />
              )}
              {group.items.map((item) => {
                const isActive = activeKey === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveKey(item.key)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={cn(
                      "w-full flex items-center gap-3 transition-all text-left",
                      sidebarCollapsed
                        ? "justify-center px-2 py-2.5 mx-auto"
                        : "px-3 py-2 mx-1 rounded-lg",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4 shrink-0", isActive && "text-primary-foreground")} />
                    {!sidebarCollapsed && (
                      <div className="min-w-0 flex-1">
                        <div className={cn("text-sm font-medium truncate", isActive && "text-primary-foreground")}>
                          {item.label}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto min-h-0">
        {/* Content header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            {activeItem && <activeItem.icon className="w-5 h-5 text-primary" />}
            <div>
              <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
                {activeItem?.label || "Settings"}
              </h2>
              <p className="text-xs text-muted-foreground">{activeItem?.description}</p>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6">
          {activeKey === "branding" && <BrandingEditor />}
          {activeKey === "page-layout" && (
            <div className="space-y-8">
              <SectionOrderEditor />
              <CustomSectionEditor />
            </div>
          )}
          {activeKey === "site-stats" && <SiteStatsEditor />}
          {activeKey === "hero" && <HeroEditor />}
          {activeKey === "about" && <AboutEditor />}
          {activeKey === "whyus" && <WhyUsEditor />}
          {activeKey === "testimonials" && <TestimonialsEditor />}
          {activeKey === "services" && <ServiceEditor />}
          {activeKey === "gallery" && <GalleryEditor />}
          {activeKey === "feedback" && <FeedbackEditor />}
          {activeKey === "certifications" && <CertificationsEditor />}
          {activeKey === "navbar" && <NavbarEditor />}
          {activeKey === "offices" && <OfficeEditor />}
          {activeKey === "contacts" && <ContactEditor />}
          {activeKey === "footer" && <FooterEditor />}
          {activeKey === "legal" && <LegalNoticeEditor />}
          {activeKey === "crm" && (
            <div className="space-y-6">
              <CrmSettingsEditor />
              <CrmPingDashboard />
            </div>
          )}
          {activeKey === "login-security" && <LoginSecurityEditor />}
        </div>
      </main>
    </div>
  );
};

export default SettingsModule;
