import { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api.js";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [currentStore, setCurrentStore] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("hypercon_admin_token"));
  const [loading, setLoading] = useState(true);

  // Validate and load token on mount
  useEffect(() => {
    async function loadAdminProfile() {
      const storedToken = localStorage.getItem("hypercon_admin_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/admin/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setAdminUser(data.user);
          setCurrentStore(data.store);
          setToken(storedToken);
        } else {
          // Token expired or invalid
          localStorage.removeItem("hypercon_admin_token");
          setToken(null);
          setAdminUser(null);
          setCurrentStore(null);
        }
      } catch (err) {
        console.warn("Failed to verify admin token with backend:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminProfile();
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Store owner login failed");
    }

    localStorage.setItem("hypercon_admin_token", data.token);
    setToken(data.token);
    setAdminUser(data.user);
    setCurrentStore(data.store);
    return data;
  };

  const signup = async (formData) => {
    const res = await fetch(`${API_BASE_URL}/admin/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Store owner registration failed");
    }

    localStorage.setItem("hypercon_admin_token", data.token);
    setToken(data.token);
    setAdminUser(data.user);
    setCurrentStore(data.store);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("hypercon_admin_token");
    setToken(null);
    setAdminUser(null);
    setCurrentStore(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        currentStore,
        setCurrentStore,
        token,
        isAuthenticated: !!token && !!adminUser,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return ctx;
}
