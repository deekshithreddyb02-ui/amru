import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNoMotion } from "@/hooks/useNoMotion";
import EnquiryForm from "@/components/EnquiryForm";
import { toast } from "sonner";

interface OfficeContact {city: string;phone?: string;whatsapp?: string;email?: string;}

const defaultOfficeContacts: OfficeContact[] = [
{ city: "Pune", phone: "+91-741-0030-418", whatsapp: "917410030418", email: "rain@amrutawater.com" },
{ city: "Hyderabad", phone: "+91-741-0030-417", whatsapp: "917410030417", email: "rain@amrutawater.com" },
{ city: "Mumbai", phone: "+91-741-0030-418", whatsapp: "917410030418", email: "rain@amrutawater.com" },
{ city: "Bangalore", phone: "+91-741-0030-417", whatsapp: "917410030417", email: "rain@amrutawater.com" }];


const Contact = () => {
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
      } catch {/* defaults */}
    };
    fetchData();
  }, []);

  return (
    <section id="contact" className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'var(--section-gradient-alt)' }}>
      <div className="container mx-auto px-4">
        <motion.div {...m({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })} className="text-center mb-14">
          
          <h2 className="section-heading mb-4">Get In Touch</h2>
          <p className="section-subheading">Ready to start your project? Contact our team for consultations, quotes, or any inquiries.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div {...m({ initial: { opacity: 0, x: -30 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })} className="space-y-5">
            <div className="bg-card p-6 rounded-2xl border border-border" style={{ boxShadow: 'var(--card-shadow)' }}>
              <h3 className="font-bold text-lg text-foreground mb-4 text-center" style={{ fontFamily: 'var(--font-serif)' }}>Contact Information</h3>
              <div className="flex items-center gap-3 mb-5 p-3 rounded-xl border border-border" style={{ background: 'hsl(var(--primary) / 0.04)' }}>
                <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <div className="font-semibold text-foreground text-base">Business Hours</div>
                  <div className="text-xs text-muted-foreground">Mon – Sun: 9:00 AM to 6:00 PM</div>
                </div>
              </div>
              <div className="space-y-4 text-left">
                {officeContacts.map((contact) =>
                <div key={contact.city} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 mt-0.5 items-center justify-center mx-[3px] flex flex-row" style={{ background: 'hsl(var(--primary) / 0.08)' }}>
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-base">{contact.city}</div>
                      {contact.phone && <a href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`} className="text-muted-foreground hover:text-primary transition-colors block text-sm">{contact.phone}</a>}
                      {contact.email && <a href={`mailto:${contact.email}`} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-sm"><Mail className="w-3 h-3" />{contact.email}</a>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div {...m({ initial: { opacity: 0, x: 30 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })}
          className="bg-card p-6 md:p-8 rounded-2xl border border-border" style={{ boxShadow: 'var(--card-shadow)' }}>
            <h3 className="font-bold text-lg text-foreground mb-6 text-center" style={{ fontFamily: 'var(--font-serif)' }}>Send Us a Message</h3>
            <EnquiryForm serviceTitle="General Enquiry" onSuccess={() => toast.success("Message sent successfully!")} />
          </motion.div>
        </div>
      </div>
    </section>);

};

export default Contact;