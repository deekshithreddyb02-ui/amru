import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";

const defaultServices = [
  "EC Consulting Services",
  "Ground Water Survey",
  "Geo-Technical Services",
  "Rainwater Harvesting",
  "GPR & Thermal Scanning",
  "STP, ETP & WTP",
  "Energy Saving Solutions",
  "CGWB Registration Services",
];

const Hero = () => {
  const { data, loading } = useSiteContent("hero");

  const metadata = data?.metadata as { backgroundImage?: string; services?: string[] } | null;
  const title = data?.title || "Integrated Water & Environmental Solutions";
  const backgroundImage = metadata?.backgroundImage || "https://images.timesproperty.com/blog/6313/A_Comprehensive_Guide_To_Rooftop_Rainwater_Harvesting.png";
  const services = metadata?.services || defaultServices;

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center pt-16"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${backgroundImage}')`,
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 hero-overlay" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-8"
          >
            {title}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10"
          >
            {services.map((service, index) => (
              <motion.div
                key={service}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-2 text-white/90"
              >
                <span className="w-2 h-2 bg-secondary rounded-full flex-shrink-0" />
                <span className="text-sm md:text-base">{service}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.a
            href="#services"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="btn-primary-hero inline-flex items-center gap-2"
          >
            Our Services
            <ArrowRight className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-1"
        >
          <div className="w-1.5 h-3 bg-white/70 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
