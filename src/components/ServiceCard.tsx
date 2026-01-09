import { useState } from "react";
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

interface ServiceCardProps {
  title: string;
  description: string;
  image: string;
  link?: string;
  delay?: number;
}

const ServiceCard = ({ title, description, image, delay = 0 }: ServiceCardProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Enquiry submitted successfully! We'll contact you soon.");
    setFormData({ name: "", phone: "", email: "", message: "" });
    setOpen(false);
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
        className="bg-white rounded-t-[2rem] rounded-b-lg h-full flex flex-col cursor-pointer shadow-sm border border-border/50 overflow-hidden"
      >
        <div className="aspect-[4/3] overflow-hidden rounded-t-[2rem]">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-bold text-base text-primary mb-2 leading-tight">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 flex-grow leading-relaxed">
            {description}
          </p>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center text-primary font-semibold text-sm hover:text-primary/80 transition-colors text-left mt-auto"
          >
            Enquire →
          </button>
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                required
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
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Your message (optional)"
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full">
              Submit Enquiry
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ServiceCard;
