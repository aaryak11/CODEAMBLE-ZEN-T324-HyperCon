import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default leaflet marker icon path issue in Vite builds
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function StoreMap({ stores, userLocation, onSelectStore, isLiveGps = false }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const centerLat = userLocation?.lat || 19.2183;
    const centerLng = userLocation?.lng || 73.0864;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 12,
      scrollWheelZoom: false,
    });

    mapInstanceRef.current = map;

    // Clean OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // "YOU ARE HERE" Pulsing Device Location Marker
    const userDivIcon = L.divIcon({
      className: "custom-user-marker",
      html: `
        <div style="position:relative; width:26px; height:26px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:26px; height:26px; border-radius:50%; background:rgba(22, 163, 74, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position:relative; width:16px; height:16px; border-radius:50%; background:#16A34A; border:3px solid #1A1A1A; box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    const userMarker = L.marker([centerLat, centerLng], { icon: userDivIcon }).addTo(map);
    userMarker.bindPopup(`
      <div style="font-family:'Inter',sans-serif; color:#1A1A1A; padding:2px;">
        <strong style="font-family:'Space Grotesk',sans-serif; font-size:13px; color:#1A1A1A;">${isLiveGps ? "Your Real-Time GPS Location" : "Selected Delivery Area"}</strong><br/>
        <span style="font-size:11px; color:#1A1A1A; font-weight:500;">${userLocation?.label || "Dombivli / Kalyan Region"}</span>
      </div>
    `);

    // Store Pin Custom Marker Icons
    stores.forEach((store) => {
      if (store.location && store.location.lat && store.location.lng) {
        const isOffline = store.feedStatus === "offline";
        const isDelayed = store.feedStatus === "delayed";
        const pinBg = isOffline ? "#EF4444" : isDelayed ? "#F59E0B" : "#16A34A";

        const storeIcon = L.divIcon({
          className: "custom-store-marker",
          html: `<div style="background-color:${pinBg}; width:24px; height:24px; border:3px solid #1A1A1A; border-radius:6px; box-shadow:2px 2px 0 0 #1A1A1A; display:flex; align-items:center; justify-content:center; color:#FFFFFF;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([store.location.lat, store.location.lng], { icon: storeIcon }).addTo(map);

        const popupContent = document.createElement("div");
        popupContent.className = "p-1 space-y-1 text-xs text-ink font-sans";
        popupContent.innerHTML = `
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="width:8px; height:8px; border-radius:50%; background-color:${pinBg}; display:inline-block;"></span>
            <strong style="color: #1A1A1A; font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700;">${store.name}</strong>
          </div>
          <p style="color: #1A1A1A; font-size: 11px; font-weight: 500; margin:2px 0;">${store.address}</p>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; font-weight:700; color:#1A1A1A;">
            <span style="display:flex; align-items:center; gap:3px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#EAB308" stroke="#1A1A1A" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              ${store.rating || 4.7}
            </span>
            <span>${store.distanceKm ? `${store.distanceKm} km away` : ""}</span>
          </div>
        `;

        if (onSelectStore && !isOffline) {
          const btn = document.createElement("button");
          btn.innerHTML = `<span style="display:inline-flex; align-items:center; justify-content:center; gap:5px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect width="14" height="14" x="1" y="5" rx="2" ry="2"/></svg>
            Watch Camera Feed
          </span>`;
          btn.className = "mt-2 px-3 py-1.5 bg-accent hover:bg-accent/90 text-surface rounded text-xs font-bold font-display border-2 border-ink shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer w-full";
          btn.onclick = () => onSelectStore(store._id);
          popupContent.appendChild(btn);
        }

        marker.bindPopup(popupContent);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [stores, userLocation, onSelectStore, isLiveGps]);

  return (
    <div className="w-full h-80 rounded-lg overflow-hidden border-3 border-ink shadow-brutal relative z-0">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
