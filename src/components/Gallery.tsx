import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGallery } from "@/hooks/useGallery";
import { Loader2, X } from "lucide-react";

const Gallery = () => {
  const { images, loading } = useGallery();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const visibleImages = images.filter(img => img.is_visible);

  if (loading) {
    return (
      <section id="gallery" className="py-20">
        <div className="container mx-auto px-4 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (visibleImages.length === 0) return null;

  return (
    <section id="gallery" className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'var(--section-gradient-alt)' }}>
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-14">
          <div className="gold-accent mx-auto mb-6" />
          <h2 className="section-heading mb-4">Our Gallery</h2>
          <p className="section-subheading">A glimpse of our work and projects across India.</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.04 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="relative group cursor-pointer overflow-hidden rounded-2xl aspect-square"
              style={{ boxShadow: 'var(--card-shadow)' }}
              onClick={() => setSelectedImage(image.image_url)}
            >
              <img src={image.image_url} alt={image.caption || "Gallery image"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end">
                {image.caption && <p className="text-white text-sm p-4 font-medium">{image.caption}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'hsl(var(--foreground) / 0.9)' }} onClick={() => setSelectedImage(null)}>
            <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} src={selectedImage} alt="Gallery preview" className="max-w-full max-h-[90vh] object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Gallery;
