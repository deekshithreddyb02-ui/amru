import { MapPin, Phone, Mail, ExternalLink } from "lucide-react";
import logo from "@/assets/logo-optimized.webp";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <img
                src={logo}
                alt="Amruta Logo"
                width={48}
                height={48}
                loading="lazy"
                className="w-12 h-12 object-contain rounded-full bg-white p-0.5"
              />
              <div>
                <span className="font-bold text-lg block">Amruta Water Solutions</span>
                <span className="text-background/60 text-sm">Since 1990</span>
              </div>
            </div>
            <p className="text-background/70 text-sm leading-relaxed mb-6">
              India's trusted partner for sustainable water management, 
              environmental consulting, and infrastructure solutions.
            </p>
            <p className="text-background/50 text-sm italic">
              "Meeting the Challenge of Nature"
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-5">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#services" className="text-background/70 hover:text-background transition-colors">
                  Our Services
                </a>
              </li>
              <li>
                <a href="#about" className="text-background/70 hover:text-background transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#certifications" className="text-background/70 hover:text-background transition-colors">
                  Certifications
                </a>
              </li>
              <li>
                <a href="#contact" className="text-background/70 hover:text-background transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="https://rain.amrutageo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-background/70 hover:text-background transition-colors inline-flex items-center gap-1"
                >
                  RWH Design Platform
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-lg mb-5">Services</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li>Rainwater Harvesting</li>
              <li>Ground Water Survey</li>
              <li>STP & ETP Solutions</li>
              <li>EC & MEP Consulting</li>
              <li>Water Audit & Net Zero</li>
              <li>CGWB Registration</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-5">Contact Us</h4>
            <div className="space-y-4 text-sm">
              <a
                href="tel:+917410030418"
                className="flex items-center gap-3 text-background/70 hover:text-background transition-colors"
              >
                <Phone className="w-4 h-4" />
                +91-741-0030-418
              </a>
              <a
                href="mailto:rain@amrutawater.com"
                className="flex items-center gap-3 text-background/70 hover:text-background transition-colors"
              >
                <Mail className="w-4 h-4" />
                rain@amrutawater.com
              </a>
              <div className="flex items-start gap-3 text-background/70">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Pune • Mumbai • Hyderabad • Bangalore
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-background/50">
              © {year} Amruta Integrated Water Solutions Pvt. Ltd. All rights reserved.
            </p>
            <p className="text-sm text-background/50">
              ISO 9001:2015 Certified
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;