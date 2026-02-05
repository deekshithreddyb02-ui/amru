import { useState, useEffect } from "react";
import { Menu, X, LogIn, LogOut, Shield, User as UserIcon, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useAdmin } from "@/hooks/useAdmin";
import logo from "@/assets/logo-optimized.webp";

const navLinks = [
   { name: "Home", href: "/" },
  { name: "Services", href: "#services" },
  { name: "About", href: "#about" },
  { name: "Why Us", href: "#why" },
  { name: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { isAdmin } = useAdmin();

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

  // Extract user display name from email or metadata
  const getUserDisplayName = () => {
    if (!user) return "";
    const metadata = user.user_metadata;
    if (metadata?.full_name) return metadata.full_name;
    if (metadata?.name) return metadata.name;
    // Extract name from email (before @)
    const emailName = user.email?.split("@")[0] || "";
    // Capitalize first letter of each word
    return emailName.split(/[._-]/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="Amruta Logo" 
              width={48}
              height={48}
              className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-full bg-white"
              fetchPriority="high"
              decoding="async"
            />
            <div className="flex flex-col">
              <span className="text-white font-serif text-sm md:text-base font-bold leading-tight uppercase tracking-wide">
                Amruta Water Solutions
              </span>
              <span className="text-white/70 text-xs hidden sm:block">
                35+ Years of Excellence
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Nav Links - only show when NOT logged in */}
            {!user && (
              <>
                {navLinks.map((link) => (
                  <a key={link.name} href={link.href} className="nav-link">
                    {link.name}
                  </a>
                ))}
              </>
            )}

            {user ? (
              <>
                {/* Welcome message */}
                <div className="text-right mr-2">
                  <div className="text-white text-sm font-medium">
                    Welcome, {getUserDisplayName()}
                  </div>
                  <div className="text-white/70 text-xs">
                    {user.email}
                  </div>
                </div>

                {/* Action Buttons */}
                <a
                  href="/profile"
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  Profile
                </a>

                <a
                   href="/dashboard"
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  My Projects
                </a>

                {isAdmin && (
                  <a
                    href="/admin"
                    className="flex items-center gap-2 bg-accent/80 hover:bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </a>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                 <a
                   href="/auth"
                   className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                 >
                   <LogIn className="w-4 h-4" />
                   Login
                 </a>
                {isAdmin && (
                  <a
                    href="/admin"
                    className="flex items-center gap-2 bg-accent/80 hover:bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </a>
                )}
                <a
                  href="#contact"
                  className="flex items-center gap-2 bg-white text-primary px-5 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-white/90"
                >
                  Get Quote
                </a>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-white p-2"
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
            className="lg:hidden bg-primary border-t border-white/10"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              {user && (
                <div className="text-center py-2 border-b border-white/10 mb-2">
                  <div className="text-white text-sm font-medium">
                    Welcome, {getUserDisplayName()}
                  </div>
                  <div className="text-white/70 text-xs">
                    {user.email}
                  </div>
                </div>
              )}

              {!user && navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="nav-link py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}

              {user ? (
                <>
                  <a
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </a>

                  <a
                     href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    <FolderOpen className="w-4 h-4" />
                    My Projects
                  </a>

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

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                   <a
                     href="/auth"
                     onClick={() => setIsOpen(false)}
                     className="flex items-center justify-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium"
                   >
                     <LogIn className="w-4 h-4" />
                     Login
                   </a>
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
                  <a
                    href="#contact"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 bg-white text-primary px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Get Quote
                  </a>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
