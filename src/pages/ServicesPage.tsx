 import { useState, useEffect, useMemo } from "react";
 import { motion } from "framer-motion";
 import Navbar from "@/components/Navbar";
 import ServiceCard from "@/components/ServiceCard";
 import ServiceSearch from "@/components/ServiceSearch";
 import CommunicationBar from "@/components/CommunicationBar";
 import FloatingActions from "@/components/FloatingActions";
 import { supabase } from "@/integrations/supabase/client";
 
 interface Service {
   id: string;
   title: string;
   description: string;
   image: string;
   link?: string;
 }
 
 const ServicesPage = () => {
   const [services, setServices] = useState<Service[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState("");
   const [sortBy, setSortBy] = useState("default");
 
   useEffect(() => {
     const fetchServices = async () => {
       const { data, error } = await supabase
         .from("services")
         .select("*")
         .order("display_order");
 
       if (!error && data) {
         setServices(data);
       }
       setLoading(false);
     };
 
     fetchServices();
   }, []);
 
   const filteredServices = useMemo(() => {
     let result = [...services];
 
     // Search filter
     if (searchQuery) {
       const query = searchQuery.toLowerCase();
       result = result.filter(
         (s) =>
           s.title.toLowerCase().includes(query) ||
           s.description.toLowerCase().includes(query)
       );
     }
 
     // Sort
     if (sortBy === "name") {
       result.sort((a, b) => a.title.localeCompare(b.title));
     }
 
     return result;
   }, [services, searchQuery, sortBy]);
 
   return (
     <div className="min-h-screen bg-muted/30">
       <Navbar />
       <main className="pt-20 pb-20">
         <div className="container mx-auto px-4">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
           >
             <div className="text-center mb-8">
               <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                 Our Services
               </h1>
               <p className="text-muted-foreground max-w-2xl mx-auto">
                 Comprehensive water management and environmental consulting solutions
                 backed by 35 years of expertise.
               </p>
             </div>
 
             <ServiceSearch
               onSearch={setSearchQuery}
               onFilter={() => {}}
               onSort={setSortBy}
             />
 
             {loading ? (
               <div className="text-center py-12 text-muted-foreground">Loading services...</div>
             ) : filteredServices.length === 0 ? (
               <div className="text-center py-12">
                 <p className="text-muted-foreground">No services found matching your search.</p>
               </div>
             ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {filteredServices.map((service, index) => (
                   <ServiceCard
                     key={service.id}
                     id={service.id}
                     title={service.title}
                     description={service.description}
                     image={service.image}
                     link={service.link}
                     delay={index * 0.05}
                   />
                 ))}
               </div>
             )}
           </motion.div>
         </div>
       </main>
       <CommunicationBar />
       <FloatingActions />
     </div>
   );
 };
 
 export default ServicesPage;