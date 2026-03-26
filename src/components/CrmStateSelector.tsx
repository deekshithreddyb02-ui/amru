import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, MapPin, Navigation, FileEdit } from "lucide-react";
import { toast } from "sonner";

interface CrmUrl {
  state_key: string;
  label: string;
  crm_url: string;
  enabled: boolean;
}

interface CrmStateSelectorProps {
  onFillFormHere: () => void;
}

const STATE_DETECT_MAP: Record<string, string> = {
  telangana: "telangana",
  maharashtra: "maharashtra",
  karnataka: "karnataka",
  "andhra pradesh": "andhrapradesh",
  "andhra": "andhrapradesh",
};

const CrmStateSelector = ({ onFillFormHere }: CrmStateSelectorProps) => {
  const [crms, setCrms] = useState<CrmUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [detectedState, setDetectedState] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    const fetchCrmUrls = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("crm-urls");
        if (!error && data?.crms) {
          setCrms(data.crms.filter((c: CrmUrl) => c.enabled && c.crm_url));
        }
      } catch {
        // fallback
      }
      setLoading(false);
    };
    fetchCrmUrls();
    detectLocation();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`
          );
          const data = await res.json();
          if (data.address) {
            const state = (data.address.state || "").toLowerCase();
            const matched = Object.entries(STATE_DETECT_MAP).find(([key]) => state.includes(key));
            setDetectedState(matched ? matched[1] : "others");
          }
        } catch {
          // ignore
        }
        setDetecting(false);
      },
      () => setDetecting(false),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  // Sort: detected state first, then others
  const sorted = [...crms].sort((a, b) => {
    if (detectedState) {
      if (a.state_key === detectedState && b.state_key !== detectedState) return -1;
      if (b.state_key === detectedState && a.state_key !== detectedState) return 1;
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Navigation className="w-4 h-4 text-primary" />
        {detecting ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> Detecting your location…
          </span>
        ) : detectedState ? (
          <span>
            Detected: <strong className="text-foreground capitalize">{detectedState}</strong> — your state is shown first
          </span>
        ) : (
          <span>Select your state to open the enquiry form</span>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No CRM forms configured. Please use the form below.
        </p>
      ) : (
        <div className="grid gap-2">
          {sorted.map((crm) => (
            <Button
              key={crm.state_key}
              variant={detectedState === crm.state_key ? "default" : "outline"}
              className={`w-full justify-between h-auto py-3 px-4 gap-3 ${
                detectedState === crm.state_key
                  ? "ring-2 ring-primary/30 shadow-md"
                  : ""
              }`}
              onClick={() => {
                window.open(crm.crm_url, "_blank", "noopener,noreferrer");
                toast.success(`Opening ${crm.label} CRM form…`);
              }}
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{crm.label}</span>
                {detectedState === crm.state_key && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-foreground/20 font-normal">
                    📍 Your State
                  </span>
                )}
              </span>
              <ExternalLink className="w-4 h-4 shrink-0 opacity-60" />
            </Button>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-border/30">
        <Button
          variant="ghost"
          className="w-full gap-2 text-sm text-muted-foreground hover:text-foreground"
          onClick={onFillFormHere}
        >
          <FileEdit className="w-4 h-4" />
          Or fill the enquiry form here instead
        </Button>
      </div>
    </div>
  );
};

export default CrmStateSelector;
