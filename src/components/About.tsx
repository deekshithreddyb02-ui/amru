import { motion } from "framer-motion";
import { Building2, Users, Award, MapPin } from "lucide-react";

const stats = [
  { icon: Award, value: "35+", label: "Years Experience" },
  { icon: Building2, value: "4", label: "Office Locations" },
  { icon: Users, value: "1000+", label: "Projects Completed" },
  { icon: MapPin, value: "Pan India", label: "Service Coverage" },
];

const About = () => {
  return (
    <section id="about" className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-heading mb-6 text-center">About Us</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Established in <strong className="text-foreground">1990</strong> at Hyderabad, 
                and extended services to Pune, Mumbai, and Bangalore. 
                <strong className="text-foreground"> Amruta Integrated Water Solutions Pvt. Ltd.</strong> is 
                one of the market leaders in NET ZERO / Water Audit, ZLD, Rainwater Harvesting, 
                Groundwater Surveys, Geological Surveys, EC Consulting, MEP Designing & Consulting, 
                Thermal Imaging Survey, Energy Saving, and Renewable Energy.
              </p>
              <p>
                With around <strong className="text-foreground">35 years of experience</strong>, we are 
                skilled to provide advice and assistance for EC, MEP, CGWB Registration, 
                Ground Water management, and more.
              </p>
              <p>
                Our team works proficiently to find Ground Water resource points for 
                borewell drilling and provide expert consultancy to help clients understand 
                the concept of rainwater harvesting. We provide effective designs keeping 
                in mind the positive impact on the environmental perspective.
              </p>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 gap-4"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-card p-6 rounded-xl text-center border border-border"
                style={{ boxShadow: "var(--card-shadow)" }}
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
