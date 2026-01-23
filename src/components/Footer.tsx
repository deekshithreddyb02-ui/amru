import { Droplets } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background py-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Droplets className="w-7 h-7" />
              <span className="font-serif text-lg font-semibold">
                Amruta Integrated Water Solutions
              </span>
            </div>
            <p className="text-background/70 text-sm">
              35+ years of expertise in water management, environmental consulting, 
              and geo-technical services across India.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-background/70">
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
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Key Services</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li>Rainwater Harvesting</li>
              <li>Ground Water Survey</li>
              <li>EC & MEP Consulting</li>
              <li>STP & ETP Solutions</li>
              <li>CGWB Registration</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 text-center text-sm text-background/60">
          <p>© {year} Amruta Integrated Water Solutions Pvt. Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
