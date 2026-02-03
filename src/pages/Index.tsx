import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";

// Lazy load below-the-fold components
const Services = lazy(() => import("@/components/Services"));
const Stats = lazy(() => import("@/components/Stats"));
const About = lazy(() => import("@/components/About"));
const WhyUs = lazy(() => import("@/components/WhyUs"));
const Certifications = lazy(() => import("@/components/Certifications"));
const Contact = lazy(() => import("@/components/Contact"));
const Footer = lazy(() => import("@/components/Footer"));
const ChatBot = lazy(() => import("@/components/ChatBot"));

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Suspense fallback={null}>
        <Services />
        <Stats />
        <About />
        <WhyUs />
        <Certifications />
        <Contact />
        <Footer />
        <ChatBot />
      </Suspense>
    </div>
  );
};

export default Index;