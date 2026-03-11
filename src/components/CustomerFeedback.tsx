import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Loader2, Play, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FeedbackItem {
  id: string;
  title: string | null;
  description: string | null;
  media_type: string;
  media_url: string;
  display_order: number;
}

const CustomerFeedback = () => {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      const { data } = await supabase
        .from("customer_feedback")
        .select("id, title, description, media_type, media_url, display_order")
        .eq("is_visible", true)
        .order("display_order");
      setItems(data || []);
      setLoading(false);
    };
    fetchFeedback();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section id="customer-feedback" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <MessageSquare className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2
            className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Customer Feedback
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See what our customers have to say about our services
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedItem(item)}
            >
              <div className="relative aspect-video overflow-hidden bg-muted">
                {item.media_type === "video" ? (
                  <>
                    <video
                      src={item.media_url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                        <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                  </>
                ) : (
                  <img
                    src={item.media_url}
                    alt={item.title || "Customer feedback"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                )}
              </div>
              {(item.title || item.description) && (
                <div className="p-4">
                  {item.title && (
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  )}
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
            onClick={() => setSelectedItem(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <div
            className="max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItem.media_type === "video" ? (
              <video
                src={selectedItem.media_url}
                controls
                autoPlay
                className="w-full max-h-[75vh] rounded-lg object-contain"
              />
            ) : (
              <img
                src={selectedItem.media_url}
                alt={selectedItem.title || "Customer feedback"}
                className="w-full max-h-[75vh] rounded-lg object-contain"
              />
            )}
            {(selectedItem.title || selectedItem.description) && (
              <div className="mt-3 text-center">
                {selectedItem.title && (
                  <h3 className="text-lg font-semibold text-white">{selectedItem.title}</h3>
                )}
                {selectedItem.description && (
                  <p className="text-sm text-white/70 mt-1">{selectedItem.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default CustomerFeedback;
