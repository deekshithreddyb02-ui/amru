import { lazy, Suspense, ComponentType } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { useVisitTracker } from "@/hooks/useVisitTracker";
import { useSectionOrder } from "@/hooks/useSectionOrder";

const sectionComponents: Record<string, ComponentType> = {
  services: lazy(() => import("@/components/Services")),
  about: lazy(() => import("@/components/About")),
  whyus: lazy(() => import("@/components/WhyUs")),
  certifications: lazy(() => import("@/components/Certifications")),
  testimonials: lazy(() => import("@/components/Testimonials")),
  gallery: lazy(() => import("@/components/Gallery")),
  contact: lazy(() => import("@/components/Contact")),
  offices: lazy(() => import("@/components/OfficeLocations")),
  legal: lazy(() => import("@/components/LegalNotice")),
  feedback: lazy(() => import("@/components/CustomerFeedback")),
};

const Footer = lazy(() => import("@/components/Footer"));
const ChatBot = lazy(() => import("@/components/ChatBot"));

const Index = () => {
  useVisitTracker();
  const { sections } = useSectionOrder();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Suspense fallback={null}>
        {sections
          .filter((s) => s.visible && sectionComponents[s.key])
          .map((s) => {
            const Component = sectionComponents[s.key];
            return <Component key={s.key} />;
          })}
        <Footer />
        <ChatBot />
      </Suspense>
    </div>
  );
};

export default Index;
