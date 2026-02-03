import { motion } from "framer-motion";
import { 
  Clock, 
  ShieldCheck, 
  Handshake, 
  Microscope, 
  Award,
  Headphones
} from "lucide-react";

const reasons = [
  {
    icon: Award,
    title: "Proven Track Record",
    description: "35+ years and 1000+ successful projects across residential, commercial, and industrial sectors.",
  },
  {
    icon: Microscope,
    title: "Research-Backed Methods",
    description: "We use geophysical surveys, AI-powered analysis, and IIT-certified methodologies for accurate results.",
  },
  {
    icon: ShieldCheck,
    title: "Full Compliance Guaranteed",
    description: "From CGWB registration to environmental clearances, we handle all regulatory requirements.",
  },
  {
    icon: Clock,
    title: "On-Time Delivery",
    description: "Project timelines you can count on, with transparent progress updates at every stage.",
  },
  {
    icon: Handshake,
    title: "End-to-End Partnership",
    description: "From initial survey to final implementation and maintenance — we're with you throughout.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description: "Single point of contact for all your queries with rapid response times.",
  },
];

const WhyUs = () => {
  return (
    <section id="why" className="py-20 md:py-28 bg-primary">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="w-16 h-1 bg-white/30 rounded-full mx-auto mb-6" />
          <h2 className="section-heading text-white mb-4">Why Partner With Us</h2>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
            We deliver results, not just reports. Here's what sets us apart.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10 
                         hover:bg-white/10 transition-colors duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-5">
                <reason.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-3">
                {reason.title}
              </h3>
              <p className="text-white/70 text-sm md:text-base leading-relaxed">
                {reason.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUs;