 import { useEffect, useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { User } from "@supabase/supabase-js";
 import Navbar from "@/components/Navbar";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { useToast } from "@/hooks/use-toast";
 import { motion } from "framer-motion";
 import { User as UserIcon, Mail, Phone, MapPin, Loader2 } from "lucide-react";
 
 const Profile = () => {
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [fullName, setFullName] = useState("");
   const [phone, setPhone] = useState("");
   const navigate = useNavigate();
   const { toast } = useToast();
 
   useEffect(() => {
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (event, session) => {
         setUser(session?.user ?? null);
         setLoading(false);
         if (!session?.user) {
           navigate("/auth");
         } else {
           setFullName(session.user.user_metadata?.full_name || "");
           setPhone(session.user.user_metadata?.phone || "");
         }
       }
     );
 
     supabase.auth.getSession().then(({ data: { session } }) => {
       setUser(session?.user ?? null);
       setLoading(false);
       if (!session?.user) {
         navigate("/auth");
       } else {
         setFullName(session.user.user_metadata?.full_name || "");
         setPhone(session.user.user_metadata?.phone || "");
       }
     });
 
     return () => subscription.unsubscribe();
   }, [navigate]);
 
   const handleSave = async () => {
     setSaving(true);
     const { error } = await supabase.auth.updateUser({
       data: {
         full_name: fullName,
         phone: phone,
       },
     });
 
     setSaving(false);
     if (error) {
       toast({ title: "Error", description: error.message, variant: "destructive" });
     } else {
       toast({ title: "Profile Updated", description: "Your profile has been saved." });
     }
   };
 
   if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <div className="text-muted-foreground">Loading...</div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-muted/30">
       <Navbar />
       <main className="pt-20 pb-12">
         <div className="container mx-auto px-4 max-w-2xl">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
           >
             <h1 className="text-3xl font-serif font-bold text-foreground mb-6">My Profile</h1>
 
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <UserIcon className="w-5 h-5" />
                   Personal Information
                 </CardTitle>
                 <CardDescription>Update your profile details</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="email" className="flex items-center gap-1">
                     <Mail className="w-4 h-4" />
                     Email
                   </Label>
                   <Input id="email" value={user?.email || ""} disabled />
                   <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                 </div>
 
                 <div className="space-y-2">
                   <Label htmlFor="fullName" className="flex items-center gap-1">
                     <UserIcon className="w-4 h-4" />
                     Full Name
                   </Label>
                   <Input
                     id="fullName"
                     value={fullName}
                     onChange={(e) => setFullName(e.target.value)}
                     placeholder="Enter your full name"
                   />
                 </div>
 
                 <div className="space-y-2">
                   <Label htmlFor="phone" className="flex items-center gap-1">
                     <Phone className="w-4 h-4" />
                     Phone Number
                   </Label>
                   <Input
                     id="phone"
                     type="tel"
                     value={phone}
                     onChange={(e) => setPhone(e.target.value)}
                     placeholder="+91 9876543210"
                   />
                 </div>
 
                 <Button onClick={handleSave} disabled={saving} className="w-full">
                   {saving ? (
                     <>
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                       Saving...
                     </>
                   ) : (
                     "Save Changes"
                   )}
                 </Button>
               </CardContent>
             </Card>
           </motion.div>
         </div>
       </main>
     </div>
   );
 };
 
 export default Profile;