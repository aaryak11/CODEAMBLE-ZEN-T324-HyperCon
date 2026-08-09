import React, { useState, useEffect, useRef } from 'react';
import { Star, Shield, Leaf, TrendingUp, Camera } from 'lucide-react';

export default function TrustScoreBadge({ score, breakdown, size = 'md', feedReliability }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const badgeRef = useRef(null);
  
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (badgeRef.current && !badgeRef.current.contains(e.target)) {
        setShowBreakdown(false);
      }
    };
    if (showBreakdown) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showBreakdown]);
  
  if (!score) return null;
  const overall = typeof score === 'object' ? score.overall : score;
  const trustData = typeof score === 'object' ? score : breakdown;
  
  const getColor = (val) => {
    if (val >= 4.5) return 'text-green-600 bg-green-50 border-green-200';
    if (val >= 4.0) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (val >= 3.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };
  
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs sm:text-sm px-2 sm:px-2.5 py-1';
  
  if (feedReliability === 'ai_generated' || feedReliability === 'fake') {
    return (
      <div className={`inline-flex items-center gap-1 rounded-full border font-semibold text-purple-700 bg-purple-50 border-purple-200 ${sizeClasses}`}>
        <Shield size={size === 'sm' ? 8 : 12} />
        <span>AI FAKE</span>
      </div>
    );
  }
  
  return (
    <div className="relative inline-block" ref={badgeRef}>
      <button type="button"
        className={`flex items-center gap-1 rounded-full border font-semibold ${getColor(overall)} ${sizeClasses} hover:shadow-sm transition-all`}
        onClick={(e) => {
          e.stopPropagation();
          setShowBreakdown(!showBreakdown);
        }}>
        <Shield size={size === 'sm' ? 8 : 12} />
        {overall ? (typeof overall === 'number' ? overall.toFixed(1) : overall) : "0.0"}
        <Star size={size === 'sm' ? 8 : 10} className="fill-current" />
      </button>
      
      {showBreakdown && trustData && typeof trustData === 'object' && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 sm:w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-gray-200 rotate-45"></div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Trust Score Breakdown</p>
          {trustData.freshness != null && <ScoreRow icon={Leaf} label="Freshness" value={trustData.freshness} max={5} />}
          {trustData.deliveryAccuracy != null && <ScoreRow icon={TrendingUp} label="Delivery" value={trustData.deliveryAccuracy} max={5} />}
          {trustData.priceConsistency != null && <ScoreRow icon={Shield} label="Price Accuracy" value={trustData.priceConsistency} max={5} />}
          {trustData.cameraUptime != null && <ScoreRow icon={Camera} label="Camera Uptime" value={trustData.cameraUptime} max={100} suffix="%" />}
        </div>
      )}
    </div>
  );
}

function ScoreRow({ icon: Icon, label, value, max, suffix }) {
  const percentage = max === 100 ? value : (value / max) * 100;
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <Icon size={10} className="text-gray-400 flex-shrink-0" />
      <span className="text-[10px] text-gray-600 flex-1">{label}</span>
      <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
      </div>
      <span className="text-[10px] font-semibold text-gray-700 w-7 text-right">
        {typeof value === 'number' ? value.toFixed(1) : value}{suffix || ''}
      </span>
    </div>
  );
}
