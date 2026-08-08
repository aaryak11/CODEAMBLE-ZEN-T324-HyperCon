import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import HyperConLogo from "./ui/HyperConLogo.jsx";
import { Search, ShoppingBag, MapPin, User, LogOut, Package, ChevronDown, Store, LifeBuoy } from "lucide-react";

export default function Navbar({ onLocateMe, isLocating }) {
  const {
    userLocation,
    setActiveScreen,
    triggerSearch,
    cart,
    setIsCartOpen,
    orders,
    setIsOrderHistoryOpen,
    setIsAdminMode,
    setIsSupportModalOpen,
  } = useApp();

  const {
    user,
    guestName,
    logout,
    setIsAuthModalOpen,
    setIsRoleModalOpen,
    setIsLocationModalOpen,
  } = useAuth();

  const [inputVal, setInputVal] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const totalCartItems = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      triggerSearch(inputVal);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-base border-b-3 border-ink shadow-brutal-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Brand & Monoline Mark Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          onClick={() => setActiveScreen("home")}
        >
          <div className="p-2 rounded-lg bg-surface border-3 border-ink shadow-brutal-sm group-hover:bg-accentSoft transition">
            <HyperConLogo className="w-6 h-6 text-ink" showText={false} strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-extrabold font-display text-xl text-ink tracking-tight block leading-tight">
              HyperCon
            </span>
            <p className="text-[10px] font-bold font-display tracking-wider text-ink/70 uppercase hidden sm:block">
              Shelf Live Verification
            </p>
          </div>
        </div>

        {/* Location selector pill with Real-time GPS support */}
        <button
          onClick={() => setIsLocationModalOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface hover:bg-base border-3 border-ink shadow-brutal-sm text-xs text-ink transition cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          title="Change Delivery Location"
        >
          <MapPin className="w-4 h-4 text-accent shrink-0" />
          <div className="text-left leading-tight max-w-[150px]">
            <p className="text-[9px] font-bold font-display uppercase tracking-wider text-ink/60">Deliver to</p>
            <p className="font-bold font-display truncate text-ink">
              {userLocation?.isLiveDevice ? "Current GPS Location" : (userLocation?.label || "Select Location")}
            </p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-ink/70 shrink-0 ml-0.5" />
        </button>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-md mx-1 sm:mx-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-ink/50 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Search produce, e.g. Tomato, Milk, Mango..."
              className="w-full pl-9 pr-20 py-2 text-xs sm:text-sm bg-surface border-3 border-ink rounded-md focus:outline-none text-ink font-medium placeholder-ink/40 shadow-brutal-sm"
            />
            <button
              type="submit"
              className="absolute right-1 px-3 py-1 bg-accent hover:bg-accent/90 text-surface text-xs font-bold font-display rounded border-2 border-ink shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 relative">
          
          {/* Store Owner Admin Portal Button */}
          <button
            onClick={() => setIsAdminMode(true)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accentSoft hover:bg-accentSoft/80 text-ink border-3 border-ink shadow-brutal-sm text-xs font-extrabold font-display active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
            title="Open Store Owner Admin Portal"
          >
            <Store className="w-4 h-4 text-accent" />
            <span>Store Admin</span>
          </button>

          {/* Support Enquiry button */}
          <button
            onClick={() => setIsSupportModalOpen(true)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-surface hover:bg-base text-ink border-3 border-ink shadow-brutal-sm text-xs font-bold font-display cursor-pointer"
            title="Customer Support & Enquiry"
          >
            <LifeBuoy className="w-4 h-4 text-accent" />
            <span className="hidden xl:inline">Support</span>
          </button>

          {/* Order History button */}
          <button
            onClick={() => setIsOrderHistoryOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface hover:bg-base text-ink border-3 border-ink shadow-brutal-sm text-xs font-bold font-display active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
            title="Order History"
          >
            <Package className="w-4 h-4 text-ink" />
            <span>Orders</span>
            {orders.length > 0 && (
              <span className="bg-ink text-surface text-[10px] font-extrabold px-1.5 py-0.2 rounded font-mono">
                {orders.length}
              </span>
            )}
          </button>

          {/* User Profile */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface hover:bg-base text-ink text-xs border-3 border-ink shadow-brutal-sm font-bold font-display cursor-pointer"
              >
                <User className="w-4 h-4 text-ink" />
                <span className="max-w-[90px] truncate">{user.name || guestName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-ink/70" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-surface border-3 border-ink rounded-lg shadow-brutal p-2 z-50 space-y-1 text-xs font-display"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="p-2 border-b-2 border-ink/10">
                    <p className="font-bold text-ink truncate">{user.name}</p>
                    <p className="text-[10px] text-ink/60 font-medium truncate">
                      {user.email || (user.isGuest ? "Guest Shopper" : "")}
                    </p>
                  </div>

                  <button
                    onClick={() => setIsLocationModalOpen(true)}
                    className="w-full text-left p-2 rounded hover:bg-base text-ink font-bold flex items-center gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    <span>Change Location</span>
                  </button>

                  <button
                    onClick={() => setIsOrderHistoryOpen(true)}
                    className="w-full text-left p-2 rounded hover:bg-base text-ink font-bold flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-ink" />
                      <span>Order History</span>
                    </div>
                    <span className="text-[10px] bg-ink text-surface px-1.5 rounded font-bold font-mono">
                      {orders.length}
                    </span>
                  </button>

                  <button
                    onClick={logout}
                    className="w-full text-left p-2 rounded hover:bg-red-50 text-red-700 font-bold flex items-center gap-2 pt-2 border-t-2 border-ink/10"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-surface text-xs font-bold font-display border-3 border-ink shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}

          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-md bg-surface hover:bg-base text-ink border-3 border-ink shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition cursor-pointer"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-5 h-5 text-ink" />
            {totalCartItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-surface text-[10px] font-extrabold font-mono w-5 h-5 rounded-full border-2 border-ink flex items-center justify-center shadow-brutal-sm">
                {totalCartItems}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
