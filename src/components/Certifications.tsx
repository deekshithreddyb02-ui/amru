import { motion } from "framer-motion";
import { Award, GraduationCap, BadgeCheck, Users } from "lucide-react";

const certifications = [
  {
    icon: Award,
    title: "ISO 1901: 2015 Certified Company",
    description: "ISO Certified Company, We follow the Global Compliance and Standards in the Business process - EURO Global Certified Company.",
  },
  {
    icon: GraduationCap,
    title: "Certified Engineers from IIT Bombay",
    subtitle: "in Water Sustenance and Rainwater Harvesting",
    description: "We have Certified Engineers in Rainwater Harvesting from IIT (INDIAN INSTITUTE OF TECHNOLOGY) Bombay.",
  },
  {
    icon: BadgeCheck,
    title: "Certified from State Govt of Maharashtra",
    description: "We have the Qualified and Certified Engineers in Rainwater Harvesting Implementation and Practices.",
  },
  {
    icon: Users,
    title: "Association with Indian Water Works",
    description: "Amruta Ground Water Discovery is Associated with Indian Water Works.",
  },
];

const Certifications = () => {
  return (
    <section id="certifications" className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="section-heading mb-4">Certifications, Associations & Partnerships</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Save time and money with our best Service prices, deals and offers.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          {certifications.map((cert, index) => (
            <motion.div
              key={cert.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-card p-6 rounded-xl border border-border flex gap-4 items-start hover:shadow-lg transition-shadow"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                <cert.icon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif font-semibold text-lg text-foreground mb-1">
                  {cert.title}
                </h3>
                {cert.subtitle && (
                  <p className="text-primary font-medium text-sm mb-2">{cert.subtitle}</p>
                )}
                <p className="text-muted-foreground text-sm">{cert.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Certifications;
