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
  { icon: "HeartHandshake", title: "Client Focused", description: "Absolute client satisfaction with personalized service and support." },
];

const WhyUs = () => {
  const { data } = useSiteContent("whyus");
  const metadata = data?.metadata as { reasons?: typeof defaultReasons } | null;
  const title = data?.title || "Why Choose Us";
  const subtitle =
    data?.content ||
    "Trusted by hundreds of clients across India for our expertise, reliability, and commitment to excellence.";
  const reasons = metadata?.reasons || defaultReasons;
  const noMotion = useNoMotion();
  const m = (props: Record<string, unknown>) => (noMotion ? {} : props);

  return (
    <section
      id="why"
      className="relative py-20 md:py-28 overflow-hidden"
      style={{ background: "hsl(var(--ocean-deep))" }}
    >
      {/* Ambient orbs */}
      <div
        className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full opacity-[0.07] blur-[100px] pointer-events-none"
        style={{ background: "hsl(var(--teal))" }}
      />
      <div
        className="absolute -bottom-24 -right-24 w-[340px] h-[340px] rounded-full opacity-[0.07] blur-[100px] pointer-events-none"
        style={{ background: "hsl(var(--secondary))" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03] blur-[120px] pointer-events-none"
        style={{ background: "hsl(var(--gold))" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          {...m({
            initial: { opacity: 0, y: 24 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { duration: 0.6 },
          })}
          className="text-center mb-16"
        >
          <div className="gold-accent mx-auto mb-6" />
          <h2 className="section-heading text-white mb-5">{title}</h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            {subtitle}
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {reasons.map((reason, index) => {
            const IconComponent = iconMap[reason.icon] || Users;
            return (
              <motion.div
                key={reason.title}
                {...m({
                  initial: { opacity: 0, y: 28 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.5, delay: index * 0.08 },
                  whileHover: { y: -6, transition: { duration: 0.25 } },
                })}
                className="group relative rounded-2xl p-[1px] overflow-hidden"
              >
                {/* Animated gold border on hover */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--secondary) / 0.4), hsl(var(--teal) / 0.2), hsl(var(--secondary) / 0.15))",
                  }}
                />

                {/* Card inner */}
                <div
                  className="relative rounded-2xl p-6 h-full flex flex-col items-center text-center transition-all duration-500 border border-white/[0.06] group-hover:border-transparent"
                  style={{
                    background:
                      "linear-gradient(160deg, hsl(0 0% 100% / 0.06) 0%, hsl(0 0% 100% / 0.02) 100%)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {/* Subtle number watermark */}
                  <span
                    className="absolute top-3 right-4 font-bold text-[3.5rem] leading-none select-none pointer-events-none"
                    style={{
                      fontFamily: "var(--font-serif)",
                      color: "hsl(0 0% 100% / 0.03)",
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-500 group-hover:scale-110"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(var(--secondary) / 0.15), hsl(var(--secondary) / 0.06))",
                      boxShadow: "0 0 0 1px hsl(var(--secondary) / 0.1)",
                    }}
                  >
                    <IconComponent
                      className="w-6 h-6 transition-colors duration-500"
                      style={{ color: "hsl(var(--secondary))" }}
                      strokeWidth={1.8}
                    />
                  </div>

                  {/* Title */}
                  <h3
                    className="font-bold text-lg text-white mb-2.5 transition-colors duration-300"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {reason.title}
                  </h3>

                  {/* Divider */}
                  <div
                    className="w-8 h-[2px] rounded-full mb-3 transition-all duration-500 group-hover:w-12"
                    style={{
                      background:
                        "linear-gradient(90deg, hsl(var(--secondary) / 0.6), hsl(var(--secondary) / 0.15))",
                    }}
                  />

                  {/* Description */}
                  <p className="text-white/50 text-sm leading-relaxed group-hover:text-white/65 transition-colors duration-500">
                    {reason.description}
                  </p>

                  {/* Bottom glow on hover */}
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-full blur-2xl"
                    style={{ background: "hsl(var(--secondary) / 0.06)" }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyUs;
