import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Loader2, Send, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNoMotion } from "@/hooks/useNoMotion";

interface OfficeContact { city: string; phone?: string; whatsapp?: string; email?: string; }

const defaultOfficeContacts: OfficeContact[] = [
  { city: "Pune", phone: "+91-741-0030-418", whatsapp: "917410030418", email: "rain@amrutawater.com" },
  { city: "Hyderabad", phone: "+91-741-0030-417", whatsapp: "917410030417", email: "rain@amrutawater.com" },
  { city: "Mumbai", phone: "+91-741-0030-418", whatsapp: "917410030418", email: "rain@amrutawater.com" },
  { city: "Bangalore", phone: "+91-741-0030-417", whatsapp: "917410030417", email: "rain@amrutawater.com" },
];

const inputCls = "w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300 placeholder:text-muted-foreground/60";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [officeContacts, setOfficeContacts] = useState<OfficeContact[]>(defaultOfficeContacts);
  const noMotion = useNoMotion();
  const m = (props: Record<string, unknown>) => noMotion ? {} : props;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from("site_content").select("section_key, metadata").in("section_key", ["offices", "contact_details"]);
        if (!error && data) {
          data.forEach((row) => {
            const metadata = row.metadata as Record<string, unknown>;
            if (row.section_key === "contact_details" && Array.isArray(metadata?.offices) && (metadata.offices as OfficeContact[]).length > 0) {
              setOfficeContacts(metadata.offices as OfficeContact[]);
            }
          });
        }
      } catch { /* defaults */ }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = (fd.get('name') as string)?.trim();
    const email = (fd.get('email') as string)?.trim();
    const phone = (fd.get('phone') as string)?.trim() || null;
    const service = (fd.get('service') as string)?.trim() || null;
    const message = (fd.get('message') as string)?.trim() || '';

    if (!name || !email) { toast.error("Please fill in all required fields."); setIsSubmitting(false); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Please enter a valid email address."); setIsSubmitting(false); return; }

    try {
      const { error } = await supabase.from('contact_messages').insert({ name, email, phone, service, message });
      if (error) throw error;
      toast.success("Thank you! Your inquiry has been received.");
      form.reset();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error("Failed to submit. Please try calling us.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'var(--section-gradient-alt)' }}>
      <div className="container mx-auto px-4">
        <motion.div {...m({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })} className="text-center mb-14">
          <div className="gold-accent mx-auto mb-6" />
          <h2 className="section-heading mb-4">Get In Touch</h2>
          <p className="section-subheading">Ready to start your project? Contact our team for consultations, quotes, or any inquiries.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div {...m({ initial: { opacity: 0, x: -30 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })} className="space-y-5">
            <div className="bg-card p-6 rounded-2xl border border-border" style={{ boxShadow: 'var(--card-shadow)' }}>
              <h3 className="font-bold text-lg text-foreground mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Contact Information</h3>
              <div className="flex items-center gap-3 mb-5 p-3 rounded-xl border border-border" style={{ background: 'hsl(var(--primary) / 0.04)' }}>
                <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <div className="font-semibold text-sm text-foreground">Business Hours</div>
                  <div className="text-xs text-muted-foreground">Mon – Sun: 9:00 AM to 6:00 PM</div>
                </div>
              </div>
              <div className="space-y-4">
                {officeContacts.map((contact) => (
                  <div key={contact.city} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'hsl(var(--primary) / 0.08)' }}>
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground">{contact.city}</div>
                      {contact.phone && <a href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`} className="text-xs text-muted-foreground hover:text-primary transition-colors block">{contact.phone}</a>}
                      {contact.email && <a href={`mailto:${contact.email}`} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div {...m({ initial: { opacity: 0, x: 30 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })}
            className="bg-card p-6 md:p-8 rounded-2xl border border-border" style={{ boxShadow: 'var(--card-shadow)' }}>
            <h3 className="font-bold text-lg text-foreground mb-6" style={{ fontFamily: 'var(--font-serif)' }}>Send Us a Message</h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">Name *</label>
                  <input type="text" id="name" name="name" required maxLength={100} className={inputCls} placeholder="Your name" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">Phone</label>
                  <input type="tel" id="phone" name="phone" maxLength={20} className={inputCls} placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">Email *</label>
                <input type="email" id="email" name="email" required maxLength={255} className={inputCls} placeholder="you@example.com" />
              </div>
              <div>
                <label htmlFor="service" className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">Service</label>
                <select id="service" name="service" className={inputCls}>
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
                <label htmlFor="message" className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">Message</label>
                <textarea id="message" name="message" rows={4} maxLength={2000} className={`${inputCls} resize-none`} placeholder="Tell us about your project..." />
              </div>
              <button type="submit" disabled={isSubmitting}
                className="w-full font-semibold py-3.5 px-6 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(200 60% 35%))', color: 'white', boxShadow: '0 4px 14px hsl(var(--primary) / 0.3)' }}>
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Send Enquiry</>}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
