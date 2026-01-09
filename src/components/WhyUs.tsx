import { motion } from "framer-motion";
import { Users, Lightbulb, Search, Shield, Clock, HeartHandshake } from "lucide-react";

const reasons = [
  {
    icon: Users,
    title: "Expert Team",
    description: "Experienced experts and committed professionals with decades of industry knowledge.",
  },
  {
    icon: Lightbulb,
    title: "Quality Solutions",
    description: "Qualitative, efficient, and cost-effective solutions tailored to your needs.",
  },
  {
    icon: Search,
    title: "Research-Backed",
    description: "Detailed, research-backed technological surveys for accurate results.",
  },
  {
    icon: Shield,
    title: "Compliance Assured",
    description: "Full regulatory compliance with CGWB, environmental, and building codes.",
  },
  {
    icon: Clock,
    title: "Timely Delivery",
    description: "On-time project completion with transparent progress updates.",
  },
  {
    icon: HeartHandshake,
    title: "Client Focused",
    description: "Absolute client satisfaction with personalized service and support.",
  },
];

const WhyUs = () => {
  return (
    <section id="why" className="py-12 md:py-16 bg-primary">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="section-heading text-white mb-4">Why Choose Us</h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Trusted by hundreds of clients across India for our expertise, 
            reliability, and commitment to excellence.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 hover:bg-white/15 transition-colors"
            >
              <reason.icon className="w-10 h-10 text-secondary mb-4" />
              <h3 className="font-serif font-semibold text-lg text-white mb-2">
                {reason.title}
              </h3>
              <p className="text-white/70 text-sm">{reason.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUs;
