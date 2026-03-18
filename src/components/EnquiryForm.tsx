import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  User,
  Globe,
  MapPin,
  Building2,
  Home,
  Phone,
  Mail,
  MessageSquare,
  Locate,
  Ruler,
  Copy,
  Check,
  ExternalLink,
  Navigation,
  Sparkles,
  Send,
  LandPlot,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AREA_TYPES = [
  "Open Plot",
  "Apartment",
  "Manufacturing Plant",
  "IT Building",
  "Bungalow",
  "Single Building",
  "Organization Land",
];

const AREA_UNITS = ["Sq.ft", "Sq.m", "Sq.y", "Acres"];

const TO_SQM: Record<string, number> = {
  "Sq.ft": 0.092903,
  "Sq.m": 1,
  "Sq.y": 0.836127,
  "Acres": 4046.86,
};

const COUNTRY_CODES: Record<string, string> = {
  India: "+91",
  "United States": "+1",
  "United Kingdom": "+44",
  Australia: "+61",
  Canada: "+1",
  Germany: "+49",
  France: "+33",
  Japan: "+81",
  China: "+86",
  Brazil: "+55",
  "South Africa": "+27",
  "United Arab Emirates": "+971",
  Singapore: "+65",
  Nepal: "+977",
  Bangladesh: "+880",
  "Sri Lanka": "+94",
  Pakistan: "+92",
};

interface EnquiryFormProps {
  serviceTitle: string;
  onSuccess: () => void;
}

const stagger = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: [0, 0, 0.2, 1] as const },
  }),
};

