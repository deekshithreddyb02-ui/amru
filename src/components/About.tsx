import { motion } from "framer-motion";
import { Building2, Users, Award, MapPin, LucideIcon } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useNoMotion } from "@/hooks/useNoMotion";

const iconMap: Record<string, LucideIcon> = { Award, Building2, Users, MapPin };

const defaultStats = [
{ icon: "Award", value: "35+", label: "Years Experience" },
{ icon: "Building2", value: "4", label: "Office Locations" },
{ icon: "Users", value: "1000+", label: "Projects Completed" },
{ icon: "MapPin", value: "Pan India", label: "Service Coverage" }];


const About = () => {
  const { data } = useSiteContent("about");
  const metadata = data?.metadata as {stats?: typeof defaultStats;} | null;
  const title = data?.title || "About Us";
  const content = data?.content || "";
  const stats = metadata?.stats || defaultStats;
  const paragraphs = content.split("\n\n").filter(Boolean);
  const noMotion = useNoMotion();
  const m = (props: Record<string, unknown>) => noMotion ? {} : props;

  return (
    <section id="about" className="relative py-20 overflow-hidden md:py-0 pb-[100px]" style={{ background: 'var(--section-gradient)' }}>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.03] blur-3xl" style={{ background: 'hsl(var(--primary))' }} />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center my-0">
          <motion.div className="text-center">
            
            
            <div className="gold-accent mb-6 mx-auto" />
            <h2 className="section-heading mb-2">{title}</h2>
            <p className="text-sm uppercase tracking-widest font-semibold mb-8" style={{ color: 'hsl(var(--secondary))' }}>
              Pioneering Water Solutions Since 1990
            </p>
            <div className="space-y-4 text-center">
              {paragraphs.map((paragraph, index) => {
                const parts = paragraph.split(/\*\*(.*?)\*\*/g);
                return (
                  <p key={index} className="text-muted-foreground leading-relaxed">
                    {parts.map((part, i) =>
                    i % 2 === 1 ? <strong key={i} className="text-foreground font-semibold">{part}</strong> : <span key={i}>{part}</span>
                    )}
                  </p>);

              })}
            </div>
          </motion.div>

          <motion.div
            {...m({ initial: { opacity: 0, x: 40 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.7 } })}
            className="grid grid-cols-2 gap-4">
            
            {stats.map((stat, index) => {
              const IconComponent = iconMap[stat.icon] || Award;
              return (
                <motion.div
                  key={stat.label}
                  {...m({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: index * 0.1 }, whileHover: { y: -4, transition: { duration: 0.2 } } })}
                  className="group bg-card p-6 rounded-2xl border border-border text-center transition-all duration-300 hover:border-primary/20"
                  style={{ boxShadow: 'var(--card-shadow)' }}>
                  
                  <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center transition-colors duration-300"
                  style={{ background: 'hsl(var(--primary) / 0.08)' }}>
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                </motion.div>);

            })}
          </motion.div>
        </div>
      </div>
    </section>);

};

export default About;