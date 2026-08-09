/**
 * AuthService
 * Handles User registration, Login, Location updates, and Guest session management.
 */

const STORAGE_KEY_USER_SESSION = "hypercon_user_session";
const STORAGE_KEY_USER_LOCATION = "hypercon_user_location";

const DEFAULT_LOCATION = {
  label: "Dombivli East, Thane",
  lat: 19.2183,
  lng: 73.0864,
};

export class AuthService {
  /**
   * Restores stored user session or returns default guest session.
   */
  static getStoredSession() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER_SESSION);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to parse stored user session", e);
    }
    return null;
  }

  /**
   * Restores stored user location preference or returns default location.
   */
  static getStoredLocation() {
    try {
      const storedLoc = localStorage.getItem(STORAGE_KEY_USER_LOCATION);
      if (storedLoc) {
        return JSON.parse(storedLoc);
      }
    } catch (e) {
      console.warn("Failed to parse stored location", e);
    }
    return DEFAULT_LOCATION;
  }

  /**
   * Persists location preference to localStorage.
   */
  static saveStoredLocation(location) {
    localStorage.setItem(STORAGE_KEY_USER_LOCATION, JSON.stringify(location));
  }

  /**
   * Guest Login fallback.
   */
  static loginAsGuest(name = "Guest Shopper") {
    const cleanName = (name || "").trim() || "Guest Shopper";
    const guestId = "guest_" + Math.random().toString(36).substring(2, 9);
    
    const session = {
      id: guestId,
      name: cleanName,
      email: "guest@hypercon.local",
      isGuest: true,
      isAuthenticated: true,
      selectedLocation: this.getStoredLocation(),
    };

    localStorage.setItem(STORAGE_KEY_USER_SESSION, JSON.stringify(session));
    return session;
  }

  /**
   * Registered User Login.
   */
  static async login(credentials) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    const session = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      isGuest: false,
      isAuthenticated: true,
      selectedLocation: data.user.selectedLocation || this.getStoredLocation(),
      token: data.user.token,
    };

    localStorage.setItem(STORAGE_KEY_USER_SESSION, JSON.stringify(session));
    if (session.selectedLocation) {
      this.saveStoredLocation(session.selectedLocation);
    }

    return session;
  }

  /**
   * User Registration (Sign Up).
   */
  static async register(userData) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...userData,
        location: userData.location || this.getStoredLocation(),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Registration failed");
    }

    const session = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      isGuest: false,
      isAuthenticated: true,
      selectedLocation: data.user.selectedLocation || this.getStoredLocation(),
      token: data.user.token,
    };

    localStorage.setItem(STORAGE_KEY_USER_SESSION, JSON.stringify(session));
    if (session.selectedLocation) {
      this.saveStoredLocation(session.selectedLocation);
    }

    return session;
  }

  /**
   * Update selected delivery location.
   */
  static async updateLocation(userId, location) {
    this.saveStoredLocation(location);

    const session = this.getStoredSession();
    if (session) {
      session.selectedLocation = location;
      localStorage.setItem(STORAGE_KEY_USER_SESSION, JSON.stringify(session));
    }

    if (userId && !session?.isGuest) {
      try {
        await fetch("/api/auth/location", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, location }),
        });
      } catch (err) {
        console.warn("Failed to sync location to backend:", err);
      }
    }

    return location;
  }

  /**
   * Logout user and clear session.
   */
  static logout() {
    localStorage.removeItem(STORAGE_KEY_USER_SESSION);
  }
}
