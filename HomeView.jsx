import { useEffect, useState, useMemo } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useGeolocation, calculateDistanceKm } from "../hooks/useGeolocation.js";
import StoreMap from "./StoreMap.jsx";
import LiveStreamModal from "./LiveStreamModal.jsx";
import { StoreSkeleton } from "./ui/Skeleton.jsx";
import { CATEGORIES_DATA, POPULAR_ITEMS_35, PARTNER_STORES_25 } from "../data/mockData.js";
import {
  Video,
  Star,
  Search,
  MapPin,
  CheckCircle2,
  Navigation,
  ChevronRight,
  ArrowRight,
  Plus,
  Filter,
  Eye,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Leaf,
  Apple,
  Milk,
  Wheat,
  Sprout,
  CupSoda
} from "lucide-react";
import { ENDPOINTS } from "../config/api.js";

const CategoryIconMap = {
  Leaf,
  Apple,
  Milk,
  Wheat,
  Sprout,
  CupSoda,
};

function CategoryIcon({ iconName, className = "w-6 h-6" }) {
  const IconComponent = CategoryIconMap[iconName] || Leaf;
  return <IconComponent className={className} />;
}

export default function HomeView() {
  const { userLocation, triggerSearch, addToCart } = useApp();

  // Geolocation integration
  const { activeLocation, status: gpsStatus, requestLocation } = useGeolocation(userLocation);

  // Store state
  const [stores, setStores] = useState(PARTNER_STORES_25);
  const [loadingStores, setLoadingStores] = useState(false);
  const [activeModalStoreId, setActiveModalStoreId] = useState(null);
  const [activeModalProduct, setActiveModalProduct] = useState(null);

  // Filter & Pagination state for Stores
  const [storeStatusFilter, setStoreStatusFilter] = useState("all"); // 'all' | 'active' | 'nearby'
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [storePage, setStorePage] = useState(1);
  const storesPerPage = 8;

  // Filter state for Popular Items
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [itemsPage, setItemsPage] = useState(1);
  const itemsPerPage = 8;

  // Compute store distances from live position and sort
  const sortedStores = useMemo(() => {
    let list = stores.map((s) => {
      const dist = calculateDistanceKm(
        activeLocation.lat,
        activeLocation.lng,
        s.location?.lat,
        s.location?.lng
      );
      return {
        ...s,
        distanceKm: dist ?? 2.5,
      };
    });

    // Sort by distance first
    list.sort((a, b) => a.distanceKm - b.distanceKm);

    // Apply status filter
    if (storeStatusFilter === "active") {
      list = list.filter((s) => s.feedStatus === "active");
    }

    // Apply text search
    if (storeSearchQuery.trim()) {
      const q = storeSearchQuery.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
      );
    }

    return list;
  }, [stores, activeLocation, storeStatusFilter, storeSearchQuery]);

  // Paginated Stores
  const totalStorePages = Math.ceil(sortedStores.length / storesPerPage) || 1;
  const paginatedStores = useMemo(() => {
    const start = (storePage - 1) * storesPerPage;
    return sortedStores.slice(start, start + storesPerPage);
  }, [sortedStores, storePage]);

  // Filtered & Paginated Items
  const filteredItems = useMemo(() => {
    if (selectedCategory === "All") return POPULAR_ITEMS_35;
    return POPULAR_ITEMS_35.filter((i) => i.category === selectedCategory);
  }, [selectedCategory]);

  const totalItemPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (itemsPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, itemsPage]);

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. HERO SECTION (Solid 100% dark text contrast, clean neobrutalist style) */}
      <section className="relative rounded-xl bg-surface text-ink p-6 sm:p-10 border-3 border-ink shadow-brutal overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-6">
          
          {/* Benefit Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-base border-2 border-ink text-ink text-xs font-extrabold font-display">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <span>Live Shelf Camera Verification Platform</span>
          </div>

          {/* Headline & High-Contrast Subcopy */}
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight leading-[1.15] text-ink">
            See the shelf <br />
            <span className="text-accent underline decoration-4 underline-offset-4">
              before you order.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-subcopy font-semibold leading-relaxed max-w-xl">
            HyperCon connects you directly to live camera feeds on local grocery store shelves. Inspect produce freshness and actual stock levels before paying.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                const target = document.getElementById("stores-section");
                if (target) target.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-5 py-3 bg-accent hover:bg-accent/90 text-surface text-xs sm:text-sm font-extrabold font-display rounded-lg border-3 border-ink shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition flex items-center gap-2 cursor-pointer"
            >
              <span>Explore 25 Partner Stores</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveModalStoreId("66b1a0000000000000000001")}
              className="px-4 py-3 bg-surface hover:bg-base text-ink text-xs sm:text-sm font-extrabold font-display rounded-lg border-3 border-ink shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition flex items-center gap-2 cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
              <span>Watch Demo Stream</span>
            </button>
          </div>

          {/* Location GPS Status Indicator Bar */}
          <div className="pt-2 flex items-center gap-2 text-xs font-bold text-ink">
            <MapPin className="w-4 h-4 text-accent shrink-0" />
            <span>Showing stores near: <strong>{activeLocation.label}</strong></span>
            {gpsStatus === "granted" ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-950 border border-emerald-700 px-2 py-0.5 rounded font-mono font-extrabold">
                GPS LIVE
              </span>
            ) : (
              <button
                onClick={requestLocation}
                className="text-[11px] underline text-accent font-extrabold hover:text-accent/80 cursor-pointer ml-1"
              >
                Enable GPS
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES SECTION (Line-art Lucide icons instead of emojis) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-extrabold text-ink tracking-tight">
              Browse Categories
            </h2>
            <p className="text-xs text-subcopy font-semibold">
              Filter live shelf inventory by perishable department
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES_DATA.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.name);
                setItemsPage(1);
              }}
              className={`p-3.5 rounded-xl border-3 border-ink shadow-brutal-sm text-left transition cursor-pointer flex flex-col justify-between h-28 ${
                cat.accentBg
              } hover:brightness-95 ${
                selectedCategory === cat.name ? "ring-3 ring-ink translate-x-[1px] translate-y-[1px]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <CategoryIcon iconName={cat.iconName} className="w-6 h-6 text-ink stroke-[2.2]" />
                <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-surface border border-ink text-ink">
                  {cat.itemCount} items
                </span>
              </div>
              <div>
                <h3 className="font-extrabold font-display text-sm text-ink leading-tight">
                  {cat.name}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. DEDICATED POPULAR LIVE VERIFIED ITEMS SECTION (Thumbnail cards, 35 items) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-extrabold text-ink tracking-tight flex items-center gap-2">
              <span>Popular Verified Items</span>
              <span className="text-xs bg-base text-ink border-2 border-ink px-2 py-0.5 rounded font-mono font-extrabold">
                {filteredItems.length} Products
              </span>
            </h2>
            <p className="text-xs text-subcopy font-semibold">
              Items currently available in nearby partner stores with shelf camera feeds
            </p>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            {["All", "Produce & Veggies", "Fresh Fruits", "Dairy & Eggs", "Bakery & Breads", "Organic & Farm", "Beverages & Juices"].map((catName) => (
              <button
                key={catName}
                onClick={() => {
                  setSelectedCategory(catName);
                  setItemsPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-extrabold font-display border-2 border-ink whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === catName
                    ? "bg-accent text-surface shadow-brutal-sm"
                    : "bg-surface text-ink hover:bg-base"
                }`}
              >
                {catName === "All" ? "All Items" : catName}
              </button>
            ))}
          </div>
        </div>

        {/* 35 Items Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {paginatedItems.map((item) => (
            <div
              key={item.id}
              className="bg-surface border-3 border-ink rounded-xl p-4 shadow-brutal flex flex-col justify-between group hover:translate-y-[-2px] transition"
            >
              <div className="space-y-3">
                
                {/* Item Thumbnail Image & Verification Dot */}
                <div className="relative w-full h-36 rounded-lg overflow-hidden border-2 border-ink bg-base">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-surface text-ink text-[10px] font-extrabold px-2 py-1 rounded border border-ink shadow-brutal-sm">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                    <span>Verified Fresh</span>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-surface text-ink text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-ink font-mono">
                    {item.unit}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-extrabold font-display text-base text-ink line-clamp-1">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-0.5 text-xs font-bold text-ink shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{item.rating}</span>
                    </div>
                  </div>

                  <p className="text-xs text-subcopy font-semibold">{item.storeName}</p>
                </div>
              </div>

              {/* Price & Action Buttons (Live View + Add to Cart) */}
              <div className="pt-3 border-t-2 border-ink/10 flex items-center justify-between mt-3 gap-2">
                <div>
                  <span className="text-xs text-subcopy line-through font-mono mr-1">₹{item.originalPrice}</span>
                  <span className="text-lg font-extrabold font-display text-ink">₹{item.price}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveModalProduct(item)}
                    className="px-2.5 py-1.5 bg-surface hover:bg-red-50 text-ink rounded-md text-xs font-extrabold font-display border-2 border-ink shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center gap-1 cursor-pointer"
                    title="Watch live shelf camera for this item"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0" />
                    <Video className="w-3.5 h-3.5 text-ink" />
                    <span className="hidden sm:inline">Live View</span>
                  </button>

                  <button
                    onClick={() => addToCart({
                      productId: item.id,
                      productName: item.name,
                      price: item.price,
                      unit: item.unit,
                      storeName: item.storeName,
                      imageUrl: item.imageUrl,
                      hasLiveVerification: true
                    })}
                    className="px-3 py-1.5 bg-accent hover:bg-accent/90 text-surface rounded-md text-xs font-extrabold font-display border-2 border-ink shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Popular Items Pagination Controls */}
        {totalItemPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setItemsPage((p) => Math.max(p - 1, 1))}
              disabled={itemsPage === 1}
              className="px-3 py-1.5 bg-surface border-2 border-ink rounded-md text-xs font-extrabold font-display disabled:opacity-40 cursor-pointer shadow-brutal-sm"
            >
              Previous
            </button>
            <span className="text-xs font-extrabold font-display px-2 text-ink font-mono">
              Page {itemsPage} of {totalItemPages}
            </span>
            <button
              onClick={() => setItemsPage((p) => Math.min(p + 1, totalItemPages))}
              disabled={itemsPage === totalItemPages}
              className="px-3 py-1.5 bg-surface border-2 border-ink rounded-md text-xs font-extrabold font-display disabled:opacity-40 cursor-pointer shadow-brutal-sm"
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* 4. "WHY VERIFY LIVE" / "HOW IT WORKS" 3-STEP VISUAL STRIP */}
      <section className="bg-surface border-3 border-ink rounded-xl p-6 sm:p-8 shadow-brutal space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-2xl font-display font-extrabold text-ink">
            How HyperCon Live Verification Works
          </h2>
          <p className="text-xs text-subcopy font-semibold">
            3 simple steps to guarantee freshness before your purchase
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-lg bg-base border-3 border-ink shadow-brutal-sm space-y-2">
            <div className="w-10 h-10 rounded-md bg-ink text-surface flex items-center justify-center font-extrabold font-display text-sm border-2 border-ink">
              01
            </div>
            <h3 className="font-extrabold font-display text-base text-ink">Search Local Stores</h3>
            <p className="text-xs text-subcopy font-semibold leading-relaxed">
              Browse 25+ partner stores around your location and compare prices across products.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-base border-3 border-ink shadow-brutal-sm space-y-2">
            <div className="w-10 h-10 rounded-md bg-accent text-surface flex items-center justify-center font-extrabold font-display text-sm border-2 border-ink">
              02
            </div>
            <h3 className="font-extrabold font-display text-base text-ink flex items-center gap-1.5">
              <span>Inspect Shelf Feed Live</span>
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            </h3>
            <p className="text-xs text-subcopy font-semibold leading-relaxed">
              Stream live RTSP/HLS camera feeds directly from the store shelf to check stock & freshness.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-base border-3 border-ink shadow-brutal-sm space-y-2">
            <div className="w-10 h-10 rounded-md bg-ink text-surface flex items-center justify-center font-extrabold font-display text-sm border-2 border-ink">
              03
            </div>
            <h3 className="font-extrabold font-display text-base text-ink">Guaranteed Fresh Delivery</h3>
            <p className="text-xs text-subcopy font-semibold leading-relaxed">
              Place your order with confidence — zero discrepancy between what you inspect and what arrives.
            </p>
          </div>
        </div>
      </section>

      {/* 5. NEARBY PARTNER STORES GRID (25 Stores, high contrast text) */}
      <section id="stores-section" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-extrabold text-ink tracking-tight flex items-center gap-2">
              <span>Nearby Partner Stores</span>
              <span className="text-xs bg-accent text-surface border-2 border-ink px-2 py-0.5 rounded font-mono font-extrabold">
                {sortedStores.length} Stores Total
              </span>
            </h2>
            <p className="text-xs text-subcopy font-semibold">
              Stores streaming real-time shelf inventory directly to your device
            </p>
          </div>

          {/* Filter Controls & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <input
                type="text"
                value={storeSearchQuery}
                onChange={(e) => {
                  setStoreSearchQuery(e.target.value);
                  setStorePage(1);
                }}
                placeholder="Search store name or area..."
                className="pl-8 pr-3 py-1.5 text-xs bg-surface border-2 border-ink rounded-md text-ink font-semibold placeholder-ink/60 w-44 sm:w-56"
              />
              <Search className="w-3.5 h-3.5 text-ink absolute left-2.5 top-2.5" />
            </div>

            <button
              onClick={() => {
                setStoreStatusFilter(storeStatusFilter === "active" ? "all" : "active");
                setStorePage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-extrabold font-display border-2 border-ink flex items-center gap-1.5 transition cursor-pointer ${
                storeStatusFilter === "active"
                  ? "bg-accent text-surface shadow-brutal-sm"
                  : "bg-surface text-ink hover:bg-base"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              <span>Live Active Only</span>
            </button>
          </div>
        </div>

        {/* Stores Responsive Grid */}
        {loadingStores ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <StoreSkeleton key={n} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {paginatedStores.map((store) => {
              const isOffline = store.feedStatus === "offline" || store.feedReliability === "offline";
              const isDelayed = store.feedStatus === "delayed" || store.feedReliability === "unreliable";
              const reliability = store.feedReliability || (isOffline ? "offline" : isDelayed ? "unreliable" : "verified");

              return (
                <div
                  key={store._id}
                  className="bg-surface border-3 border-ink rounded-xl p-4 shadow-brutal flex flex-col justify-between group hover:translate-y-[-2px] transition"
                >
                  <div className="space-y-3">
                    
                    {/* Header: Name + Distance */}
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-extrabold font-display text-base text-ink line-clamp-1 group-hover:text-accent transition">
                          {store.name}
                        </h3>
                        <span className="text-[10px] font-mono font-extrabold bg-base border border-ink px-1.5 py-0.5 rounded text-ink shrink-0">
                          {store.distanceKm} km
                        </span>
                      </div>
                      <p className="text-xs text-subcopy font-semibold line-clamp-1 mt-0.5">{store.address}</p>
                    </div>

                    {/* Meta: Star Rating (Plain text) & Status */}
                    <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-ink/10">
                      
                      {/* Rating plain text */}
                      <div className="flex items-center gap-1 text-ink font-extrabold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{store.rating || 4.7}</span>
                      </div>

                      {/* Live Feed Status Dot */}
                      <div className="flex items-center gap-1.5 text-[11px] font-extrabold">
                        {reliability === "offline" ? (
                          <span className="flex items-center gap-1 text-red-700 font-mono">
                            <span className="w-2 h-2 rounded-full bg-red-600"></span>
                            <span>FEED OFFLINE</span>
                          </span>
                        ) : reliability === "unreliable" ? (
                          <span className="flex items-center gap-1 text-amber-800 font-mono">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>FEED UNVERIFIED</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-accent font-mono">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                            <span>VERIFIED FRESH</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SIGNATURE ACTION BUTTON */}
                  <div className="pt-4 border-t-2 border-ink/10 mt-3">
                    <button
                      onClick={() => reliability !== "offline" && setActiveModalStoreId(store._id)}
                      disabled={reliability === "offline"}
                      className={`w-full py-2.5 px-3 rounded-lg text-xs font-extrabold font-display border-2 border-ink shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-2 transition cursor-pointer ${
                        reliability === "offline"
                          ? "bg-gray-100 text-gray-500 border-gray-400 shadow-none cursor-not-allowed"
                          : reliability === "unreliable"
                          ? "bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-700"
                          : "bg-accent hover:bg-accent/90 text-surface"
                      }`}
                    >
                      {reliability === "verified" && (
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                      )}
                      {reliability === "unreliable" && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      )}
                      <Video className="w-4 h-4" />
                      <span>
                        {reliability === "offline"
                          ? "Feed Offline"
                          : reliability === "unreliable"
                          ? "Watch Unverified Feed"
                          : "Watch Camera Feed"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stores Pagination Controls */}
        {totalStorePages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setStorePage((p) => Math.max(p - 1, 1))}
              disabled={storePage === 1}
              className="px-4 py-2 bg-surface border-2 border-ink rounded-md text-xs font-extrabold font-display disabled:opacity-40 cursor-pointer shadow-brutal-sm"
            >
              Previous Page
            </button>
            <span className="text-xs font-extrabold font-display px-3 text-ink font-mono">
              Page {storePage} of {totalStorePages} ({sortedStores.length} Stores)
            </span>
            <button
              onClick={() => setStorePage((p) => Math.min(p + 1, totalStorePages))}
              disabled={storePage === totalStorePages}
              className="px-4 py-2 bg-surface border-2 border-ink rounded-md text-xs font-extrabold font-display disabled:opacity-40 cursor-pointer shadow-brutal-sm"
            >
              Next Page
            </button>
          </div>
        )}
      </section>

      {/* 6. INTERACTIVE MAP SECTION */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-display font-extrabold text-ink tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              <span>Interactive Store Map</span>
            </h2>
            <p className="text-xs text-subcopy font-semibold">
              Physical locations & live feeds near {activeLocation.label}
            </p>
          </div>

          <button
            onClick={requestLocation}
            className="px-3 py-1.5 bg-surface hover:bg-base text-ink border-2 border-ink rounded-md text-xs font-extrabold font-display flex items-center gap-1.5 shadow-brutal-sm cursor-pointer self-start sm:self-auto"
          >
            <Navigation className="w-3.5 h-3.5 text-accent" />
            <span>Center on My GPS Location</span>
          </button>
        </div>

        <StoreMap
          stores={sortedStores}
          userLocation={activeLocation}
          onSelectStore={(id) => setActiveModalStoreId(id)}
          isLiveGps={gpsStatus === "granted"}
        />
      </section>

      {/* Live Stream Modal */}
      {(activeModalStoreId || activeModalProduct) && (
        <LiveStreamModal
          storeId={activeModalProduct ? null : activeModalStoreId}
          product={activeModalProduct}
          onClose={() => {
            setActiveModalStoreId(null);
            setActiveModalProduct(null);
          }}
        />
      )}
    </div>
  );
}
