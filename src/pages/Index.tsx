import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";

// Lazy load below-the-fold components to reduce initial JS bundle
const Services = lazy(() => import("@/components/Services"));
const About = lazy(() => import("@/components/About"));
const WhyUs = lazy(() => import("@/components/WhyUs"));
const Certifications = lazy(() => import("@/components/Certifications"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
const Gallery = lazy(() => import("@/components/Gallery"));
const Contact = lazy(() => import("@/components/Contact"));
const CustomerFeedback = lazy(() => import("@/components/CustomerFeedback"));
const OfficeLocations = lazy(() => import("@/components/OfficeLocations"));
const LegalNotice = lazy(() => import("@/components/LegalNotice"));
const Footer = lazy(() => import("@/components/Footer"));
const ChatBot = lazy(() => import("@/components/ChatBot"));

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Suspense fallback={null}>
        <Services />
        <About />
        <WhyUs />
        <Certifications />
        <Testimonials />
        <Gallery />
        <Contact />
        <OfficeLocations />
        <LegalNotice />
        <Footer />
        <ChatBot />
      </Suspense>
    </div>
  );
};

export default Index;
