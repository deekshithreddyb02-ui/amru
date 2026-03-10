import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, Send, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  service_title?: string;
  user_name?: string;
}

const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-5 h-5 transition-colors ${
          star <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
        } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
        onClick={() => interactive && onRate?.(star)}
      />
    ))}
  </div>
);

const CustomerFeedback = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "", rating: 0, service_id: "" });
  const [services, setServices] = useState<{ id: string; title: string }[]>([]);

  const reviewsPerPage = 3;

  const fetchReviews = useCallback(async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, rating, title, content, created_at, service_id")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch service titles and user names in parallel
      const serviceIds = [...new Set(data.map((r) => r.service_id).filter(Boolean))];
      const userIds = data.map((r) => r.id); // We'll use profiles via a separate approach

      let serviceMap: Record<string, string> = {};
      if (serviceIds.length > 0) {
        const { data: svcData } = await supabase
          .from("services")
          .select("id, title")
          .in("id", serviceIds);
        if (svcData) {
          serviceMap = Object.fromEntries(svcData.map((s) => [s.id, s.title]));
        }
      }

      setReviews(
        data.map((r) => ({
          ...r,
          service_title: serviceMap[r.service_id] || undefined,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReviews();

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, [fetchReviews]);

  useEffect(() => {
    if (showForm && services.length === 0) {
      supabase.from("services").select("id, title").order("display_order").then(({ data }) => {
        if (data) setServices(data);
      });
    }
  }, [showForm, services.length]);

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const currentReviews = reviews.slice(currentPage * reviewsPerPage, (currentPage + 1) * reviewsPerPage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Please log in to submit feedback");
      return;
    }
    if (formData.rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!formData.service_id) {
      toast.error("Please select a service");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: userId,
      service_id: formData.service_id,
      rating: formData.rating,
      title: formData.title || null,
      content: formData.content || null,
    });

    if (error) {
      toast.error("Failed to submit feedback. Please try again.");
    } else {
      toast.success("Thank you! Your feedback has been submitted for review.");
      setFormData({ title: "", content: "", rating: 0, service_id: "" });
      setShowForm(false);
      fetchReviews();
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <section id="customer-feedback" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
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

          {reviews.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <StarRating rating={Math.round(Number(avgRating))} />
              <span className="text-lg font-semibold text-foreground">{avgRating}</span>
              <span className="text-muted-foreground">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
            </div>
          )}
        </motion.div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No feedback yet. Be the first to share your experience!</p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <AnimatePresence mode="wait">
                {currentReviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {review.title && (
                      <h3 className="font-semibold text-foreground mb-2">{review.title}</h3>
                    )}

                    {review.content && (
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">
                        {review.content}
                      </p>
                    )}

                    {review.service_title && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <span className="text-xs text-primary font-medium">
                          Service: {review.service_title}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Submit Feedback Button / Form */}
        <div className="mt-10 text-center">
          {!showForm ? (
            <Button
              onClick={() => {
                if (!userId) {
                  toast.error("Please log in to submit feedback");
                  return;
                }
                setShowForm(true);
              }}
              className="gap-2"
              size="lg"
            >
              <Send className="w-4 h-4" />
              Share Your Feedback
            </Button>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="max-w-lg mx-auto bg-card rounded-xl p-6 shadow-sm border border-border text-left space-y-4"
            >
              <h3 className="text-lg font-semibold text-foreground text-center mb-2">Share Your Experience</h3>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Rating *</label>
                <StarRating rating={formData.rating} onRate={(r) => setFormData({ ...formData, rating: r })} interactive />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Service *</label>
                <select
                  value={formData.service_id}
                  onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  required
                >
                  <option value="">Select a service</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Title (optional)</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Summarize your experience"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Your Feedback (optional)</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Tell us about your experience..."
                  rows={4}
                  maxLength={1000}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit
                </Button>
              </div>
            </motion.form>
          )}
        </div>
      </div>
    </section>
  );
};

export default CustomerFeedback;
