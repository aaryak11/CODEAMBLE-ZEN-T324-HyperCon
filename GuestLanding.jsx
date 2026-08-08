import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import HyperConLogo from "./ui/HyperConLogo.jsx";
import { Video, ShieldCheck, MapPin, Zap, ArrowRight, User } from "lucide-react";

export default function GuestLanding() {
  const { loginAsGuest, setIsRoleModalOpen } = useAuth();
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    loginAsGuest(name || "Guest Shopper");
  };

  return (
    <div className="min-h-screen bg-base text-ink flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-xl w-full text-center space-y-8">
        
        {/* Logo Mark Header */}
        <div className="inline-flex flex-col items-center gap-3">
          <div className="p-4 rounded-xl bg-surface border-3 border-ink shadow-brutal">
            <HyperConLogo className="w-12 h-12" showText={false} />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-surface border-2 border-ink text-ink text-xs font-mono font-bold shadow-brutal-sm">
            <span>LIVE SHELF VERIFICATION ENGINE</span>
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-ink">
            HyperCon
          </h1>
          <p className="text-sm sm:text-base text-ink max-w-lg mx-auto leading-relaxed font-semibold">
            See the shelf before you order. Watch live camera feeds of local store shelves to verify stock and freshness.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-surface border-3 border-ink rounded-xl p-6 sm:p-8 shadow-brutal text-left space-y-6">
          <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
            <div className="space-y-0.5">
              <h2 className="text-xl font-display font-extrabold text-ink">Welcome to HyperCon</h2>
              <p className="text-xs text-ink font-semibold">
                Enter your name or sign in to start exploring live store feeds.
              </p>
            </div>
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="px-3 py-1.5 bg-base text-ink border-2 border-ink font-bold font-display rounded-md text-xs hover:bg-base/80 shadow-brutal-sm cursor-pointer"
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold font-display text-ink mb-1.5">
                Your Name / Guest Alias
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pratik / Shopper"
                className="w-full px-4 py-3 bg-surface border-3 border-ink rounded-md text-ink placeholder-ink/60 focus:outline-none focus:ring-2 focus:ring-accent font-semibold shadow-brutal-sm text-sm"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-md bg-accent hover:bg-accent/90 text-surface font-display font-extrabold flex items-center justify-center gap-2 border-3 border-ink shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition cursor-pointer text-sm"
            >
              <span>Explore 25 Local Partner Stores</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-left">
          <div className="p-4 rounded-xl bg-surface border-3 border-ink shadow-brutal space-y-2">
            <Video className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-display font-extrabold text-ink">Live Camera Feeds</h3>
            <p className="text-xs text-ink font-semibold">
              RTSP/HLS live streams directly from partner store shelves.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border-3 border-ink shadow-brutal space-y-2">
            <Zap className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-display font-extrabold text-ink">Smart Ranking</h3>
            <p className="text-xs text-ink font-semibold">
              Compare price + proximity + delivery speed automatically.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border-3 border-ink shadow-brutal space-y-2">
            <MapPin className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-display font-extrabold text-ink">GPS Location</h3>
            <p className="text-xs text-ink font-semibold">
              Real-time location distance sorting across 25 partner stores.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
