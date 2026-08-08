import { useApp } from "../context/AppContext.jsx";
import { X, Package, Clock, ShieldCheck, ShoppingBag, MapPin } from "lucide-react";

export default function OrderHistoryModal() {
  const { isOrderHistoryOpen, setIsOrderHistoryOpen, orders } = useApp();

  if (!isOrderHistoryOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-ink/75 z-50 flex items-center justify-center p-4"
      onClick={() => setIsOrderHistoryOpen(false)}
    >
      <div
        className="bg-surface border-3 border-ink rounded-lg p-6 sm:p-8 max-w-2xl w-full text-ink shadow-brutal-lg space-y-6 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-ink pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-accentSoft text-accent border-2 border-ink flex items-center justify-center font-bold font-display shadow-brutal-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold font-display text-ink text-xl">Your Order History</h2>
              <p className="text-xs text-ink/70 font-medium">Itemized receipts & store commission breakdown</p>
            </div>
          </div>

          <button
            onClick={() => setIsOrderHistoryOpen(false)}
            className="p-1.5 rounded-lg bg-surface border-2 border-ink hover:bg-accentSoft text-ink shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {orders.length === 0 ? (
            <div className="text-center py-16 space-y-3 text-ink/60">
              <div className="w-16 h-16 rounded-lg bg-accentSoft text-accent border-3 border-ink flex items-center justify-center mx-auto shadow-brutal">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-bold font-display text-ink text-base">No past orders found</p>
              <p className="text-xs text-ink/70 font-medium max-w-xs mx-auto">
                Orders placed from your account will appear here with zero discrepancy proof.
              </p>
            </div>
          ) : (
            orders.map((order, idx) => (
              <div
                key={order.orderId || idx}
                className="bg-surface border-3 border-ink rounded-lg p-5 space-y-4 shadow-brutal"
              >
                {/* Order Top Summary Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-ink/10 pb-3 gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-display text-ink text-base">{order.orderId}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] bg-accentSoft text-accent px-2 py-0.5 rounded font-bold font-display border border-ink">
                        <ShieldCheck className="w-3 h-3" />
                        {order.status || "Confirmed"}
                      </span>
                    </div>
                    <p className="text-xs text-ink/70 font-medium">
                      Placed: {order.orderTime || "Today"} · Delivered to {order.location?.label || "Saved Address"}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xl font-extrabold font-display text-accent">₹{order.total}</span>
                    <p className="text-[10px] text-ink/60 font-semibold">User Fee: ₹0 · Delivery: ₹0</p>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  {order.items?.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="p-2.5 bg-base border-2 border-ink rounded-lg flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-9 h-9 rounded-lg object-cover border-2 border-ink shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-accentSoft border-2 border-ink text-ink font-bold font-display flex items-center justify-center shrink-0 text-xs">
                            {item.productName?.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold font-display text-ink">{item.productName}</h4>
                          <p className="text-[11px] text-ink/70 font-medium">
                            {item.storeName} · {item.quantity || 1} x ₹{item.price} / {item.unit || "1kg"}
                          </p>
                        </div>
                      </div>

                      <span className="font-bold font-display text-ink shrink-0">
                        ₹{item.price * (item.quantity || 1)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Store 10% Commission Breakdown */}
                <div className="p-3 bg-accentSoft/60 border-2 border-ink rounded-lg text-xs space-y-1 text-ink/80 font-medium">
                  <div className="flex justify-between">
                    <span>User Total Paid:</span>
                    <span className="font-bold text-ink">₹{order.total}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Platform Service & Delivery Charge:</span>
                    <span className="font-bold text-accent">₹0 (FREE)</span>
                  </div>
                  <div className="flex justify-between text-[11px] pt-1 border-t border-ink/20 text-ink">
                    <span>Store Vendor Payout (after 10% platform fee):</span>
                    <span className="font-bold font-display">₹{Math.round(order.subtotal * 0.90)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
