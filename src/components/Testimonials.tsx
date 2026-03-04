import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import testimonialsBg from "@/assets/testimonials-bg.jpg";

const fallbackTestimonials = [
  {
    text: "This is - from Vatika Society - Balewadi- PUNE - having 3 Buildings & 193 Flats. We used to spend 7 to 8 tankers in a day and Rs. 70,000/- to 80,000/- in a month and totally Rs. 8 Lakh to 9 Lakh in a Year for Tankers. Earlier We had a failure with Convention method (survey done by other third party vendor) called Copper Dowsing Rods. We approached Amrutha Ground Water Discovery, to perform Ground Water Survey, and they visited and Survey done with an American Intelligent Ground Water Discovery Machine and they have suggested 4 Bore Points in the Report and out of which they have recommended Greatest Ground Water resource point and we have drilled it and got more than 2 inch of water and we switch the Motor on for 2 to 3 hours and gives us 7 to 8 tankers (80,000 Liters) and it is sufficient for ONE DAY consumption. Now we are saving around Rs. 70,000/- to 80,000/- in a month. Yearly we are saving around Rs. 8 Lack to 9 Lack. They have made us to realize the important",
    name: "Rajesh Lokhande",
    organization: "Vatika Society",
  },
  { text: "If you are in need of ground water survey, surely would recommend them.", name: "Kalpana Pillai", organization: "" },
  { text: "Got rainwater harvesting done for my society. Highly effective results. Literally the best.", name: "Vineet Kulkarni", organization: "" },
  {
    text: "We have 233 flats in our society, our daily demand is about 10-15 tankers of water. Earlier our builder and society had drilled 11 bore-wells and all of them were ended up with a failure. We used to spend Rs.25-28 lakhs of rupees for tanker yearly. We have approached Amrutha Ground Water Discovery for the ground water survey and they have done 5 scans with an American technological device including GPS mapping. They submitted the report with 5 top most yielding/greatest ground water resource points. We have drilled the bore-well. Got on point - 1: 2.5 inch of water. On Point - 2: 2.0 inch of water. On Point - 3: 1.5 inch around. Now we are completely free from tankers as earlier we used to spend for tankers = Rs. 26 Lakhs/Year. Currently spending (NO TANKERS) = 3 Lakhs/Year (Only for Power Bill) Current savings = Rs. 23 Lakhs/Year.",
    name: "Pratima Gupte",
    organization: "Pebbles Coop Housing Society",
  },
];

const swipeThreshold = 50;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const Testimonials = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("name, organization, text")
        .eq("is_visible", true)
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        setTestimonials(data.map(d => ({ text: d.text, name: d.name, organization: d.organization || "" })));
      }
    };
    fetchTestimonials();
  }, []);

  const goTo = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -swipeThreshold) {
      next();
    } else if (info.offset.x > swipeThreshold) {
      prev();
    }
  };

  if (testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${testimonialsBg})` }} />
      <div className="absolute inset-0 bg-[hsl(210_30%_10%/0.82)]" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <Quote className="w-10 h-10 text-white/60 mx-auto mb-4" />
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-10 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
          Testimonials
        </h2>

        <div
          className="relative min-h-[260px] md:min-h-[220px] flex items-center justify-center touch-pan-y"
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="max-w-3xl mx-auto cursor-grab active:cursor-grabbing"
            >
              <p className="text-white/90 text-base md:text-lg leading-relaxed mb-6 italic line-clamp-[8]">
                {testimonials[current].text}
              </p>
              <p className="text-white font-semibold text-lg">
                {testimonials[current].name}
                {testimonials[current].organization && (
                  <span className="text-white/70 italic font-normal">, {testimonials[current].organization}</span>
                )}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-2.5 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="group p-1"
              aria-label={`Go to testimonial ${i + 1}`}
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-8 h-3 bg-white"
                    : "w-3 h-3 bg-white/40 group-hover:bg-white/60"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
