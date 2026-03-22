import { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Loader2,
  User,
  Phone,
  MapPin,
  Send,
  Calendar,
  Navigation,
  ScanLine,
  LandPlot,
  MessageSquare,
  Home,
  Building2,
  Mail as MailIcon,
  Wrench,
  LocateFixed,
  Ruler,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BIZ_AREAS = ["Maharashtra", "Telangana", "Karnataka", "AndhraPradesh", "Others"];

// Country code mapping
const COUNTRY_CODES: Record<string, string> = {
  india: "+91", "united states": "+1", "united kingdom": "+44", australia: "+61",
  canada: "+1", germany: "+49", france: "+33", japan: "+81", china: "+86",
  brazil: "+55", "south africa": "+27", uae: "+971", "united arab emirates": "+971",
  singapore: "+65", malaysia: "+60", nepal: "+977", "sri lanka": "+94",
  bangladesh: "+880", pakistan: "+92", indonesia: "+62", thailand: "+66",
};
const DISTANCES = [
  "0-30 KM", "50 KM", "100 KM", "150 KM", "200 KM", "250 KM",
  "300 KM", "400 KM", "500 KM", "700 KM", "800 KM", "1000 KM", "1500 KM", "2000 KM",
];
const SERVICES_LIST = ["GWS", "RWH", "iGEOS", "GeoTech", "THRML-IMG", "GPR", "STP", "ETP", "CGWA", "NOCB", "MEP"];
const SCANS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const AREA_TYPES = ["OPEN PLOT", "APPRT", "MANFCT PLANT", "IT BLDG", "BANGLOW", "SINGLE BLDG", "ORG LAND"];

type AreaUnit = "sqft" | "sqm" | "sqyd" | "acres" | "guntas";

const AREA_UNITS: { value: AreaUnit; label: string }[] = [
  { value: "sqft", label: "Sq.Ft" },
  { value: "sqm", label: "Sq.M" },
  { value: "sqyd", label: "Sq.Yrds" },
  { value: "acres", label: "Acres" },
  { value: "guntas", label: "Guntas" },
];

// Conversion factors to sqft
const TO_SQFT: Record<AreaUnit, number> = {
  sqft: 1,
  sqm: 10.7639,
  sqyd: 9,
  acres: 43560,
  guntas: 1089,
};

function convertArea(value: number, from: AreaUnit): Record<AreaUnit, string> {
  const sqft = value * TO_SQFT[from];
  const result: Record<AreaUnit, string> = {} as any;
  for (const unit of AREA_UNITS) {
    const converted = sqft / TO_SQFT[unit.value];
    result[unit.value] = converted < 0.01 ? converted.toExponential(2) : parseFloat(converted.toFixed(2)).toString();
  }
  return result;
}

interface EnquiryFormProps {
  serviceTitle: string;
  onSuccess: () => void;
}

const stagger = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.035, duration: 0.25, ease: [0, 0, 0.2, 1] as const },
  }),
};

