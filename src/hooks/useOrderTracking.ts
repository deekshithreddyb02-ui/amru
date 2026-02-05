 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface OrderTracking {
   id: string;
   user_id: string;
   booking_id: string | null;
   enquiry_id: string | null;
   status: "enquiry_received" | "site_visit_scheduled" | "survey_in_progress" | "report_generated" | "work_started" | "completed";
   status_message: string | null;
   expected_completion: string | null;
   created_at: string;
   updated_at: string;
   bookings?: { booking_date: string; services: { title: string } | null } | null;
   contact_messages?: { service: string; created_at: string } | null;
 }
 
 export const useOrderTracking = () => {
   const [orders, setOrders] = useState<OrderTracking[]>([]);
   const [loading, setLoading] = useState(true);
 
   const fetchOrders = async () => {
     setLoading(true);
     const { data, error } = await supabase
       .from("order_tracking")
       .select("*, bookings(booking_date, services(title)), contact_messages(service, created_at)")
       .order("updated_at", { ascending: false });
 
     if (!error && data) {
       setOrders(data as OrderTracking[]);
     }
     setLoading(false);
   };
 
   useEffect(() => {
     fetchOrders();
   }, []);
 
   return { orders, loading, refetch: fetchOrders };
 };