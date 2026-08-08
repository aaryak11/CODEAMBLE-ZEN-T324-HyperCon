import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthService } from "../services/auth/AuthService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(AuthService.getStoredLocation());
  const [isLoading, setIsLoading] = useState(true);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Automatically restore session & location on mount
  useEffect(() => {
    const session = AuthService.getStoredSession();
    if (session) {
      setUser(session);
      if (session.selectedLocation) {
        setUserLocation(session.selectedLocation);
      }
    }
    setIsLoading(false);
  }, []);

  const updateLocation = async (newLocation) => {
    setUserLocation(newLocation);
    const updatedLoc = await AuthService.updateLocation(user?.id, newLocation);
    if (user) {
      setUser((prev) => (prev ? { ...prev, selectedLocation: updatedLoc } : prev));
    }
    return updatedLoc;
  };

  const requestGpsLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return Promise.reject("Unsupported");
    }

    setIsGpsLoading(true);
    setGpsError("");

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const newLat = pos.coords.latitude;
          const newLng = pos.coords.longitude;
          const liveLoc = {
            lat: newLat,
            lng: newLng,
            label: `Live GPS (${newLat.toFixed(3)}, ${newLng.toFixed(3)})`,
            isLiveDevice: true,
          };
          await updateLocation(liveLoc);
          setIsGpsLoading(false);
          setGpsError("");
          resolve(liveLoc);
        },
        (err) => {
          console.warn("AuthContext GPS error:", err.code, err.message);
          let msg = "Location permission denied.";
          if (err.code === 1) {
            msg = "Location permission denied. Please allow location in your browser settings.";
          } else if (err.code === 2) {
            msg = "Position unavailable. Please check device GPS.";
          } else if (err.code === 3) {
            msg = "Location request timed out. Retrying...";
          }
          setGpsError(msg);
          setIsGpsLoading(false);
          reject(msg);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, [user]);

  const loginAsGuest = (name) => {
    const session = AuthService.loginAsGuest(name);
    setUser(session);
    if (session.selectedLocation) {
      setUserLocation(session.selectedLocation);
    }
    return session;
  };

  const login = async (credentials) => {
    const session = await AuthService.login(credentials);
    setUser(session);
    if (session.selectedLocation) {
      setUserLocation(session.selectedLocation);
    }
    return session;
  };

  const register = async (userData) => {
    const session = await AuthService.register({
      ...userData,
      location: userLocation,
    });
    setUser(session);
    if (session.selectedLocation) {
      setUserLocation(session.selectedLocation);
    }
    return session;
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId: user?.id || "guest-user",
        guestId: user?.id || null,
        guestName: user?.name || "Guest Shopper",
        isGuestEntered: Boolean(user?.isAuthenticated),
        userLocation,
        isLoading,
        isGpsLoading,
        gpsError,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isRoleModalOpen,
        setIsRoleModalOpen,
        isLocationModalOpen,
        setIsLocationModalOpen,
        loginAsGuest,
        login,
        register,
        updateLocation,
        requestGpsLocation,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
