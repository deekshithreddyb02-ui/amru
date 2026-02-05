 import { useOrderTracking } from "@/hooks/useOrderTracking";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Package, CheckCircle, Clock, Truck, FileText, Hammer, Search } from "lucide-react";
 import { format } from "date-fns";
 
 const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
   enquiry_received: { label: "Enquiry Received", icon: FileText, color: "bg-blue-100 text-blue-800" },
   site_visit_scheduled: { label: "Site Visit Scheduled", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
   survey_in_progress: { label: "Survey In Progress", icon: Search, color: "bg-purple-100 text-purple-800" },
   report_generated: { label: "Report Generated", icon: FileText, color: "bg-indigo-100 text-indigo-800" },
   work_started: { label: "Work Started", icon: Hammer, color: "bg-orange-100 text-orange-800" },
   completed: { label: "Completed", icon: CheckCircle, color: "bg-green-100 text-green-800" },
 };
 
 const OrderTrackingTab = () => {
   const { orders, loading } = useOrderTracking();
 
   if (loading) {
     return <div className="text-center py-8 text-muted-foreground">Loading orders...</div>;
   }
 
   if (orders.length === 0) {
     return (
       <Card>
         <CardContent className="py-12 text-center">
           <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
           <h3 className="font-semibold text-lg mb-2">No Active Projects</h3>
           <p className="text-muted-foreground">Your project progress will be tracked here.</p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <div className="space-y-4">
       {orders.map((order) => {
         const config = statusConfig[order.status];
         const StatusIcon = config?.icon || Package;
         const serviceName = order.bookings?.services?.title || order.contact_messages?.service || "Service Request";
 
         return (
           <Card key={order.id}>
             <CardHeader className="pb-2">
               <div className="flex items-start justify-between">
                 <div>
                   <CardTitle className="text-lg flex items-center gap-2">
                     <StatusIcon className="w-5 h-5 text-primary" />
                     {serviceName}
                   </CardTitle>
                 </div>
                 <Badge className={config?.color}>{config?.label}</Badge>
               </div>
             </CardHeader>
             <CardContent>
               {order.status_message && (
                 <p className="text-sm text-muted-foreground mb-2">{order.status_message}</p>
               )}
               <div className="flex items-center gap-4 text-xs text-muted-foreground">
                 <span>Updated: {format(new Date(order.updated_at), "PPp")}</span>
                 {order.expected_completion && (
                   <span>Expected: {format(new Date(order.expected_completion), "PP")}</span>
                 )}
               </div>
 
               {/* Progress Steps */}
               <div className="mt-4 flex items-center gap-1">
                 {Object.keys(statusConfig).map((step, index) => {
                   const stepKeys = Object.keys(statusConfig);
                   const currentIndex = stepKeys.indexOf(order.status);
                   const isCompleted = index <= currentIndex;
 
                   return (
                     <div
                       key={step}
                       className={`flex-1 h-2 rounded-full ${
                         isCompleted ? "bg-primary" : "bg-muted"
                       }`}
                     />
                   );
                 })}
               </div>
             </CardContent>
           </Card>
         );
       })}
     </div>
   );
 };
 
 export default OrderTrackingTab;