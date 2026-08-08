import { Sparkles, X, Store, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";

export default function NewArrivalCard({ arrival, onClose }) {
  const { setSearchQuery, setActiveScreen } = useApp();

  if (!arrival) return null;

  const handleInspect = () => {
    setSearchQuery(arrival.productName);
    setActiveScreen("search");
    onClose();
  };

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full bg-surface border-3 border-ink rounded-xl p-4 shadow-brutal-lg animate-bounce-short">
      <div className="flex items-start justify-between gap-3 border-b-2 border-ink/10 pb-2">
        <div className="flex items-center gap-1.5 bg-accent text-surface text-[10px] font-extrabold font-display uppercase tracking-wider px-2 py-0.5 rounded border border-ink shadow-brutal-sm">
          <Sparkles className="w-3 h-3" />
          <span>New Perishable Stock Arrival</span>
        </div>
        <button
          onClick={onClose}
          className="text-ink hover:text-accent p-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3 pt-3">
        <img
          src={arrival.imageUrl || "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80"}
          alt={arrival.productName}
          className="w-14 h-14 rounded-lg object-cover border-2 border-ink bg-base shrink-0"
        />

        <div className="space-y-0.5 min-w-0 flex-1">
          <h4 className="font-extrabold font-display text-sm text-ink truncate">
            {arrival.productName}
          </h4>
          <span className="text-[11px] font-semibold text-ink/80 block">
            ₹{arrival.price} / {arrival.unit || "1kg"}
          </span>
          <span className="text-[10px] font-bold text-ink flex items-center gap-1">
            <Store className="w-3 h-3 text-accent" />
            <span className="truncate">{arrival.storeName}</span>
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-ink/10 flex items-center justify-between">
        <span className="text-[10px] font-mono text-ink/70">Live Shelf Updated</span>
        <button
          onClick={handleInspect}
          className="px-3 py-1 bg-accent hover:bg-accent/90 text-surface text-xs font-bold font-display rounded border-2 border-ink shadow-brutal-sm flex items-center gap-1 cursor-pointer"
        >
          <span>Inspect Feed</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
