import { useState, useEffect } from "react";
import { MapPin, Globe, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-optimized.webp";

interface QuickLink {
  label: string;
  url: string;
  emoji: string;
}

interface FooterData {
  description: string;
  tagline_quote: string;
  head_office_label: string;
  head_office_address: string;
  locations_text: string;
  locations_subtext: string;
  email: string;
  website: string;
  phone_numbers: string[];
  help_email: string;
  help_website: string;
  quick_links: QuickLink[];
  tagline: string;
  version: string;
}

const defaultFooter: FooterData = {
  description: "Leading the World's Sustainable Water Revolution for over 35 years.",
  tagline_quote: '"Meeting the Challenge of Nature" - Not Just a Slogan, A Way of Life.',
  head_office_label: "Head Office:",
  head_office_address: "Off: 207, Bhoomi Allium, Kokane Chowk, Pimple Soudagar, Pune, Maharashtra-411027, INDIA",
  locations_text: "PUNE | MUMBAI | HYDERABAD | BANGALORE",
  locations_subtext: "INDIA & REST OF THE WORLD",
  email: "rain@amrutawater.com",
  website: "www.amrutawater.com",
  phone_numbers: ["+91-741-0030-418", "+91-741-0030-417"],
  help_email: "rain@amrutawater.com",
  help_website: "www.amrutawater.com",
  quick_links: [
    { label: "Simple Calculator", url: "https://rain.amrutageo.com/", emoji: "📊" },
    { label: "Expert Tool", url: "https://rain.amrutageo.com/", emoji: "🔮" },
    { label: "Project Dashboard", url: "https://rain.amrutageo.com/", emoji: "📁" },
    { label: "Login Portal", url: "https://rain.amrutageo.com/", emoji: "🔐" },
    { label: "JustDial", url: "https://www.justdial.com/", emoji: "📞" },
  ],
  tagline: "Start Now — Let Every Drop Count",
  version: "1.0.0.2601232241",
};

const Footer = () => {
  const year = new Date().getFullYear();
  const [footer, setFooter] = useState<FooterData>(defaultFooter);

  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("metadata")
          .eq("section_key", "footer")
          .single();

        if (!error && data?.metadata) {
          setFooter({ ...defaultFooter, ...(data.metadata as unknown as FooterData) });
        }
      } catch {
        // use defaults
      }
    };
    fetchFooter();
  }, []);

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
            <p className="text-background/80 text-sm mb-4">{footer.description}</p>
            <p className="text-background/70 text-sm italic mb-4">{footer.tagline_quote}</p>

            <div className="space-y-3 text-sm">
              <div>
                <p className="flex items-center gap-2 text-background/90 font-medium">
                  <MapPin className="w-4 h-4 text-red-400" /> {footer.head_office_label}
                </p>
                <p className="text-background/70 ml-6">{footer.head_office_address}</p>
              </div>

              <div>
                <p className="flex items-center gap-2 text-background/90 font-medium">
                  <Globe className="w-4 h-4 text-blue-400" /> Locations:
                </p>
                <p className="text-background/70 ml-6">
                  {footer.locations_text}<br />
                  {footer.locations_subtext}
                </p>
              </div>

              <div className="flex items-center gap-2 text-background/70">
                <Mail className="w-4 h-4 text-blue-400" />
                <a href={`mailto:${footer.email}`} className="hover:text-background transition-colors">{footer.email}</a>
              </div>

              <div className="flex items-center gap-2 text-background/70">
                <Globe className="w-4 h-4 text-blue-400" />
                <a href={`https://${footer.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-background transition-colors">{footer.website}</a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="pl-12">
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm text-background/70">
              {footer.quick_links.map((link, i) => (
                <li key={i}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-background transition-colors flex items-center gap-2">
                    <span>{link.emoji}</span> {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Get Expert Help */}
          <div className="pl-8">
            <h4 className="font-semibold mb-4">Get Expert Help</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="flex items-center gap-2 text-background/90">
                  <Phone className="w-4 h-4 text-green-400" /> Phone:
                </p>
                <p className="text-background/70 ml-6">
                  {footer.phone_numbers.map((phone, i) => (
                    <span key={i}>
                      <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="hover:text-background transition-colors">{phone}</a>
                      {i < footer.phone_numbers.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-2 text-background/90">
                  <Mail className="w-4 h-4 text-blue-400" /> Email:
                </p>
                <p className="text-background/70 ml-6">
                  <a href={`mailto:${footer.help_email}`} className="hover:text-background transition-colors">{footer.help_email}</a>
                </p>
              </div>

              <div>
                <p className="flex items-center gap-2 text-background/90">
                  <Globe className="w-4 h-4 text-blue-400" /> Website:
                </p>
                <p className="text-background/70 ml-6">
                  <a href={`https://${footer.help_website}`} target="_blank" rel="noopener noreferrer" className="hover:text-background transition-colors">{footer.help_website}</a>
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
            <span className="text-primary font-semibold">{footer.tagline}</span>
            <span>🌱</span>
          </p>
          <p className="text-xs text-background/50 mb-2">Version: {footer.version}</p>
          <p className="text-sm text-background/60">
            © {year} Amruta Integrated Water Solutions Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
