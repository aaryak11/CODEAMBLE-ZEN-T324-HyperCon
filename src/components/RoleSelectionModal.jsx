import { useAuth } from "../context/AuthContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import HyperConLogo from "./ui/HyperConLogo.jsx";
import { X, User, Store, ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";

export default function RoleSelectionModal() {
  const { isRoleModalOpen, setIsRoleModalOpen, setIsAuthModalOpen } = useAuth();
  const { setIsAdminMode } = useApp();

  if (!isRoleModalOpen) return null;

  const handleSelectCustomer = () => {
    setIsRoleModalOpen(false);
    setIsAuthModalOpen(true);
  };

  const handleSelectStoreOwner = () => {
    setIsRoleModalOpen(false);
    setIsAdminMode(true);
  };

  return (
    <div
      className="fixed inset-0 bg-ink/70 z-50 flex items-center justify-center p-4"
      onClick={() => setIsRoleModalOpen(false)}
    >
      <div
        className="bg-surface border-3 border-ink rounded-xl p-6 sm:p-8 max-w-lg w-full text-ink shadow-brutal-lg space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-ink pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface border-2 border-ink shadow-brutal-sm">
              <HyperConLogo className="w-8 h-8" showText={false} />
            </div>
            <div>
              <h2 className="font-extrabold font-display text-ink text-xl">Welcome to HyperCon</h2>
              <p className="text-xs text-ink font-semibold">Select your account type to proceed</p>
            </div>
          </div>

          <button
            onClick={() => setIsRoleModalOpen(false)}
            className="p-1.5 rounded-lg bg-surface border-2 border-ink hover:bg-base text-ink shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Choice Question Banner */}
        <div className="text-center space-y-1">
          <h3 className="text-lg font-display font-extrabold text-ink">
            Are you a Customer or a Store Owner?
          </h3>
          <p className="text-xs text-ink font-semibold">
            Choose your role to get directed to the correct portal
          </p>
        </div>

        {/* Options Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* 1. Customer Option Card */}
          <button
            onClick={handleSelectCustomer}
            className="p-5 rounded-xl bg-base hover:bg-surface border-3 border-ink shadow-brutal hover:translate-y-[-2px] transition text-left flex flex-col justify-between space-y-4 group cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-accent text-surface border-2 border-ink flex items-center justify-center shadow-brutal-sm">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-surface border border-ink text-ink inline-block mb-1">
                  SHOPPER PORTAL
                </span>
                <h4 className="font-extrabold font-display text-base text-ink group-hover:text-accent transition">
                  Customer
                </h4>
                <p className="text-xs text-ink font-semibold leading-relaxed mt-1">
                  Browse live camera feeds on store shelves, compare produce prices, and order fresh items.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-extrabold font-display text-accent pt-2 border-t border-ink/10">
              <span>Continue as Customer</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </button>

          {/* 2. Store Owner Option Card */}
          <button
            onClick={handleSelectStoreOwner}
            className="p-5 rounded-xl bg-base hover:bg-surface border-3 border-ink shadow-brutal hover:translate-y-[-2px] transition text-left flex flex-col justify-between space-y-4 group cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-ink text-surface border-2 border-ink flex items-center justify-center shadow-brutal-sm">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-surface border border-ink text-ink inline-block mb-1">
                  ADMIN PORTAL
                </span>
                <h4 className="font-extrabold font-display text-base text-ink group-hover:text-accent transition">
                  Store Owner
                </h4>
                <p className="text-xs text-ink font-semibold leading-relaxed mt-1">
                  Manage live camera streams, edit inventory & pricing, drop store location pin, and view payouts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-extrabold font-display text-ink pt-2 border-t border-ink/10">
              <span>Go to Admin Panel</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition text-accent" />
            </div>
          </button>

        </div>

        {/* Footer Note */}
        <div className="text-center pt-2 border-t border-ink/10">
          <p className="text-[11px] text-ink font-semibold flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>HyperCon Platform — Live Shelf Camera Verification</span>
          </p>
        </div>

      </div>
    </div>
  );
}
