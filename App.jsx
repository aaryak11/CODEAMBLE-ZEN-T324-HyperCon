import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import GuestLanding from "./components/GuestLanding.jsx";
import HomeView from "./components/HomeView.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import AuthModal from "./components/AuthModal.jsx";
import RoleSelectionModal from "./components/RoleSelectionModal.jsx";
import LocationModal from "./components/LocationModal.jsx";
import OrderHistoryModal from "./components/OrderHistoryModal.jsx";
import CustomerSupportModal from "./components/CustomerSupportModal.jsx";
import NewArrivalCard from "./components/NewArrivalCard.jsx";
import AdminPortal from "./components/admin/AdminPortal.jsx";
import AdminAuthView from "./components/admin/AdminAuthView.jsx";
import { ShieldCheck, AlertCircle, Info, Store } from "lucide-react";

function MainLayout() {
  const { isGuestEntered } = useAuth();
  const {
    activeScreen,
    searchQuery,
    toast,
    isAdminMode,
    setIsAdminMode,
    isSupportModalOpen,
    setIsSupportModalOpen,
    newArrival,
    setNewArrival,
  } = useApp();
  const { isAuthenticated: isAdminAuthenticated } = useAdminAuth();

  // If in Store Owner Admin Mode, render the dedicated Store Owner workflow
  if (isAdminMode) {
    if (isAdminAuthenticated) {
      return (
        <AdminPortal onBackToCustomer={() => setIsAdminMode(false)} />
      );
    }
    return (
      <AdminAuthView onBackToCustomer={() => setIsAdminMode(false)} />
    );
  }

  // Customer landing if not yet entered
  if (!isGuestEntered) {
    return (
      <>
        <GuestLanding />
        <RoleSelectionModal />
        <AuthModal />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-base text-ink font-sans flex flex-col antialiased">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeScreen === "home" ? (
          <HomeView />
        ) : (
          <SearchResults query={searchQuery} />
        )}
      </main>

      {/* Real-time New Perishable Arrival Notification Card */}
      {newArrival && (
        <NewArrivalCard
          arrival={newArrival}
          onClose={() => setNewArrival(null)}
        />
      )}

      {/* Dynamic Global Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-brutal border-3 border-ink bg-ink text-base flex items-center gap-2.5 text-xs font-semibold transition-all transform translate-y-0`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-accent" />
          ) : toast.type === "info" ? (
            <Info className="w-4 h-4 text-emerald-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-accent" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Modals & Overlays */}
      <CartDrawer />
      <RoleSelectionModal />
      <AuthModal />
      <LocationModal />
      <OrderHistoryModal />
      <CustomerSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-surface border-t-3 border-ink py-6 mt-12 text-center text-xs text-ink font-semibold">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold font-display text-ink">HyperCon Platform</span>
            <span>•</span>
            <span>Shelf Verification Engine</span>
            <span>•</span>
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="text-accent hover:underline font-bold cursor-pointer"
            >
              Contact Support
            </button>
            <span>•</span>
            <button
              onClick={() => setIsAdminMode(true)}
              className="text-accent hover:underline font-bold cursor-pointer flex items-center gap-1"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Store Owner Portal</span>
            </button>
          </div>
          <div className="text-ink font-mono text-[11px]">
            10% Platform Fee · ₹0 Customer Commission · ₹0 Delivery
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <AuthProvider>
        <AppProvider>
          <MainLayout />
        </AppProvider>
      </AuthProvider>
    </AdminAuthProvider>
  );
}
