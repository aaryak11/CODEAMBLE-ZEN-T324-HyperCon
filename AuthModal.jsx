import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { X, ShieldCheck, Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react";

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register, loginAsGuest, updateLocation } = useAuth();
  const [tab, setTab] = useState("login"); // 'login' | 'register' | 'guest'
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setError(null);
    setIsAuthModalOpen(false);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      handleClose();
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ name, email, password });
      handleClose();
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    loginAsGuest(name || "Guest Shopper");
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 bg-ink/70 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-surface border-3 border-ink rounded-lg p-6 sm:p-8 max-w-md w-full text-ink shadow-brutal-lg space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-ink pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-accentSoft text-accent border-2 border-ink flex items-center justify-center font-bold font-display shadow-brutal-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold font-display text-ink text-xl">HyperCon Account</h2>
              <p className="text-xs text-ink/70 font-medium">Persistent sessions & order tracking</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-surface border-2 border-ink hover:bg-accentSoft text-ink shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-surface p-1 rounded-lg border-2 border-ink shadow-brutal-sm">
          <button
            onClick={() => { setTab("login"); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-bold font-display rounded transition cursor-pointer ${
              tab === "login" ? "bg-accent text-surface border-2 border-ink" : "text-ink hover:bg-accentSoft"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab("register"); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-bold font-display rounded transition cursor-pointer ${
              tab === "register" ? "bg-accent text-surface border-2 border-ink" : "text-ink hover:bg-accentSoft"
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => { setTab("guest"); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-bold font-display rounded transition cursor-pointer ${
              tab === "guest" ? "bg-accent text-surface border-2 border-ink" : "text-ink hover:bg-accentSoft"
            }`}
          >
            Quick Guest
          </button>
        </div>

        {error && (
          <div className="p-3 bg-accentSoft border-2 border-ink text-ink rounded-lg text-xs font-bold font-display">
            {error}
          </div>
        )}

        {/* Login Form */}
        {tab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold font-display text-ink mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink/40 absolute left-3 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border-2 border-ink rounded-lg text-ink placeholder-ink/40 focus:outline-none text-xs font-medium shadow-brutal-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold font-display text-ink mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink/40 absolute left-3 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border-2 border-ink rounded-lg text-ink placeholder-ink/40 focus:outline-none text-xs font-medium shadow-brutal-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-50 text-surface font-bold font-display flex items-center justify-center gap-2 border-3 border-ink shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition cursor-pointer text-xs"
            >
              <span>{loading ? "Signing In..." : "Sign In to Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold font-display text-ink mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-ink/40 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pratik / Judge"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border-2 border-ink rounded-lg text-ink placeholder-ink/40 focus:outline-none text-xs font-medium shadow-brutal-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold font-display text-ink mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink/40 absolute left-3 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border-2 border-ink rounded-lg text-ink placeholder-ink/40 focus:outline-none text-xs font-medium shadow-brutal-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold font-display text-ink mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink/40 absolute left-3 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border-2 border-ink rounded-lg text-ink placeholder-ink/40 focus:outline-none text-xs font-medium shadow-brutal-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-50 text-surface font-bold font-display flex items-center justify-center gap-2 border-3 border-ink shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition cursor-pointer text-xs"
            >
              <span>{loading ? "Creating Account..." : "Create Account & Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Quick Guest Form */}
        {tab === "guest" && (
          <form onSubmit={handleGuestSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold font-display text-ink mb-1">Guest Alias / Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-ink/40 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Guest Shopper"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border-2 border-ink rounded-lg text-ink placeholder-ink/40 focus:outline-none text-xs font-medium shadow-brutal-sm"
                />
              </div>
            </div>

            <p className="text-xs text-ink/70 font-medium leading-relaxed">
              Explore HyperCon immediately without creating a password.
            </p>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg bg-accent hover:bg-accent/90 text-surface font-bold font-display flex items-center justify-center gap-2 border-3 border-ink shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition cursor-pointer text-xs"
            >
              <span>Continue as Guest</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
