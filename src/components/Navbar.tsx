import { useState, useEffect } from "react";
import { Menu, X, LogIn, LogOut, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useAdmin } from "@/hooks/useAdmin";
import logo from "@/assets/logo-optimized.webp";

const navLinks = [
  { name: "Services", href: "#services" },
  { name: "About", href: "#about" },
  { name: "Why Us", href: "#why" },
  { name: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-primary/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-3">
            <img
              src={logo}
              alt="Amruta Logo"
              width={48}
              height={48}
              className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-full bg-white p-0.5"
              fetchPriority="high"
              decoding="async"
            />
            <div className="hidden sm:block">
              <span className="text-white font-bold text-base md:text-lg leading-tight block">
                Amruta Water Solutions
              </span>
              <span className="text-white/60 text-xs">Since 1990</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="nav-link px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {link.name}
              </a>
            ))}
            
            <div className="w-px h-6 bg-white/20 mx-2" />
            
            {isAdmin && (
              <a
                href="/admin"
                className="flex items-center gap-2 text-white/80 hover:text-white px-4 py-2 rounded-lg 
                           hover:bg-white/10 transition-colors text-sm font-medium"
              >
                <Shield className="w-4 h-4" />
                Admin
              </a>
            )}
            
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-white/80 hover:text-white px-4 py-2 
                           rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <a
                href="/auth"
                className="flex items-center gap-2 text-white/80 hover:text-white px-4 py-2 
                           rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
              >
                <LogIn className="w-4 h-4" />
                Login
              </a>
            )}

            <a
              href="#contact"
              className="ml-2 bg-white text-primary font-semibold px-5 py-2.5 rounded-lg 
                         hover:bg-white/95 transition-colors text-sm"
            >
              Get Quote
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
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
            <div className="container mx-auto px-4 py-6 flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="nav-link py-3 px-4 rounded-lg hover:bg-white/10"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              
              <div className="h-px bg-white/10 my-2" />
              
              {isAdmin && (
                <a
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-white/80 py-3 px-4 rounded-lg hover:bg-white/10"
                >
                  <Shield className="w-4 h-4" />
                  Admin Dashboard
                </a>
              )}
              
              {user ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 text-white/80 py-3 px-4 rounded-lg hover:bg-white/10 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              ) : (
                <a
                  href="/auth"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-white/80 py-3 px-4 rounded-lg hover:bg-white/10"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </a>
              )}

              <a
                href="#contact"
                onClick={() => setIsOpen(false)}
                className="mt-2 bg-white text-primary font-semibold py-3 px-4 rounded-lg text-center"
              >
                Get Free Quote
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;