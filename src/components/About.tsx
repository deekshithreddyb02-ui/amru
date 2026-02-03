import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const highlights = [
  "ISO 9001:2015 certified quality management systems",
  "IIT Bombay certified engineers for rainwater harvesting",
  "Trusted by 1000+ commercial and industrial clients",
  "Full lifecycle support from survey to implementation",
  "Government-recognized CGWB compliance consultants",
  "Integrated solutions across water, environment & energy",
];

const About = () => {
  return (
    <section id="about" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="section-divider mb-6" />
            <h2 className="section-heading mb-6">
              India's Trusted Water <br className="hidden md:block" />
              Management Partner
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Since 1990, we've helped organizations across India implement sustainable 
              water solutions. Our expertise spans from ground water surveys to zero 
              liquid discharge systems, backed by certified engineers and proven methodologies.
            </p>

            {/* Highlights as scannable list */}
            <ul className="space-y-4">
              {highlights.map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Visual - Image or illustration */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80"
                alt="Water management infrastructure"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {/* Floating stat card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="absolute -bottom-6 -left-6 md:-left-8 bg-white rounded-2xl p-6 shadow-lg border border-border/50"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary mb-1">35+</div>
              <div className="text-sm text-muted-foreground font-medium">Years of Excellence</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;