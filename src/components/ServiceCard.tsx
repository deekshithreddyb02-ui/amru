 import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
 import { Loader2, Heart, Calendar, Star } from "lucide-react";
 import { useSavedServices } from "@/hooks/useSavedServices";
 import StarRating from "./StarRating";
 import BookingDialog from "./BookingDialog";
 import ReviewDialog from "./ReviewDialog";

interface ServiceCardProps {
  title: string;
  description: string;
  image: string;
  link?: string;
  delay?: number;
   id?: string;
   rating?: number;
   reviewCount?: number;
}

 const ServiceCard = ({ title, description, image, delay = 0, id, rating = 0, reviewCount = 0 }: ServiceCardProps) => {
  const [open, setOpen] = useState(false);
   const [bookingOpen, setBookingOpen] = useState(false);
   const [reviewOpen, setReviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
   const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
 
   const { isServiceSaved, saveService, removeSavedService } = useSavedServices();
   const isSaved = id ? isServiceSaved(id) : false;
 
   useEffect(() => {
     supabase.auth.getSession().then(({ data: { session } }) => {
       setUser(session?.user ?? null);
     });
   }, []);
 
   const handleSaveToggle = async () => {
     if (!id || !user) {
       toast.error("Please login to save services");
       return;
     }
     if (isSaved) {
       await removeSavedService(id);
       toast.success("Removed from saved");
     } else {
       await saveService(id);
       toast.success("Saved to wishlist");
     }
   };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim() || null;
    const message = formData.message.trim() || '';

    // Basic validation
    if (!name || !email) {
      toast.error("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name,
          email,
          phone,
          service: title,
          message,
        });

      if (error) throw error;

      toast.success("Enquiry submitted successfully! We'll contact you soon.");
      setFormData({ name: "", phone: "", email: "", message: "" });
      setOpen(false);
    } catch (error) {
      console.error('Submission error:', error);
      toast.error("Failed to submit. Please try calling us at +91-741-0030-418.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ 
          y: -4,
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)"
        }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl h-full flex flex-col cursor-pointer shadow-sm border border-border/50 overflow-hidden"
      >
         <div className="aspect-[4/3] overflow-hidden rounded-t-2xl relative">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
           {id && user && (
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 handleSaveToggle();
               }}
               className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
             >
               <Heart className={`w-4 h-4 ${isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
             </button>
           )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-base text-primary mb-2 leading-tight">
            {title}
          </h3>
           <StarRating rating={rating} reviewCount={reviewCount} />
          <p className="text-muted-foreground text-sm leading-relaxed flex-1">
            {description}
          </p>
           <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/30">
             <button
               onClick={() => setOpen(true)}
               className="flex-1 text-primary font-semibold text-sm hover:text-primary/80 transition-colors text-left"
             >
               Enquire →
             </button>
             {id && user && (
               <>
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     setBookingOpen(true);
                   }}
                   className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                   title="Book Consultation"
                 >
                   <Calendar className="w-4 h-4" />
                 </button>
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     setReviewOpen(true);
                   }}
                   className="p-1.5 text-muted-foreground hover:text-yellow-500 transition-colors"
                   title="Write Review"
                 >
                   <Star className="w-4 h-4" />
                 </button>
               </>
             )}
           </div>
        </div>
      </motion.article>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">Enquire About</DialogTitle>
            <DialogDescription className="text-primary font-medium">
              {title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                required
                maxLength={100}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                maxLength={20}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Your phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                maxLength={255}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                maxLength={2000}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Your message (optional)"
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Enquiry"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
 
       {id && (
         <>
           <BookingDialog
             open={bookingOpen}
             onOpenChange={setBookingOpen}
             serviceId={id}
             serviceName={title}
           />
           <ReviewDialog
             open={reviewOpen}
             onOpenChange={setReviewOpen}
             serviceId={id}
             serviceName={title}
           />
         </>
       )}
    </>
  );
};

export default ServiceCard;
