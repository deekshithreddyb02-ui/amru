import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Home, LogOut } from "lucide-react";
import defaultLogo from "@/assets/logo-small.webp";

interface BrandingMeta {
  primary_logo?: string;
  company_name?: string;
}

const DEFAULT_COMPANY_NAME = "Amruta HydroGeo Services";

const AdminHeader = () => {
  const navigate = useNavigate();
  const [logo, setLogo] = useState(defaultLogo);
  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY_NAME);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const { data } = await supabase
          .from("site_content")
          .select("metadata")
          .eq("section_key", "branding")
          .maybeSingle();

        if (data?.metadata) {
          const meta = data.metadata as unknown as BrandingMeta;
          if (meta.primary_logo) setLogo(meta.primary_logo);
          if (meta.company_name) setCompanyName(meta.company_name);
        }
      } catch {
        // fallback to defaults
      }
    };
    fetchBranding();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt={companyName}
            className="w-10 h-10 object-contain rounded-full bg-white/10 p-0.5 cursor-pointer"
            onClick={() => navigate("/")}
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultLogo;
            }}
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight truncate max-w-[200px] md:max-w-none">
              {companyName}
            </span>
            <span className="text-xs text-primary-foreground/70">Admin Dashboard</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate("/")}>
            <Home className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Home</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10">
            <LogOut className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
