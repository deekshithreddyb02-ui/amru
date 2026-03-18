import { useState, useEffect } from "react";
import { Menu, X, LogIn, LogOut, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useAdmin } from "@/hooks/useAdmin";
import { useSiteContent } from "@/hooks/useSiteContent";
import defaultLogo from "@/assets/logo-small.webp";

interface NavLink { name: string; href: string; }
interface NavbarMetadata {
  company_name: string;
  logo_url: string;
  nav_links: NavLink[];
  external_link: { name: string; url: string };
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { isAdmin } = useAdmin();
  const { data: navbarContent } = useSiteContent("navbar");

  const meta = navbarContent?.metadata as unknown as NavbarMetadata | undefined;
  const companyName = meta?.company_name || "Amruta Integrated Water Solutions Pvt. Ltd.";
  const logoSrc = meta?.logo_url || defaultLogo;
  const navLinks = meta?.nav_links || [
    { name: "Home", href: "#home" },
    { name: "About Us", href: "#about" },
    { name: "Why Us", href: "#why" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Services", href: "#services" },
    { name: "Gallery", href: "#gallery" },
    { name: "Office Maps", href: "#offices" },
    { name: "Contact", href: "#contact" },
  ];
  const externalLink = meta?.external_link || { name: "RWH SW HFL PMS", url: "https://rain.amrutageo.com/" };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); };

  const handleMobileNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    const targetId = href.replace('#', '');
    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else window.location.href = href;
    }, 300);
  };

  const pillCls = "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? "bg-[hsl(200_80%_18%/0.95)] backdrop-blur-xl shadow-lg"
        : "bg-transparent"
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          <a href="#home" className="flex items-center gap-2.5 group">
            <div className="relative">
              <img
                src={logoSrc}
                alt="Logo"
                width={44}
                height={44}
                className="w-10 h-10 md:w-11 md:h-11 object-contain rounded-full bg-white ring-2 ring-white/20 transition-all group-hover:ring-white/40"
                fetchPriority="low"
                decoding="async"
                loading="eager"
              />
            </div>
            <span className="text-white text-sm md:text-base font-semibold leading-tight tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
              {companyName}
            </span>
          </a>

          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="nav-link py-1">{link.name}</a>
            ))}
            <div className="w-px h-5 bg-white/15" />
            {externalLink.url && (
              <a href={externalLink.url} target="_blank" rel="noopener noreferrer"
                className={`${pillCls} bg-white/10 text-white hover:bg-white/20 border border-white/10`}>
                {externalLink.name}
              </a>
            )}
            {isAdmin && (
              <a href="/admin" className={`${pillCls} text-white border border-white/10`} style={{ background: 'hsl(var(--secondary) / 0.2)' }}>
                <Shield className="w-3.5 h-3.5" /> Admin
              </a>
            )}
            {user ? (
              <button onClick={handleLogout} className={`${pillCls} bg-white/10 text-white hover:bg-white/20 border border-white/10`}>
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            ) : (
              <a href="/auth" className={`${pillCls} text-white border border-white/10`} style={{ background: 'hsl(var(--secondary) / 0.15)' }}>
                <LogIn className="w-3.5 h-3.5" /> Login
              </a>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="lg:hidden text-white p-2" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[hsl(200_80%_15%/0.98)] backdrop-blur-xl border-t border-white/5"
          >
            <div className="container mx-auto px-4 py-5 flex flex-col gap-3">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} className="nav-link py-2 text-base" onClick={(e) => handleMobileNavClick(e, link.href)}>
                  {link.name}
                </a>
              ))}
              <div className="h-px bg-white/10 my-1" />
              {externalLink.url && (
                <a href={externalLink.url} target="_blank" rel="noopener noreferrer"
                  className="bg-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-medium text-center border border-white/10">
                  {externalLink.name}
                </a>
              )}
              {isAdmin && (
                <a href="/admin" onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white border border-white/10"
                  style={{ background: 'hsl(var(--secondary) / 0.2)' }}>
                  <Shield className="w-4 h-4" /> Admin
                </a>
              )}
              {user ? (
                <button onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="flex items-center justify-center gap-2 bg-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-medium border border-white/10">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              ) : (
                <a href="/auth" onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white border border-white/10"
                  style={{ background: 'hsl(var(--secondary) / 0.15)' }}>
                  <LogIn className="w-4 h-4" /> Login
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
