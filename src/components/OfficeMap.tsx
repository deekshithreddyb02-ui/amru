import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Phone } from "lucide-react";

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
  offices: Office[];
}

const OfficeMap = ({ offices }: OfficeMapProps) => {
  const validOffices = offices.filter((o): o is Office & { lat: number; lng: number } => 
    typeof o.lat === 'number' && typeof o.lng === 'number'
  );

  if (validOffices.length === 0) return null;

  const centerLat = validOffices.reduce((sum, o) => sum + o.lat, 0) / validOffices.length;
  const centerLng = validOffices.reduce((sum, o) => sum + o.lng, 0) / validOffices.length;

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-border shadow-md">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={5}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validOffices.map((office) => (
          <Marker key={office.city} position={[office.lat, office.lng]}>
            <Popup>
              <div className="text-sm">
                <strong className="text-base">{office.city}</strong>
                <p className="mt-1 text-muted-foreground">{office.address}</p>
                {office.phone && (
                  <p className="mt-1">
                    📞 <a href={`tel:${office.phone.replace(/[^+\d]/g, "")}`}>{office.phone}</a>
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default OfficeMap;
