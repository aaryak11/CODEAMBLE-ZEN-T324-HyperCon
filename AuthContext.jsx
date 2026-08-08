import { createContext, useContext, useState, useEffect } from "react";
import { AuthService } from "../services/auth/AuthService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(AuthService.getStoredLocation());
  const [isLoading, setIsLoading] = useState(true);
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

  const updateLocation = async (newLocation) => {
    setUserLocation(newLocation);
    const updatedLoc = await AuthService.updateLocation(user?.id, newLocation);
    if (user) {
      setUser((prev) => (prev ? { ...prev, selectedLocation: updatedLoc } : prev));
    }
    return updatedLoc;
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
