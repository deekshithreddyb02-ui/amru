 import { useBookings } from "@/hooks/useBookings";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Calendar, Clock, MapPin, X } from "lucide-react";
 import { format } from "date-fns";
 import { useToast } from "@/hooks/use-toast";
 
 const statusColors: Record<string, string> = {
   pending: "bg-yellow-100 text-yellow-800",
   confirmed: "bg-blue-100 text-blue-800",
   in_progress: "bg-purple-100 text-purple-800",
   completed: "bg-green-100 text-green-800",
   cancelled: "bg-red-100 text-red-800",
 };
 
 const BookingsTab = () => {
   const { bookings, loading, cancelBooking } = useBookings();
   const { toast } = useToast();
 
   const handleCancel = async (id: string) => {
     const { error } = await cancelBooking(id);
     if (error) {
       toast({ title: "Error", description: error, variant: "destructive" });
     } else {
       toast({ title: "Booking Cancelled", description: "Your booking has been cancelled." });
     }
   };
 
   if (loading) {
     return <div className="text-center py-8 text-muted-foreground">Loading bookings...</div>;
   }
 
   if (bookings.length === 0) {
     return (
       <Card>
         <CardContent className="py-12 text-center">
           <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
           <h3 className="font-semibold text-lg mb-2">No Bookings Yet</h3>
           <p className="text-muted-foreground">Book a service consultation to get started.</p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <div className="space-y-4">
       {bookings.map((booking) => (
         <Card key={booking.id}>
           <CardHeader className="pb-2">
             <div className="flex items-start justify-between">
               <div>
                 <CardTitle className="text-lg">
                   {booking.services?.title || "Service Consultation"}
                 </CardTitle>
                 <CardDescription className="flex items-center gap-4 mt-1">
                   <span className="flex items-center gap-1">
                     <Calendar className="w-3 h-3" />
                     {format(new Date(booking.booking_date), "PPP")}
                   </span>
                   <span className="flex items-center gap-1">
                     <Clock className="w-3 h-3" />
                     {booking.booking_time}
                   </span>
                 </CardDescription>
               </div>
               <Badge className={statusColors[booking.status]}>
                 {booking.status.replace("_", " ")}
               </Badge>
             </div>
           </CardHeader>
           <CardContent>
             {booking.location && (
               <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                 <MapPin className="w-3 h-3" />
                 {booking.location}
               </p>
             )}
             {booking.notes && (
               <p className="text-sm text-muted-foreground">{booking.notes}</p>
             )}
             {booking.status === "pending" && (
               <Button
                 variant="outline"
                 size="sm"
                 className="mt-3"
                 onClick={() => handleCancel(booking.id)}
               >
                 <X className="w-4 h-4 mr-1" />
                 Cancel Booking
               </Button>
             )}
           </CardContent>
         </Card>
       ))}
     </div>
   );
 };
 
 export default BookingsTab;