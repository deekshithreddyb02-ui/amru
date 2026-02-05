 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { MessageSquare, Clock } from "lucide-react";
 import { format } from "date-fns";
 
 interface Enquiry {
   id: string;
   name: string;
   email: string;
   phone: string | null;
   service: string | null;
   message: string;
   created_at: string;
   is_read: boolean | null;
 }
 
 const EnquiriesTab = () => {
   const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const fetchEnquiries = async () => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;
 
       const { data } = await supabase
         .from("contact_messages")
         .select("*")
         .eq("email", user.email)
         .order("created_at", { ascending: false });
 
       if (data) setEnquiries(data);
       setLoading(false);
     };
 
     fetchEnquiries();
   }, []);
 
   if (loading) {
     return <div className="text-center py-8 text-muted-foreground">Loading enquiries...</div>;
   }
 
   if (enquiries.length === 0) {
     return (
       <Card>
         <CardContent className="py-12 text-center">
           <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
           <h3 className="font-semibold text-lg mb-2">No Enquiries Yet</h3>
           <p className="text-muted-foreground">Your submitted enquiries will appear here.</p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <div className="space-y-4">
       {enquiries.map((enquiry) => (
         <Card key={enquiry.id}>
           <CardHeader className="pb-2">
             <div className="flex items-start justify-between">
               <div>
                 <CardTitle className="text-lg">{enquiry.service || "General Enquiry"}</CardTitle>
                 <CardDescription className="flex items-center gap-1 mt-1">
                   <Clock className="w-3 h-3" />
                   {format(new Date(enquiry.created_at), "PPp")}
                 </CardDescription>
               </div>
               <Badge variant={enquiry.is_read ? "secondary" : "default"}>
                 {enquiry.is_read ? "Reviewed" : "Pending"}
               </Badge>
             </div>
           </CardHeader>
           <CardContent>
             <p className="text-muted-foreground text-sm">{enquiry.message}</p>
           </CardContent>
         </Card>
       ))}
     </div>
   );
 };
 
 export default EnquiriesTab;