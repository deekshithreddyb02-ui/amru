import { useState } from "react";
import { Menu, X, Droplets } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "Services", href: "#services" },
  { name: "About Us", href: "#about" },
  { name: "Why Us", href: "#why" },
  { name: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12 md:h-14">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2">
            <Droplets className="w-8 h-8 text-white" />
            <span className="text-white font-serif text-lg md:text-xl font-semibold">
              Amruta Geo
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="nav-link">
                {link.name}
              </a>
            ))}
            <a
              href="https://rain.amrutageo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              RWH SW HFL PMS
            </a>
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
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <a
                href="https://rain.amrutageo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium text-center"
              >
                RWH SW HFL PMS
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
