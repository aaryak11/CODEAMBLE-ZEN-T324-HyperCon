import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import OrderSuccess from "./OrderSuccess.jsx";
import QRPaymentModal from "./QRPaymentModal.jsx";
import { CheckoutProcessingSkeleton } from "./ui/Skeleton.jsx";
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, ShoppingCart, AlertCircle, Info, QrCode } from "lucide-react";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    processCheckoutOrder,
    showToast,
    minOrderThreshold = 30,
  } = useApp();

  const { guestName } = useAuth();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  if (!isCartOpen) return null;

  const itemsSubtotal = cart.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);
  const deliveryFee = 0; // ₹0 Delivery Fee
  const storeCommissionAmount = Math.round(itemsSubtotal * 0.10);
  const grandTotal = itemsSubtotal + deliveryFee;

  const isBelowThreshold = itemsSubtotal > 0 && itemsSubtotal < minOrderThreshold;

  const handleInitiatePayment = () => {
    if (isProcessing || cart.length === 0 || isBelowThreshold) return;
    setShowQRModal(true);
  };

  const handleQRSuccessComplete = async () => {
    setShowQRModal(false);
    setIsProcessing(true);
    try {
      const newOrder = await processCheckoutOrder();
      setCompletedOrder(newOrder);
    } catch (err) {
      console.error("Checkout failed:", err);
      showToast(err.message || "Checkout failed. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsCartOpen(false);
    setTimeout(() => {
      setCompletedOrder(null);
      setShowQRModal(false);
    }, 300);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-ink/60 z-50 flex justify-end transition-opacity"
        onClick={handleClose}
      >
        <div
          className="w-full max-w-md bg-surface h-full flex flex-col justify-between border-l-3 border-ink shadow-brutal-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="p-5 border-b-3 border-ink flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-base text-ink border-2 border-ink flex items-center justify-center font-extrabold font-display shadow-brutal-sm">
                <ShoppingBag className="w-5 h-5 text-ink" />
              </div>
              <div>
                <h2 className="font-extrabold font-display text-ink text-lg">HyperCon Cart</h2>
                <p className="text-xs text-ink/70 font-medium">
                  {completedOrder ? "Order Confirmation" : `${cart.length} verified item(s)`}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg bg-surface border-2 border-ink hover:bg-base text-ink shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {completedOrder ? (
              <OrderSuccess order={completedOrder} onClose={handleClose} />
            ) : isProcessing ? (
              <CheckoutProcessingSkeleton />
            ) : cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-ink/60 p-8 py-20">
                <div className="w-16 h-16 rounded-xl bg-base border-3 border-ink shadow-brutal flex items-center justify-center text-ink">
                  <ShoppingCart className="w-8 h-8 stroke-[2]" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-extrabold font-display text-ink">Your cart is currently empty</p>
                  <p className="text-xs text-ink/70 font-medium max-w-xs leading-relaxed">
                    Browse produce, inspect shelf camera feeds live, and verify stock before adding items to your cart.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-3">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="p-3.5 bg-surface border-3 border-ink rounded-xl flex items-center justify-between gap-3 shadow-brutal-sm"
                  >
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-12 h-12 rounded-lg object-cover border-2 border-ink shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-base text-ink border-2 border-ink font-extrabold font-display flex items-center justify-center text-xs shrink-0">
                          {item.productName?.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="space-y-0.5">
                        <h4 className="font-extrabold font-display text-sm text-ink">{item.productName}</h4>
                        <p className="text-xs text-ink/70 font-medium">
                          {item.storeName} · ₹{item.price} / {item.unit || "1kg"}
                        </p>
                        {item.hasLiveVerification && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-ink bg-base px-1.5 py-0.5 rounded font-bold font-mono border border-ink">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                            Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="text-sm font-extrabold font-display text-ink">
                        ₹{item.price * (item.quantity || 1)}
                      </div>

                      <div className="flex items-center gap-1 bg-surface border-2 border-ink rounded-lg p-0.5 shadow-brutal-sm">
                        <button
                          onClick={() => updateCartQuantity(index, (item.quantity || 1) - 1)}
                          className="p-1 hover:bg-base text-ink rounded transition cursor-pointer"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-display px-1.5 text-ink font-mono">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(index, (item.quantity || 1) + 1)}
                          className="p-1 hover:bg-base text-ink rounded transition cursor-pointer"
                          title="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="p-1 hover:bg-red-50 text-red-600 rounded transition ml-1 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {!completedOrder && cart.length > 0 && (
            <div className="p-5 border-t-3 border-ink bg-surface space-y-4">
              
              {/* Minimum Order Threshold Alert */}
              {isBelowThreshold && (
                <div className="p-3 bg-amber-50 border-2 border-ink rounded-lg flex items-center gap-2 text-xs font-bold font-display text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Add ₹{minOrderThreshold - itemsSubtotal} more to meet the ₹{minOrderThreshold} minimum order threshold.</span>
                </div>
              )}

              <div className="space-y-1.5 text-xs text-ink font-semibold">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-ink">₹{itemsSubtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-accent">₹0 (FREE)</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Commission</span>
                  <span className="font-bold text-accent">₹0 (FREE)</span>
                </div>

                <div className="pt-2 border-t border-ink/10 flex items-center justify-between text-[11px] text-ink font-semibold">
                  <span className="flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-ink" />
                    Store Vendor Commission (10%):
                  </span>
                  <span className="font-bold text-ink">₹{storeCommissionAmount}</span>
                </div>

                <div className="flex justify-between text-base font-extrabold font-display text-ink pt-2 border-t-2 border-ink/10">
                  <span>Total Amount</span>
                  <span className="text-accent">₹{grandTotal}</span>
                </div>
              </div>

              {/* Scan to Pay / Checkout Button */}
              <button
                onClick={handleInitiatePayment}
                disabled={isProcessing || isBelowThreshold}
                className="w-full py-3.5 px-4 bg-accent hover:bg-accent/90 disabled:opacity-50 text-surface font-extrabold font-display rounded-lg text-xs flex items-center justify-center gap-2 border-3 border-ink shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition cursor-pointer disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span>Processing Order...</span>
                ) : isBelowThreshold ? (
                  <span>Min Order ₹{minOrderThreshold} Required</span>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Proceed to Scan & Pay (₹{grandTotal})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-ink font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                <span>Verified Stock Guarantee · Live Feed Audited</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demo QR Payment Gateway Modal (Requirement 7) */}
      <QRPaymentModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        amount={grandTotal}
        itemsCount={cart.length}
        onPaymentSuccess={handleQRSuccessComplete}
      />
    </>
  );
}
