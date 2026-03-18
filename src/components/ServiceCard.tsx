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
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border/30 shadow-[0_25px_60px_-15px_hsl(var(--primary)/0.15)] bg-gradient-to-b from-background via-background to-muted/20">
          {/* Header band */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent border-b border-border/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
            <DialogHeader className="relative">
              <DialogTitle className="text-lg font-serif tracking-tight text-foreground">
                Enquire About
              </DialogTitle>
              <DialogDescription className="text-primary font-semibold text-base">
                {title}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 pb-6">
            <EnquiryForm
              serviceTitle={title}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ServiceCard;
