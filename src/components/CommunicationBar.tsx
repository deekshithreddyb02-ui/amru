 import { Phone, MessageCircle } from "lucide-react";
 import { Button } from "@/components/ui/button";
 
 interface CommunicationBarProps {
   phone?: string;
   whatsapp?: string;
   className?: string;
 }
 
 const CommunicationBar = ({ 
   phone = "+919822035499", 
   whatsapp = "+919822035499",
   className = "" 
 }: CommunicationBarProps) => {
   const handleCall = () => {
     window.location.href = `tel:${phone}`;
   };
 
   const handleWhatsApp = () => {
     const message = encodeURIComponent("Hi, I'm interested in your water solutions services.");
     window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${message}`, "_blank");
   };
 
   return (
     <div className={`fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg lg:hidden ${className}`}>
       <div className="flex items-center gap-2 p-3">
         <Button 
           onClick={handleCall} 
           className="flex-1 bg-primary hover:bg-primary/90"
         >
           <Phone className="w-4 h-4 mr-2" />
           Call Now
         </Button>
         <Button 
           onClick={handleWhatsApp} 
           className="flex-1 bg-green-600 hover:bg-green-700"
         >
           <MessageCircle className="w-4 h-4 mr-2" />
           WhatsApp
         </Button>
       </div>
     </div>
   );
 };
 
 export default CommunicationBar;