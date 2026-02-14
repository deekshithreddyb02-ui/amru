import { useState, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const OfficeMap = lazy(() => import("@/components/OfficeMap"));

interface Office {
  city: string;
  address: string;
  lat?: number;
  lng?: number;
  phone?: string;
  whatsapp?: string;
}

const defaultOffices: Office[] = [
  { city: "Pune", address: "301, Fortuna Business Park, Shivar Chowk, Pimple Saudagar, Pimpri Chinchwad, Pune, Maharashtra - 411061" },
  { city: "Hyderabad", address: "Head Office - Hyderabad, Telangana" },
  { city: "Mumbai", address: "Branch Office - Mumbai, Maharashtra" },
  { city: "Bangalore", address: "Branch Office - Bangalore, Karnataka" },
];

const OfficeLocations = () => {
  const [offices, setOffices] = useState<Office[]>(defaultOffices);

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("metadata")
          .eq("section_key", "offices")
          .single();

        if (!error && data) {
          const meta = data.metadata as Record<string, any>;
          if (meta?.offices?.length > 0) {
            setOffices(meta.offices);
          }
        }
      } catch {
        // Use defaults
      }
    };
    fetchOffices();
  }, []);

  const officesWithCoords = offices.filter(
    (o) => typeof o.lat === "number" && typeof o.lng === "number"
  );

  if (officesWithCoords.length === 0) return null;

  return (
    <section id="office-locations" className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="section-heading mb-4">Office Locations</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find us at our offices across India.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          {officesWithCoords.map((office, i) => (
            <motion.div
              key={office.city}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <Suspense fallback={<div className="h-[250px] bg-muted animate-pulse" />}>
                <OfficeMap office={office} height="250px" />
              </Suspense>
              <div className="p-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">{office.city}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{office.address}</p>
                    {office.phone && (
                      <a
                        href={`tel:${office.phone.replace(/[^+\d]/g, "")}`}
                        className="text-sm text-primary hover:underline mt-1 inline-block"
                      >
                        📞 {office.phone}
                      </a>
                    )}
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
