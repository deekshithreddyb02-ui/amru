import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import EnquiryForm from "@/components/EnquiryForm";

interface ServiceCardProps {
  title: string;
  description: string;
  image: string;
  link?: string;
  delay?: number;
}

const ServiceCard = ({ title, description, image, link, delay = 0 }: ServiceCardProps) => {
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [detectedCity, setDetectedCity] = useState("");
  const [locationMapUrl, setLocationMapUrl] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
    location: "",
  });


  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.county || "";
          const state = data.address?.state || "";
          const displayLocation = [city, state].filter(Boolean).join(", ");
          const matched = matchCityToOption(city || state);
          setFormData((prev) => ({ ...prev, location: matched }));
          setDetectedCity(displayLocation);
          setLocationMapUrl(mapsUrl);
          toast.success(`Location detected: ${displayLocation}`);
        } catch {
          toast.error("Could not detect location. Please select manually.");
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        toast.error("Location access denied. Please select manually.");
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim() || null;
    const message = formData.message.trim() || '';

    if (!name || !email) {
      toast.error("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

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
          message: `${formData.location ? `[Location: ${formData.location}]` : ''}${locationMapUrl ? ` [Map: ${locationMapUrl}]` : ''} ${message}`.trim(),
        });

      if (error) throw error;

      toast.success("Enquiry submitted successfully! We'll contact you soon.");
      setFormData({ name: "", phone: "", email: "", message: "", location: "" });
      setLocationMapUrl("");
      setDetectedCity("");
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
        <div className="overflow-hidden rounded-t-2xl aspect-[4/3] bg-muted/20">
          <img
            src={image}
            alt={title}
            width={400}
            height={300}
            className="w-full h-full object-cover"
            loading="lazy"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
          />
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-base text-primary mb-2 leading-tight">
            {title}
          </h3>
          <div className="flex-1">
            <p
              className="text-muted-foreground text-sm leading-relaxed line-clamp-3 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setDetailOpen(true); }}
            >
              {description}
            </p>
          </div>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-primary font-semibold text-sm hover:text-primary/80 transition-colors text-left mt-3 pt-2 border-t border-border/30"
            >
              Visit App →
            </a>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center text-primary font-semibold text-sm hover:text-primary/80 transition-colors text-left mt-3 pt-2 border-t border-border/30"
            >
              Enquire →
            </button>
          )}
        </div>
      </motion.article>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">{title}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {description}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

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
              <Label htmlFor="location">Location *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select your location" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_OPTIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={detectLocation}
                  disabled={detectingLocation}
                  title="Detect my location"
                >
                  {detectingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {detectedCity && (
                <p className="text-xs text-muted-foreground">📍 Detected: {detectedCity}</p>
              )}
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
    </>
  );
};

export default ServiceCard;
