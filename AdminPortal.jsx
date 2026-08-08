import { useState, useEffect } from "react";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import InventoryModal from "./InventoryModal.jsx";
import HyperConLogo from "../ui/HyperConLogo.jsx";
import { API_BASE_URL } from "../../config/api.js";
import {
  Video,
  Layers,
  DollarSign,
  PackageCheck,
  LifeBuoy,
  LogOut,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Building,
  CreditCard,
  Send,
  Eye,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Activity
} from "lucide-react";

export default function AdminPortal({ onBackToCustomer }) {
  const { adminUser, currentStore, token, logout } = useAdminAuth();

  // Active navigation tab: 'overview' | 'inventory' | 'payouts' | 'orders' | 'support'
  const [activeTab, setActiveTab] = useState("overview");

  // Inventory state
  const [inventory, setInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  // Payout state
  const [payoutData, setPayoutData] = useState(null);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [instantSettling, setInstantSettling] = useState(false);
  const [upiInput, setUpiInput] = useState("");
  const [isEditingBank, setIsEditingBank] = useState(false);

  // Support Tickets state
  const [supportTickets, setSupportTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Orders state
  const [orders, setOrders] = useState([]);

  // Toast / notification state
  const [adminToast, setAdminToast] = useState(null);

  const showToast = (message, type = "success") => {
    setAdminToast({ message, type });
    setTimeout(() => setAdminToast(null), 3500);
  };

  // 1. Fetch Store Inventory
  const fetchInventory = async () => {
    if (!token) return;
    setLoadingInventory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInventory(data.items || []);
      }
    } catch (err) {
      console.warn("Error fetching inventory:", err);
    } finally {
      setLoadingInventory(false);
    }
  };

  // 2. Fetch Payouts Overview
  const fetchPayouts = async () => {
    if (!token) return;
    setLoadingPayouts(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/payouts/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPayoutData(data);
        setUpiInput(data.bankDetails?.upiId || "");
        setOrders(data.recentOrders || []);
      }
    } catch (err) {
      console.warn("Error fetching payouts:", err);
    } finally {
      setLoadingPayouts(false);
    }
  };

  // 3. Fetch Support Tickets
  const fetchSupportTickets = async () => {
    if (!token) return;
    setLoadingTickets(true);
    try {
      const res = await fetch(`${API_BASE_URL}/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSupportTickets(data.tickets || []);
      }
    } catch (err) {
      console.warn("Error fetching support tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  // 4. Fetch Stream Health & Verification Audit Logs
  const [streamHealth, setStreamHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  const fetchStreamHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch("/api/streams/health");
      if (res.ok) {
        const data = await res.json();
        setStreamHealth(data);
      }
    } catch (err) {
      console.warn("Error fetching stream health:", err);
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleRunVerificationSweep = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch("/api/streams/verify-now", { method: "POST" });
      if (res.ok) {
        showToast("AI Feed Verification Sweep Completed!");
        fetchStreamHealth();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchPayouts();
    fetchSupportTickets();
    fetchStreamHealth();
  }, [token]);

  // Inventory Save Handler (Add / Edit)
  const handleSaveInventoryItem = async (itemData) => {
    if (itemData._id) {
      // Edit
      const res = await fetch(`${API_BASE_URL}/admin/inventory/${itemData._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(itemData),
      });
      if (!res.ok) throw new Error("Failed to update item");
      showToast("Perishable item updated successfully!");
    } else {
      // Add New
      const res = await fetch(`${API_BASE_URL}/admin/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(itemData),
      });
      if (!res.ok) throw new Error("Failed to add item");
      showToast("New arrival product added! Broadcasted to shoppers live.");
    }
    fetchInventory();
  };

  // Inventory Stock Status Quick Switch
  const handleQuickStockToggle = async (item, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/inventory/${item._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stockStatus: newStatus }),
      });
      if (res.ok) {
        setInventory((prev) =>
          prev.map((i) => (i._id === item._id ? { ...i, stockStatus: newStatus } : i))
        );
        showToast(`Stock updated to ${newStatus.replace("_", " ")}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Inventory Delete Handler
  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to remove this item from your store shelf catalog?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/inventory/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setInventory((prev) => prev.filter((i) => i._id !== id));
        showToast("Item removed from store shelf");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Instant Settlement Trigger
  const handleInstantSettlement = async () => {
    setInstantSettling(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/payouts/instant-settlement`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        showToast("Instant Settlement IMPS transfer completed! UTR generated.");
        fetchPayouts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInstantSettling(false);
    }
  };

  // Update Bank & UPI Details
  const handleSaveBankSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/admin/payouts/bank-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ upiId: upiInput }),
      });
      if (res.ok) {
        showToast("Payout UPI details updated successfully!");
        setIsEditingBank(false);
        fetchPayouts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Support Ticket Status
  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/support/tickets/${ticketId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSupportTickets((prev) =>
          prev.map((t) => (t.ticketId === ticketId ? { ...t, status: newStatus } : t))
        );
        showToast(`Ticket status marked as ${newStatus}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered inventory list
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.category.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.shelfLocation?.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-base text-ink flex flex-col antialiased">
      
      {/* 1. ADMIN TOP NAVBAR */}
      <header className="bg-surface border-b-3 border-ink sticky top-0 z-30 shadow-brutal-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand & Store Name */}
          <div className="flex items-center gap-3">
            <HyperConLogo className="w-7 h-7" showText={false} />
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="font-extrabold font-display text-ink text-base sm:text-lg">
                  {adminUser?.storeName || currentStore?.name || "Partner Store"}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-accent text-surface text-[10px] font-mono font-bold border border-ink">
                  STORE OWNER ADMIN
                </span>
              </div>
              <span className="text-xs text-ink font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-accent" />
                {currentStore?.address || "Dombivli East, Thane"}
              </span>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToCustomer}
              className="px-3 py-1.5 bg-surface hover:bg-base text-ink border-2 border-ink rounded-lg text-xs font-bold font-display shadow-brutal-sm flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">View Customer Storefront</span>
            </button>

            <button
              onClick={logout}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-ink rounded-lg text-xs font-bold font-display shadow-brutal-sm flex items-center gap-1 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto scrollbar-none py-2 border-t border-ink/10">
          {[
            { id: "overview", label: "Store & Live Camera", icon: Video },
            { id: "inventory", label: `Perishable Inventory (${inventory.length})`, icon: Layers },
            { id: "feedHealth", label: "AI Feed Reliability", icon: ShieldCheck },
            { id: "payouts", label: "Payouts & 10% Commission", icon: DollarSign },
            { id: "orders", label: `Live Orders (${orders.length})`, icon: PackageCheck },
            { id: "support", label: `Support Tickets (${supportTickets.length})`, icon: LifeBuoy },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-extrabold font-display flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer border-2 ${
                  isActive
                    ? "bg-accent text-surface border-ink shadow-brutal-sm"
                    : "bg-surface text-ink border-transparent hover:border-ink hover:bg-base"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* 2. MAIN BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* TAB 1: OVERVIEW & LIVE CAMERA */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            
            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-surface border-3 border-ink rounded-xl p-4 shadow-brutal space-y-1">
                <span className="text-[11px] font-bold text-ink uppercase tracking-wider">Total Shelf Catalog</span>
                <p className="text-2xl sm:text-3xl font-extrabold font-display text-ink">{inventory.length}</p>
                <span className="text-[11px] text-ink font-semibold">Active Perishable SKUs</span>
              </div>

              <div className="bg-surface border-3 border-ink rounded-xl p-4 shadow-brutal space-y-1">
                <span className="text-[11px] font-bold text-ink uppercase tracking-wider">In Stock Ready</span>
                <p className="text-2xl sm:text-3xl font-extrabold font-display text-emerald-800">
                  {inventory.filter((i) => i.stockStatus === "in_stock").length}
                </p>
                <span className="text-[11px] text-ink font-semibold">Verified on Camera</span>
              </div>

              <div className="bg-surface border-3 border-ink rounded-xl p-4 shadow-brutal space-y-1">
                <span className="text-[11px] font-bold text-ink uppercase tracking-wider">Gross Sales (Current)</span>
                <p className="text-2xl sm:text-3xl font-extrabold font-display text-ink">
                  ₹{payoutData?.summary?.grossSales || 12450}
                </p>
                <span className="text-[11px] text-ink font-semibold">10% Platform Fee</span>
              </div>

              <div className="bg-surface border-3 border-ink rounded-xl p-4 shadow-brutal space-y-1">
                <span className="text-[11px] font-bold text-ink uppercase tracking-wider">Net Payable Settlement</span>
                <p className="text-2xl sm:text-3xl font-extrabold font-display text-accent">
                  ₹{payoutData?.summary?.netPayable || 11205}
                </p>
                <span className="text-[11px] text-ink font-semibold">90% Direct Store Payout</span>
              </div>
            </div>

            {/* Live Camera Feed Management Console */}
            <div className="bg-surface border-3 border-ink rounded-xl p-6 shadow-brutal space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-ink/10 pb-4">
                <div>
                  <h2 className="text-xl font-display font-extrabold text-ink flex items-center gap-2">
                    <Video className="w-5 h-5 text-accent" />
                    <span>Store Shelf Camera Stream Feed</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-700 text-xs font-mono font-extrabold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                      RTSP / HLS LIVE
                    </span>
                  </h2>
                  <p className="text-xs text-ink font-semibold">
                    Live video streamed directly to customers for interactive shelf freshness verification
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3.5 py-2 bg-accent hover:bg-accent/90 text-surface rounded-lg text-xs font-extrabold font-display border-2 border-ink shadow-brutal-sm flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Perishable SKU</span>
                </button>
              </div>

              {/* Simulated Camera Video Box */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative aspect-video bg-ink rounded-lg overflow-hidden border-3 border-ink shadow-brutal">
                  <video
                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-90"
                  />
                  {/* Camera HUD Overlays */}
                  <div className="absolute top-3 left-3 bg-black/80 text-white px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-2 border border-white/20">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                    <span>CAM 01: VEG & FRUIT MAIN RACK</span>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/80 text-white px-2.5 py-1 rounded text-xs font-mono font-bold border border-white/20">
                    1080P · 30 FPS · VERIFIED
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/80 text-white px-2.5 py-1 rounded text-xs font-mono font-bold border border-white/20">
                    LAT: {currentStore?.location?.lat || 19.2183}, LNG: {currentStore?.location?.lng || 73.0864}
                  </div>
                </div>

                {/* Camera Diagnostics & Controls */}
                <div className="space-y-4 bg-base p-4 rounded-lg border-2 border-ink">
                  <h3 className="font-extrabold font-display text-sm text-ink">Camera Diagnostic Status</h3>
                  
                  <div className="space-y-2 text-xs font-semibold text-ink">
                    <div className="flex justify-between p-2 bg-surface rounded border border-ink/40">
                      <span>Stream Protocol</span>
                      <span className="font-mono font-bold">HLS + WebRTC</span>
                    </div>
                    <div className="flex justify-between p-2 bg-surface rounded border border-ink/40">
                      <span>MediaMTX Endpoint</span>
                      <span className="font-mono font-bold">/live/{currentStore?.cameraStreamId || "store1"}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-surface rounded border border-ink/40">
                      <span>Current Viewers</span>
                      <span className="font-mono font-bold text-accent">14 Shoppers</span>
                    </div>
                    <div className="flex justify-between p-2 bg-surface rounded border border-ink/40">
                      <span>Latency</span>
                      <span className="font-mono font-bold text-emerald-800">120ms (Ultra-low)</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-ink/20 space-y-2">
                    <span className="text-[11px] font-bold text-ink block">Stream Status Controls:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button className="py-1 bg-emerald-700 text-white text-[10px] font-bold font-display rounded border border-ink">
                        Active Live
                      </button>
                      <button className="py-1 bg-surface text-ink text-[10px] font-bold font-display rounded border border-ink hover:bg-base">
                        Delayed
                      </button>
                      <button className="py-1 bg-surface text-ink text-[10px] font-bold font-display rounded border border-ink hover:bg-base">
                        Offline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: PERISHABLE INVENTORY MANAGEMENT (CRUD) */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            
            {/* Inventory Controls Header */}
            <div className="bg-surface border-3 border-ink rounded-xl p-5 shadow-brutal flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-extrabold text-ink tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-accent" />
                  <span>Store Shelf Perishable Catalog</span>
                  <span className="text-xs bg-base text-ink border-2 border-ink px-2 py-0.5 rounded font-mono font-extrabold">
                    {filteredInventory.length} Items
                  </span>
                </h2>
                <p className="text-xs text-ink font-semibold">
                  Add, update prices, manage stock levels, and assign camera shelf rack coordinates
                </p>
              </div>

              <button
                onClick={() => {
                  setItemToEdit(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2.5 bg-accent hover:bg-accent/90 text-surface text-xs font-extrabold font-display rounded-lg border-2 border-ink shadow-brutal-sm flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Perishable SKU</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search item, category, shelf..."
                  className="w-full pl-9 pr-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50"
                />
                <Search className="w-4 h-4 text-ink absolute left-2.5 top-2.5" />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none w-full sm:w-auto">
                {["All", "Produce & Veggies", "Fresh Fruits", "Dairy & Eggs", "Bakery & Breads", "Organic & Farm", "Beverages & Juices"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded text-xs font-bold font-display border whitespace-nowrap transition cursor-pointer ${
                      categoryFilter === cat
                        ? "bg-accent text-surface border-ink shadow-brutal-sm"
                        : "bg-surface text-ink border-ink/40 hover:bg-base"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Inventory Items Table / Grid */}
            {loadingInventory ? (
              <div className="p-12 text-center text-xs font-bold text-ink bg-surface border-3 border-ink rounded-xl">
                Loading store inventory catalog...
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="p-12 text-center text-xs font-bold text-ink bg-surface border-3 border-ink rounded-xl space-y-2">
                <p>No perishable items found in this category.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 bg-accent text-surface text-xs font-extrabold font-display rounded-md border-2 border-ink shadow-brutal-sm cursor-pointer"
                >
                  Add Your First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInventory.map((item) => {
                  const isLow = item.stockStatus === "low_stock";
                  const isOut = item.stockStatus === "out_of_stock";

                  return (
                    <div
                      key={item._id}
                      className="bg-surface border-3 border-ink rounded-xl p-4 shadow-brutal flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 rounded-lg object-cover border-2 border-ink bg-base shrink-0"
                          />
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <h3 className="font-extrabold font-display text-sm text-ink truncate">
                              {item.name}
                            </h3>
                            <span className="text-[11px] font-bold text-ink/70 block">
                              {item.category} · {item.unit}
                            </span>
                            <span className="text-[10px] font-mono bg-base px-1.5 py-0.5 rounded border border-ink/40 text-ink inline-block mt-0.5">
                              {item.shelfLocation || "Main Veg Rack"}
                            </span>
                          </div>
                        </div>

                        {/* Price & Stock Badge */}
                        <div className="flex items-center justify-between pt-2 border-t border-ink/10">
                          <div>
                            <span className="text-base font-extrabold font-display text-ink">₹{item.price}</span>
                            <span className="text-[10px] text-ink font-semibold ml-1">/ {item.unit}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {isOut ? (
                              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-600 text-[10px] font-bold font-mono">
                                OUT OF STOCK
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-600 text-[10px] font-bold font-mono">
                                LOW STOCK
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-600 text-[10px] font-bold font-mono">
                                IN STOCK
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Stock Status Selector */}
                        <div className="grid grid-cols-3 gap-1 bg-base p-1 rounded-md border border-ink/30 text-[10px] font-bold font-display">
                          <button
                            onClick={() => handleQuickStockToggle(item, "in_stock")}
                            className={`py-1 rounded text-center cursor-pointer ${
                              item.stockStatus === "in_stock"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-ink hover:bg-surface"
                            }`}
                          >
                            In Stock
                          </button>
                          <button
                            onClick={() => handleQuickStockToggle(item, "low_stock")}
                            className={`py-1 rounded text-center cursor-pointer ${
                              item.stockStatus === "low_stock"
                                ? "bg-amber-500 text-ink shadow-sm"
                                : "text-ink hover:bg-surface"
                            }`}
                          >
                            Low Stock
                          </button>
                          <button
                            onClick={() => handleQuickStockToggle(item, "out_of_stock")}
                            className={`py-1 rounded text-center cursor-pointer ${
                              item.stockStatus === "out_of_stock"
                                ? "bg-rose-600 text-white shadow-sm"
                                : "text-ink hover:bg-surface"
                            }`}
                          >
                            Out
                          </button>
                        </div>
                      </div>

                      {/* Item Action Footer */}
                      <div className="pt-2 border-t border-ink/10 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setItemToEdit(item);
                            setIsModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-base hover:bg-surface text-ink text-xs font-bold font-display rounded-md border border-ink flex items-center gap-1 shadow-brutal-sm cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-accent" />
                          <span>Edit Details</span>
                        </button>

                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-md border border-ink shadow-brutal-sm cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB 3: PAYOUT & COMMISSION GATEWAY */}
        {activeTab === "payouts" && (
          <div className="space-y-6">
            
            {/* Header / Summary Card */}
            <div className="bg-surface border-3 border-ink rounded-xl p-6 shadow-brutal space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-ink/10 pb-4">
                <div>
                  <h2 className="text-xl font-display font-extrabold text-ink flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-accent" />
                    <span>Store Owner Commission & Payout Gateway</span>
                  </h2>
                  <p className="text-xs text-ink font-semibold">
                    Transparent 10% platform vendor fee with zero delivery & user commission deductions
                  </p>
                </div>

                <button
                  onClick={handleInstantSettlement}
                  disabled={instantSettling}
                  className="px-4 py-2.5 bg-accent hover:bg-accent/90 text-surface text-xs font-extrabold font-display rounded-lg border-2 border-ink shadow-brutal active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{instantSettling ? "Transferring Funds..." : "Request Instant Settlement"}</span>
                </button>
              </div>

              {/* Commission Breakdown Formula Strip */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-base border-2 border-ink space-y-1">
                  <span className="text-[11px] font-bold text-ink uppercase">Gross Store Sales</span>
                  <p className="text-2xl font-extrabold font-display text-ink">
                    ₹{payoutData?.summary?.grossSales || 12450}
                  </p>
                  <span className="text-[10px] text-ink font-semibold">Total Customer Orders</span>
                </div>

                <div className="p-4 rounded-lg bg-base border-2 border-ink space-y-1">
                  <span className="text-[11px] font-bold text-ink uppercase">Platform Fee (10%)</span>
                  <p className="text-2xl font-extrabold font-display text-rose-800">
                    - ₹{payoutData?.summary?.platformCommission || 1245}
                  </p>
                  <span className="text-[10px] text-ink font-semibold">Live Camera & Infra Fee</span>
                </div>

                <div className="p-4 rounded-lg bg-base border-2 border-ink space-y-1">
                  <span className="text-[11px] font-bold text-ink uppercase">Delivery & User Fee</span>
                  <p className="text-2xl font-extrabold font-display text-emerald-800">
                    ₹0 (FREE)
                  </p>
                  <span className="text-[10px] text-ink font-semibold">Guaranteed ₹0 Fee Platform</span>
                </div>

                <div className="p-4 rounded-lg bg-accent text-surface border-2 border-ink space-y-1 shadow-brutal-sm">
                  <span className="text-[11px] font-bold uppercase text-surface/90">Net Store Settlement (90%)</span>
                  <p className="text-2xl font-extrabold font-display text-surface">
                    ₹{payoutData?.summary?.netPayable || 11205}
                  </p>
                  <span className="text-[10px] text-surface/90 font-semibold">Direct UPI Transfer</span>
                </div>
              </div>
            </div>

            {/* Bank / UPI Settings Card */}
            <div className="bg-surface border-3 border-ink rounded-xl p-6 shadow-brutal space-y-4">
              <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
                <h3 className="font-extrabold font-display text-base text-ink flex items-center gap-2">
                  <Building className="w-4 h-4 text-accent" />
                  <span>Store Settlement Account & UPI ID</span>
                </h3>
                <button
                  onClick={() => setIsEditingBank(!isEditingBank)}
                  className="text-xs font-bold text-accent underline cursor-pointer"
                >
                  {isEditingBank ? "Cancel" : "Edit Details"}
                </button>
              </div>

              {isEditingBank ? (
                <form onSubmit={handleSaveBankSettings} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold font-display text-ink mb-1">
                      Store UPI ID for Instant Settlements
                    </label>
                    <input
                      type="text"
                      value={upiInput}
                      onChange={(e) => setUpiInput(e.target.value)}
                      placeholder="e.g. greenbasket@okhdfcbank"
                      className="w-full px-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent text-surface text-xs font-extrabold font-display rounded-lg border-2 border-ink shadow-brutal-sm cursor-pointer"
                  >
                    Save UPI Settings
                  </button>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-ink">
                  <div className="p-3 bg-base rounded-lg border border-ink/40">
                    <span className="text-[11px] text-ink/70 block">Registered UPI ID</span>
                    <span className="font-mono font-extrabold text-sm">{payoutData?.bankDetails?.upiId || "greenbasket@okhdfcbank"}</span>
                  </div>
                  <div className="p-3 bg-base rounded-lg border border-ink/40">
                    <span className="text-[11px] text-ink/70 block">Partner Bank</span>
                    <span className="font-bold text-sm">{payoutData?.bankDetails?.bankName || "HDFC Bank"}</span>
                  </div>
                  <div className="p-3 bg-base rounded-lg border border-ink/40">
                    <span className="text-[11px] text-ink/70 block">Settlement Frequency</span>
                    <span className="font-bold text-sm text-emerald-800">{payoutData?.bankDetails?.settlementFrequency || "Daily Auto-Settlement"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Payouts History Table */}
            <div className="bg-surface border-3 border-ink rounded-xl p-6 shadow-brutal space-y-4">
              <h3 className="font-extrabold font-display text-base text-ink">
                Settlement & Payout Transfer History
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-ink bg-base font-extrabold font-display text-ink">
                      <th className="p-3">Payout ID</th>
                      <th className="p-3">Period</th>
                      <th className="p-3">Orders</th>
                      <th className="p-3">Gross Sales</th>
                      <th className="p-3">10% Platform Fee</th>
                      <th className="p-3">Net Paid</th>
                      <th className="p-3">UTR Reference</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10 font-semibold text-ink">
                    {(payoutData?.payoutsHistory || []).map((p) => (
                      <tr key={p.payoutId} className="hover:bg-base/60">
                        <td className="p-3 font-mono font-bold">{p.payoutId}</td>
                        <td className="p-3">{p.period}</td>
                        <td className="p-3 font-mono">{p.ordersCount}</td>
                        <td className="p-3 font-bold">₹{p.grossSales}</td>
                        <td className="p-3 text-rose-800 font-bold">- ₹{p.platformCommission}</td>
                        <td className="p-3 text-emerald-900 font-extrabold text-sm">₹{p.netPayable}</td>
                        <td className="p-3 font-mono text-[11px]">{p.referenceUtr}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-700 text-[10px] font-mono font-extrabold">
                            PAID OUT
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: LIVE STORE ORDERS */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="bg-surface border-3 border-ink rounded-xl p-5 shadow-brutal flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-extrabold text-ink tracking-tight flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-accent" />
                  <span>Real-Time Customer Orders</span>
                  <span className="text-xs bg-base text-ink border-2 border-ink px-2 py-0.5 rounded font-mono font-extrabold">
                    {orders.length} Orders
                  </span>
                </h2>
                <p className="text-xs text-ink font-semibold">
                  Orders placed by customers after inspecting live shelf video feeds
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center text-xs font-bold text-ink bg-surface border-3 border-ink rounded-xl">
                No orders placed in this store yet today.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord, idx) => (
                  <div
                    key={ord.orderId || idx}
                    className="bg-surface border-3 border-ink rounded-xl p-5 shadow-brutal space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink/10 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold font-mono text-sm text-ink">
                          {ord.orderId || `ORD-${idx + 100}`}
                        </span>
                        <span className="text-xs font-semibold text-ink/70">
                          {ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString() : "Just now"}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-700 text-[10px] font-mono font-extrabold">
                          {ord.status?.toUpperCase() || "COMPLETED"}
                        </span>
                      </div>

                      <div className="text-sm font-extrabold font-display text-accent">
                        Total: ₹{ord.totalPrice || ord.totalAmount || 180}
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {(ord.items || []).map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="p-2 bg-base rounded border border-ink/40 flex items-center justify-between text-xs font-semibold text-ink"
                        >
                          <span className="truncate">{item.productName || item.name}</span>
                          <span className="font-mono font-bold ml-2">₹{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SUPPORT TICKETS & ENQUIRIES */}
        {activeTab === "support" && (
          <div className="space-y-6">
            <div className="bg-surface border-3 border-ink rounded-xl p-5 shadow-brutal flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-extrabold text-ink tracking-tight flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-accent" />
                  <span>Customer Support & Inquiries</span>
                  <span className="text-xs bg-base text-ink border-2 border-ink px-2 py-0.5 rounded font-mono font-extrabold">
                    {supportTickets.length} Tickets
                  </span>
                </h2>
                <p className="text-xs text-ink font-semibold">
                  Customer enquiries regarding produce freshness, live video feeds, orders, and payments
                </p>
              </div>
            </div>

            {loadingTickets ? (
              <div className="p-12 text-center text-xs font-bold text-ink bg-surface border-3 border-ink rounded-xl">
                Loading support tickets...
              </div>
            ) : supportTickets.length === 0 ? (
              <div className="p-12 text-center text-xs font-bold text-ink bg-surface border-3 border-ink rounded-xl">
                No customer support tickets received.
              </div>
            ) : (
              <div className="space-y-4">
                {supportTickets.map((t) => (
                  <div
                    key={t.ticketId}
                    className="bg-surface border-3 border-ink rounded-xl p-5 shadow-brutal space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink/10 pb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded bg-base border border-ink">
                          {t.ticketId}
                        </span>
                        <h3 className="font-extrabold font-display text-sm text-ink">{t.subject}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-ink/70">
                          {t.customerName} ({t.email})
                        </span>
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateTicketStatus(t.ticketId, e.target.value)}
                          className="px-2 py-1 rounded text-xs font-bold font-display border-2 border-ink bg-surface text-ink"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-xs text-ink font-semibold leading-relaxed bg-base p-3 rounded-lg border border-ink/30">
                      &ldquo;{t.message}&rdquo;
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-ink font-semibold">
                      <span>Category: <strong>{t.category}</strong></span>
                      <span>Order ID: <strong>{t.orderId || "N/A"}</strong></span>
                      <span>Submitted: {new Date(t.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: AI FEED RELIABILITY & HEALTH LOGS */}
        {activeTab === "feedHealth" && (
          <div className="space-y-6">
            <div className="bg-surface border-3 border-ink rounded-xl p-5 shadow-brutal flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-extrabold text-ink tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                  <span>AI Live Feed Reliability & Motion Analysis</span>
                </h2>
                <p className="text-xs text-subcopy font-semibold mt-0.5">
                  Automated background frame-diff, loop detection, & camera stream audit engine
                </p>
              </div>

              <button
                onClick={handleRunVerificationSweep}
                disabled={loadingHealth}
                className="px-4 py-2.5 bg-accent hover:bg-accent/90 text-surface text-xs font-bold font-display rounded-lg border-2 border-ink shadow-brutal-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none self-start sm:self-auto"
              >
                <RefreshCw className={`w-4 h-4 ${loadingHealth ? "animate-spin" : ""}`} />
                <span>Run Instant AI Verification Sweep</span>
              </button>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-surface border-3 border-ink rounded-xl p-4 shadow-brutal space-y-1">
                <span className="text-[11px] font-bold text-ink uppercase tracking-wider">Verified Live Streams</span>
                <p className="text-3xl font-extrabold font-display text-emerald-700">
                  {streamHealth?.verifiedCount || 0}
                </p>
                <span className="text-[11px] text-subcopy font-semibold">Motion & Perceptual Hash OK</span>
              </div>

              <div className="bg-surface border-3 border-ink rounded-xl p-4 shadow-brutal space-y-1">
                <span className="text-[11px] font-bold text-ink uppercase tracking-wider">Unverified / Suspicious</span>
                <p className="text-3xl font-extrabold font-display text-amber-600">
                  {streamHealth?.unreliableCount || 0}
                </p>
                <span className="text-[11px] text-subcopy font-semibold">Static/Looped Video Flagged</span>
              </div>

              <div className="bg-surface border-3 border-ink rounded-xl p-4 shadow-brutal space-y-1">
                <span className="text-[11px] font-bold text-ink uppercase tracking-wider">Offline Streams</span>
                <p className="text-3xl font-extrabold font-display text-red-600">
                  {streamHealth?.offlineCount || 0}
                </p>
                <span className="text-[11px] text-subcopy font-semibold">Connection Timed Out</span>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-surface border-3 border-ink rounded-xl p-5 shadow-brutal space-y-4">
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <h3 className="font-extrabold font-display text-base text-ink">Background Verification Audit Log</h3>
                <span className="text-xs font-mono font-bold bg-base border border-ink px-2 py-0.5 rounded text-ink">
                  {streamHealth?.logs?.length || 0} Recent Audits
                </span>
              </div>

              {!streamHealth?.logs || streamHealth.logs.length === 0 ? (
                <p className="text-xs font-semibold text-subcopy text-center py-6">
                  No verification audit logs recorded yet. Trigger a sweep above.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead>
                      <tr className="border-b-2 border-ink text-ink font-bold font-display uppercase tracking-wider bg-base text-[11px]">
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Store Name</th>
                        <th className="py-2.5 px-3">Verdict Status</th>
                        <th className="py-2.5 px-3">Motion Diff Score</th>
                        <th className="py-2.5 px-3">Loop Detected</th>
                        <th className="py-2.5 px-3">Confidence</th>
                        <th className="py-2.5 px-3">Analysis Findings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/10 font-mono text-[11px]">
                      {streamHealth.logs.map((log) => (
                        <tr key={log.id} className="hover:bg-base/50 transition">
                          <td className="py-2.5 px-3 text-ink font-bold">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2.5 px-3 text-ink font-sans font-extrabold">{log.storeName}</td>
                          <td className="py-2.5 px-3">
                            {log.verdict === "verified" ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-700 font-extrabold">
                                VERIFIED
                              </span>
                            ) : log.verdict === "unreliable" ? (
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-700 font-extrabold">
                                UNVERIFIED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-red-100 text-red-950 border border-red-700 font-extrabold">
                                OFFLINE
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-ink">{log.diffScore}%</td>
                          <td className="py-2.5 px-3">
                            {log.loopDetected ? (
                              <span className="text-amber-700 font-bold">YES (LOOP)</span>
                            ) : (
                              <span className="text-emerald-700">NO</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-ink font-bold">{log.confidenceScore}%</td>
                          <td className="py-2.5 px-3 text-subcopy font-sans text-xs font-medium">{log.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Inventory Add/Edit Modal */}
      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveInventoryItem}
        itemToEdit={itemToEdit}
      />

      {/* Admin Toast */}
      {adminToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-brutal border-3 border-ink bg-ink text-base flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-accent" />
          <span>{adminToast.message}</span>
        </div>
      )}
    </div>
  );
}
