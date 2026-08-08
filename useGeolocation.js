import { useState, useEffect, useCallback, useRef } from "react";

// Haversine formula to compute distance in km
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export function useGeolocation(fallbackLocation = { lat: 19.2183, lng: 73.0864, label: "Dombivli East, Thane" }) {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("idle"); // 'idle' | 'prompt' | 'granted' | 'denied' | 'unsupported'
  const [errorMsg, setErrorMsg] = useState("");
  const lastUpdateRef = useRef(0);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("unsupported");
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setStatus("prompt");

    const handleSuccess = (position) => {
      const now = Date.now();
      const newLat = position.coords.latitude;
      const newLng = position.coords.longitude;

      // Debounce updates: update at most every 5 seconds unless initial grant
      if (now - lastUpdateRef.current < 5000 && coords) {
        return;
      }
      lastUpdateRef.current = now;

      setCoords({
        lat: newLat,
        lng: newLng,
        accuracy: position.coords.accuracy,
        isLiveDevice: true,
      });
      setStatus("granted");
      setErrorMsg("");
    };

    const handleError = (err) => {
      console.warn("Geolocation permission/fetch error:", err.message);
      setStatus("denied");
      setErrorMsg(err.message || "Location permission denied.");
    };

    // First try fast current position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 10000,
    });

    // Then set watchPosition for continuous live update
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    });

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [coords]);

  // Attempt location request on mount
  useEffect(() => {
    const cleanup = requestLocation();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, []);

  const activeLocation = coords
    ? {
        lat: coords.lat,
        lng: coords.lng,
        label: "Current Device Location",
        isLiveDevice: true,
      }
    : fallbackLocation;

  return {
    coords,
    activeLocation,
    status,
    errorMsg,
    requestLocation,
  };
}
