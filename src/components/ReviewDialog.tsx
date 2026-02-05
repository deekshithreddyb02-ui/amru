 import { useState } from "react";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Star, Loader2 } from "lucide-react";
 import { useReviews } from "@/hooks/useReviews";
 import { useToast } from "@/hooks/use-toast";
 
 interface ReviewDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   serviceId: string;
   serviceName: string;
 }
 
 const ReviewDialog = ({ open, onOpenChange, serviceId, serviceName }: ReviewDialogProps) => {
   const [rating, setRating] = useState(0);
   const [hoverRating, setHoverRating] = useState(0);
   const [title, setTitle] = useState("");
   const [content, setContent] = useState("");
   const [loading, setLoading] = useState(false);
 
   const { createReview } = useReviews(serviceId);
   const { toast } = useToast();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (rating === 0) {
       toast({ title: "Error", description: "Please select a rating", variant: "destructive" });
       return;
     }
 
     setLoading(true);
     const { error } = await createReview({
       service_id: serviceId,
       rating,
       title: title || undefined,
       content: content || undefined,
     });
 
     setLoading(false);
 
     if (error) {
       toast({ title: "Error", description: error, variant: "destructive" });
     } else {
       toast({ title: "Review Submitted!", description: "Thank you for your feedback." });
       onOpenChange(false);
       setRating(0);
       setTitle("");
       setContent("");
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle>Write a Review</DialogTitle>
           <DialogDescription>{serviceName}</DialogDescription>
         </DialogHeader>
 
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-2">
             <Label>Your Rating</Label>
             <div className="flex gap-1">
               {[1, 2, 3, 4, 5].map((star) => (
                 <button
                   key={star}
                   type="button"
                   onClick={() => setRating(star)}
                   onMouseEnter={() => setHoverRating(star)}
                   onMouseLeave={() => setHoverRating(0)}
                   className="p-1"
                 >
                   <Star
                     className={`w-8 h-8 transition-colors ${
                       star <= (hoverRating || rating)
                         ? "fill-yellow-400 text-yellow-400"
                         : "text-muted-foreground"
                     }`}
                   />
                 </button>
               ))}
             </div>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="title">Review Title</Label>
             <Input
               id="title"
               placeholder="Summarize your experience"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="content">Your Review</Label>
             <Textarea
               id="content"
               placeholder="Tell us about your experience..."
               value={content}
               onChange={(e) => setContent(e.target.value)}
               rows={4}
             />
           </div>
 
           <Button type="submit" className="w-full" disabled={loading}>
             {loading ? (
               <>
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                 Submitting...
               </>
             ) : (
               "Submit Review"
             )}
           </Button>
         </form>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default ReviewDialog;