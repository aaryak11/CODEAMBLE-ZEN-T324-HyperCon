import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { 
  ArrowLeft, MapPin, Clock, Star, Camera, ShoppingCart, 
  Package, Leaf, AlertTriangle, Eye, Shield, TrendingUp,
  CheckCircle, XCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function TrustScoreBreakdown({ trustScore }) {
  if (!trustScore) return null;
  const metrics = [
    { label: 'Freshness', value: trustScore.freshness || 4.5, icon: Leaf, color: 'text-green-500' },
    { label: 'Delivery', value: trustScore.deliveryAccuracy || 4.2, icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Price Accuracy', value: trustScore.priceConsistency || 4.0, icon: Shield, color: 'text-purple-500' },
    { label: 'Camera Uptime', value: trustScore.cameraUptime || 90, suffix: '%', icon: Camera, color: 'text-orange-500' }
  ];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 mt-3 sm:mt-4">
      <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
        <Shield size={14} /> Trust Score Breakdown
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {metrics.map(({ label, value, icon: Icon, color, suffix }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon size={12} className={color} />
            <span className="text-xs text-gray-600 flex-1">{label}</span>
            <span className="text-xs font-bold">{value}{suffix || '/5'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FreshnessBadge({ badge, lastRestocked }) {
  if (!badge && !lastRestocked) return null;
  let displayText = badge; let color = 'green';
  if (!displayText && lastRestocked) {
    const hoursAgo = Math.round((Date.now() - new Date(lastRestocked).getTime()) / (1000 * 60 * 60));
    if (hoursAgo < 6) { displayText = `Restocked ${hoursAgo}h ago`; color = 'green'; }
    else if (hoursAgo < 24) { displayText = `Restocked ${hoursAgo}h ago`; color = 'yellow'; }
    else { displayText = `Restocked ${Math.round(hoursAgo/24)}d ago`; color = 'red'; }
  }
  const colors = {
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700'
  };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${colors[color] || colors.green}`}>🌿 {displayText}</span>;
}

function ProductCard({ item, onAddToCart }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{item.productName}</h4>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{item.unit}{item.shelfLocation ? ` • ${item.shelfLocation}` : ''}</p>
          <div className="mt-1"><FreshnessBadge badge={item.freshnessBadge} lastRestocked={item.lastRestocked} /></div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-bold text-gray-900">₹{item.price}</span>
            {item.originalPrice && item.originalPrice > item.price && (
              <span className="text-[10px] sm:text-xs text-gray-400 line-through">₹{item.originalPrice}</span>
            )}
          </div>
          {item.discount > 0 && <span className="text-[10px] sm:text-xs text-green-600 font-medium">{item.discount}% off</span>}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1">
        {item.stockStatus === 'in_stock' ? (
          <span className="flex items-center gap-1 text-[10px] sm:text-xs text-green-600">
            <CheckCircle size={10} /> In Stock
          </span>
        ) : item.stockStatus === 'low_stock' ? (
          <span className="flex items-center gap-1 text-[10px] sm:text-xs text-yellow-600">
            <AlertTriangle size={10} /> Low Stock
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] sm:text-xs text-red-600">
            <XCircle size={10} /> Out of Stock
          </span>
        )}
      </div>
      <button
        onClick={() => onAddToCart(item)}
        disabled={item.stockStatus === 'out_of_stock'}
        className="mt-3 w-full bg-green-600 text-white text-xs sm:text-sm py-2 px-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 min-h-[44px]"
      >
        <ShoppingCart size={14} /> Add to Cart
      </button>
    </div>
  );
}

export default function StoreDetail({ storeId: propStoreId, onAddToCart: propAddToCart, onOpenLiveStream: propOpenLiveStream, onBack }) {
  const context = useApp() || {};
  const storeId = propStoreId || context.selectedStoreId || '66b1a0000000000000000001';
  
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  
  const userLocation = useMemo(() => {
    try {
      const saved = localStorage.getItem('hypercon_user_location');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { lat: 19.2183, lng: 73.0867 };
  }, []);
  
  useEffect(() => { fetchStoreDetail(); }, [storeId]);
  
  const fetchStoreDetail = async () => {
    setLoading(true); setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(
        `${API_URL}/api/stores/${storeId}?lat=${userLocation.lat}&lng=${userLocation.lng}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (!res.ok) throw new Error(res.status === 404 ? 'Store not found' : 'Failed to load');
      const data = await res.json();
      setStoreData(data);
    } catch (err) {
      setError(err.name === 'AbortError' ? 'Request timeout' : err.message);
    } finally { setLoading(false); }
  };
  
  const handleAdd = (item) => {
    const fn = propAddToCart || context.addToCart;
    if (fn) fn({
      storeId: storeData.store._id, storeName: storeData.store.name,
      productId: item.productId, productName: item.productName,
      price: item.price, unit: item.unit, quantity: 1
    });
  };

  const handleOpenStream = () => {
    const fn = propOpenLiveStream || context.openLiveStream;
    if (fn) fn(storeData.store);
  };

  const handleGoBack = () => {
    if (onBack) return onBack();
    if (context.setActiveScreen) context.setActiveScreen('home');
  };
  
  const filteredProducts = useMemo(() => {
    if (!storeData) return [];
    let items = storeData.inventory;
    if (activeCategory !== 'all') items = items.filter(i => i.category === activeCategory);
    if (searchFilter) items = items.filter(i => i.productName.toLowerCase().includes(searchFilter.toLowerCase()));
    return items;
  }, [storeData, activeCategory, searchFilter]);
  
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-3 text-sm text-gray-600">Loading store...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="mx-auto text-red-500" size={40} />
        <h2 className="mt-3 text-lg font-bold text-gray-900">Oops!</h2>
        <p className="mt-1 text-sm text-gray-600">{error}</p>
        <div className="mt-4 flex gap-2 justify-center">
          <button onClick={handleGoBack} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm min-h-[44px]">Go Back</button>
          <button onClick={fetchStoreDetail} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm min-h-[44px]">Retry</button>
        </div>
      </div>
    </div>
  );
  
  if (!storeData) return null;
  const { store, distance, estimatedDelivery, totalProducts, categories } = storeData;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3">
          <button onClick={handleGoBack} className="p-1.5 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">{store.name}</h1>
            <p className="text-[10px] sm:text-xs text-gray-500 truncate">{store.address}</p>
          </div>
          {store.cameraStatus === 'live' && (
            <button onClick={handleOpenStream}
                    className="flex items-center gap-1 sm:gap-1.5 bg-red-50 text-red-600 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium min-h-[44px]">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="hidden sm:inline">Watch Live</span><span className="sm:hidden">Live</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Star size={14} className="text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-gray-900">{store.trustScore?.overall || store.rating}</span>
              <span className="text-gray-400 hidden sm:inline">Trust Score</span>
            </div>
            {distance && (
              <div className="flex items-center gap-1"><MapPin size={14} className="text-blue-500" /><span>{distance} km</span></div>
            )}
            <div className="flex items-center gap-1"><Clock size={14} className="text-green-500" /><span>{estimatedDelivery || store.avgDeliveryTime} min</span></div>
            {store.isOpen !== false ? (
              <span className="flex items-center gap-1 text-green-600"><CheckCircle size={12} /> Open</span>
            ) : (
              <span className="flex items-center gap-1 text-red-600"><XCircle size={12} /> Closed</span>
            )}
            <div className="flex items-center gap-1"><Package size={14} className="text-purple-500" /><span>{totalProducts} items</span></div>
          </div>
          {store.specialties?.length > 0 && (
            <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-1.5">
              {store.specialties.map(s => (
                <span key={s} className="text-[10px] sm:text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          )}
          {store.description && <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600">{store.description}</p>}
        </div>
        
        {store.trustScore && <TrustScoreBreakdown trustScore={store.trustScore} />}
        
        {store.cameraStatus === 'live' && (
          <div className="mt-3 sm:mt-4 bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
              <div className="min-w-0">
                <p className="font-semibold text-green-900 text-xs sm:text-sm truncate">Live Shelf Verification Active</p>
                <p className="text-[10px] sm:text-xs text-green-700 truncate">Verify stock and freshness before ordering</p>
              </div>
            </div>
            <button onClick={handleOpenStream}
                    className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 flex-shrink-0 min-h-[44px] flex items-center justify-center gap-1">
              <Eye size={12} /> Watch
            </button>
          </div>
        )}
        
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap min-h-[44px] transition-colors ${
                activeCategory === 'all' ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Items ({totalProducts})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap capitalize min-h-[44px] transition-colors ${
                  activeCategory === cat ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <input
            type="text"
            placeholder="Filter in store..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px] w-full sm:w-48"
          />
        </div>
        
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredProducts.map(item => (
            <ProductCard key={item.inventoryId} item={item} onAddToCart={handleAdd} />
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mt-4">
            <Package className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-sm text-gray-500">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
