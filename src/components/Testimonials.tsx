import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import testimonialsBg from "@/assets/testimonials-bg.jpg";
import { useNoMotion } from "@/hooks/useNoMotion";

const fallbackTestimonials = [
  { text: "This is - from Vatika Society - Balewadi- PUNE - having 3 Buildings & 193 Flats. We used to spend 7 to 8 tankers in a day and Rs. 70,000/- to 80,000/- in a month and totally Rs. 8 Lakh to 9 Lakh in a Year for Tankers. Earlier We had a failure with Convention method (survey done by other third party vendor) called Copper Dowsing Rods. We approached Amrutha Ground Water Discovery, to perform Ground Water Survey, and they visited and Survey done with an American Intelligent Ground Water Discovery Machine and they have suggested 4 Bore Points in the Report and out of which they have recommended Greatest Ground Water resource point and we have drilled it and got more than 2 inch of water and we switch the Motor on for 2 to 3 hours and gives us 7 to 8 tankers (80,000 Liters) and it is sufficient for ONE DAY consumption. Now we are saving around Rs. 70,000/- to 80,000/- in a month. Yearly we are saving around Rs. 8 Lack to 9 Lack. They have made us to realize the important", name: "Rajesh Lokhande", organization: "Vatika Society" },
  { text: "If you are in need of ground water survey, surely would recommend them.", name: "Kalpana Pillai", organization: "" },
  { text: "Got rainwater harvesting done for my society. Highly effective results. Literally the best.", name: "Vineet Kulkarni", organization: "" },
  { text: "We have 233 flats in our society, our daily demand is about 10-15 tankers of water. Earlier our builder and society had drilled 11 bore-wells and all of them were ended up with a failure. We used to spend Rs.25-28 lakhs of rupees for tanker yearly. We have approached Amrutha Ground Water Discovery for the ground water survey and they have done 5 scans with an American technological device including GPS mapping. They submitted the report with 5 top most yielding/greatest ground water resource points. We have drilled the bore-well. Got on point - 1: 2.5 inch of water. On Point - 2: 2.0 inch of water. On Point - 3: 1.5 inch around. Now we are completely free from tankers as earlier we used to spend for tankers = Rs. 26 Lakhs/Year. Currently spending (NO TANKERS) = 3 Lakhs/Year (Only for Power Bill) Current savings = Rs. 23 Lakhs/Year.", name: "Pratima Gupte", organization: "Pebbles Coop Housing Society" },
];

const swipeThreshold = 50;
const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
};

const Testimonials = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);
  const noMotion = useNoMotion();
  const m = (props: Record<string, unknown>) => noMotion ? {} : props;

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from("testimonials").select("name, organization, text").eq("is_visible", true).order("display_order", { ascending: true });
      if (!error && data?.length) setTestimonials(data.map(d => ({ text: d.text, name: d.name, organization: d.organization || "" })));
    };
    fetch();
  }, []);

  const next = useCallback(() => { setDirection(1); setCurrent(p => (p + 1) % testimonials.length); }, [testimonials.length]);
  const prev = useCallback(() => { setDirection(-1); setCurrent(p => (p - 1 + testimonials.length) % testimonials.length); }, [testimonials.length]);
  const goTo = useCallback((i: number) => { setDirection(i > current ? 1 : -1); setCurrent(i); }, [current]);

  useEffect(() => { const t = setInterval(next, 6000); return () => clearInterval(t); }, [next]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -swipeThreshold) next();
    else if (info.offset.x > swipeThreshold) prev();
  };

  if (!testimonials.length) return null;

  return (
    <section id="testimonials" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${testimonialsBg})` }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, hsl(200 80% 10% / 0.88) 0%, hsl(200 60% 15% / 0.82) 50%, hsl(168 50% 18% / 0.78) 100%)' }} />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          {...m({ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })}
        >
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" style={{ color: 'hsl(var(--secondary))' }} />
            ))}
          </div>
          <h2 className="section-heading text-white mb-2">What Our Clients Say</h2>
          <p className="text-white/50 text-sm mb-12">Trusted by 1000+ clients across India</p>
        </motion.div>

        <div className="relative h-[280px] md:h-[250px] flex items-center justify-center touch-pan-y overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={noMotion ? undefined : slideVariants}
              initial={noMotion ? undefined : "enter"}
              animate={noMotion ? undefined : "center"}
              exit={noMotion ? undefined : "exit"}
              transition={noMotion ? undefined : { duration: 0.4, ease: "easeInOut" }}
              drag={noMotion ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={noMotion ? undefined : handleDragEnd}
              className="absolute inset-0 flex flex-col items-center justify-center max-w-3xl mx-auto cursor-grab active:cursor-grabbing px-4"
            >
              <Quote className="w-8 h-8 mx-auto mb-5 opacity-30 shrink-0" style={{ color: 'hsl(var(--secondary))' }} />
              <p className="text-white/85 text-base md:text-lg leading-relaxed mb-6 italic line-clamp-5 text-center">
                "{testimonials[current].text}"
              </p>
              <div className="flex items-center justify-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'hsl(var(--secondary) / 0.2)', color: 'hsl(var(--secondary))' }}>
                  {testimonials[current].name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">{testimonials[current].name}</p>
                  {testimonials[current].organization && (
                    <p className="text-white/50 text-xs">{testimonials[current].organization}</p>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-2 mt-10">
          {testimonials.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} className="group p-1" aria-label={`Go to testimonial ${i + 1}`}>
              <span className={`block rounded-full transition-all duration-300 ${
                i === current ? "w-8 h-2" : "w-2 h-2 group-hover:w-4"
              }`} style={{ background: i === current ? 'hsl(var(--secondary))' : 'hsl(0 0% 100% / 0.25)' }} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
