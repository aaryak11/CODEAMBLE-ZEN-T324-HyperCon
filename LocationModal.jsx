import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { X, MapPin, Check, Navigation } from "lucide-react";

export default function LocationModal() {
  const { isLocationModalOpen, setIsLocationModalOpen, userLocation, updateLocation } = useAuth();
  const [customAddress, setCustomAddress] = useState("");

  if (!isLocationModalOpen) return null;

  const presets = [
    { label: "Dombivli East, Thane (Station Rd)", lat: 19.2183, lng: 73.0864 },
    { label: "Kalyan West, Thane (Shivaji Chowk)", lat: 19.2403, lng: 73.1305 },
    { label: "Thane Central (Viviana Circle)", lat: 19.1970, lng: 72.9730 },
    { label: "Mumbai Central (Grant Rd)", lat: 18.9696, lng: 72.8193 },
  ];

  const handleSelect = (loc) => {
    updateLocation(loc);
    setIsLocationModalOpen(false);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customAddress.trim()) return;
    const customLoc = {
      label: customAddress.trim(),
      lat: 19.2183 + (Math.random() * 0.04 - 0.02),
      lng: 73.0864 + (Math.random() * 0.04 - 0.02),
    };
    updateLocation(customLoc);
    setIsLocationModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 bg-ink/70 z-50 flex items-center justify-center p-4"
      onClick={() => setIsLocationModalOpen(false)}
    >
      <div
        className="bg-surface border-3 border-ink rounded-lg p-6 sm:p-8 max-w-md w-full text-ink shadow-brutal-lg space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-ink pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accentSoft text-accent border-2 border-ink flex items-center justify-center font-bold font-display shadow-brutal-sm">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold font-display text-lg text-ink">Choose Delivery Location</h3>
              <p className="text-xs text-ink/70 font-medium">Rankings update automatically</p>
            </div>
          </div>

          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="p-1.5 rounded-lg bg-surface border-2 border-ink hover:bg-accentSoft text-ink shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Location Buttons */}
        <div className="space-y-2">
          <p className="text-xs font-bold font-display uppercase tracking-wider text-ink/70">Popular Locations</p>
          <div className="space-y-2">
            {presets.map((loc) => {
              const isSelected = userLocation?.label === loc.label;
              return (
                <button
                  key={loc.label}
                  onClick={() => handleSelect(loc)}
                  className={`w-full p-3 rounded-lg border-2 border-ink text-left text-xs font-bold font-display flex items-center justify-between transition cursor-pointer shadow-brutal-sm ${
                    isSelected
                      ? "bg-accent text-surface"
                      : "bg-surface text-ink hover:bg-accentSoft"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 shrink-0" />
                    <span>{loc.label}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Address Input */}
        <form onSubmit={handleCustomSubmit} className="pt-2 border-t-2 border-ink/10 space-y-3">
          <label className="block text-xs font-bold font-display text-ink">Or Enter Custom Address</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder="e.g. Bandra West, Mumbai"
              className="flex-1 px-3 py-2 bg-surface border-2 border-ink rounded-lg text-ink text-xs font-medium focus:outline-none placeholder-ink/40 shadow-brutal-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-surface text-xs font-bold font-display rounded-lg border-2 border-ink shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
            >
              Set
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
