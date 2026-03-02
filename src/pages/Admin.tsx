import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogOut, Home, Wrench, Image, Navigation, MapPin, PanelBottom, Sparkles, Info, HelpCircle, MessageSquareQuote, Scale } from "lucide-react";
import { motion } from "framer-motion";

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

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/admin-login");
    }
  }, [isAdmin, adminLoading, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="sm" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <h1 className="text-xl font-serif font-semibold">Admin Dashboard</h1>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs defaultValue="hero">
            <TabsList className="mb-4">
              <TabsTrigger value="hero">
                <Sparkles className="w-4 h-4 mr-1" />
                Hero
              </TabsTrigger>
              <TabsTrigger value="about">
                <Info className="w-4 h-4 mr-1" />
                About Us
              </TabsTrigger>
              <TabsTrigger value="whyus">
                <HelpCircle className="w-4 h-4 mr-1" />
                Why Us
              </TabsTrigger>
              <TabsTrigger value="testimonials">
                <MessageSquareQuote className="w-4 h-4 mr-1" />
                Testimonials
              </TabsTrigger>
              <TabsTrigger value="services">
                <Wrench className="w-4 h-4 mr-1" />
                Services
              </TabsTrigger>
              <TabsTrigger value="gallery">
                <Image className="w-4 h-4 mr-1" />
                Gallery
              </TabsTrigger>
              <TabsTrigger value="navbar">
                <Navigation className="w-4 h-4 mr-1" />
                Navbar
              </TabsTrigger>
              <TabsTrigger value="offices">
                <MapPin className="w-4 h-4 mr-1" />
                Office Maps
              </TabsTrigger>
              <TabsTrigger value="footer">
                <PanelBottom className="w-4 h-4 mr-1" />
                Footer
              </TabsTrigger>
              <TabsTrigger value="legal">
                <Scale className="w-4 h-4 mr-1" />
                Legal Notice
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hero">
              <HeroEditor />
            </TabsContent>
            <TabsContent value="about">
              <AboutEditor />
            </TabsContent>
            <TabsContent value="whyus">
              <WhyUsEditor />
            </TabsContent>
            <TabsContent value="testimonials">
              <TestimonialsEditor />
            </TabsContent>
            <TabsContent value="services">
              <ServiceEditor />
            </TabsContent>
            <TabsContent value="gallery">
              <GalleryEditor />
            </TabsContent>
            <TabsContent value="navbar">
              <NavbarEditor />
            </TabsContent>
            <TabsContent value="offices">
              <OfficeEditor />
            </TabsContent>
            <TabsContent value="footer">
              <FooterEditor />
            </TabsContent>
            <TabsContent value="legal">
              <LegalNoticeEditor />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default Admin;
