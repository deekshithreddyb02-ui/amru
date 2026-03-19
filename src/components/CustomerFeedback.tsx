import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Loader2, Play, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNoMotion } from "@/hooks/useNoMotion";

interface FeedbackItem { id: string; title: string | null; description: string | null; media_type: string; media_url: string; display_order: number; }

const CustomerFeedback = () => {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const noMotion = useNoMotion();
  const m = (props: Record<string, unknown>) => noMotion ? {} : props;

  useEffect(() => {
    const fetchFeedback = async () => {
      const { data } = await supabase.from("customer_feedback").select("id, title, description, media_type, media_url, display_order").eq("is_visible", true).order("display_order");
      setItems(data || []);
      setLoading(false);
    };
    fetchFeedback();
  }, []);

  if (loading) return <section className="py-20"><div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></section>;
  if (items.length === 0) return null;

  return (
    <section id="customer-feedback" className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'var(--section-gradient)' }}>
      <div className="container mx-auto px-4">
        <motion.div {...m({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } })} className="text-center mb-14">
          <div className="gold-accent mx-auto mb-6" />
          <h2 className="section-heading mb-4">Customer Feedback</h2>
          <p className="section-subheading">See what our customers have to say about our services.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              {...m({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: index * 0.08 }, whileHover: { y: -4, transition: { duration: 0.2 } } })}
              className="group bg-card rounded-2xl overflow-hidden border border-border cursor-pointer transition-all duration-500"
              style={{ boxShadow: 'var(--card-shadow)' }}
              onClick={() => setSelectedItem(item)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow)'; }}
            >
              <div className="relative aspect-video overflow-hidden bg-muted">
                {item.media_type === "video" ? (
                  <>
                    <video src={item.media_url} className="w-full h-full object-cover" muted preload="metadata" />
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/20 group-hover:bg-foreground/30 transition-colors">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.9)' }}>
                        <Play className="w-6 h-6 text-white ml-0.5" />
                      </div>
                    </div>
                  </>
                ) : (
                  <img src={item.media_url} alt={item.title || "Customer feedback"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                )}
              </div>
              {(item.title || item.description) && (
                <div className="p-4">
                  {item.title && <h3 className="font-bold text-sm text-foreground mb-1" style={{ fontFamily: 'var(--font-serif)' }}>{item.title}</h3>}
                  {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'hsl(0 0% 0% / 0.85)' }} onClick={() => setSelectedItem(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white z-10" onClick={() => setSelectedItem(null)}><X className="w-8 h-8" /></button>
          <div className="max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {selectedItem.media_type === "video" ? (
              <video src={selectedItem.media_url} controls autoPlay className="w-full max-h-[75vh] rounded-2xl object-contain" />
            ) : (
              <img src={selectedItem.media_url} alt={selectedItem.title || "Feedback"} className="w-full max-h-[75vh] rounded-2xl object-contain" />
            )}
            {(selectedItem.title || selectedItem.description) && (
              <div className="mt-4 text-center">
                {selectedItem.title && <h3 className="text-lg font-bold text-white">{selectedItem.title}</h3>}
                {selectedItem.description && <p className="text-sm text-white/60 mt-1">{selectedItem.description}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default CustomerFeedback;
