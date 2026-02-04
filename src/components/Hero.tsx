import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Play } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";

const defaultStats = [
  "35+ Years of Expertise",
  "1000+ Projects Delivered",
  "Pan-India Coverage",
];

const Hero = () => {
  const { data, loading } = useSiteContent("hero");

  const metadata = data?.metadata as { 
    backgroundImage?: string; 
    stats?: string[];
    description?: string;
    certificationBadge?: string;
  } | null;
  
  const title = data?.title || "Sustainable Water Solutions That Save Resources & Costs";
  const description = metadata?.description || "From rainwater harvesting to environmental compliance, we help organizations reduce water dependency, meet regulations, and build sustainable infrastructure.";
  const backgroundImage = metadata?.backgroundImage || "https://images.timesproperty.com/blog/6313/A_Comprehensive_Guide_To_Rooftop_Rainwater_Harvesting.png";
  const stats = metadata?.stats || defaultStats;
  const certificationBadge = metadata?.certificationBadge || "ISO 9001:2015 Certified Company";

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center pt-16"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${backgroundImage}')`,
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-primary/70" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          {/* Certification Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6"
          >
            <CheckCircle className="w-4 h-4 text-secondary" />
            <span className="text-sm text-white font-medium">{certificationBadge}</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-6"
          >
            {title}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-white/80 leading-relaxed mb-8 max-w-xl"
          >
            {description}
          </motion.p>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-x-6 gap-y-2 mb-10"
          >
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-2 text-white/90">
                <span className="w-2 h-2 bg-secondary rounded-full flex-shrink-0" />
                <span className="text-sm md:text-base">{stat}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap gap-4"
          >
            <a
              href="#contact"
              className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-lg hover:bg-white/90 transition-colors"
            >
              Get Free Consultation
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#services"
              className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Play className="w-5 h-5" />
              Explore Services
            </a>
          </motion.div>
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
