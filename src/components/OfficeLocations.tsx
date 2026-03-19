import { useState, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNoMotion } from "@/hooks/useNoMotion";

const OfficeMap = lazy(() => import("@/components/OfficeMap"));

interface Office { city: string; address: string; label?: string; lat?: number; lng?: number; phone?: string; whatsapp?: string; }

const defaultOffices: Office[] = [
  { city: "Pune", address: "301, Fortuna Business Park, Shivar Chowk, Pimple Saudagar, Pimpri Chinchwad, Pune, Maharashtra - 411061" },
  { city: "Hyderabad", address: "Head Office - Hyderabad, Telangana" },
  { city: "Mumbai", address: "Branch Office - Mumbai, Maharashtra" },
  { city: "Bangalore", address: "Branch Office - Bangalore, Karnataka" },
];

const OfficeLocations = () => {
  const [offices, setOffices] = useState<Office[]>(defaultOffices);
  const [companyName, setCompanyName] = useState("Amruta Integrated Water Solutions Pvt. Ltd.");
  const [popupBgColor, setPopupBgColor] = useState<string | undefined>();
  const [popupTextColor, setPopupTextColor] = useState<string | undefined>();
  const noMotion = useNoMotion();
  const m = (props: Record<string, unknown>) => noMotion ? {} : props;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [officesRes, navbarRes] = await Promise.all([
          supabase.from("site_content").select("metadata").eq("section_key", "offices").single(),
          supabase.from("site_content").select("metadata").eq("section_key", "navbar").single(),
        ]);
        if (!officesRes.error && officesRes.data) {
          const meta = officesRes.data.metadata as Record<string, unknown>;
          if (Array.isArray(meta?.offices) && (meta.offices as Office[]).length > 0) setOffices(meta.offices as Office[]);
          if (meta?.popupBgColor) setPopupBgColor(meta.popupBgColor as string);
          if (meta?.popupTextColor) setPopupTextColor(meta.popupTextColor as string);
        }
        if (!navbarRes.error && navbarRes.data) {
          const meta = navbarRes.data.metadata as Record<string, unknown>;
          if (meta?.company_name) setCompanyName(meta.company_name as string);
        }
      } catch { /* defaults */ }
    };
    fetchData();
  }, []);

  const officesWithCoords = offices.filter(o => typeof o.lat === "number" && typeof o.lng === "number");
  if (officesWithCoords.length === 0) return null;

  return (
    <section id="office-locations" className="relative py-20 md:py-28 overflow-hidden bg-background">
      <div className="container mx-auto px-4">
        <motion.div {...m({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })} className="text-center mb-14">
          <div className="gold-accent mx-auto mb-6" />
          <h2 className="section-heading mb-4">Office Locations</h2>
          <p className="section-subheading">Find us at our offices across India.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          {officesWithCoords.map((office, i) => (
            <motion.div
              key={office.city}
              {...m({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: i * 0.1 } })}
              className="bg-card rounded-2xl border border-border overflow-hidden"
              style={{ boxShadow: 'var(--card-shadow)' }}
            >
              <div className="relative">
                <Suspense fallback={<div className="h-[250px] bg-muted animate-pulse rounded-t-2xl" />}>
                  <OfficeMap office={office} height="250px" companyName={companyName} popupBgColor={popupBgColor} popupTextColor={popupTextColor} />
                </Suspense>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${office.lat},${office.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 text-white"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(200 60% 35%))', boxShadow: '0 4px 12px hsl(var(--primary) / 0.3)' }}
                >
                  Get Direction <MapPin className="w-4 h-4" />
                </a>
              </div>
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'hsl(var(--primary) / 0.08)' }}>
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>{office.city}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{office.address}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OfficeLocations;
