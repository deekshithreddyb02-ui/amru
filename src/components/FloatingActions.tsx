 import { useState } from "react";
 import { Phone, MessageCircle, X, MessageSquare } from "lucide-react";
 import { motion, AnimatePresence } from "framer-motion";
 
 interface FloatingActionsProps {
   phone?: string;
   whatsapp?: string;
 }
 
 const FloatingActions = ({ 
   phone = "+919822035499", 
   whatsapp = "+919822035499" 
 }: FloatingActionsProps) => {
   const [isOpen, setIsOpen] = useState(false);
 
   const handleCall = () => {
     window.location.href = `tel:${phone}`;
   };
 
   const handleWhatsApp = () => {
     const message = encodeURIComponent("Hi, I'm interested in your water solutions services.");
     window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${message}`, "_blank");
   };
 
   return (
     <div className="fixed bottom-20 right-4 z-40 hidden lg:flex flex-col items-end gap-3">
       <AnimatePresence>
         {isOpen && (
           <>
             <motion.button
               initial={{ opacity: 0, scale: 0.8, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.8, y: 20 }}
               transition={{ duration: 0.2 }}
               onClick={handleCall}
               className="flex items-center gap-2 bg-primary text-white px-4 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
             >
               <Phone className="w-5 h-5" />
               <span className="font-medium">Call Now</span>
             </motion.button>
 
             <motion.button
               initial={{ opacity: 0, scale: 0.8, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.8, y: 20 }}
               transition={{ duration: 0.2, delay: 0.05 }}
               onClick={handleWhatsApp}
               className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
             >
               <MessageCircle className="w-5 h-5" />
               <span className="font-medium">WhatsApp</span>
             </motion.button>
           </>
         )}
       </AnimatePresence>
 
       <motion.button
         whileHover={{ scale: 1.05 }}
         whileTap={{ scale: 0.95 }}
         onClick={() => setIsOpen(!isOpen)}
         className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
           isOpen ? "bg-muted-foreground" : "bg-primary"
         }`}
       >
         {isOpen ? (
           <X className="w-6 h-6 text-white" />
         ) : (
           <MessageSquare className="w-6 h-6 text-white" />
         )}
       </motion.button>
     </div>
   );
 };
 
 export default FloatingActions;