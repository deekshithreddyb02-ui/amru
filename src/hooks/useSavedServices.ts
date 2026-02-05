 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface SavedService {
   id: string;
   user_id: string;
   service_id: string;
   created_at: string;
   services?: { id: string; title: string; image: string; description: string } | null;
 }
 
 export const useSavedServices = () => {
   const [savedServices, setSavedServices] = useState<SavedService[]>([]);
   const [loading, setLoading] = useState(true);
 
   const fetchSavedServices = async () => {
     setLoading(true);
     const { data, error } = await supabase
       .from("saved_services")
       .select("*, services(id, title, image, description)")
       .order("created_at", { ascending: false });
 
     if (!error && data) {
       setSavedServices(data as SavedService[]);
     }
     setLoading(false);
   };
 
   useEffect(() => {
     fetchSavedServices();
   }, []);
 
   const saveService = async (serviceId: string) => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return { error: "Not authenticated" };
 
     const { error } = await supabase.from("saved_services").insert({
       service_id: serviceId,
       user_id: user.id,
     });
 
     if (!error) await fetchSavedServices();
     return { error: error?.message || null };
   };
 
   const removeSavedService = async (serviceId: string) => {
     const { error } = await supabase
       .from("saved_services")
       .delete()
       .eq("service_id", serviceId);
 
     if (!error) await fetchSavedServices();
     return { error: error?.message || null };
   };
 
   const isServiceSaved = (serviceId: string) => {
     return savedServices.some((s) => s.service_id === serviceId);
   };
 
   return { savedServices, loading, saveService, removeSavedService, isServiceSaved, refetch: fetchSavedServices };
 };