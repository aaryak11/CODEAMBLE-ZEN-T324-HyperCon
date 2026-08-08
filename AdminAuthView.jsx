import { useState } from "react";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import StoreLocationPicker from "./StoreLocationPicker.jsx";
import HyperConLogo from "../ui/HyperConLogo.jsx";
import { Store, User, Mail, Lock, Phone, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminAuthView({ onBackToCustomer }) {
  const { login, signup } = useAdminAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form fields
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState({
    lat: 19.2183,
    lng: 73.0867,
    address: "Shop 4, Station Road, Dombivli East, Thane",
  });

  const handleFillDemo = () => {
    setEmail("owner@greenbasket.com");
    setPassword("password123");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        await signup({
          storeName,
          ownerName,
          email,
          password,
          phone,
          location,
          address: location.address,
        });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base text-ink flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-xl w-full space-y-6">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-surface border-3 border-ink rounded-xl shadow-brutal inline-flex items-center gap-2">
            <HyperConLogo className="w-8 h-8" showText={false} />
            <span className="font-extrabold font-display text-xl text-ink">HyperCon</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-accent text-surface text-xs font-mono font-extrabold border-2 border-ink shadow-brutal-sm">
            <span>STORE OWNER ADMIN PORTAL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink tracking-tight">
            {isSignup ? "Register Your Grocery Store" : "Store Owner Login"}
          </h1>
          <p className="text-xs text-ink font-semibold max-w-md">
            Manage your store's live camera feeds, inventory catalog, perishable pricing, and daily payouts.
          </p>
        </div>

        {/* Form Container Card */}
        <div className="bg-surface border-3 border-ink rounded-xl p-6 sm:p-8 shadow-brutal space-y-6">
          
          {/* Toggle Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-base p-1.5 rounded-lg border-2 border-ink">
            <button
              type="button"
              onClick={() => {
                setIsSignup(false);
                setError("");
              }}
              className={`py-2 text-xs font-extrabold font-display rounded-md transition cursor-pointer ${
                !isSignup ? "bg-accent text-surface border-2 border-ink shadow-brutal-sm" : "text-ink hover:bg-surface"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignup(true);
                setError("");
              }}
              className={`py-2 text-xs font-extrabold font-display rounded-md transition cursor-pointer ${
                isSignup ? "bg-accent text-surface border-2 border-ink shadow-brutal-sm" : "text-ink hover:bg-surface"
              }`}
            >
              Register New Store
            </button>
          </div>

          {/* Quick Demo Fill banner */}
          {!isSignup && (
            <div className="p-3 bg-emerald-50 border-2 border-emerald-800 rounded-lg flex items-center justify-between gap-2 text-xs text-emerald-950 font-semibold">
              <div>
                <span className="font-bold">Evaluation Demo Account:</span>
                <span className="block font-mono text-[11px] text-emerald-900">owner@greenbasket.com / password123</span>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="px-2.5 py-1.5 bg-emerald-700 text-white rounded text-[11px] font-bold font-display hover:bg-emerald-800 cursor-pointer shrink-0"
              >
                1-Click Autofill
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border-2 border-rose-600 rounded-lg flex items-center gap-2 text-xs font-bold text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold font-display text-ink mb-1">
                      Store Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="e.g. Green Basket Organics"
                        className="w-full pl-9 pr-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
                        required
                      />
                      <Store className="w-4 h-4 text-ink absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-display text-ink mb-1">
                      Owner Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="e.g. Rajesh Sharma"
                        className="w-full pl-9 pr-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
                        required
                      />
                      <User className="w-4 h-4 text-ink absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold font-display text-ink mb-1">
                    Store Contact Phone
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98200 12345"
                      className="w-full pl-9 pr-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    />
                    <Phone className="w-4 h-4 text-ink absolute left-2.5 top-2.5" />
                  </div>
                </div>

                {/* Location Picker with Leaflet Pin Drop */}
                <StoreLocationPicker
                  initialLocation={location}
                  onLocationChange={(newLoc) => setLocation(newLoc)}
                />
              </>
            )}

            <div>
              <label className="block text-xs font-bold font-display text-ink mb-1">
                Owner Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@store.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
                <Mail className="w-4 h-4 text-ink absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold font-display text-ink mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
                <Lock className="w-4 h-4 text-ink absolute left-2.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-accent hover:bg-accent/90 text-surface text-xs sm:text-sm font-extrabold font-display rounded-lg border-3 border-ink shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? "Processing..." : isSignup ? "Create Store & Launch Admin" : "Sign In to Admin Panel"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Back switch */}
          <div className="pt-3 border-t-2 border-ink/10 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onBackToCustomer}
              className="font-bold text-ink underline hover:text-accent cursor-pointer"
            >
              &larr; Switch back to Customer Storefront
            </button>
            <span className="text-ink font-semibold">10% Platform Fee · ₹0 Customer Commission</span>
          </div>
        </div>

      </div>
    </div>
  );
}
