import { MapPin, Globe, Mail, Phone } from "lucide-react";
import logo from "@/assets/logo-optimized.webp";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background py-10">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Amruta Logo" width={48} height={48} loading="lazy" className="w-12 h-12 object-contain rounded-full bg-white" />
              <span className="font-serif text-lg font-semibold leading-tight">
                Amruta Integrated Water Solutions Pvt. Ltd.
              </span>
            </div>
            <p className="text-background/80 text-sm mb-4">
              Leading the World's Sustainable Water Revolution for over 35 years.
            </p>
            <p className="text-background/70 text-sm italic mb-4">
              "Meeting the Challenge of Nature" - Not Just a Slogan, A Way of Life.
            </p>
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="flex items-center gap-2 text-background/90 font-medium">
                  <MapPin className="w-4 h-4 text-red-400" /> Head Office:
                </p>
                <p className="text-background/70 ml-6">
                  Off: 207, Bhoomi Allium, Kokane Chowk,<br />
                  Pimple Soudagar, Pune, Maharashtra-411027, INDIA
                </p>
              </div>
              
              <div>
                <p className="flex items-center gap-2 text-background/90 font-medium">
                  <Globe className="w-4 h-4 text-blue-400" /> Locations:
                </p>
                <p className="text-background/70 ml-6">
                  PUNE | MUMBAI | HYDERABAD | BANGALORE<br />
                  INDIA & REST OF THE WORLD
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-background/70">
                <Mail className="w-4 h-4 text-blue-400" />
                <a href="mailto:rain@amrutawater.com" className="hover:text-background transition-colors">
                  rain@amrutawater.com
                </a>
              </div>
              
              <div className="flex items-center gap-2 text-background/70">
                <Globe className="w-4 h-4 text-blue-400" />
                <a href="https://www.amrutawater.com" target="_blank" rel="noopener noreferrer" className="hover:text-background transition-colors">
                  www.amrutawater.com
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li>
                <a 
                  href="https://rain.amrutageo.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-background transition-colors flex items-center gap-2"
                >
                  <span>📊</span> Simple Calculator
                </a>
              </li>
              <li>
                <a 
                  href="https://rain.amrutageo.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-background transition-colors flex items-center gap-2"
                >
                  <span>🔮</span> Expert Tool
                </a>
              </li>
              <li>
                <a 
                  href="https://rain.amrutageo.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-background transition-colors flex items-center gap-2"
                >
                  <span>📁</span> Project Dashboard
                </a>
              </li>
              <li>
                <a 
                  href="https://rain.amrutageo.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-background transition-colors flex items-center gap-2"
                >
                  <span>🔐</span> Login Portal
                </a>
              </li>
              <li>
                <a 
                  href="https://www.justdial.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-background transition-colors flex items-center gap-2"
                >
                  <span>📞</span> JustDial
                </a>
              </li>
            </ul>
          </div>

          {/* Get Expert Help */}
          <div>
            <h4 className="font-semibold mb-4">Get Expert Help</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="flex items-center gap-2 text-background/90">
                  <Phone className="w-4 h-4 text-green-400" /> Phone:
                </p>
                <p className="text-background/70 ml-6">
                  <a href="tel:+917410030418" className="hover:text-background transition-colors">+91-741-0030-418</a><br />
                  <a href="tel:+917410030417" className="hover:text-background transition-colors">+91-741-0030-417</a>
                </p>
              </div>
              
              <div>
                <p className="flex items-center gap-2 text-background/90">
                  <Mail className="w-4 h-4 text-blue-400" /> Email:
                </p>
                <p className="text-background/70 ml-6">
                  <a href="mailto:rain@amrutawater.com" className="hover:text-background transition-colors">rain@amrutawater.com</a>
                </p>
              </div>
              
              <div>
                <p className="flex items-center gap-2 text-background/90">
                  <Globe className="w-4 h-4 text-blue-400" /> Website:
                </p>
                <p className="text-background/70 ml-6">
                  <a href="https://www.amrutawater.com" target="_blank" rel="noopener noreferrer" className="hover:text-background transition-colors">www.amrutawater.com</a>
                </p>
              </div>
              
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="border-t border-background/20 pt-6 text-center">
          <p className="flex items-center justify-center gap-2 text-lg mb-3">
            <span>💧</span>
            <span>📂</span>
            <span className="text-primary font-semibold">Start Now — Let Every Drop Count</span>
            <span>🌱</span>
          </p>
          <p className="text-xs text-background/50 mb-2">Version: 1.0.0.2601232241</p>
          <p className="text-sm text-background/60">
            © {year} Amruta Integrated Water Solutions Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
