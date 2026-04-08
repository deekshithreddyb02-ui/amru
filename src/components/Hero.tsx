import { motion } from "framer-motion";
import { ArrowRight, Droplets, Shield, Award } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useNoMotion } from "@/hooks/useNoMotion";
import { useAboutStats } from "@/hooks/useAboutStats";

const DEFAULT_BG = "https://images.timesproperty.com/blog/6313/A_Comprehensive_Guide_To_Rooftop_Rainwater_Harvesting.png";

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

const staticStats = [
  { icon: Award, labelKey: "years", label: "Years" },
  { icon: Shield, labelKey: "projects", label: "Projects" },
  { icon: Droplets, labelKey: "coverage", label: "Coverage" },
];

const Hero = () => {
  const { data } = useSiteContent("hero");
  const metadata = data?.metadata as { backgroundImage?: string; services?: string[] } | null;
  const title = data?.title || "Integrated Water & Environmental Solutions";
  const backgroundImage = metadata?.backgroundImage || DEFAULT_BG;
  const services = metadata?.services || defaultServices;
  const noMotion = useNoMotion();
  const { yearsExperience, projectsCompleted, serviceCoverage } = useAboutStats();

  const statsValues: Record<string, string> = {
    years: yearsExperience,
    projects: projectsCompleted,
    coverage: serviceCoverage,
  };
  const stats = staticStats.map((s) => ({ ...s, value: statsValues[s.labelKey] }));

  const m = (props: Record<string, unknown>) => noMotion ? {} : props;

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background */}
      <img
        src={backgroundImage}
        alt="Rooftop rainwater harvesting"
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full object-cover scale-105"
        fetchPriority="high"
        decoding="async"
      />
      <div className="absolute inset-0 hero-overlay" />

      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: 'hsl(42 90% 55%)' }} />
      <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full opacity-8 blur-3xl" style={{ background: 'hsl(168 55% 38%)' }} />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div
            {...m({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } })}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest bg-white/10 text-white/90 border border-white/15 backdrop-blur-sm">
              <Droplets className="w-3.5 h-3.5" style={{ color: 'hsl(42 90% 55%)' }} />
              Since 1990 — Trusted Nationwide
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...m({ initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay: 0.15 } })}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.08] mb-6 tracking-tight"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            {...m({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.3 } })}
            className="text-lg md:text-xl text-white/70 max-w-2xl mb-8 leading-relaxed"
          >
            Comprehensive water management, environmental consulting & sustainable solutions backed by 35+ years of expertise.
          </motion.p>

          {/* Services grid */}
          <motion.div
            {...m({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.4 } })}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-10"
          >
            {services.map((service, index) => (
              <motion.div
                key={service}
                {...m({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: 0.5 + index * 0.06 } })}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'hsl(42 90% 55%)' }} />
                <span className="text-xs md:text-sm text-white/85 font-medium">{service}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA + Stats row */}
          <motion.div
            {...m({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.6 } })}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
          >
            <a href="#services" className="btn-primary-hero inline-flex items-center gap-2 group">
              Explore Our Services
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>

            <div className="flex items-center gap-6">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <s.icon className="w-4 h-4 text-white/40" />
                  <div>
                    <div className="text-white font-bold text-sm">{s.value}</div>
                    <div className="text-white/50 text-xs">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator — hidden on mobile/tablet */}
      {!noMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1.5"
          >
            <div className="w-1 h-2.5 rounded-full bg-white/60" />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};

export default Hero;
