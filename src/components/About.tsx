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
    <section id="about" className="relative overflow-hidden">
      {/* Stats Bar */}
      <motion.div
        {...m({ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })}
        className="relative py-6 md:py-8"
        style={{ background: 'hsl(var(--primary) / 0.85)', backdropFilter: 'blur(8px)' }}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center gap-8 md:gap-16 flex-wrap">
            {stats.map((stat, index) => {
              const IconComponent = iconMap[stat.icon] || Award;
              return (
                <motion.div
                  key={stat.label}
                  {...m({ initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.4, delay: index * 0.1 } })}
                  className="flex items-center gap-3 text-primary-foreground"
                >
                  <IconComponent className="w-5 h-5 md:w-6 md:h-6 opacity-80" />
                  <div>
                    <div className="text-xl md:text-2xl font-bold leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                      {stat.value}
                    </div>
                    <div className="text-xs md:text-sm opacity-80 font-medium">{stat.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* About Content */}
      <div className="py-20 md:py-28" style={{ background: 'var(--section-gradient)' }}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.03] blur-3xl" style={{ background: 'hsl(var(--primary))' }} />
        <div className="container mx-auto px-4">
          <motion.div {...m({ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })} className="max-w-3xl mx-auto text-center">
            <div className="gold-accent mb-6 mx-auto" />
            <h2 className="section-heading mb-2">{title}</h2>
            <p className="text-sm uppercase tracking-widest font-semibold mb-8" style={{ color: 'hsl(var(--secondary))' }}>
              Pioneering Water Solutions Since 1990
            </p>
            <div className="space-y-4">
              {paragraphs.map((paragraph, index) => {
                const parts = paragraph.split(/\*\*(.*?)\*\*/g);
                return (
                  <p key={index} className="text-muted-foreground leading-relaxed">
                    {parts.map((part, i) =>
                      i % 2 === 1 ? <strong key={i} className="text-foreground font-semibold">{part}</strong> : <span key={i}>{part}</span>
                    )}
                  </p>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>);

};

export default About;