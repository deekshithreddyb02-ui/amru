import { motion } from "framer-motion";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";

const trustPoints = [
  "35+ Years of Expertise",
  "1000+ Projects Delivered",
  "Pan-India Coverage",
];

const Hero = () => {
  return (
    <section
      id="home"
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
    >
      {/* Background with gradient overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80')`,
          }}
        />
        <div className="hero-gradient absolute inset-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl">
          {/* Trust badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              ISO 9001:2015 Certified Company
            </span>
          </motion.div>

          {/* Main headline - benefit-driven */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-6"
          >
            Sustainable Water Solutions 
            <span className="block mt-2 text-white/90">
              That Save Resources & Costs
            </span>
          </motion.h1>

          {/* Subheading - impact focused */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/80 max-w-2xl mb-8 leading-relaxed"
          >
            From rainwater harvesting to environmental compliance, we help organizations 
            reduce water dependency, meet regulations, and build sustainable infrastructure.
          </motion.p>

          {/* Trust points */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 md:gap-6 mb-10"
          >
            {trustPoints.map((point) => (
              <span
                key={point}
                className="flex items-center gap-2 text-white/80 text-sm md:text-base"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                {point}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href="#contact"
              className="btn-primary text-base px-8 py-4 bg-white text-primary hover:bg-white/95"
            >
              Get Free Consultation
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#services"
              className="btn-secondary text-base px-8 py-4 bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <Play className="w-5 h-5" />
              Explore Services
            </a>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;