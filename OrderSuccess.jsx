import { CheckCircle, ShieldCheck, Clock, Package, Copy, Check, Info } from "lucide-react";
import { useState } from "react";

export default function OrderSuccess({ order, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const storePayout = Math.round((order.subtotal || order.total) * 0.90);

  return (
    <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
      
      {/* Top Success Banner */}
      <div className="text-center space-y-3 pt-2">
        <div className="w-16 h-16 rounded-xl bg-accent text-surface border-3 border-ink flex items-center justify-center mx-auto shadow-brutal">
          <CheckCircle className="w-9 h-9 stroke-[2.2]" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-base text-ink text-xs font-bold font-display border-2 border-ink shadow-brutal-sm">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <span>Live Shelf Verified & Dispatched</span>
          </div>
          <h2 className="text-2xl font-display font-extrabold text-ink tracking-tight">
            Thank you, {order.guestName || "Guest"}!
          </h2>
          <p className="text-xs text-ink/70 max-w-sm mx-auto font-medium leading-relaxed">
            Your live store verified produce order has been confirmed with zero shelf discrepancy.
          </p>
        </div>
      </div>

      {/* Order Reference Card */}
      <div className="bg-surface text-ink rounded-xl p-4 space-y-3 border-3 border-ink shadow-brutal">
        <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3 text-xs">
          <span className="text-ink/70 font-bold font-display">Order ID</span>
          <button
            onClick={handleCopyOrderId}
            className="flex items-center gap-1.5 font-mono text-ink font-bold bg-base px-2.5 py-1 rounded border-2 border-ink shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
          >
            <span>{order.orderId}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5 text-ink" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-ink/60 text-[11px] font-medium">Placed At</p>
            <p className="font-semibold text-ink">{order.orderTime || "Just now"}</p>
          </div>
          <div>
            <p className="text-ink/60 text-[11px] font-medium">Estimated Delivery</p>
            <p className="font-extrabold font-display text-accent flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {order.estimatedDelivery || "15-25 min"}
            </p>
          </div>
        </div>
      </div>

      {/* Itemized Order Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold font-display uppercase tracking-wider text-ink/70 flex items-center gap-1.5">
          <Package className="w-4 h-4 text-ink" />
          <span>Items Ordered ({order.items?.length || 0})</span>
        </h4>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {order.items?.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-surface border-2 border-ink rounded-lg flex items-center justify-between gap-3 text-xs shadow-brutal-sm"
            >
              <div className="flex items-center gap-3">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-10 h-10 rounded-lg object-cover border-2 border-ink shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-base text-ink font-bold font-display border-2 border-ink flex items-center justify-center shrink-0">
                    {item.productName?.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h5 className="font-extrabold font-display text-ink text-sm">{item.productName}</h5>
                  <p className="text-[11px] text-ink/70 font-medium">
                    {item.storeName} · {item.quantity || 1} x ₹{item.price} / {item.unit || "1kg"}
                  </p>
                </div>
              </div>
              <span className="font-extrabold font-display text-ink shrink-0 font-mono">
                ₹{item.price * (item.quantity || 1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Totals */}
      <div className="p-4 bg-surface rounded-xl border-3 border-ink space-y-2 text-xs text-ink/70 shadow-brutal font-medium">
        <div className="flex justify-between">
          <span>Items Subtotal</span>
          <span className="font-bold text-ink">₹{order.subtotal || order.total}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery Fee</span>
          <span className="font-bold text-accent">₹0 (FREE)</span>
        </div>

        <div className="pt-2 border-t border-ink/10 flex justify-between text-[11px] text-ink/80">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-ink" />
            Store Vendor Earnings (after 10% fee):
          </span>
          <span className="font-bold font-display text-ink">₹{storePayout}</span>
        </div>

        <div className="flex justify-between text-sm font-extrabold font-display text-ink pt-2 border-t-2 border-ink/10">
          <span>Total Paid</span>
          <span className="text-accent font-mono">₹{order.total}</span>
        </div>
      </div>

      {/* Footer Action Button */}
      <button
        onClick={onClose}
        className="w-full py-3.5 px-4 bg-accent hover:bg-accent/90 text-surface font-extrabold font-display rounded-lg text-xs border-3 border-ink shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition cursor-pointer"
      >
        Back to Shopping
      </button>
    </div>
  );
}
