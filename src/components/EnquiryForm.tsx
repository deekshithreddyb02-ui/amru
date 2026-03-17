import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  ChevronRight,
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

/* ── tiny reusable pieces ── */
const SectionHeader = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/40">
    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
      <Icon className="h-3.5 w-3.5 text-primary" />
    </div>
    <span className="text-xs font-semibold uppercase tracking-wider text-primary/80">{label}</span>
  </div>
);

const RequiredDot = () => <span className="text-destructive ml-0.5">*</span>;

const FieldLabel = ({
  htmlFor,
  icon: Icon,
  children,
}: {
  htmlFor?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <Label htmlFor={htmlFor} className="flex items-center gap-1.5 text-[13px] font-medium text-foreground/90">
    <Icon className="h-3.5 w-3.5 text-primary/70" />
    {children}
    <RequiredDot />
  </Label>
);

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
          setCity(addr.city || addr.town || addr.county || addr.village || "");
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
      toast.error("Failed to submit. Please try calling us at +91-741-0030-418.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const conversions = getConversions();

  const inputCls =
    "pl-10 h-9 text-sm bg-background border-border/60 focus-visible:ring-primary/30 transition-shadow";
  const iconCls =
    "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 mt-2 max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin"
    >
      {/* ═══════ PERSONAL INFO ═══════ */}
      <section className="space-y-3">
        <SectionHeader icon={User} label="Personal Information" />

        {/* Name */}
        <div className="space-y-1.5">
          <FieldLabel htmlFor="enq-name" icon={User}>Full Name</FieldLabel>
          <div className="relative">
            <User className={iconCls} />
            <Input
              id="enq-name"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className={inputCls}
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <FieldLabel htmlFor="enq-email" icon={Mail}>Email Address</FieldLabel>
          <div className="relative">
            <Mail className={iconCls} />
            <Input
              id="enq-email"
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <FieldLabel htmlFor="enq-phone" icon={Phone}>Phone Number</FieldLabel>
          <div className="flex gap-2">
            <div className="relative w-[76px] shrink-0">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
              <Input
                className="pl-7 text-center text-sm h-9 bg-muted/30 border-border/60"
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
              className="flex-1 h-9 text-sm border-border/60 focus-visible:ring-primary/30"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
            />
          </div>
        </div>
      </section>

      {/* ═══════ LOCATION ═══════ */}
      <section className="space-y-3">
        <SectionHeader icon={Navigation} label="Location Details" />

        {/* Auto-Fill Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 h-10 border-primary/20 bg-primary/[0.03] text-primary font-semibold hover:bg-primary/10 hover:border-primary/40 transition-all"
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
              <Locate className="w-4 h-4" />
              <span>Auto-Fill Location</span>
              <Sparkles className="w-3.5 h-3.5 ml-auto opacity-60" />
            </>
          )}
        </Button>

        <div className="grid grid-cols-2 gap-3">
          {/* Country */}
          <div className="space-y-1.5">
            <FieldLabel htmlFor="enq-country" icon={Globe}>Country</FieldLabel>
            <div className="relative">
              <Globe className={iconCls} />
              <Input
                id="enq-country"
                required
                maxLength={100}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="India"
                className={inputCls}
              />
            </div>
          </div>

          {/* State */}
          <div className="space-y-1.5">
            <FieldLabel htmlFor="enq-state" icon={MapPin}>State / Province</FieldLabel>
            <div className="relative">
              <MapPin className={iconCls} />
              <Input
                id="enq-state"
                required
                maxLength={100}
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Maharashtra"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* City */}
        <div className="space-y-1.5">
          <FieldLabel htmlFor="enq-city" icon={Building2}>City</FieldLabel>
          <div className="relative">
            <Building2 className={iconCls} />
            <Input
              id="enq-city"
              required
              maxLength={100}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Pune"
              className={inputCls}
            />
          </div>
        </div>

        {/* Full Address */}
        <div className="space-y-1.5">
          <FieldLabel htmlFor="enq-address" icon={Home}>Full Address</FieldLabel>
          <div className="relative">
            <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
            <Textarea
              id="enq-address"
              required
              maxLength={500}
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="Street, locality, landmark…"
              rows={2}
              className="pl-10 text-sm min-h-[64px] bg-background border-border/60 focus-visible:ring-primary/30 resize-none"
            />
          </div>
        </div>

        {/* GPS Coordinates Card */}
        {lat && lon && (
          <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] to-transparent p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/70 flex items-center gap-1.5">
                <Navigation className="h-3 w-3" /> GPS Coordinates
              </span>
              <div className="flex items-center gap-1.5">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline bg-primary/10 rounded-full px-2.5 py-0.5 transition-colors hover:bg-primary/15"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open Maps
                </a>
                <button
                  type="button"
                  onClick={copyCoordLink}
                  className="p-1 rounded-full hover:bg-primary/10 transition-colors"
                  title="Copy map link"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background/60 rounded-lg px-2.5 py-1.5 text-xs border border-border/30">
                <span className="text-muted-foreground/70">Lat</span>{" "}
                <span className="font-mono font-semibold text-foreground">{lat}</span>
              </div>
              <div className="bg-background/60 rounded-lg px-2.5 py-1.5 text-xs border border-border/30">
                <span className="text-muted-foreground/70">Lon</span>{" "}
                <span className="font-mono font-semibold text-foreground">{lon}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ═══════ PROJECT DETAILS ═══════ */}
      <section className="space-y-3">
        <SectionHeader icon={LandPlot} label="Project Details" />

        {/* Area Type */}
        <div className="space-y-1.5">
          <FieldLabel icon={Building2}>Area Type</FieldLabel>
          <Select value={areaType} onValueChange={setAreaType} required>
            <SelectTrigger className="h-9 text-sm border-border/60 focus:ring-primary/30">
              <SelectValue placeholder="Select area type…" />
            </SelectTrigger>
            <SelectContent>
              {AREA_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Area + Unit */}
        <div className="space-y-1.5">
          <FieldLabel htmlFor="enq-area" icon={Ruler}>Total Area</FieldLabel>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Ruler className={iconCls} />
              <Input
                id="enq-area"
                type="number"
                min="0"
                step="any"
                required
                className={inputCls}
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. 2400"
              />
            </div>
            <Select value={areaUnit} onValueChange={setAreaUnit}>
              <SelectTrigger className="w-[96px] h-9 text-sm border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AREA_UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {conversions && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {conversions.map((c) => (
                <span
                  key={c.unit}
                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted/50 text-muted-foreground rounded-full px-2.5 py-0.5 border border-border/30"
                >
                  ≈ {c.value} <span className="font-semibold text-foreground/70">{c.unit}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════ MESSAGE ═══════ */}
      <section className="space-y-3">
        <SectionHeader icon={MessageSquare} label="Your Message" />
        <div className="space-y-1.5">
          <FieldLabel htmlFor="enq-message" icon={MessageSquare}>Message</FieldLabel>
          <Textarea
            id="enq-message"
            required
            value={message}
            maxLength={2000}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Auto-generated based on your inputs…"
            rows={4}
            className="text-sm bg-background border-border/60 focus-visible:ring-primary/30 resize-none"
          />
          <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Auto-generated from your details above
          </p>
        </div>
      </section>

      {/* ═══════ SUBMIT ═══════ */}
      <Button
        type="submit"
        className="w-full gap-2 font-semibold h-11 text-sm shadow-md hover:shadow-lg transition-all"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            Submit Enquiry
            <ChevronRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </form>
  );
};

export default EnquiryForm;
