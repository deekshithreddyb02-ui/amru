 import { useSavedServices } from "@/hooks/useSavedServices";
 import { Card, CardContent } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Heart, Trash2 } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 
 const SavedServicesTab = () => {
   const { savedServices, loading, removeSavedService } = useSavedServices();
   const { toast } = useToast();
 
   const handleRemove = async (serviceId: string) => {
     const { error } = await removeSavedService(serviceId);
     if (error) {
       toast({ title: "Error", description: error, variant: "destructive" });
     } else {
       toast({ title: "Removed", description: "Service removed from saved list." });
     }
   };
 
   if (loading) {
     return <div className="text-center py-8 text-muted-foreground">Loading saved services...</div>;
   }
 
   if (savedServices.length === 0) {
     return (
       <Card>
         <CardContent className="py-12 text-center">
           <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
           <h3 className="font-semibold text-lg mb-2">No Saved Services</h3>
           <p className="text-muted-foreground">Save services you're interested in for quick access.</p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
       {savedServices.map((saved) => (
         <Card key={saved.id} className="overflow-hidden">
           {saved.services?.image && (
             <img
               src={saved.services.image}
               alt={saved.services.title}
               className="w-full h-32 object-cover"
             />
           )}
           <CardContent className="p-4">
             <h3 className="font-semibold mb-2">{saved.services?.title}</h3>
             <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
               {saved.services?.description}
             </p>
             <Button
               variant="outline"
               size="sm"
               onClick={() => handleRemove(saved.service_id)}
               className="w-full"
             >
               <Trash2 className="w-4 h-4 mr-1" />
               Remove
             </Button>
           </CardContent>
         </Card>
       ))}
     </div>
   );
 };
 
 export default SavedServicesTab;