const EnquiryForm = ({ serviceTitle, onSuccess }: EnquiryFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");

  const [areaType, setAreaType] = useState("");
  const [area, setArea] = useState("");
  const [areaUnit, setAreaUnit] = useState("Sq.ft");

  const [countryCode, setCountryCode] = useState("+91");

  useEffect(() => {
    if (country) {
      const code = COUNTRY_CODES[country];
      if (code) setCountryCode(code);
    }
  }, [country]);

  useEffect(() => {
    const parts: string[] = [];
    if (serviceTitle) parts.push(`Service: ${serviceTitle}`);
    if (areaType) parts.push(`Area Type: ${areaType}`);
    if (area && areaUnit) parts.push(`Area: ${area} ${areaUnit}`);
    if (city) parts.push(`City: ${city}`);
    if (state) parts.push(`State: ${state}`);
    if (country) parts.push(`Country: ${country}`);
    if (fullAddress) parts.push(`Address: ${fullAddress}`);
    if (lat && lon) parts.push(`Coordinates: ${lat}, ${lon}`);

    if (parts.length > 1) {
      setMessage(
        `I am interested in ${serviceTitle}.\n${parts.slice(1).join("\n")}`
      );
    }
  }, [serviceTitle, areaType, area, areaUnit, city, state, country, fullAddress, lat, lon]);

  const getConversions = () => {
    const val = parseFloat(area);
    if (!val || isNaN(val)) return null;
    const sqm = val * TO_SQM[areaUnit];
    return AREA_UNITS.filter((u) => u !== areaUnit).map((u) => ({
      unit: u,
      value: (sqm / TO_SQM[u]).toFixed(2),
    }));
  };

  const googleMapsUrl =
    lat && lon ? `https://www.google.com/maps?q=${lat},${lon}` : "";

  const copyCoordLink = useCallback(() => {
    if (!googleMapsUrl) return;
    navigator.clipboard.writeText(googleMapsUrl).then(() => {
      setCopied(true);
      toast.success("Map link copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [googleMapsUrl]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setLat(latitude.toFixed(6));
          setLon(longitude.toFixed(6));

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          const addr = data.address || {};

          const detectedCountry = addr.country || "";
          setCountry(detectedCountry);
          setState(addr.state || "");
          setCity(
            addr.city || addr.town || addr.county || addr.village || ""
          );
          setFullAddress(data.display_name || "");

          if (detectedCountry && COUNTRY_CODES[detectedCountry]) {
            setCountryCode(COUNTRY_CODES[detectedCountry]);
          }

          toast.success("Location detected successfully!");
        } catch {
          toast.error("Could not detect location. Please fill manually.");
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        toast.error("Location access denied. Please fill manually.");
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const trimName = name.trim();
    const trimEmail = email.trim();
    const trimPhone = phone.trim();

    if (
      !trimName ||
      !trimEmail ||
      !trimPhone ||
      !country.trim() ||
      !state.trim() ||
      !city.trim() ||
      !fullAddress.trim() ||
      !areaType ||
      !area.trim()
    ) {
      toast.error("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimEmail)) {
      toast.error("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    try {
      const fullMessage = [
        country && `[Country: ${country}]`,
        state && `[State: ${state}]`,
        city && `[City: ${city}]`,
        fullAddress && `[Address: ${fullAddress}]`,
        lat && lon && `[Coordinates: ${lat}, ${lon}]`,
        lat && lon && `[Map: ${googleMapsUrl}]`,
        areaType && `[Area Type: ${areaType}]`,
        area && `[Area: ${area} ${areaUnit}]`,
        message.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      const { error } = await supabase.from("contact_messages").insert({
        name: trimName,
        email: trimEmail,
        phone: trimPhone ? `${countryCode} ${trimPhone}` : null,
        service: serviceTitle,
        message: fullMessage,
      });

      if (error) throw error;

      toast.success("Enquiry submitted successfully! We'll contact you soon.");
      onSuccess();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        "Failed to submit. Please try calling us at +91-741-0030-418."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const conversions = getConversions();

  const fieldIcon =
    "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60 pointer-events-none";
  const inputCls =
    "pl-10 bg-background/60 border-border/50 backdrop-blur-sm transition-all duration-200 focus:bg-background focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] hover:border-primary/30";

  let fieldIndex = 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3.5 mt-2 max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin"
    >
      {/* ── Name ── */}
      <motion.div custom={fieldIndex++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
        <Label htmlFor="enq-name" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
          <User className="h-3.5 w-3.5 text-primary" /> Name <span className="text-destructive">*</span>
        </Label>
        <div className="relative group">
          <User className={fieldIcon} />
          <Input
            id="enq-name"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className={inputCls}
          />
        </div>
      </motion.div>

      {/* ── Auto-Fill GPS Button ── */}
      <motion.div custom={fieldIndex++} variants={stagger} initial="hidden" animate="visible">
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2.5 h-11 relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent hover:from-primary/10 hover:via-primary/5 hover:to-primary/[0.02] hover:border-primary/40 text-primary font-semibold transition-all duration-300 hover:shadow-[0_4px_20px_-6px_hsl(var(--primary)/0.25)]"
          onClick={detectLocation}
          disabled={detectingLocation}
        >
          {detectingLocation ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Detecting Location…</span>
            </>
          ) : (
            <>
              <div className="relative">
                <Navigation className="w-4 h-4" />
                <Sparkles className="w-2.5 h-2.5 absolute -top-1 -right-1.5 text-primary/70" />
              </div>
              <span>Auto-Fill Location</span>
            </>
          )}
        </Button>
      </motion.div>

      {/* ── Location Fields Grid ── */}
      <motion.div custom={fieldIndex++} variants={stagger} initial="hidden" animate="visible"
        className="grid grid-cols-2 gap-3"
      >
        {/* Country */}
        <div className="space-y-1.5">
          <Label htmlFor="enq-country" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
            <Globe className="h-3 w-3 text-primary" /> Country <span className="text-destructive">*</span>
          </Label>
          <div className="relative group">
            <Globe className={fieldIcon} />
            <Input id="enq-country" required maxLength={100} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" className={inputCls} />
          </div>
        </div>

        {/* State */}
        <div className="space-y-1.5">
          <Label htmlFor="enq-state" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
            <MapPin className="h-3 w-3 text-primary" /> State <span className="text-destructive">*</span>
          </Label>
          <div className="relative group">
            <MapPin className={fieldIcon} />
            <Input id="enq-state" required maxLength={100} value={state} onChange={(e) => setState(e.target.value)} placeholder="State / Province" className={inputCls} />
          </div>
        </div>
      </motion.div>

      {/* City */}
      <motion.div custom={fieldIndex++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
        <Label htmlFor="enq-city" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
          <Building2 className="h-3.5 w-3.5 text-primary" /> City <span className="text-destructive">*</span>
        </Label>
        <div className="relative group">
          <Building2 className={fieldIcon} />
          <Input id="enq-city" required maxLength={100} value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={inputCls} />
        </div>
      </motion.div>

      {/* Full Address */}
      <motion.div custom={fieldIndex++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
        <Label htmlFor="enq-address" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
          <Home className="h-3.5 w-3.5 text-primary" /> Full Address <span className="text-destructive">*</span>
        </Label>
        <div className="relative group">
          <Home className={fieldIcon} />
          <Input id="enq-address" required maxLength={500} value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} placeholder="Full address" className={inputCls} />
        </div>
      </motion.div>

      {/* ── GPS Coordinates Panel ── */}
      <AnimatePresence>
        {lat && lon && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-transparent to-accent/[0.03] p-3.5 space-y-2.5 backdrop-blur-sm shadow-[inset_0_1px_0_0_hsl(var(--primary)/0.06)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary/70 flex items-center gap-1.5">
                <Locate className="h-3 w-3" /> GPS Coordinates
              </span>
              <div className="flex items-center gap-1.5">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/5"
                >
                  <ExternalLink className="h-3 w-3" />
                  Maps
                </a>
                <button
                  type="button"
                  onClick={copyCoordLink}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-all duration-200 hover:bg-primary/5 text-muted-foreground hover:text-primary"
                  title="Copy map link"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background/50 rounded-lg px-3 py-1.5 border border-border/30">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Lat</span>
                <p className="font-mono text-sm font-semibold text-foreground">{lat}</p>
              </div>
              <div className="bg-background/50 rounded-lg px-3 py-1.5 border border-border/30">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Lon</span>
                <p className="font-mono text-sm font-semibold text-foreground">{lon}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Area Type & Area ── */}
      <motion.div custom={fieldIndex++} variants={stagger} initial="hidden" animate="visible"
        className="grid grid-cols-2 gap-3"
      >
        {/* Area Type */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
            <LandPlot className="h-3 w-3 text-primary" /> Area Type <span className="text-destructive">*</span>
          </Label>
          <Select value={areaType} onValueChange={setAreaType} required>
            <SelectTrigger className="bg-background/60 border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-200 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="border-border/50 backdrop-blur-md bg-background/95">
              {AREA_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Area + Unit */}
        <div className="space-y-1.5">
          <Label htmlFor="enq-area" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
            <Ruler className="h-3 w-3 text-primary" /> Area <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Ruler className={fieldIcon} />
              <Input
                id="enq-area"
                type="number"
                min="0"
                step="any"
                required
                className={inputCls}
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="2400"
              />
            </div>
            <Select value={areaUnit} onValueChange={setAreaUnit}>
              <SelectTrigger className="w-[80px] bg-background/60 border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border/50 backdrop-blur-md bg-background/95">
                {AREA_UNITS.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Area Conversion */}
      <AnimatePresence>
        {conversions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 -mt-1"
          >
            {conversions.map((c) => (
              <span
                key={c.unit}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/[0.06] text-primary/80 border border-primary/10"
              >
                ≈ {c.value} <span className="text-primary/50">{c.unit}</span>
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phone ── */}
      <motion.div custom={fieldIndex++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
        <Label htmlFor="enq-phone" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
          <Phone className="h-3.5 w-3.5 text-primary" /> Phone <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <div className="relative w-[76px]">
            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/60 pointer-events-none" />
            <Input
              className="pl-7 text-center text-sm font-mono bg-background/60 border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              maxLength={6}
            />
          </div>
          <Input
            id="enq-phone"
            type="tel"
            required
            maxLength={15}
            className={`flex-1 ${inputCls.replace("pl-10 ", "")}`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
          />
        </div>
      </motion.div>

      {/* ── Email ── */}
      <motion.div custom={fieldIndex++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
        <Label htmlFor="enq-email" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
          <Mail className="h-3.5 w-3.5 text-primary" /> Email <span className="text-destructive">*</span>
        </Label>
        <div className="relative group">
          <Mail className={fieldIcon} />
          <Input
            id="enq-email"
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className={inputCls}
          />
        </div>
      </motion.div>

      {/* ── Message ── */}
      <motion.div custom={fieldIndex++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
        <Label htmlFor="enq-message" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
          <MessageSquare className="h-3.5 w-3.5 text-primary" /> Message <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="enq-message"
          required
          value={message}
          maxLength={2000}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Auto-generated based on your inputs"
          rows={3}
          className="bg-background/60 border-border/50 backdrop-blur-sm transition-all duration-200 focus:bg-background focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] hover:border-primary/30 text-sm resize-none"
        />
      </motion.div>

      {/* ── Submit ── */}
      <motion.div custom={fieldIndex++} variants={stagger} initial="hidden" animate="visible" className="pt-1">
        <Button
          type="submit"
          className="w-full gap-2.5 h-12 font-bold text-sm relative overflow-hidden bg-gradient-to-r from-primary to-primary/85 hover:from-primary/90 hover:to-primary shadow-[0_4px_20px_-6px_hsl(var(--primary)/0.4)] hover:shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.5)] transition-all duration-300 rounded-xl"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Enquiry
            </>
          )}
        </Button>
      </motion.div>
    </form>
  );
};

export default EnquiryForm;
