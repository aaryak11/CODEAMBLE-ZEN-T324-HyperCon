import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import LiveStreamModal from "../components/LiveStreamModal.jsx";
import { SearchResultSkeleton } from "../components/ui/Skeleton.jsx";
import TrustScoreBadge from "../components/TrustScoreBadge.jsx";
import { Video, Sparkles, Zap, ShoppingBag, ArrowLeft, Clock, MapPin, Store, SlidersHorizontal, Plus } from "lucide-react";
import { ENDPOINTS } from "../config/api.js";

export default function SearchResults({ query }) {
  const { userLocation, setActiveScreen, addToCart, openStoreDetail } = useApp();
  const [rawResults, setRawResults] = useState([]);
  const [sortedResults, setSortedResults] = useState([]);
  const [sortBy, setSortBy] = useState("smartest"); // 'smartest' | 'nearest' | 'cheapest'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStoreId, setActiveStoreId] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);

  const [aiMode, setAiMode] = useState(true);
  const [aiInterpretation, setAiInterpretation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    let isCancelled = false;

    async function performSearch() {
      setLoading(true);
      setError(null);
      setAiInterpretation(null);

      let effectiveQuery = query;
      let interpretation = null;

      if (aiMode) {
        setAiLoading(true);
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const aiRes = await fetch(`/api/ai-search/interpret`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userQuery: query }),
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            if (aiData.interpretation) {
              interpretation = aiData.interpretation;
              if (!isCancelled) {
                setAiInterpretation({ ...interpretation, latencyMs: aiData.latencyMs, fallback: aiData.fallback });
              }
              effectiveQuery =
                interpretation.primaryProduct ||
                interpretation.category ||
                interpretation.keywords?.[0] ||
                query;
            }
          }
        } catch (err) {
          console.warn("AI failed:", err.message);
        } finally {
          if (!isCancelled) setAiLoading(false);
        }
      }

      const params = new URLSearchParams({
        product: effectiveQuery,
        lat: userLocation.lat,
        lng: userLocation.lng,
      });

      try {
        const r = await fetch(`${ENDPOINTS.SEARCH}?${params}`);
        if (!r.ok) throw new Error(`Search request failed with status ${r.status}`);
        const data = await r.json();
        let results = data.results || [];

        if (interpretation) {
          if (interpretation.maxPrice) results = results.filter((r) => r.price <= interpretation.maxPrice);
          if (interpretation.minPrice) results = results.filter((r) => r.price >= interpretation.minPrice);

          if (results.length > 0) {
            results.forEach((r) => (r.isSmartestOption = false));
            if (interpretation.priority === "cheapest") results.sort((a, b) => a.price - b.price);
            else if (interpretation.priority === "fastest")
              results.sort((a, b) => (a.deliveryEtaMinutes || 999) - (b.deliveryEtaMinutes || 999));
            else if (interpretation.priority === "nearest")
              results.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
            else if (interpretation.priority === "freshest") {
              results.sort((a, b) => {
                if (a.hasLiveFeed && !b.hasLiveFeed) return -1;
                if (!a.hasLiveFeed && b.hasLiveFeed) return 1;
                return (b.trustScore || 0) - (a.trustScore || 0);
              });
            }
            results[0].isSmartestOption = true;
          }
        }

        if (!isCancelled) {
          setRawResults(results);
        }
      } catch (err) {
        if (!isCancelled) setError(err.message);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    performSearch();

    return () => {
      isCancelled = true;
    };
  }, [query, userLocation, aiMode]);

  // Client-side sort toggle
  useEffect(() => {
    if (!rawResults.length) {
      setSortedResults([]);
      return;
    }

    const copy = [...rawResults];
    if (sortBy === "smartest") {
      copy.sort((a, b) => a.score - b.score);
    } else if (sortBy === "nearest") {
      copy.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortBy === "cheapest") {
      copy.sort((a, b) => a.price - b.price);
    }

    setSortedResults(copy);
  }, [rawResults, sortBy]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-8">
        <div className="h-8 w-48 bg-surface border-3 border-ink rounded-lg shadow-brutal-sm" />
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <SearchResultSkeleton key={n} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <p className="text-red-600 font-display font-extrabold text-lg">Error loading search results: {error}</p>
        <button
          onClick={() => setActiveScreen("home")}
          className="px-4 py-2 bg-ink text-surface text-xs font-bold font-display rounded-lg border-2 border-ink shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* Top bar with back button & search query header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-ink pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen("home")}
            className="p-2 rounded-lg bg-surface hover:bg-base border-3 border-ink shadow-brutal-sm text-ink active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink tracking-tight">
              Results for &ldquo;<span className="text-accent underline decoration-3">{query}</span>&rdquo;
            </h1>
            <p className="text-xs text-subcopy font-semibold">
              Comparing price + proximity + delivery speed across local partner stores & platforms
            </p>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 bg-surface p-1.5 rounded-lg border-3 border-ink shadow-brutal-sm shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-ink ml-1.5 mr-1" />
          <button
            onClick={() => setSortBy("smartest")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold font-display transition cursor-pointer ${
              sortBy === "smartest"
                ? "bg-accent text-surface border-2 border-ink shadow-brutal-sm"
                : "text-ink hover:bg-base border-2 border-transparent"
            }`}
          >
            Best Match
          </button>
          <button
            onClick={() => setSortBy("nearest")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold font-display transition cursor-pointer ${
              sortBy === "nearest"
                ? "bg-accent text-surface border-2 border-ink shadow-brutal-sm"
                : "text-ink hover:bg-base border-2 border-transparent"
            }`}
          >
            Nearest
          </button>
          <button
            onClick={() => setSortBy("cheapest")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold font-display transition cursor-pointer ${
              sortBy === "cheapest"
                ? "bg-accent text-surface border-2 border-ink shadow-brutal-sm"
                : "text-ink hover:bg-base border-2 border-transparent"
            }`}
          >
            Cheapest
          </button>
        </div>
      </div>

      {/* AI Toggle Bar */}
      <div className="bg-surface border-3 border-ink rounded-xl px-3 sm:px-4 py-2 shadow-brutal-sm">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAiMode(!aiMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold font-display transition-all min-h-[36px] border-2 border-ink cursor-pointer ${
                aiMode
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-brutal-sm"
                  : "bg-base text-ink"
              }`}
            >
              <Sparkles size={14} />
              <span>{aiMode ? "AI Mode ON" : "AI Mode OFF"}</span>
            </button>
            {aiMode && (
              <span className="text-[10px] sm:text-xs text-subcopy font-semibold hidden sm:inline">
                Try: &ldquo;sabji 100 rupees mein&rdquo; or &ldquo;fastest milk&rdquo;
              </span>
            )}
          </div>
          {aiLoading && (
            <div className="flex items-center gap-1.5 text-xs text-purple-600 font-bold font-display">
              <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span>AI thinking...</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Interpretation Banner */}
      {aiInterpretation && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-3 border-purple-500 rounded-xl p-3 sm:p-4 shadow-brutal-sm">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles size={16} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold font-display text-purple-800 uppercase tracking-wide">
                  {aiInterpretation.fallback ? "Smart Parser" : "AI Understood"}
                </span>
                {!aiInterpretation.fallback && aiInterpretation.latencyMs && (
                  <span className="text-[10px] bg-purple-200 text-purple-800 font-mono px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Zap size={8} /> {aiInterpretation.latencyMs}ms • Groq Llama 3.3
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-purple-900 mt-1">{aiInterpretation.userIntent}</p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap mt-2">
            {aiInterpretation.category && (
              <span className="bg-surface px-2 py-0.5 rounded-full text-xs font-bold text-purple-700 border-2 border-purple-200">
                📦 {aiInterpretation.category}
              </span>
            )}
            {aiInterpretation.maxPrice && (
              <span className="bg-surface px-2 py-0.5 rounded-full text-xs font-bold text-purple-700 border-2 border-purple-200">
                💰 Max ₹{aiInterpretation.maxPrice}
              </span>
            )}
            {aiInterpretation.priority && aiInterpretation.priority !== "balanced" && (
              <span className="bg-surface px-2 py-0.5 rounded-full text-xs font-bold text-purple-700 border-2 border-purple-200">
                🎯 {aiInterpretation.priority}
              </span>
            )}
            {aiInterpretation.requiresLiveFeed && (
              <span className="bg-surface px-2 py-0.5 rounded-full text-xs font-bold text-purple-700 border-2 border-purple-200">
                📹 Live feed recommended
              </span>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {sortedResults.length === 0 ? (
        <div className="bg-surface border-3 border-ink rounded-xl p-12 text-center space-y-4 shadow-brutal">
          <p className="text-ink font-display font-extrabold text-lg">No local inventory found for &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-subcopy font-semibold max-w-sm mx-auto">Try searching for Tomato, Banana, Milk, Apples, or Potato, or switch to the standard e-commerce view for warehouse options.</p>
          <button className="px-5 py-2.5 bg-ink text-surface text-sm font-bold font-display rounded-lg mt-2 cursor-pointer shadow-brutal-sm hover:-translate-y-0.5 transition-transform">
            Switch to E-commerce View
          </button>
        </div>
      ) : (
        /* Results List */
        <div className="space-y-6">
          {sortedResults.map((r, i) => {
            const isSmartest = r.isSmartestOption && sortBy === "smartest";

            return (
              <div
                key={i}
                className={`relative bg-surface border-3 border-ink rounded-xl p-5 transition shadow-brutal ${
                  isSmartest ? "ring-2 ring-accent" : ""
                }`}
              >
                {/* Smartest Badge */}
                {isSmartest && (
                  <div className="absolute -top-3.5 left-5 bg-accent text-surface text-[10px] font-extrabold font-display uppercase tracking-wider px-2.5 py-0.5 rounded border-2 border-ink flex items-center gap-1 shadow-brutal-sm">
                    <Sparkles className="w-3 h-3 stroke-[2.5]" />
                    <span>Best Value Recommendation</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Left product details */}
                  <div className="flex items-start gap-4">
                    {r.imageUrl ? (
                      <img
                        src={r.imageUrl}
                        alt={r.productName}
                        className="w-16 h-16 rounded-lg object-cover border-2 border-ink shrink-0 bg-base"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-base border-2 border-ink flex items-center justify-center text-ink font-display font-extrabold shrink-0">
                        {r.productName?.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold font-display text-ink text-xl">{r.productName}</h3>
                        <span className="text-xs text-ink font-bold">({r.unit || "1kg"})</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
                        {r.type === "local_store" ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-semibold text-green-700 cursor-pointer hover:underline"
                              onClick={() => openStoreDetail(r.storeId)}
                            >
                              <Store className="w-3.5 h-3.5 inline mr-1" />
                              {r.storeName}
                            </span>
                            {r.trustScore && (
                              <TrustScoreBadge score={r.trustScoreBreakdown || r.trustScore} size="sm" />
                            )}
                            {r.hasLiveFeed && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                LIVE
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-ink bg-base px-2 py-0.5 rounded border-2 border-ink font-semibold flex items-center gap-1">
                            <Store className="w-3.5 h-3.5 text-accent" />
                            {r.source || "Online Platform"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-subcopy font-semibold pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-accent" />
                          {r.type === "local_store" ? `${r.distanceKm?.toFixed(1) || 0} km away` : "Warehouse Direct"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-ink" />
                          {r.deliveryEtaMinutes} min delivery
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right action area: Price & Buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t-2 sm:border-t-0 pt-3 sm:pt-0 border-ink/10 gap-3 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-3xl font-extrabold font-display text-ink">
                        ₹{r.price}
                      </div>
                      <div className="text-[11px] text-ink font-bold font-mono">
                        Score: {r.score}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setActiveProduct({
                            id: r.id || r.productId,
                            name: r.productName,
                            storeName: r.storeName,
                            price: r.price,
                            unit: r.unit,
                            imageUrl: r.imageUrl,
                          })
                        }
                        className="py-2 px-3 bg-surface hover:bg-red-50 text-ink border-2 border-ink rounded-md text-xs font-bold font-display flex items-center gap-1.5 shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
                        title="Watch live shelf camera for this product"
                      >
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                        <Video className="w-3.5 h-3.5 text-ink" />
                        <span>Live View</span>
                      </button>

                      <button
                        onClick={() => addToCart(r)}
                        className="py-2 px-4 bg-accent hover:bg-accent/90 text-surface rounded-md text-xs font-extrabold font-display flex items-center gap-1.5 border-2 border-ink shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Stream Modal */}
      {(activeStoreId || activeProduct) && (
        <LiveStreamModal
          storeId={activeProduct ? null : activeStoreId}
          product={activeProduct}
          onClose={() => {
            setActiveStoreId(null);
            setActiveProduct(null);
          }}
        />
      )}
    </div>
  );
}
