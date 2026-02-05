 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { LayoutDashboard, Calendar, Heart, Package } from "lucide-react";
 import EnquiriesTab from "./EnquiriesTab";
 import BookingsTab from "./BookingsTab";
 import SavedServicesTab from "./SavedServicesTab";
 import OrderTrackingTab from "./OrderTrackingTab";
 
 const DashboardTabs = () => {
   return (
     <Tabs defaultValue="enquiries" className="w-full">
       <TabsList className="grid w-full grid-cols-4 mb-6">
         <TabsTrigger value="enquiries" className="flex items-center gap-2">
           <LayoutDashboard className="w-4 h-4" />
           <span className="hidden sm:inline">Enquiries</span>
         </TabsTrigger>
         <TabsTrigger value="bookings" className="flex items-center gap-2">
           <Calendar className="w-4 h-4" />
           <span className="hidden sm:inline">Bookings</span>
         </TabsTrigger>
         <TabsTrigger value="saved" className="flex items-center gap-2">
           <Heart className="w-4 h-4" />
           <span className="hidden sm:inline">Saved</span>
         </TabsTrigger>
         <TabsTrigger value="tracking" className="flex items-center gap-2">
           <Package className="w-4 h-4" />
           <span className="hidden sm:inline">Track Order</span>
         </TabsTrigger>
       </TabsList>
 
       <TabsContent value="enquiries">
         <EnquiriesTab />
       </TabsContent>
 
       <TabsContent value="bookings">
         <BookingsTab />
       </TabsContent>
 
       <TabsContent value="saved">
         <SavedServicesTab />
       </TabsContent>
 
       <TabsContent value="tracking">
         <OrderTrackingTab />
       </TabsContent>
     </Tabs>
   );
 };
 
 export default DashboardTabs;