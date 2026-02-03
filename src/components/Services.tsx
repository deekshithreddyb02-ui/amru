import { motion } from "framer-motion";
import { 
  Droplets, 
  Search, 
  Leaf, 
  Building2, 
  Gauge, 
  FileCheck,
  ArrowRight
} from "lucide-react";

const services = [
  {
    icon: Droplets,
    title: "Rainwater Harvesting",
    benefit: "Reduce water bills by up to 40% with intelligent capture systems",
    href: "#contact",
  },
  {
    icon: Search,
    title: "Ground Water Survey",
    benefit: "Locate water sources accurately with advanced geophysical methods",
    href: "#contact",
  },
  {
    icon: Leaf,
    title: "STP & ETP Solutions",
    benefit: "Achieve zero liquid discharge and meet all compliance standards",
    href: "#contact",
  },
  {
    icon: Building2,
    title: "EC & MEP Consulting",
    benefit: "Fast-track environmental clearances for your projects",
    href: "#contact",
  },
  {
    icon: Gauge,
    title: "Water Audit & Net Zero",
    benefit: "Identify savings and optimize water usage across operations",
    href: "#contact",
  },
  {
    icon: FileCheck,
    title: "CGWB Registration",
    benefit: "Complete compliance support for ground water regulations",
    href: "#contact",
  },
];

const Services = () => {
  return (
    <section id="services" className="py-20 md:py-28 bg-background">
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
          <h2 className="section-heading mb-4">What We Do</h2>
          <p className="section-subheading mx-auto">
            End-to-end water management solutions designed to reduce costs, 
            ensure compliance, and build sustainable infrastructure.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.map((service, index) => (
            <motion.a
              key={service.title}
              href={service.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group modern-card p-6 md:p-8 cursor-pointer"
            >
              <div className="service-icon-wrapper">
                <service.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-4">
                {service.benefit}
              </p>
              <span className="inline-flex items-center gap-1 text-primary font-medium text-sm group-hover:gap-2 transition-all">
                Learn more
                <ArrowRight className="w-4 h-4" />
              </span>
            </motion.a>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <a
            href="https://rain.amrutageo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Access RWH Design Platform
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Services;