import { motion } from "framer-motion";
import { Building2, Users, Award, MapPin, LucideIcon } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";

const iconMap: Record<string, LucideIcon> = {
  Award,
  Building2,
  Users,
  MapPin
};

const defaultStats = [
{ icon: "Award", value: "35+", label: "Years Experience" },
{ icon: "Building2", value: "4", label: "Office Locations" },
{ icon: "Users", value: "1000+", label: "Projects Completed" },
{ icon: "MapPin", value: "Pan India", label: "Service Coverage" }];


const About = () => {
  const { data, loading } = useSiteContent("about");

  const metadata = data?.metadata as {stats?: typeof defaultStats;} | null;
  const title = data?.title || "About Us";
  const content = data?.content || "";
  const stats = metadata?.stats || defaultStats;

  // Split content into paragraphs
  const paragraphs = content.split("\n\n").filter(Boolean);

  return (
    <section id="about" className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}>

            <h2 className="section-heading mb-6 text-center">{title}</h2>
            <div className="space-y-4 text-muted-foreground">
              {paragraphs.map((paragraph, index) =>
              <p key={index} dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} className="font-sans text-center" />
              )}
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 gap-4">

            {stats.map((stat, index) => {
              const IconComponent = iconMap[stat.icon] || Award;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-card p-6 rounded-xl text-center border border-border"
                  style={{ boxShadow: "var(--card-shadow)" }}>

                  <IconComponent className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>);

            })}
          </motion.div>
        </div>
      </div>
    </section>);

};

export default About;