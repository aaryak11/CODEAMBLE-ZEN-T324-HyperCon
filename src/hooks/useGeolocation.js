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
    setErrorMsg("");

    const handleSuccess = (position) => {
      const now = Date.now();
      const newLat = position.coords.latitude;
      const newLng = position.coords.longitude;

      if (now - lastUpdateRef.current < 2000 && coords) {
        return;
      }
      lastUpdateRef.current = now;

      setCoords({
        lat: newLat,
        lng: newLng,
        accuracy: position.coords.accuracy,
        isLiveDevice: true,
        label: `Current Location (${newLat.toFixed(3)}, ${newLng.toFixed(3)})`,
      });
      setStatus("granted");
      setErrorMsg("");
    };

    const handleError = (err) => {
      console.warn("Geolocation permission/fetch error:", err.code, err.message);
      setStatus("denied");
      let msg = "Location permission denied.";
      if (err.code === 1) {
        msg = "Location permission denied. Please allow location access in browser settings.";
      } else if (err.code === 2) {
        msg = "Position unavailable. Please check GPS settings.";
      } else if (err.code === 3) {
        msg = "Location request timed out. Using default delivery location.";
      }
      setErrorMsg(msg);
    };

    // Use maximumAge: 0 to get fresh real position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 5000,
    });

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [coords]);

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
        label: coords.label || "Current GPS Location",
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
