import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Check } from "lucide-react";

export default function StoreLocationPicker({ initialLocation, onLocationChange }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [coords, setCoords] = useState(
    initialLocation || { lat: 19.2183, lng: 73.0867, address: "Dombivli East, Thane" }
  );
  const [addressInput, setAddressInput] = useState(coords.address || "Dombivli East, Thane");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 14,
      scrollWheelZoom: false,
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: "custom-picker-marker",
      html: `<div style="background-color:#EF4444; width:28px; height:28px; border:3px solid #1A1A1A; border-radius:8px; box-shadow:3px 3px 0 0 #1A1A1A; display:flex; align-items:center; justify-content:center; color:#FFFFFF;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    const marker = L.marker([coords.lat, coords.lng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", (e) => {
      const position = e.target.getLatLng();
      const updated = {
        lat: Number(position.lat.toFixed(6)),
        lng: Number(position.lng.toFixed(6)),
        address: addressInput,
      };
      setCoords(updated);
      onLocationChange && onLocationChange(updated);
    });

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      const updated = {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        address: addressInput,
      };
      setCoords(updated);
      onLocationChange && onLocationChange(updated);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleUseGps = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const updated = { lat, lng, address: addressInput };
        setCoords(updated);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);
          markerRef.current.setLatLng([lat, lng]);
        }

        onLocationChange && onLocationChange(updated);
      },
      () => {
        setIsLocating(false);
      }
    );
  };

  const handleAddressChange = (e) => {
    const val = e.target.value;
    setAddressInput(val);
    const updated = { ...coords, address: val };
    setCoords(updated);
    onLocationChange && onLocationChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold font-display text-ink flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-accent" />
          <span>Store Physical Location (Pin on Map)</span>
        </label>
        <button
          type="button"
          onClick={handleUseGps}
          disabled={isLocating}
          className="px-2.5 py-1 bg-surface hover:bg-base text-ink border-2 border-ink rounded text-[11px] font-bold font-display flex items-center gap-1 shadow-brutal-sm cursor-pointer disabled:opacity-50"
        >
          <Navigation className="w-3 h-3 text-accent" />
          <span>{isLocating ? "Detecting GPS..." : "Set via Device GPS"}</span>
        </button>
      </div>

      <input
        type="text"
        value={addressInput}
        onChange={handleAddressChange}
        placeholder="Physical store address & landmark (e.g. Shop 4, Station Road, Dombivli East)"
        className="w-full px-3.5 py-2.5 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
        required
      />

      <div className="w-full h-52 rounded-lg overflow-hidden border-2 border-ink shadow-brutal-sm relative z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-ink bg-base p-2 rounded border border-ink font-bold">
        <span>Latitude: {coords.lat}</span>
        <span>Longitude: {coords.lng}</span>
        <span className="text-emerald-700 flex items-center gap-1">
          <Check className="w-3.5 h-3.5" /> Pin Dropped
        </span>
      </div>
    </div>
  );
}
