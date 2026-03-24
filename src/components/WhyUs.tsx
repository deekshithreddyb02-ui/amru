import { motion } from "framer-motion";
import { Users, Lightbulb, Search, Shield, Clock, HeartHandshake, LucideIcon } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useNoMotion } from "@/hooks/useNoMotion";

const iconMap: Record<string, LucideIcon> = { Users, Lightbulb, Search, Shield, Clock, HeartHandshake };

const defaultReasons = [
{ icon: "Users", title: "Expert Team", description: "Experienced experts and committed professionals with decades of industry knowledge." },
{ icon: "Lightbulb", title: "Quality Solutions", description: "Qualitative, efficient, and cost-effective solutions tailored to your needs." },
{ icon: "Search", title: "Research-Backed", description: "Detailed, research-backed technological surveys for accurate results." },
{ icon: "Shield", title: "Compliance Assured", description: "Full regulatory compliance with CGWB, environmental, and building codes." },
{ icon: "Clock", title: "Timely Delivery", description: "On-time project completion with transparent progress updates." },
{ icon: "HeartHandshake", title: "Client Focused", description: "Absolute client satisfaction with personalized service and support." }];


const WhyUs = () => {
  const { data } = useSiteContent("whyus");
  const metadata = data?.metadata as {reasons?: typeof defaultReasons;} | null;
  const title = data?.title || "Why Choose Us";
  const subtitle = data?.content || "Trusted by hundreds of clients across India for our expertise, reliability, and commitment to excellence.";
  const reasons = metadata?.reasons || defaultReasons;
  const noMotion = useNoMotion();
  const m = (props: Record<string, unknown>) => noMotion ? {} : props;

  return (
    <section id="why" className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'hsl(var(--ocean-deep))' }}>
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'hsl(var(--teal))' }} />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: 'hsl(var(--secondary))' }} />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          {...m({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })}
          className="text-center mb-14">
          
          
          <h2 className="section-heading text-white mb-4">{title}</h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg leading-relaxed">{subtitle}</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reasons.map((reason, index) => {
            const IconComponent = iconMap[reason.icon] || Users;
            return (
              <motion.div
                key={reason.title}
                {...m({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: index * 0.08 }, whileHover: { y: -4, transition: { duration: 0.2 } } })}
                className="group p-6 rounded-2xl border border-white/[0.08] backdrop-blur-sm transition-all duration-300 hover:border-white/20"
                style={{ background: 'hsl(0 0% 100% / 0.04)' }}>
                
                <div className="w-12 h-12 rounded-xl mb-4 transition-all duration-300 items-center justify-center text-center flex flex-row"
                style={{ background: 'hsl(var(--secondary) / 0.12)' }}>
                  <IconComponent className="w-6 h-6" style={{ color: 'hsl(var(--secondary))' }} />
                </div>
                <h3 className="font-bold text-lg text-white mb-2 text-center" style={{ fontFamily: 'var(--font-serif)' }}>
                  {reason.title}
                </h3>
                <p className="text-white/55 text-sm leading-relaxed text-center">{reason.description}</p>
              </motion.div>);

          })}
        </div>
      </div>
    </section>);

};

export default WhyUs;