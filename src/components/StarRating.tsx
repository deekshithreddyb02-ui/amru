 import { Star } from "lucide-react";
 
 interface StarRatingProps {
   rating: number;
   reviewCount?: number;
   size?: "sm" | "md";
   showCount?: boolean;
 }
 
 const StarRating = ({ rating, reviewCount = 0, size = "sm", showCount = true }: StarRatingProps) => {
   const starSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
   const textSize = size === "sm" ? "text-xs" : "text-sm";
 
   return (
     <div className="flex items-center gap-1">
       <div className="flex">
         {[1, 2, 3, 4, 5].map((star) => (
           <Star
             key={star}
             className={`${starSize} ${
               star <= Math.round(rating)
                 ? "fill-yellow-400 text-yellow-400"
                 : "text-muted-foreground"
             }`}
           />
         ))}
       </div>
       {showCount && (
         <span className={`${textSize} text-muted-foreground`}>
           {rating > 0 ? rating.toFixed(1) : "New"} {reviewCount > 0 && `(${reviewCount})`}
         </span>
       )}
     </div>
   );
 };
 
 export default StarRating;