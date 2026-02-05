 import { useEffect, useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { User } from "@supabase/supabase-js";
 import Navbar from "@/components/Navbar";
 import DashboardTabs from "@/components/dashboard/DashboardTabs";
 import { motion } from "framer-motion";
 
 const Dashboard = () => {
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState(true);
   const navigate = useNavigate();
 
   useEffect(() => {
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (event, session) => {
         setUser(session?.user ?? null);
         setLoading(false);
         if (!session?.user) {
           navigate("/auth");
         }
       }
     );
 
     supabase.auth.getSession().then(({ data: { session } }) => {
       setUser(session?.user ?? null);
       setLoading(false);
       if (!session?.user) {
         navigate("/auth");
       }
     });
 
     return () => subscription.unsubscribe();
   }, [navigate]);
 
   const getUserDisplayName = () => {
     if (!user) return "";
     const metadata = user.user_metadata;
     if (metadata?.full_name) return metadata.full_name;
     if (metadata?.name) return metadata.name;
     const emailName = user.email?.split("@")[0] || "";
     return emailName.split(/[._-]/).map(word => 
       word.charAt(0).toUpperCase() + word.slice(1)
     ).join(" ");
   };
 
   if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <div className="text-muted-foreground">Loading...</div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-muted/30">
       <Navbar />
       <main className="pt-20 pb-12">
         <div className="container mx-auto px-4">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
           >
             <div className="mb-8">
               <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                 Welcome, {getUserDisplayName()}!
               </h1>
               <p className="text-muted-foreground">
                 Manage your enquiries, bookings, and track your projects.
               </p>
             </div>
 
             <DashboardTabs />
           </motion.div>
         </div>
       </main>
     </div>
   );
 };
 
 export default Dashboard;