const EnquiryForm = ({ serviceTitle, onSuccess }: EnquiryFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastName, setLastName] = useState("");
  const [expectedClose, setExpectedClose] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [whatsapp, setWhatsapp] = useState("");
  const [bizArea, setBizArea] = useState("Telangana");
  const [distance, setDistance] = useState("0-30 KM");
  const [serviceNeeded, setServiceNeeded] = useState(() => {
    const match = SERVICES_LIST.find((s) => serviceTitle.toLowerCase().includes(s.toLowerCase()));
    return match || "GWS";
  });
  const [numScans, setNumScans] = useState("1");
  const [areaType, setAreaType] = useState("OPEN PLOT");
  const [description, setDescription] = useState("");
  const [mailingStreet, setMailingStreet] = useState("");
  const [mailingCity, setMailingCity] = useState("");
  const [mailingPoBox, setMailingPoBox] = useState("");
  const [detectedCountry, setDetectedCountry] = useState("");

  // Location
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: string; lng: string } | null>(null);

  // Area conversion
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("sqft");
  const [areaValue, setAreaValue] = useState("");

  const converted = useMemo(() => {
    const num = parseFloat(areaValue);
    if (!areaValue || isNaN(num) || num <= 0) return null;
    return convertArea(num, areaUnit);
  }, [areaValue, areaUnit]);

  // Build total area string for CRM
  const totalAreaText = useMemo(() => {
    if (!converted) return "Gunta: \nAcres: \nSq.Yrds: \nSq.Ft:";
    return `Gunta: ${converted.guntas}\nAcres: ${converted.acres}\nSq.Yrds: ${converted.sqyd}\nSq.Ft: ${converted.sqft}`;
  }, [converted]);

  // Google Maps URL
  const googleMapsUrl = useMemo(() => {
    if (!coords) return "";
    return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
  }, [coords]);

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`)).catch(() => toast.error("Copy failed"));
  };

  // Auto-fill description from fields above
  const autoDescription = useMemo(() => {
    const parts: string[] = [];
    if (lastName) parts.push(`Name: ${lastName}`);
    if (whatsapp) parts.push(`WhatsApp: ${whatsapp}`);
    parts.push(`Service: ${serviceNeeded}`);
    parts.push(`Area Type: ${areaType}`);
    if (converted) {
      parts.push(`Area: ${areaValue} ${AREA_UNITS.find(u => u.value === areaUnit)?.label}`);
      parts.push(`  → Sq.Ft: ${converted.sqft} | Sq.M: ${converted.sqm} | Acres: ${converted.acres} | Guntas: ${converted.guntas}`);
    }
    parts.push(`BIZ Area: ${bizArea}`);
    parts.push(`Distance: ${distance}`);
    parts.push(`Scans: ${numScans}`);
    if (coords) {
      parts.push(`GPS: ${coords.lat}, ${coords.lng}`);
      parts.push(`Maps: https://www.google.com/maps?q=${coords.lat},${coords.lng}`);
    }
    if (mailingStreet) parts.push(`Street: ${mailingStreet}`);
    if (mailingCity) parts.push(`City: ${mailingCity}`);
    if (mailingPoBox) parts.push(`PIN: ${mailingPoBox}`);
    if (detectedCountry) parts.push(`Country: ${detectedCountry}`);
    return parts.join("\n");
  }, [lastName, whatsapp, serviceNeeded, areaType, areaValue, areaUnit, converted, bizArea, distance, numScans, coords, mailingStreet, mailingCity, mailingPoBox, detectedCountry]);

  // Sync auto description
  useEffect(() => {
    setDescription(autoDescription);
  }, [autoDescription]);

  // Get location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setCoords({ lat, lng });

        // Reverse geocode
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`);
          const data = await res.json();
          if (data.address) {
            const a = data.address;
            const country = a.country || "";
            setDetectedCountry(country);

            // Build mailing street: road, neighbourhood, suburb, district, state, country
            const streetParts = [a.road, a.neighbourhood, a.suburb, a.state_district || a.county, a.state, country].filter(Boolean);
            setMailingStreet(streetParts.join(", "));
            setMailingCity(a.city || a.town || a.village || a.county || "");
            setMailingPoBox(a.postcode || "");

            // Auto-detect BIZ Area from state
            const state = (a.state || "").toLowerCase();
            if (state.includes("telangana")) setBizArea("Telangana");
            else if (state.includes("maharashtra")) setBizArea("Maharashtra");
            else if (state.includes("karnataka")) setBizArea("Karnataka");
            else if (state.includes("andhra")) setBizArea("AndhraPradesh");
            else setBizArea("Others");

            // Auto-fill country code for phone
            const countryLower = country.toLowerCase();
            const code = COUNTRY_CODES[countryLower];
            if (code && !whatsapp) {
              setWhatsapp(code + " ");
            }
          }
          toast.success("Location detected!");
        } catch {
          toast.success("Coordinates captured. Address lookup failed.");
        }
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        toast.error(err.message || "Could not get location.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSubmit = async () => {
    if (!lastName.trim() || !whatsapp.trim() || !description.trim() || !mailingStreet.trim() || !mailingCity.trim() || !mailingPoBox.trim() || !areaValue.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);

    try {
      const formData: Record<string, string> = {
        __vtrftk: "sid:c13e250974b2e7ea0ef70de7fecdcc0cc6191ec5,1773737516",
        publicid: "85432a838b51f53a6bc4ec937b64ee40",
        urlencodeenable: "1",
        name: "Enquiry Form: Telangana - Amruta HydroGeo Services",
        lastname: lastName,
        cf_1044: expectedClose,
        cf_1022: whatsapp,
        cf_990: bizArea,
        cf_998: distance,
        cf_994: serviceNeeded,
        cf_1014: numScans,
        cf_1002: areaType,
        cf_1006: totalAreaText,
        cf_1020: "",
        description: description,
        mailingstreet: mailingStreet,
        mailingcity: mailingCity,
        mailingpobox: mailingPoBox,
      };

      const { data, error } = await supabase.functions.invoke("vtiger-submit", {
        body: { formData },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Enquiry submitted successfully! We'll contact you soon.");
        onSuccess();
      } else {
        toast.error(data?.message || "Submission failed. Please try again after sometime.");
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error("Could not submit enquiry. Please try again after sometime.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldIcon = "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60 pointer-events-none";
  const inputCls = "pl-10 bg-background/60 border-border/50 backdrop-blur-sm transition-all duration-200 focus:bg-background focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] hover:border-primary/30";
  const selectCls = "bg-background/60 border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-200 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]";
  const labelCls = "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70";

  let idx = 0;

  return (
    <>
      <iframe ref={iframeRef} name="vtiger_submit_frame" className="hidden" title="submit" />

      <form
        ref={formRef}
        action="https://appscomsolutions.com/VTCRM/modules/Webforms/capture.php"
        method="post"
        acceptCharset="utf-8"
        encType="multipart/form-data"
        target="vtiger_submit_frame"
        className="space-y-3 mt-2 max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin"
        onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
      >
        <input type="hidden" name="__vtrftk" value="sid:c13e250974b2e7ea0ef70de7fecdcc0cc6191ec5,1773737516" />
        <input type="hidden" name="publicid" value="85432a838b51f53a6bc4ec937b64ee40" />
        <input type="hidden" name="urlencodeenable" value="1" />
        <input type="hidden" name="name" value="Enquiry Form: Telangana - Amruta HydroGeo Services" />

        {/* Name */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
          <Label className={labelCls}><User className="h-3.5 w-3.5 text-primary" /> Name <span className="text-destructive">*</span></Label>
          <div className="relative">
            <User className={fieldIcon} />
            <Input name="lastname" required maxLength={100} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Your full name" className={inputCls} />
          </div>
        </motion.div>

        {/* Expected Close Date */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
          <Label className={labelCls}><Calendar className="h-3.5 w-3.5 text-primary" /> Expected Close Date <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Calendar className={fieldIcon} />
            <Input name="cf_1044" type="date" required value={expectedClose} onChange={(e) => setExpectedClose(e.target.value)} className={inputCls} />
          </div>
        </motion.div>

        {/* WhatsApp */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
          <Label className={labelCls}><Phone className="h-3.5 w-3.5 text-primary" /> WhatsApp Number <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Phone className={fieldIcon} />
            <Input name="cf_1022" required maxLength={15} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+91 XXXXX XXXXX" className={inputCls} />
          </div>
        </motion.div>

        {/* Get Location Button */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible">
          <Button
            type="button"
            variant="outline"
            onClick={handleGetLocation}
            disabled={locating}
            className="w-full gap-2 h-10 text-xs font-semibold border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
            {locating ? "Detecting Location…" : coords ? "📍 Location Captured — Re-detect" : "📍 Get My Location"}
          </Button>
          {coords && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/30 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-foreground/80 font-mono">
                  <span className="text-muted-foreground">Lat:</span> {coords.lat} &nbsp; <span className="text-muted-foreground">Lon:</span> {coords.lng}
                </p>
                <button type="button" onClick={() => handleCopy(`${coords.lat}, ${coords.lng}`, "Coordinates")} className="p-1 rounded hover:bg-primary/10 transition-colors" title="Copy coordinates">
                  <Copy className="w-3.5 h-3.5 text-primary/70" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary underline underline-offset-2 truncate flex-1 hover:text-primary/80 transition-colors">
                  {googleMapsUrl}
                </a>
                <button type="button" onClick={() => handleCopy(googleMapsUrl, "Google Maps URL")} className="p-1 rounded hover:bg-primary/10 transition-colors" title="Copy Maps URL">
                  <Copy className="w-3.5 h-3.5 text-primary/70" />
                </button>
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-primary/10 transition-colors" title="Open in Maps">
                  <ExternalLink className="w-3.5 h-3.5 text-primary/70" />
                </a>
              </div>
            </div>
          )}
        </motion.div>

        {/* BIZ Area & Distance */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className={labelCls}><MapPin className="h-3 w-3 text-primary" /> BIZ Area <span className="text-destructive">*</span></Label>
            <select name="cf_990" value={bizArea} onChange={(e) => setBizArea(e.target.value)} required className="hidden">
              {BIZ_AREAS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <Select value={bizArea} onValueChange={setBizArea}>
              <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
              <SelectContent className="border-border/50 backdrop-blur-md bg-background/95">
                {BIZ_AREAS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={labelCls}><Navigation className="h-3 w-3 text-primary" /> Distance <span className="text-destructive">*</span></Label>
            <select name="cf_998" value={distance} onChange={(e) => setDistance(e.target.value)} required className="hidden">
              {DISTANCES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <Select value={distance} onValueChange={setDistance}>
              <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
              <SelectContent className="border-border/50 backdrop-blur-md bg-background/95 max-h-48">
                {DISTANCES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Service & Scans */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className={labelCls}><Wrench className="h-3 w-3 text-primary" /> Service <span className="text-destructive">*</span></Label>
            <select name="cf_994" value={serviceNeeded} onChange={(e) => setServiceNeeded(e.target.value)} required className="hidden">
              {SERVICES_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Select value={serviceNeeded} onValueChange={setServiceNeeded}>
              <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
              <SelectContent className="border-border/50 backdrop-blur-md bg-background/95">
                {SERVICES_LIST.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={labelCls}><ScanLine className="h-3 w-3 text-primary" /> Scans <span className="text-destructive">*</span></Label>
            <select name="cf_1014" value={numScans} onChange={(e) => setNumScans(e.target.value)} required className="hidden">
              {SCANS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Select value={numScans} onValueChange={setNumScans}>
              <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
              <SelectContent className="border-border/50 backdrop-blur-md bg-background/95">
                {SCANS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Area Type */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
          <Label className={labelCls}><LandPlot className="h-3.5 w-3.5 text-primary" /> Area Type <span className="text-destructive">*</span></Label>
          <select name="cf_1002" value={areaType} onChange={(e) => setAreaType(e.target.value)} required className="hidden">
            {AREA_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <Select value={areaType} onValueChange={setAreaType}>
            <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
            <SelectContent className="border-border/50 backdrop-blur-md bg-background/95">
              {AREA_TYPES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Total Area — Unit selector + input + conversions */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
          <Label className={labelCls}><Ruler className="h-3.5 w-3.5 text-primary" /> Total Area <span className="text-destructive">*</span></Label>
          <div className="flex gap-2">
            <Select value={areaUnit} onValueChange={(v) => setAreaUnit(v as AreaUnit)}>
              <SelectTrigger className={`${selectCls} w-[100px] shrink-0`}><SelectValue /></SelectTrigger>
              <SelectContent className="border-border/50 backdrop-blur-md bg-background/95">
                {AREA_UNITS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min="0"
              step="any"
              required
              value={areaValue}
              onChange={(e) => setAreaValue(e.target.value)}
              placeholder="Enter area"
              className="bg-background/60 border-border/50 backdrop-blur-sm transition-all duration-200 focus:bg-background focus:border-primary/40 hover:border-primary/30 flex-1"
            />
          </div>
          {converted && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1.5 px-2 py-1.5 rounded-lg bg-muted/30 border border-border/30">
              {AREA_UNITS.filter(u => u.value !== areaUnit).map((u) => (
                <p key={u.value} className="text-[10px] text-muted-foreground">
                  <span className="font-medium text-foreground/70">{u.label}:</span> {converted[u.value]}
                </p>
              ))}
            </div>
          )}
          {/* Hidden field for CRM */}
          <textarea name="cf_1006" value={totalAreaText} readOnly className="hidden" />
        </motion.div>

        {/* Hidden: Total BIZ Cost — sending empty to CRM */}
        <input type="hidden" name="cf_1020" value="" />

        {/* Description (auto-filled) */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
          <Label className={labelCls}><MessageSquare className="h-3.5 w-3.5 text-primary" /> Description <span className="text-destructive">*</span></Label>
          <Textarea
            name="description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Auto-filled from above details..."
            rows={4}
            className="bg-background/60 border-border/50 backdrop-blur-sm transition-all duration-200 focus:bg-background focus:border-primary/40 hover:border-primary/30 text-xs resize-none font-mono leading-relaxed"
          />
          <p className="text-[10px] text-muted-foreground italic">Auto-filled from your inputs. You can edit it.</p>
        </motion.div>

        {/* Mailing Address */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
          <Label className={labelCls}><Home className="h-3.5 w-3.5 text-primary" /> Mailing Street <span className="text-destructive">*</span></Label>
          <Textarea name="mailingstreet" required value={mailingStreet} onChange={(e) => setMailingStreet(e.target.value)} placeholder="Street address (auto-filled from location)" rows={2} className="bg-background/60 border-border/50 backdrop-blur-sm transition-all duration-200 focus:bg-background focus:border-primary/40 hover:border-primary/30 text-sm resize-none" />
        </motion.div>

        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className={labelCls}><Building2 className="h-3 w-3 text-primary" /> Mailing City <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Building2 className={fieldIcon} />
              <Input name="mailingcity" required value={mailingCity} onChange={(e) => setMailingCity(e.target.value)} placeholder="City" className={inputCls} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className={labelCls}><MailIcon className="h-3 w-3 text-primary" /> PIN Code <span className="text-destructive">*</span></Label>
            <div className="relative">
              <MailIcon className={fieldIcon} />
              <Input name="mailingpobox" required value={mailingPoBox} onChange={(e) => setMailingPoBox(e.target.value)} placeholder="PIN Code" className={inputCls} />
            </div>
          </div>
        </motion.div>

        {/* Submit */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="pt-1">
          <Button
            type="submit"
            className="w-full gap-2.5 h-12 font-bold text-sm relative overflow-hidden bg-gradient-to-r from-primary to-primary/85 hover:from-primary/90 hover:to-primary shadow-[0_4px_20px_-6px_hsl(var(--primary)/0.4)] hover:shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.5)] transition-all duration-300 rounded-xl"
            disabled={isSubmitting}
          >
            {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>) : (<><Send className="w-4 h-4" /> Submit Enquiry</>)}
          </Button>
        </motion.div>
      </form>
    </>
  );
};

export default EnquiryForm;
