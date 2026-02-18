import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useRef, useEffect } from "react";
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
  phone?: string;
  whatsapp?: string;
  lat?: number;
  lng?: number;
}

interface OfficeMapProps {
  office: Office;
  height?: string;
}

const AutoOpenMarker = ({ position, office }: { position: [number, number]; office: Office }) => {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.openPopup();
    }
  }, []);

  return (
    <Marker position={position} ref={markerRef}>
      <Popup>
        <div className="text-sm">
          <strong>{office.city}</strong>
          <p className="mt-1">{office.address}</p>
          {office.phone && (
            <p className="mt-1">
              📞 <a href={`tel:${office.phone.replace(/[^+\d]/g, "")}`}>{office.phone}</a>
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

const OfficeMap = ({ office, height = "250px" }: OfficeMapProps) => {
  if (typeof office.lat !== "number" || typeof office.lng !== "number") return null;

  return (
    <div className="w-full rounded-lg overflow-hidden border border-border shadow-sm" style={{ height }}>
      <MapContainer
        center={[office.lat, office.lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AutoOpenMarker position={[office.lat, office.lng]} office={office} />
      </MapContainer>
    </div>
  );
};

export default OfficeMap;
