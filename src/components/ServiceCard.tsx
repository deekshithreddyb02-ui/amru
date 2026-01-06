import { motion } from "framer-motion";

interface ServiceCardProps {
  title: string;
  description: string;
  image: string;
  link?: string;
  delay?: number;
}

const ServiceCard = ({ title, description, image, link, delay = 0 }: ServiceCardProps) => {
  return (
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
        <h3 className="font-serif font-semibold text-lg text-foreground mb-2 leading-tight line-clamp-2 min-h-[3.5rem]">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 flex-grow line-clamp-3 min-h-[3.75rem]">
          {description}
        </p>
        <a
          href={link || "#contact"}
          target={link ? "_blank" : undefined}
          rel={link ? "noopener noreferrer" : undefined}
          className="inline-flex items-center text-primary font-medium text-sm hover:text-secondary transition-colors"
        >
          Enquire →
        </a>
      </div>
    </motion.article>
  );
};

export default ServiceCard;
