 import { useState } from "react";
 import { Input } from "@/components/ui/input";
 import { Button } from "@/components/ui/button";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Search, SlidersHorizontal, X } from "lucide-react";
 
 interface ServiceSearchProps {
   onSearch: (query: string) => void;
   onFilter: (filter: string) => void;
   onSort: (sort: string) => void;
 }
 
 const ServiceSearch = ({ onSearch, onFilter, onSort }: ServiceSearchProps) => {
   const [query, setQuery] = useState("");
   const [showFilters, setShowFilters] = useState(false);
 
   const handleSearch = (value: string) => {
     setQuery(value);
     onSearch(value);
   };
 
   const clearSearch = () => {
     setQuery("");
     onSearch("");
   };
 
   return (
     <div className="space-y-4 mb-8">
       <div className="flex gap-2">
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
           <Input
             placeholder="Search services..."
             value={query}
             onChange={(e) => handleSearch(e.target.value)}
             className="pl-10 pr-10"
           />
           {query && (
             <button
               onClick={clearSearch}
               className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
             >
               <X className="w-4 h-4" />
             </button>
           )}
         </div>
         <Button
           variant="outline"
           onClick={() => setShowFilters(!showFilters)}
           className="shrink-0"
         >
           <SlidersHorizontal className="w-4 h-4 mr-2" />
           Filters
         </Button>
       </div>
 
       {showFilters && (
         <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
           <div className="flex-1 min-w-[150px]">
             <label className="text-sm font-medium mb-1 block">Category</label>
             <Select onValueChange={onFilter}>
               <SelectTrigger>
                 <SelectValue placeholder="All Categories" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Categories</SelectItem>
                 <SelectItem value="water">Water Management</SelectItem>
                 <SelectItem value="survey">Survey & Scanning</SelectItem>
                 <SelectItem value="consulting">Consulting</SelectItem>
                 <SelectItem value="treatment">Treatment Plants</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <div className="flex-1 min-w-[150px]">
             <label className="text-sm font-medium mb-1 block">Sort By</label>
             <Select onValueChange={onSort}>
               <SelectTrigger>
                 <SelectValue placeholder="Default" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="default">Default</SelectItem>
                 <SelectItem value="rating">Highest Rated</SelectItem>
                 <SelectItem value="popular">Most Popular</SelectItem>
                 <SelectItem value="name">Name A-Z</SelectItem>
               </SelectContent>
             </Select>
           </div>
         </div>
       )}
     </div>
   );
 };
 
 export default ServiceSearch;