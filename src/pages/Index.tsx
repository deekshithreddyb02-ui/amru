import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
 import CommunicationBar from "@/components/CommunicationBar";
 import FloatingActions from "@/components/FloatingActions";

// Lazy load below-the-fold components to reduce initial JS bundle
const Services = lazy(() => import("@/components/Services"));
const About = lazy(() => import("@/components/About"));
const WhyUs = lazy(() => import("@/components/WhyUs"));
const Certifications = lazy(() => import("@/components/Certifications"));
const Contact = lazy(() => import("@/components/Contact"));
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
        <Contact />
        <LegalNotice />
        <Footer />
        <ChatBot />
         <CommunicationBar />
         <FloatingActions />
      </Suspense>
    </div>
  );
};

export default Index;
