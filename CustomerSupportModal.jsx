import { useState } from "react";
import { X, LifeBuoy, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "../config/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function CustomerSupportModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [storeName, setStoreName] = useState("Green Basket Fresh Organics");
  const [category, setCategory] = useState("produce_freshness");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/support/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName || user?.name || "Shopper",
          email,
          phone,
          orderId,
          storeName,
          category,
          subject,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit enquiry");
      setSubmittedTicket(data.ticket);
    } catch (err) {
      setError(err.message || "Failed to submit enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedTicket(null);
    setSubject("");
    setMessage("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-ink/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border-3 border-ink rounded-xl shadow-brutal-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="p-5 border-b-3 border-ink flex items-center justify-between bg-surface sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-accent text-surface flex items-center justify-center border-2 border-ink shadow-brutal-sm">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold font-display text-ink text-lg">
                Customer Support & Store Enquiry
              </h2>
              <p className="text-xs text-ink font-semibold">
                Direct inquiry to partner store owners and freshness specialists
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-surface border-2 border-ink hover:bg-base text-ink shadow-brutal-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {submittedTicket ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 border-3 border-ink flex items-center justify-center mx-auto shadow-brutal-sm">
              <CheckCircle2 className="w-6 h-6 text-emerald-800" />
            </div>
            <h3 className="text-xl font-display font-extrabold text-ink">
              Enquiry Submitted Successfully!
            </h3>
            <p className="text-xs text-ink font-semibold max-w-sm mx-auto">
              Your inquiry has been assigned ticket ID:
            </p>
            <div className="inline-block px-4 py-2 rounded-lg bg-base border-2 border-ink font-mono font-extrabold text-sm text-ink shadow-brutal-sm">
              {submittedTicket.ticketId}
            </div>
            <p className="text-[11px] text-ink font-semibold">
              Your message has been sent, we&apos;ll respond within 24 hours. The store owner has been notified.
            </p>
            <div className="pt-2">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-surface text-xs font-extrabold font-display rounded-lg border-2 border-ink shadow-brutal active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border-2 border-rose-600 rounded-lg flex items-center gap-2 text-xs font-bold text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold font-display text-ink mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Sneha Patil"
                  className="w-full px-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-display text-ink mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sneha@example.com"
                  className="w-full px-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold font-display text-ink mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98000 00000"
                  className="w-full px-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-display text-ink mb-1">
                  Enquiry Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="order_issue">Order Issue</option>
                  <option value="payment_issue">Payment Issue</option>
                  <option value="store_product_issue">Store / Product Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold font-display text-ink mb-1">
                  Order ID (Optional)
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. ORD-99381"
                  className="w-full px-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-display text-ink mb-1">
                  Partner Store Name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Green Basket Fresh Organics"
                  className="w-full px-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold font-display text-ink mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Inquiring about fresh batch timing for tomatoes"
                className="w-full px-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-display text-ink mb-1">
                Message / Details
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question or feedback..."
                className="w-full px-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div className="pt-2 border-t border-ink/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-surface hover:bg-base text-ink text-xs font-bold font-display rounded-lg border-2 border-ink shadow-brutal-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-accent hover:bg-accent/90 text-surface text-xs font-extrabold font-display rounded-lg border-2 border-ink shadow-brutal active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? "Submitting..." : "Send Enquiry"}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
