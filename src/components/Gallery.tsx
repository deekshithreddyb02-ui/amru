import { motion } from "framer-motion";
import { useGallery } from "@/hooks/useGallery";
import { Loader2 } from "lucide-react";

const Gallery = () => {
  const { images, loading } = useGallery();

  const visibleImages = images.filter(img => img.is_visible);

  if (loading) {
    return (
      <section id="gallery" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (visibleImages.length === 0) return null;

  return (
    <section id="gallery" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="section-heading">Our Gallery</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            A glimpse of our work and projects
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative group overflow-hidden rounded-xl aspect-square"
            >
              <img
                src={image.image_url}
                alt={image.caption || "Gallery image"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              {image.caption && (
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/50 transition-all duration-300 flex items-end">
                  <p className="text-background text-sm p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {image.caption}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
