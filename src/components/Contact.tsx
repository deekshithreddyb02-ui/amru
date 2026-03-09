import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Office {
  city: string;
  address: string;
  lat?: number;
  lng?: number;
}

interface OfficeContact {
  city: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
}

const defaultOffices: Office[] = [{
  city: "Pune",
  address: "301, Fortuna Business Park, Shivar Chowk, Pimple Saudagar, Pimpri Chinchwad, Pune, Maharashtra - 411061"
}, {
  city: "Hyderabad",
  address: "Head Office - Hyderabad, Telangana"
}, {
  city: "Mumbai",
  address: "Branch Office - Mumbai, Maharashtra"
}, {
  city: "Bangalore",
  address: "Branch Office - Bangalore, Karnataka"
}];

const defaultOfficeContacts: OfficeContact[] = [
{ city: "Pune", phone: "+91-741-0030-418", whatsapp: "917410030418", email: "rain@amrutawater.com" },
{ city: "Hyderabad", phone: "+91-741-0030-417", whatsapp: "917410030417", email: "rain@amrutawater.com" },
{ city: "Mumbai", phone: "+91-741-0030-418", whatsapp: "917410030418", email: "rain@amrutawater.com" },
{ city: "Bangalore", phone: "+91-741-0030-417", whatsapp: "917410030417", email: "rain@amrutawater.com" }];


const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offices, setOffices] = useState<Office[]>(defaultOffices);
  const [officeContacts, setOfficeContacts] = useState<OfficeContact[]>(defaultOfficeContacts);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.
        from("site_content").
        select("section_key, metadata").
        in("section_key", ["offices", "contact_details"]);

        if (!error && data) {
          data.forEach((row) => {
            const metadata = row.metadata as Record<string, any>;
            if (row.section_key === "offices" && metadata?.offices?.length > 0) {
              setOffices(metadata.offices);
            }
            if (row.section_key === "contact_details") {
              if (Array.isArray(metadata?.offices) && metadata.offices.length > 0) {
                setOfficeContacts(metadata.offices);
              }
            }
          });
        }
      } catch {

        // Use defaults on error
      }};

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = (formData.get('name') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim() || null;
    const service = (formData.get('service') as string)?.trim() || null;
    const message = (formData.get('message') as string)?.trim() || '';

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
      const { error } = await supabase.
      from('contact_messages').
      insert({
        name,
        email,
        phone,
        service,
        message
      });

      if (error) throw error;

      toast.success("Thank you! Your inquiry has been received. We will contact you shortly.");
      form.reset();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error("Failed to submit. Please try calling us at +91-741-0030-418.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="text-center mb-12">
          <h2 className="section-heading mb-4">Contact Us</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get in touch with our team for consultations, quotes, or any inquiries.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Info */}
          <motion.div initial={{
            opacity: 0,
            x: -20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }} className="space-y-6">
            {/* Phone & Email */}
            <div className="bg-card p-6 rounded-xl border border-border" style={{
              boxShadow: "var(--card-shadow)"
            }}>
              <h3 className="font-serif font-semibold text-xl text-foreground mb-4">
                Get In Touch
              </h3>
              <div className="space-y-4">
                {officeContacts.map((contact) =>
                <div key={contact.city} className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground">{contact.city}</div>
                      {contact.phone &&
                    <a href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`} className="text-sm text-muted-foreground hover:text-primary transition-colors block">
                          {contact.phone}
                        </a>
                    }
                      {contact.email &&
                    <a href={`mailto:${contact.email}`} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </a>
                    }
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Offices */}
            














            

          </motion.div>

          {/* Contact Form */}
          <motion.div initial={{
            opacity: 0,
            x: 20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }} className="bg-card p-6 md:p-8 rounded-xl border border-border h-fit" style={{
            boxShadow: "var(--card-shadow)"
          }}>
            <h3 className="font-serif font-semibold text-xl text-foreground mb-6">
              Send Us a Message
            </h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    maxLength={100}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                    placeholder="Your name" />
                  
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    maxLength={20}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                    placeholder="+91 XXXXX XXXXX" />
                  
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  maxLength={255}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  placeholder="you@example.com" />
                
              </div>
              <div>
                <label htmlFor="service" className="block text-sm font-medium text-foreground mb-1">
                  Service Interested In
                </label>
                <select id="service" name="service" className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow">
                  <option value="">Select a service</option>
                  <option>Rainwater Harvesting</option>
                  <option>Ground Water Survey</option>
                  <option>Water Audit / ZLD</option>
                  <option>EC & MEP Consulting</option>
                  <option>STP / ETP Solutions</option>
                  <option>GPR & Thermal Scanning</option>
                  <option>CGWB Registration</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  maxLength={2000}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-none"
                  placeholder="Tell us about your project..." />
                
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                
                {isSubmitting ?
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </> :

                "Send Enquiry"
                }
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>);

};

export default Contact;