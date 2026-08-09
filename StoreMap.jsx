import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useApp } from "../context/AppContext.jsx";

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

const createStoreIcon = (status, isLive) => {
  const colors = { live: '#22c55e', unreliable: '#eab308', offline: '#ef4444' };
  const color = colors[status] || colors.offline;
  return L.divIcon({
    className: 'custom-store-marker',
    html: `<div style="width:32px;height:32px;background:${color};
      border:3px solid white;border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;position:relative;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      </svg>
      ${isLive ? '<span style="position:absolute;top:-2px;right:-2px;width:10px;height:10px;background:#ef4444;border-radius:50%;border:2px solid white;animation:pulse 1.5s infinite;"></span>' : ''}
    </div>`,
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
  });
};

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div style="width:16px;height:16px;background:#3b82f6;
    border:3px solid white;border-radius:50%;
    box-shadow:0 0 0 8px rgba(59,130,246,0.2);
    animation:pulse 2s infinite;"></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8]
});

export default function StoreMap({ stores, userLocation, onSelectStore, isLiveGps = false }) {
  const { openStoreDetail, openLiveStream } = useApp();
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
    const userMarker = L.marker([centerLat, centerLng], { icon: userIcon }).addTo(map);
    userMarker.bindPopup(`
      <div style="font-family:'Inter',sans-serif; color:#1A1A1A; padding:2px;">
        <strong style="font-family:'Space Grotesk',sans-serif; font-size:13px; color:#1A1A1A;">${isLiveGps ? "Your Real-Time GPS Location" : "Selected Delivery Area"}</strong><br/>
        <span style="font-size:11px; color:#1A1A1A; font-weight:500;">${userLocation?.label || "Dombivli / Kalyan Region"}</span>
      </div>
    `);

    // Store Pin Custom Marker Icons
    stores.forEach((store) => {
      if (store.location && store.location.lat && store.location.lng) {
        const isOffline = store.feedStatus === "offline" || store.feedReliability === "offline";
        const isDelayed = store.feedStatus === "delayed" || store.feedReliability === "unreliable";
        const status = isOffline ? "offline" : isDelayed ? "unreliable" : "live";
        const isLive = status === "live";

        const storeIcon = createStoreIcon(status, isLive);

        const marker = L.marker([store.location.lat, store.location.lng], { icon: storeIcon }).addTo(map);

        const popupContent = document.createElement("div");
        popupContent.className = "p-1 space-y-2 text-xs text-ink font-sans w-48";
        
        // Trust score representation
        const ts = store.trustScore || 85;
        let tsColor = "#ef4444";
        if (ts >= 90) tsColor = "#22c55e";
        else if (ts >= 80) tsColor = "#3b82f6";
        else if (ts >= 70) tsColor = "#eab308";

        popupContent.innerHTML = `
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:4px;">
            <strong style="color: #1A1A1A; font-size: 13px; font-weight: 800; line-height: 1.2;">${store.name}</strong>
            <span style="background:${tsColor}15; color:${tsColor}; border:1px solid ${tsColor}40; padding:1px 4px; border-radius:4px; font-size:10px; font-weight:700; white-space:nowrap;">
              Score: ${ts}
            </span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; font-weight:600; color:#4b5563;">
            <span>${store.distanceKm ? `${store.distanceKm} km` : ""}</span>
            <span style="display:flex; align-items:center; gap:2px;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${Math.round((store.distanceKm || 2) * 5 + 10)} min
            </span>
          </div>
          <div style="display:flex; flex-direction:column; gap:4px; margin-top:6px;">
            <button class="view-store-btn" style="width:100%; padding:4px 8px; background:#f3f4f6; color:#111827; border:1px solid #d1d5db; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">
              View Store
            </button>
            ${status !== 'offline' ? `
            <button class="watch-live-btn" style="width:100%; padding:4px 8px; background:#16a34a; color:white; border:none; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;">
              <span style="width:4px; height:4px; background:white; border-radius:50%; animation:pulse 1s infinite;"></span>
              Watch Live
            </button>
            ` : ''}
          </div>
        `;

        // Event delegation for dynamically added buttons
        setTimeout(() => {
          const viewBtn = popupContent.querySelector('.view-store-btn');
          if (viewBtn) {
            viewBtn.addEventListener('click', () => {
              openStoreDetail(store._id);
            });
          }
          
          const liveBtn = popupContent.querySelector('.watch-live-btn');
          if (liveBtn) {
            liveBtn.addEventListener('click', () => {
              // Usually onSelectStore sets the modal store id in HomeView
              if (onSelectStore) {
                onSelectStore(store._id);
              } else {
                openLiveStream(store);
              }
            });
          }
        }, 0);

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
      
      {/* Legend overlay */}
      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 z-[1000] 
           bg-white rounded-lg shadow-md p-2 sm:p-3 text-[10px] sm:text-xs">
        <p className="font-semibold mb-1 sm:mb-1.5">Map Legend</p>
        <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 border border-white"></span>
          <span>Live Feed Verified</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 border border-white"></span>
          <span>Feed Offline</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500 border border-white"></span>
          <span>Your Location</span>
        </div>
      </div>
    </div>
  );
}
