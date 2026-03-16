import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
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

// Conversion factors to Sq.m as base
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

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  // Location fields
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");

  // Area fields
  const [areaType, setAreaType] = useState("");
  const [area, setArea] = useState("");
  const [areaUnit, setAreaUnit] = useState("Sq.ft");

  // Country code
  const [countryCode, setCountryCode] = useState("+91");

  // Auto-set country code when country changes
  useEffect(() => {
    if (country) {
      const code = COUNTRY_CODES[country];
      if (code) setCountryCode(code);
    }
  }, [country]);

  // Auto-generate message when relevant fields change
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
      setMessage(`I am interested in ${serviceTitle}.\n${parts.slice(1).join("\n")}`);
    }
  }, [serviceTitle, areaType, area, areaUnit, city, state, country, fullAddress, lat, lon]);

  // Area conversions
  const getConversions = () => {
    const val = parseFloat(area);
    if (!val || isNaN(val)) return null;
    const sqm = val * TO_SQM[areaUnit];
    return AREA_UNITS.filter((u) => u !== areaUnit).map((u) => ({
      unit: u,
      value: (sqm / TO_SQM[u]).toFixed(2),
    }));
  };

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

          setCountry(addr.country || "");
          setState(addr.state || "");
          setCity(addr.city || addr.town || addr.county || addr.village || "");
          setFullAddress(data.display_name || "");

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

    if (!trimName || !trimEmail) {
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
        lat && lon && `[Map: https://www.google.com/maps?q=${lat},${lon}]`,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 max-h-[65vh] overflow-y-auto pr-1">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="enq-name">Name *</Label>
        <Input
          id="enq-name"
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      {/* Auto-Fill Location Button */}
      <div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={detectLocation}
          disabled={detectingLocation}
        >
          {detectingLocation ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Detecting...
            </>
          ) : (
            "Auto-Fill"
          )}
        </Button>
      </div>

      {/* Country */}
      <div className="space-y-1.5">
        <Label htmlFor="enq-country">Country</Label>
        <Input
          id="enq-country"
          maxLength={100}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Country"
        />
      </div>

      {/* State/Province */}
      <div className="space-y-1.5">
        <Label htmlFor="enq-state">State / Province</Label>
        <Input
          id="enq-state"
          maxLength={100}
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder="State / Province"
        />
      </div>

      {/* City */}
      <div className="space-y-1.5">
        <Label htmlFor="enq-city">City</Label>
        <Input
          id="enq-city"
          maxLength={100}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
        />
      </div>

      {/* Full Address */}
      <div className="space-y-1.5">
        <Label htmlFor="enq-address">Full Address</Label>
        <Input
          id="enq-address"
          maxLength={500}
          value={fullAddress}
          onChange={(e) => setFullAddress(e.target.value)}
          placeholder="Full address"
        />
      </div>

      {/* Lat / Lon */}
      {(lat || lon) && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Latitude</Label>
            <Input value={lat} readOnly className="text-xs bg-muted/30" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Longitude</Label>
            <Input value={lon} readOnly className="text-xs bg-muted/30" />
          </div>
        </div>
      )}

      {/* Area Type */}
      <div className="space-y-1.5">
        <Label>Area Type</Label>
        <Select value={areaType} onValueChange={setAreaType}>
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
        <Label htmlFor="enq-area">Area</Label>
        <div className="flex gap-2">
          <Input
            id="enq-area"
            type="number"
            min="0"
            step="any"
            className="flex-1"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. 2400"
          />
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
          <p className="text-xs text-muted-foreground mt-1">
            ≈ {conversions.map((c) => `${c.value} ${c.unit}`).join(" · ")}
          </p>
        )}
      </div>

      {/* Phone with country code */}
      <div className="space-y-1.5">
        <Label htmlFor="enq-phone">Phone Number</Label>
        <div className="flex gap-2">
          <Input
            className="w-[80px] text-center text-sm"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            maxLength={6}
          />
          <Input
            id="enq-phone"
            type="tel"
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
        <Label htmlFor="enq-email">Email *</Label>
        <Input
          id="enq-email"
          type="email"
          required
          maxLength={255}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
        />
      </div>

      {/* Message (auto-generated) */}
      <div className="space-y-1.5">
        <Label htmlFor="enq-message">Message</Label>
        <Textarea
          id="enq-message"
          value={message}
          maxLength={2000}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Auto-generated based on your inputs"
          rows={4}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Enquiry"
        )}
      </Button>
    </form>
  );
};

export default EnquiryForm;
