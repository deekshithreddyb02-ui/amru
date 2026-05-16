import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNoMotion } from "@/hooks/useNoMotion";
import { supabase } from "@/integrations/supabase/client";
import { getCertificationIcon } from "@/lib/certificationIcons";

interface CertRow {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  icon_name: string;
  display_order: number;
  is_visible: boolean;
}

const Certifications = () => {
  const noMotion = useNoMotion();
  const m = (props: Record<string, unknown>) => (noMotion ? {} : props);
  const [certifications, setCertifications] = useState<CertRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await (supabase as any)
        .from("certifications")
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true });
      if (!cancelled && data) setCertifications(data as CertRow[]);
    };
    load();

    const channel = supabase
      .channel("certifications-public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "certifications" },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  if (certifications.length === 0) return null;

  return (
    <section
      id="certifications"
      className="relative py-20 md:py-28 overflow-hidden"
      style={{ background: "var(--section-gradient)" }}
    >
      <div className="container mx-auto px-4">
        <motion.div
          {...m({
            initial: { opacity: 0, y: 24 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { duration: 0.6 },
          })}
          className="text-center mb-14"
        >
          <div className="gold-accent mx-auto mb-6" />
          <h2 className="section-heading mb-4">Certifications & Partnerships</h2>
          <p className="section-subheading">
            Industry-recognized certifications that guarantee quality and reliability.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5">
          {certifications.map((cert, index) => {
            const Icon = getCertificationIcon(cert.icon_name);
            return (
              <motion.div
                key={cert.id}
                {...m({
                  initial: { opacity: 0, y: 24 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.5, delay: index * 0.1 },
                  whileHover: { y: -4, transition: { duration: 0.2 } },
                })}
                className="group bg-card p-6 rounded-2xl border border-border flex gap-5 items-start transition-all duration-500 hover:border-primary/15"
                style={{ boxShadow: "var(--card-shadow)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--card-shadow-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--card-shadow)";
                }}
              >
                <div
                  className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--secondary)), hsl(42 95% 45%))",
                  }}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3
                    className="font-bold text-base text-foreground mb-1 text-center"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {cert.title}
                  </h3>
                  {cert.subtitle && (
                    <p
                      className="text-xs font-semibold mb-2 text-center"
                      style={{ color: "hsl(var(--primary))" }}
                    >
                      {cert.subtitle}
                    </p>
                  )}
                  <p className="text-muted-foreground text-sm leading-relaxed text-center">
                    {cert.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Certifications;
