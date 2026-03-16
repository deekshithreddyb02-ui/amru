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

          // Auto-set country code
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
    "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none";
  const inputWithIcon = "pl-10";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 mt-4 max-h-[65vh] overflow-y-auto pr-1"
    >
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="enq-name" className="flex items-center gap-1.5 text-sm font-medium">
          <User className="h-3.5 w-3.5 text-primary" /> Name <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <User className={fieldIcon} />
          <Input
            id="enq-name"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className={inputWithIcon}
          />
        </div>
      </div>

      {/* Auto-Fill */}
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
        onClick={detectLocation}
        disabled={detectingLocation}
      >
        {detectingLocation ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Detecting Location...
          </>
        ) : (
          <>
            <Locate className="w-4 h-4" />
            Auto-Fill Location
          </>
        )}
      </Button>

      {/* Country */}
      <div className="space-y-1.5">
        <Label htmlFor="enq-country" className="flex items-center gap-1.5 text-sm font-medium">
          <Globe className="h-3.5 w-3.5 text-primary" /> Country <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Globe className={fieldIcon} />
          <Input
            id="enq-country"
            required
            maxLength={100}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country"
            className={inputWithIcon}
          />
        </div>
      </div>

      {/* State */}
      <div className="space-y-1.5">
        <Label htmlFor="enq-state" className="flex items-center gap-1.5 text-sm font-medium">
          <MapPin className="h-3.5 w-3.5 text-primary" /> State / Province <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <MapPin className={fieldIcon} />
          <Input
            id="enq-state"
            required
            maxLength={100}
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State / Province"
            className={inputWithIcon}
          />
        </div>
      </div>

      {/* City */}
      <div className="space-y-1.5">
        <Label htmlFor="enq-city" className="flex items-center gap-1.5 text-sm font-medium">
          <Building2 className="h-3.5 w-3.5 text-primary" /> City <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Building2 className={fieldIcon} />
          <Input
            id="enq-city"
            required
            maxLength={100}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className={inputWithIcon}
          />
        </div>
      </div>

      {/* Full Address */}
      <div className="space-y-1.5">
        <Label htmlFor="enq-address" className="flex items-center gap-1.5 text-sm font-medium">
          <Home className="h-3.5 w-3.5 text-primary" /> Full Address <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Home className={fieldIcon} />
          <Input
            id="enq-address"
            required
            maxLength={500}
            value={fullAddress}
            onChange={(e) => setFullAddress(e.target.value)}
            placeholder="Full address"
            className={inputWithIcon}
          />
        </div>
      </div>

      {/* Lat / Lon with Google Maps link */}
      {lat && lon && (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> GPS Coordinates
            </span>
            <div className="flex items-center gap-1">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Open in Maps
              </a>
              <button
                type="button"
                onClick={copyCoordLink}
                className="ml-2 p-1 rounded hover:bg-muted transition-colors"
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
            <div className="text-xs">
              <span className="text-muted-foreground">Lat:</span>{" "}
              <span className="font-mono font-medium">{lat}</span>
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground">Lon:</span>{" "}
              <span className="font-mono font-medium">{lon}</span>
            </div>
          </div>
        </div>
      )}

      {/* Area Type */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <Building2 className="h-3.5 w-3.5 text-primary" /> Area Type <span className="text-destructive">*</span>
        </Label>
        <Select value={areaType} onValueChange={setAreaType} required>
          <SelectTrigger>
            <SelectValue placeholder="Select area type" />
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
        <Label htmlFor="enq-area" className="flex items-center gap-1.5 text-sm font-medium">
          <Ruler className="h-3.5 w-3.5 text-primary" /> Area <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Ruler className={fieldIcon} />
            <Input
              id="enq-area"
              type="number"
              min="0"
              step="any"
              required
              className={inputWithIcon}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. 2400"
            />
          </div>
          <Select value={areaUnit} onValueChange={setAreaUnit}>
            <SelectTrigger className="w-[100px]">
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
          <p className="text-xs text-muted-foreground mt-1 bg-muted/30 rounded px-2 py-1">
            ≈ {conversions.map((c) => `${c.value} ${c.unit}`).join(" · ")}
          </p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="enq-phone" className="flex items-center gap-1.5 text-sm font-medium">
          <Phone className="h-3.5 w-3.5 text-primary" /> Phone Number <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <div className="relative w-[80px]">
            <Phone className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-7 text-center text-sm"
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
            className="flex-1"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="enq-email" className="flex items-center gap-1.5 text-sm font-medium">
          <Mail className="h-3.5 w-3.5 text-primary" /> Email <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Mail className={fieldIcon} />
          <Input
            id="enq-email"
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className={inputWithIcon}
          />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <Label htmlFor="enq-message" className="flex items-center gap-1.5 text-sm font-medium">
          <MessageSquare className="h-3.5 w-3.5 text-primary" /> Message <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="enq-message"
          required
          value={message}
          maxLength={2000}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Auto-generated based on your inputs"
          rows={4}
        />
      </div>

      <Button
        type="submit"
        className="w-full gap-2 font-semibold"
        disabled={isSubmitting}
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Mail className="w-4 h-4" />
            Submit Enquiry
          </>
        )}
      </Button>
    </form>
  );
};

export default EnquiryForm;
