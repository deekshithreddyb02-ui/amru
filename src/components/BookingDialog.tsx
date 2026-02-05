 import { useState } from "react";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Calendar } from "@/components/ui/calendar";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { CalendarIcon, Loader2 } from "lucide-react";
 import { format } from "date-fns";
 import { cn } from "@/lib/utils";
 import { useBookings } from "@/hooks/useBookings";
 import { useToast } from "@/hooks/use-toast";
 
 interface BookingDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   serviceId: string;
   serviceName: string;
 }
 
 const timeSlots = [
   "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"
 ];
 
 const BookingDialog = ({ open, onOpenChange, serviceId, serviceName }: BookingDialogProps) => {
   const [date, setDate] = useState<Date>();
   const [time, setTime] = useState("");
   const [location, setLocation] = useState("");
   const [phone, setPhone] = useState("");
   const [notes, setNotes] = useState("");
   const [loading, setLoading] = useState(false);
 
   const { createBooking } = useBookings();
   const { toast } = useToast();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!date || !time) {
       toast({ title: "Error", description: "Please select date and time", variant: "destructive" });
       return;
     }
 
     setLoading(true);
     const { error } = await createBooking({
       service_id: serviceId,
       booking_date: format(date, "yyyy-MM-dd"),
       booking_time: time,
       location: location || undefined,
       phone: phone || undefined,
       notes: notes || undefined,
     });
 
     setLoading(false);
 
     if (error) {
       toast({ title: "Error", description: error, variant: "destructive" });
     } else {
       toast({ title: "Booking Confirmed!", description: "We'll contact you to confirm your appointment." });
       onOpenChange(false);
       // Reset form
       setDate(undefined);
       setTime("");
       setLocation("");
       setPhone("");
       setNotes("");
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle>Book Consultation</DialogTitle>
           <DialogDescription>{serviceName}</DialogDescription>
         </DialogHeader>
 
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-2">
             <Label>Select Date</Label>
             <Popover>
               <PopoverTrigger asChild>
                 <Button
                   variant="outline"
                   className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                 >
                   <CalendarIcon className="mr-2 h-4 w-4" />
                   {date ? format(date, "PPP") : "Pick a date"}
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-auto p-0" align="start">
                 <Calendar
                   mode="single"
                   selected={date}
                   onSelect={setDate}
                   disabled={(date) => date < new Date()}
                   initialFocus
                 />
               </PopoverContent>
             </Popover>
           </div>
 
           <div className="space-y-2">
             <Label>Select Time</Label>
             <Select value={time} onValueChange={setTime}>
               <SelectTrigger>
                 <SelectValue placeholder="Choose a time slot" />
               </SelectTrigger>
               <SelectContent>
                 {timeSlots.map((slot) => (
                   <SelectItem key={slot} value={slot}>
                     {slot}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="phone">Phone Number</Label>
             <Input
               id="phone"
               type="tel"
               placeholder="+91 9876543210"
               value={phone}
               onChange={(e) => setPhone(e.target.value)}
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="location">Site Location</Label>
             <Input
               id="location"
               placeholder="Address for site visit"
               value={location}
               onChange={(e) => setLocation(e.target.value)}
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="notes">Additional Notes</Label>
             <Textarea
               id="notes"
               placeholder="Any specific requirements..."
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               rows={3}
             />
           </div>
 
           <Button type="submit" className="w-full" disabled={loading}>
             {loading ? (
               <>
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                 Booking...
               </>
             ) : (
               "Confirm Booking"
             )}
           </Button>
         </form>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default BookingDialog;