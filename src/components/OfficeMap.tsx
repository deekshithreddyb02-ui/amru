import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useRef, useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Office {
  city: string;
  address: string;
  label?: string;
  phone?: string;
  whatsapp?: string;
  lat?: number;
  lng?: number;
}

interface OfficeMapProps {
  office: Office;
  height?: string;
  companyName?: string;
  popupBgColor?: string;
  popupTextColor?: string;
}

/** Disables single-finger drag on touch; enables two-finger drag */
const TouchGuard = ({ onShowHint }: { onShowHint: () => void }) => {
  const map = useMap();

  useEffect(() => {
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    // Disable default touch drag
    map.dragging.disable();

    const container = map.getContainer();

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        map.dragging.enable();
      } else {
        map.dragging.disable();
        onShowHint();
      }
    };

    const handleTouchEnd = () => {
      map.dragging.disable();
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [map, onShowHint]);

  return null;
};

const AutoOpenMarker = ({ position, office, companyName, popupBgColor, popupTextColor }: { position: [number, number]; office: Office; companyName: string; popupBgColor?: string; popupTextColor?: string }) => {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.openPopup();
    }
  }, []);

  return (
    <Marker position={position} ref={markerRef}>
      <Popup>
        <div className="text-sm p-1 rounded" style={{ 
          ...(popupBgColor ? { backgroundColor: popupBgColor } : {}),
          ...(popupTextColor ? { color: popupTextColor } : {})
        }}>
          <strong>{office.label || companyName}</strong>
          <p className="mt-1">{office.address}</p>
        </div>
      </Popup>
    </Marker>
  );
};

const OfficeMap = ({ office, height = "250px", companyName = "Amruta Integrated Water Solutions Pvt. Ltd.", popupBgColor, popupTextColor }: OfficeMapProps) => {
  const [showHint, setShowHint] = useState(false);

  if (typeof office.lat !== "number" || typeof office.lng !== "number") return null;

  const handleShowHint = () => {
    setShowHint(true);
    setTimeout(() => setShowHint(false), 1500);
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-border shadow-sm" style={{ height }}>
      <MapContainer
        center={[office.lat, office.lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution={`&copy; ${companyName} ${new Date().getFullYear()} | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>`}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AutoOpenMarker position={[office.lat, office.lng]} office={office} companyName={companyName} popupBgColor={popupBgColor} popupTextColor={popupTextColor} />
        <TouchGuard onShowHint={handleShowHint} />
      </MapContainer>
      {showHint && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/40 pointer-events-none transition-opacity">
          <span className="text-white text-sm font-medium bg-black/60 px-4 py-2 rounded-xl">
            Use two fingers to move the map
          </span>
        </div>
      )}
    </div>
  );
};

export default OfficeMap;
