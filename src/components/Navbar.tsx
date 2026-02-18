import { useState, useEffect } from "react";
import { Menu, X, LogIn, LogOut, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useAdmin } from "@/hooks/useAdmin";
import { useSiteContent } from "@/hooks/useSiteContent";
import defaultLogo from "@/assets/logo-small.webp";

interface NavLink {
  name: string;
  href: string;
}

interface NavbarMetadata {
  company_name: string;
  logo_url: string;
  nav_links: NavLink[];
  external_link: { name: string; url: string };
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { isAdmin } = useAdmin();
  const { data: navbarContent } = useSiteContent("navbar");

  const meta = navbarContent?.metadata as unknown as NavbarMetadata | undefined;
  const companyName = meta?.company_name || "Amruta Integrated Water Solutions Pvt. Ltd.";
  const logoSrc = meta?.logo_url || defaultLogo;
  const navLinks = meta?.nav_links || [
    { name: "Home", href: "#home" },
    { name: "Services", href: "#services" },
    { name: "About Us", href: "#about" },
    { name: "Why Us", href: "#why" },
    { name: "Contact", href: "#contact" },
  ];
  const externalLink = meta?.external_link || { name: "RWH SW HFL PMS", url: "https://rain.amrutageo.com/" };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleMobileNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    const targetId = href.replace('#', '');
    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = href;
      }
    }, 300);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12 md:h-14">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2">
            <img 
              src={logoSrc} 
              alt="Logo" 
              width={48}
              height={48}
              className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-full bg-white"
              fetchPriority="low"
              decoding="async"
              loading="eager"
            />
            <span className="text-white font-serif text-sm md:text-lg font-semibold leading-tight">
              {companyName}
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="nav-link">
                {link.name}
              </a>
            ))}
            {externalLink.url && (
              <a
                href={externalLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {externalLink.name}
              </a>
            )}
            {isAdmin && (
              <a
                href="/admin"
                className="flex items-center gap-2 bg-accent/80 hover:bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Shield className="w-4 h-4" />
                Admin
              </a>
            )}
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <a
                href="/auth"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-primary border-t border-white/10"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="nav-link py-2"
                  onClick={(e) => handleMobileNavClick(e, link.href)}
                >
                  {link.name}
                </a>
              ))}
              {externalLink.url && (
                <a
                  href={externalLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium text-center"
                >
                  {externalLink.name}
                </a>
              )}
              {isAdmin && (
                <a
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 bg-accent/80 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </a>
              )}
              {user ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              ) : (
                <a
                  href="/auth"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
