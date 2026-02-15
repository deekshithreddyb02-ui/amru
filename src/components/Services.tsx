import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import ServiceCard from "./ServiceCard";
import { supabase } from "@/integrations/supabase/client";

interface Service {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string | null;
  is_main: boolean;
  display_order: number;
}

const Services = () => {
  const [showMore, setShowMore] = useState(false);
  const [mainServices, setMainServices] = useState<Service[]>([]);
  const [extraServices, setExtraServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from("services")
        .select("*")
        .order("display_order");

      if (data) {
        setMainServices(data.filter((s) => s.is_main));
        setExtraServices(data.filter((s) => !s.is_main));
      }
    };
    fetchServices();
  }, []);

  return (
    <section id="services" className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="section-heading mb-4">Our Services</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive water management and environmental consulting solutions
            backed by 35 years of expertise.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {mainServices.map((service, index) => (
            <div key={service.id} className="w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.75rem)] lg:w-[calc(16.666%-0.85rem)]">
              <ServiceCard
                title={service.title}
                description={service.description}
                image={service.image}
                link={service.link || undefined}
                delay={index * 0.1}
              />
            </div>
          ))}
        </div>

        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap justify-center gap-4">
                {extraServices.map((service, index) => (
                  <div key={service.id} className="w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.75rem)] lg:w-[calc(16.666%-0.85rem)]">
                    <ServiceCard
                      title={service.title}
                      description={service.description}
                      image={service.image}
                      link={service.link || undefined}
                      delay={index * 0.05}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {extraServices.length > 0 && (
          <div className="text-center mt-6">
            <button
              onClick={() => setShowMore(!showMore)}
              className="inline-flex items-center gap-2 text-primary font-medium hover:text-secondary transition-colors"
            >
              {showMore ? (
                <>
                  Show Less <ChevronUp className="w-5 h-5" />
                </>
              ) : (
                <>
                  Show More Services <ChevronDown className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;
