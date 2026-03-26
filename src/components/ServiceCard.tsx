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
import CrmStateSelector from "@/components/CrmStateSelector";

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
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ y: -6, transition: { duration: 0.25 } }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4, delay }}
        className="group bg-card rounded-2xl h-full flex flex-col cursor-pointer border border-border/50 overflow-hidden transition-shadow duration-500"
        style={{ boxShadow: 'var(--card-shadow)' }}
        onMouseEnter={(e) => {(e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow-hover)';}}
        onMouseLeave={(e) => {(e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow)';}}>
        
        <div className="overflow-hidden aspect-[4/3] bg-muted/20">
          <img
            src={image}
            alt={title}
            width={400}
            height={300}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px" />
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-sm text-foreground mb-2 leading-tight text-center" style={{ fontFamily: 'var(--font-serif)' }}>
            {title}
          </h3>
          <div className="flex-1">
            <p className="text-muted-foreground text-xs leading-relaxed line-clamp-5 text-center">
              {description}
            </p>
            <button
              type="button"
              className="text-xs font-medium mt-1 text-primary hover:text-primary/80 transition-colors text-center"
              onClick={(e) => {e.stopPropagation();setDetailOpen(true);}}>
              Read more
            </button>
          </div>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center font-semibold text-xs mt-3 pt-2.5 border-t border-border/30 transition-colors duration-300"
              style={{ color: 'hsl(var(--secondary))' }}>
              Visit App →
            </a>
          ) : (
            <button
              onClick={() => { setOpen(true); setShowForm(false); }}
              className="inline-flex items-center text-primary font-semibold text-xs hover:text-primary/80 transition-colors text-left mt-3 pt-2.5 border-t border-border/30">
              Enquire →
            </button>
          )}
        </div>
      </motion.article>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl" style={{ fontFamily: 'var(--font-serif)' }}>{title}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {description}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowForm(false); }}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl border-border/30"
        style={{ boxShadow: '0 25px 60px -15px hsl(var(--primary) / 0.15)', background: 'linear-gradient(180deg, hsl(var(--background)), hsl(var(--muted) / 0.4))' }}>
          <div className="relative px-6 pt-6 pb-4 border-b border-border/30"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.04), transparent)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none"
            style={{ background: 'hsl(var(--primary) / 0.03)' }} />
            <DialogHeader className="relative">
              <DialogTitle className="text-lg tracking-tight text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
                {showForm ? "Enquiry Form" : "Enquire About"}
              </DialogTitle>
              <DialogDescription className="font-semibold text-base" style={{ color: 'hsl(var(--primary))' }}>
                {title}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 pb-6 max-h-[65vh] overflow-y-auto">
            {showForm ? (
              <EnquiryForm serviceTitle={title} onSuccess={() => setOpen(false)} />
            ) : (
              <CrmStateSelector onFillFormHere={() => setShowForm(true)} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ServiceCard;
