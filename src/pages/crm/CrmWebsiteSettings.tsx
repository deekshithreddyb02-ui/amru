import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft,
  LayoutList, BarChart3, Sparkles, Info, HelpCircle, MessageSquareQuote,
  Wrench, Image as ImageIcon, Navigation, MapPin, PanelBottom, Scale, Phone,
  ExternalLink, Globe, Palette, Shield, Award, FormInput, type LucideIcon,
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
import EnquiryFormEditor from "@/components/admin/EnquiryFormEditor";
import FeedbackEditor from "@/components/admin/FeedbackEditor";
import CrmSettingsEditor from "@/components/admin/CrmSettingsEditor";

import SectionOrderEditor from "@/components/admin/SectionOrderEditor";
import CustomSectionEditor from "@/components/admin/CustomSectionEditor";
import SiteStatsEditor from "@/components/admin/SiteStatsEditor";
import BrandingEditor from "@/components/admin/BrandingEditor";
import LoginSecurityEditor from "@/components/admin/LoginSecurityEditor";
import CertificationsEditor from "@/components/admin/CertificationsEditor";

type Section = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  render: () => JSX.Element;
};

export const WEBSITE_SETTING_SECTIONS: Section[] = [
  { key: "branding", label: "Branding & Assets", description: "Logos, favicon & brand identity", icon: Palette, render: () => <BrandingEditor /> },
  { key: "page-layout", label: "Page Layout", description: "Section ordering & custom sections", icon: LayoutList, render: () => (
    <div className="space-y-8"><SectionOrderEditor /><CustomSectionEditor /></div>
  )},
  { key: "site-stats", label: "Site Statistics", description: "Centralized metrics across all pages", icon: BarChart3, render: () => <SiteStatsEditor /> },
  { key: "navbar", label: "Navigation Bar", description: "Menu items, logo & nav styling", icon: Navigation, render: () => <NavbarEditor /> },
  { key: "footer", label: "Footer", description: "Footer content, links & branding", icon: PanelBottom, render: () => <FooterEditor /> },
  { key: "hero", label: "Hero Banner", description: "Main hero area, CTA & visuals", icon: Sparkles, render: () => <HeroEditor /> },
  { key: "about", label: "About Us", description: "Company story & mission", icon: Info, render: () => <AboutEditor /> },
  { key: "whyus", label: "Why Choose Us", description: "Key differentiators & trust signals", icon: HelpCircle, render: () => <WhyUsEditor /> },
  { key: "services", label: "Services", description: "Service cards & detailed views", icon: Wrench, render: () => <ServiceEditor /> },
  { key: "testimonials", label: "Testimonials", description: "Client reviews & ratings", icon: MessageSquareQuote, render: () => <TestimonialsEditor /> },
  { key: "feedback", label: "Customer Feedback", description: "Feedback media & highlights", icon: BarChart3, render: () => <FeedbackEditor /> },
  { key: "gallery", label: "Project Gallery", description: "Photos from field & projects", icon: ImageIcon, render: () => <GalleryEditor /> },
  { key: "certifications", label: "Certifications", description: "Edit certification cards & icons", icon: Award, render: () => <CertificationsEditor /> },
  { key: "offices", label: "Office Locations", description: "Map coordinates & office details", icon: MapPin, render: () => <OfficeEditor /> },
  { key: "contacts", label: "Contact Info", description: "Phone, email & WhatsApp", icon: Phone, render: () => <ContactEditor /> },
  { key: "enquiry-form", label: "Enquiry Form", description: "Form fields & state \u2192 CRM routing", icon: FormInput, render: () => <EnquiryFormEditor /> },
  { key: "crm-config", label: "CRM Settings", description: "CRM routing & status", icon: ExternalLink, render: () => (
    <div className="space-y-6"><CrmSettingsEditor /></div>
  )},
  { key: "login-security", label: "Login Security", description: "Login attempt limits & lockout", icon: Shield, render: () => <LoginSecurityEditor /> },
  { key: "legal", label: "Legal Notice", description: "Terms, privacy & disclaimers", icon: Scale, render: () => <LegalNoticeEditor /> },
];

export default function CrmWebsiteSettings() {
  const { section, slug } = useParams<{ section?: string; slug: string }>();
  const navigate = useNavigate();

  if (!section) {
    return <Navigate to={`/crm/${slug}/website-settings/branding`} replace />;
  }

  const sec = WEBSITE_SETTING_SECTIONS.find((s) => s.key === section);

  if (!sec) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Section not found</h2>
        <p className="text-sm text-muted-foreground mt-1">The website settings section "{section}" does not exist.</p>
      </div>
    );
  }

  const Icon = sec.icon;

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/crm/${slug}/website-settings`)}
            className="gap-1 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Icon className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
              {sec.label}
            </h2>
            <p className="text-xs text-muted-foreground">{sec.description}</p>
          </div>
        </div>
      </div>
      <div className="p-6 flex-1 overflow-y-auto">{sec.render()}</div>
    </div>
  );
}
