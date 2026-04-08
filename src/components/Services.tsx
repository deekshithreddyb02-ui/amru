import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import ServiceCard from "./ServiceCard";
import { supabase } from "@/integrations/supabase/client";
import { useNoMotion } from "@/hooks/useNoMotion";
import { useAboutStats } from "@/hooks/useAboutStats";

interface Service {
  id: string; title: string; description: string; detailed_description: string | null; image: string; link: string | null;
  is_main: boolean; is_main_tablet: boolean; is_main_mobile: boolean;
  display_order: number; display_order_tablet: number; display_order_mobile: number;
}

type DeviceType = "laptop" | "tablet" | "mobile";

const useDeviceType = (): DeviceType => {
  const [device, setDevice] = useState<DeviceType>("laptop");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 768) setDevice("mobile");
      else if (w < 1024) setDevice("tablet");
      else setDevice("laptop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return device;
};

const DEVICE_FIELDS: Record<DeviceType, { main: keyof Service; order: keyof Service }> = {
  laptop: { main: "is_main", order: "display_order" },
  tablet: { main: "is_main_tablet", order: "display_order_tablet" },
  mobile: { main: "is_main_mobile", order: "display_order_mobile" },
};

const Services = () => {
  const [showMore, setShowMore] = useState(false);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const device = useDeviceType();
  const noMotion = useNoMotion();
  const { yearsExperience } = useAboutStats();
  const m = (props: Record<string, unknown>) => noMotion ? {} : props;

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase.from("services").select("*").order("display_order");
      if (data) setAllServices(data as Service[]);
    };
    fetchServices();
  }, []);

  const { main: mainField, order: orderField } = DEVICE_FIELDS[device];
  const sorted = [...allServices].sort((a, b) => (a[orderField] as number) - (b[orderField] as number));
  const mainServices = sorted.filter((s) => s[mainField]);
  const extraServices = sorted.filter((s) => !s[mainField]);

  return (
    <section id="services" className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'var(--section-gradient-alt)' }}>
      <div className="container mx-auto px-4">
        <motion.div
          {...m({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })}
          className="text-center mb-14"
        >
          <div className="gold-accent mx-auto mb-6" />
          <h2 className="section-heading mb-4">Our Services</h2>
          <p className="section-subheading">
            Comprehensive water management and environmental consulting solutions backed by {yearsExperience} years of expertise.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {mainServices.map((service, index) => (
            <div key={service.id} className="w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.75rem)] lg:w-[calc(20%-0.85rem)]">
              <ServiceCard title={service.title} description={service.description} detailedDescription={service.detailed_description} image={service.image} link={service.link || undefined} delay={noMotion ? 0 : index * 0.08} />
            </div>
          ))}
        </div>

        <AnimatePresence>
          {showMore && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4 }} className="overflow-hidden">
              <div className="flex flex-wrap justify-center gap-4">
                {extraServices.map((service, index) => (
                  <div key={service.id} className="w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.75rem)] lg:w-[calc(20%-0.85rem)]">
                    <ServiceCard title={service.title} description={service.description} detailedDescription={service.detailed_description} image={service.image} link={service.link || undefined} delay={noMotion ? 0 : index * 0.04} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {extraServices.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowMore(!showMore)}
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              {showMore ? (
                <>Show Less <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" /></>
              ) : (
                <>Show More Services <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;
