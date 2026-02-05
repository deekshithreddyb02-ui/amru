 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface Review {
   id: string;
   user_id: string;
   service_id: string;
   rating: number;
   title: string | null;
   content: string | null;
   is_verified: boolean;
   created_at: string;
 }
 
 export const useReviews = (serviceId?: string) => {
   const [reviews, setReviews] = useState<Review[]>([]);
   const [loading, setLoading] = useState(true);
   const [averageRating, setAverageRating] = useState(0);
 
   const fetchReviews = async () => {
     setLoading(true);
     let query = supabase
       .from("reviews")
       .select("*")
       .order("created_at", { ascending: false });
 
     if (serviceId) {
       query = query.eq("service_id", serviceId);
     }
 
     const { data, error } = await query;
 
     if (!error && data) {
       setReviews(data as Review[]);
       if (data.length > 0) {
         const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
         setAverageRating(Math.round(avg * 10) / 10);
       }
     }
     setLoading(false);
   };
 
   useEffect(() => {
     fetchReviews();
   }, [serviceId]);
 
   const createReview = async (review: {
     service_id: string;
     rating: number;
     title?: string;
     content?: string;
   }) => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return { error: "Not authenticated" };
 
     const { error } = await supabase.from("reviews").insert({
       ...review,
       user_id: user.id,
     });
 
     if (!error) await fetchReviews();
     return { error: error?.message || null };
   };
 
   return { reviews, loading, averageRating, createReview, refetch: fetchReviews };
 };