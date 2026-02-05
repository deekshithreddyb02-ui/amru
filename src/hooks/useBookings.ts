 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface Booking {
   id: string;
   user_id: string;
   service_id: string | null;
   booking_date: string;
   booking_time: string;
   status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
   notes: string | null;
   location: string | null;
   phone: string | null;
   created_at: string;
   services?: { title: string; image: string } | null;
 }
 
 export const useBookings = () => {
   const [bookings, setBookings] = useState<Booking[]>([]);
   const [loading, setLoading] = useState(true);
 
   const fetchBookings = async () => {
     setLoading(true);
     const { data, error } = await supabase
       .from("bookings")
       .select("*, services(title, image)")
       .order("booking_date", { ascending: false });
 
     if (!error && data) {
       setBookings(data as Booking[]);
     }
     setLoading(false);
   };
 
   useEffect(() => {
     fetchBookings();
   }, []);
 
   const createBooking = async (booking: {
     service_id: string;
     booking_date: string;
     booking_time: string;
     notes?: string;
     location?: string;
     phone?: string;
   }) => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return { error: "Not authenticated" };
 
     const { error } = await supabase.from("bookings").insert({
       ...booking,
       user_id: user.id,
     });
 
     if (!error) await fetchBookings();
     return { error: error?.message || null };
   };
 
   const cancelBooking = async (id: string) => {
     const { error } = await supabase
       .from("bookings")
       .update({ status: "cancelled" })
       .eq("id", id);
 
     if (!error) await fetchBookings();
     return { error: error?.message || null };
   };
 
   return { bookings, loading, createBooking, cancelBooking, refetch: fetchBookings };
 };