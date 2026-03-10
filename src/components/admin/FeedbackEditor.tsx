import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Star, CheckCircle2, XCircle, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Review {
  id: string;
  user_id: string;
  service_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  is_verified: boolean | null;
  is_published: boolean | null;
  created_at: string;
  service_title?: string;
}

const FeedbackEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "verified">("all");

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch service titles
      const serviceIds = [...new Set((data || []).map((r) => r.service_id).filter(Boolean))];
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
        (data || []).map((r) => ({
          ...r,
          service_title: serviceMap[r.service_id] || "Unknown",
        }))
      );
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleVerified = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("reviews")
      .update({ is_verified: !current })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, is_verified: !current } : r)));
      toast({ title: !current ? "Review verified" : "Verification removed" });
    }
  };

  const togglePublished = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("reviews")
      .update({ is_published: !current })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, is_published: !current } : r)));
      toast({ title: !current ? "Review published" : "Review hidden" });
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Review deleted" });
    }
  };

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return !r.is_verified;
    if (filter === "verified") return r.is_verified;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.is_verified).length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Customer Feedback</h3>
          <p className="text-sm text-muted-foreground">
            {reviews.length} total reviews · {pendingCount} pending verification
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReviews} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "pending", "verified"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
            {f === "pending" && pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">
                {pendingCount}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No reviews found.</p>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rating</TableHead>
                <TableHead>Title / Content</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/20"}`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    {review.title && <p className="font-medium text-sm truncate">{review.title}</p>}
                    {review.content && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{review.content}</p>
                    )}
                    {!review.title && !review.content && (
                      <span className="text-xs text-muted-foreground italic">No text</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">{review.service_title}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleVerified(review.id, !!review.is_verified)}
                      className={review.is_verified ? "text-green-600" : "text-muted-foreground"}
                    >
                      {review.is_verified ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePublished(review.id, !!review.is_published)}
                      className={review.is_published ? "text-blue-600" : "text-muted-foreground"}
                    >
                      {review.is_published ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteReview(review.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default FeedbackEditor;
