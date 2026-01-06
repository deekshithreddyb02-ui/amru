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
          scale: 1.05, 
          y: -8,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)"
        }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.3 }}
        className="service-card h-full flex flex-col cursor-pointer"
      >
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="font-serif font-semibold text-lg text-foreground mb-2 leading-tight">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 flex-grow">
            {description}
          </p>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center text-primary font-medium text-sm hover:text-secondary transition-colors text-left"
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
