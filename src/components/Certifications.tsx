import { motion } from "framer-motion";
import { Award, GraduationCap, BadgeCheck, Users } from "lucide-react";
import { useNoMotion } from "@/hooks/useNoMotion";

const certifications = [
{ icon: Award, title: "ISO 1901: 2015 Certified Company", description: "ISO Certified Company, We follow the Global Compliance and Standards in the Business process - EURO Global Certified Company." },
{ icon: GraduationCap, title: "Certified Engineers from IIT Bombay", subtitle: "in Water Sustenance and Rainwater Harvesting", description: "We have Certified Engineers in Rainwater Harvesting from IIT (INDIAN INSTITUTE OF TECHNOLOGY) Bombay." },
{ icon: BadgeCheck, title: "Certified from State Govt of Maharashtra", description: "We have the Qualified and Certified Engineers in Rainwater Harvesting Implementation and Practices." },
{ icon: Users, title: "Association with Indian Water Works", description: "Amruta Ground Water Discovery is Associated with Indian Water Works." }];


const Certifications = () => {
  const noMotion = useNoMotion();
  const m = (props: Record<string, unknown>) => noMotion ? {} : props;

  return (
    <section id="certifications" className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'var(--section-gradient)' }}>
      <div className="container mx-auto px-4">
        <motion.div
          {...m({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })}
          className="text-center mb-14">
          
          
          <h2 className="section-heading mb-4">Certifications & Partnerships</h2>
          <p className="section-subheading">Industry-recognized certifications that guarantee quality and reliability.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5">
          {certifications.map((cert, index) =>
          <motion.div
            key={cert.title}
            {...m({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: index * 0.1 }, whileHover: { y: -4, transition: { duration: 0.2 } } })}
            className="group bg-card p-6 rounded-2xl border border-border flex gap-5 items-start transition-all duration-500 hover:border-primary/15"
            style={{ boxShadow: 'var(--card-shadow)' }}
            onMouseEnter={(e) => {(e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow-hover)';}}
            onMouseLeave={(e) => {(e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow)';}}>
            
              <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(var(--secondary)), hsl(42 95% 45%))' }}>
                <cert.icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-foreground mb-1 text-center" style={{ fontFamily: 'var(--font-serif)' }}>
                  {cert.title}
                </h3>
                {cert.subtitle &&
              <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--primary))' }}>{cert.subtitle}</p>
              }
                <p className="text-muted-foreground text-sm leading-relaxed text-center">{cert.description}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

};

export default Certifications;