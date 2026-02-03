import { motion } from "framer-motion";
import { Award, GraduationCap, BadgeCheck, Users } from "lucide-react";

const certifications = [
  {
    icon: Award,
    title: "ISO 9001:2015 Certified",
    subtitle: "Quality Management",
    description: "Internationally recognized quality standards ensuring consistent, reliable service delivery.",
  },
  {
    icon: GraduationCap,
    title: "IIT Bombay Certified Engineers",
    subtitle: "Technical Excellence",
    description: "Our engineers hold specialized certifications in rainwater harvesting from India's premier institution.",
  },
  {
    icon: BadgeCheck,
    title: "Maharashtra State Certified",
    subtitle: "Government Recognition",
    description: "Officially certified consultants for rainwater harvesting implementation and compliance.",
  },
  {
    icon: Users,
    title: "Indian Water Works Association",
    subtitle: "Industry Partnership",
    description: "Active member contributing to water management standards and best practices nationwide.",
  },
];

const Certifications = () => {
  return (
    <section id="certifications" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="section-divider mx-auto mb-6" />
          <h2 className="section-heading mb-4">Trusted Credentials</h2>
          <p className="section-subheading mx-auto">
            Our certifications and partnerships ensure you work with qualified, 
            recognized professionals.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {certifications.map((cert, index) => (
            <motion.div
              key={cert.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="modern-card p-6 md:p-8 flex gap-5"
            >
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 
                                flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <cert.icon className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                  {cert.subtitle}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {cert.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {cert.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Certifications;