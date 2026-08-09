import { PaymentProvider } from "./PaymentProvider.js";
import { ENDPOINTS } from "../../config/api.js";

/**
 * RazorpayPaymentProvider
 * Handles real Razorpay Checkout integration with backend order creation & verification.
 */
export class RazorpayPaymentProvider extends PaymentProvider {
  constructor() {
    super();
    this.razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "";
  }

  /**
   * Dynamically load the Razorpay Checkout JavaScript SDK if not already loaded.
   */
  async loadScript() {
    if (window.Razorpay) return true;

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load Razorpay Checkout SDK"));
      document.body.appendChild(script);
    });
  }

  /**
   * Retrieve the active Razorpay Key ID from env or server endpoint.
   */
  async fetchKey() {
    if (this.razorpayKey) return this.razorpayKey;

    try {
      const res = await fetch(ENDPOINTS.PAYMENT_KEY);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.key) {
          this.razorpayKey = data.key;
          return data.key;
        }
      }
    } catch (e) {
      console.warn("[RazorpayPaymentProvider] Could not fetch key from server:", e);
    }

    return import.meta.env.VITE_RAZORPAY_KEY_ID || "";
  }

  /**
   * Process Razorpay payment.
   * @param {Object} paymentDetails Payment options including amount, guestName, email, etc.
   */
  async processPayment(paymentDetails) {
    await this.loadScript();
    const key = await this.fetchKey();

    if (!key) {
      throw new Error("Razorpay Key ID missing. Please check .env configuration.");
    }

    const amount = Number(paymentDetails?.amount);
    if (!amount || amount <= 0) {
      throw new Error("Invalid payment amount specified");
    }

    // 1. Create order on backend
    const orderRes = await fetch(ENDPOINTS.PAYMENT_CREATE_ORDER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    let orderData;
    const orderText = await orderRes.text();
    try {
      orderData = JSON.parse(orderText);
    } catch (e) {
      throw new Error(`Server endpoint error (${orderRes.status}): Received invalid JSON from ${ENDPOINTS.PAYMENT_CREATE_ORDER}`);
    }

    if (!orderRes.ok || !orderData.success) {
      throw new Error(orderData.message || "Failed to create Razorpay order");
    }

    // 2. Open Razorpay modal
    return new Promise((resolve, reject) => {
      const options = {
        key,
        amount: orderData.order.amount,
        currency: orderData.order.currency || "INR",
        name: "HyperCon",
        description: paymentDetails?.description || "HyperCon Grocery Order",
        order_id: orderData.order.id,
        prefill: {
          name: paymentDetails?.guestName || "HyperCon Customer",
          email: paymentDetails?.email || "customer@hypercon.store",
          contact: paymentDetails?.contact || "9820198201",
        },
        handler: async (response) => {
          try {
            // 3. Verify payment signature on backend
            const verifyRes = await fetch(ENDPOINTS.PAYMENT_VERIFY, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });

            let verifyData;
            const verifyText = await verifyRes.text();
            try {
              verifyData = JSON.parse(verifyText);
            } catch (e) {
              throw new Error(`Server verification error (${verifyRes.status}): Received invalid response`);
            }

            if (verifyRes.ok && verifyData.success) {
              resolve({
                success: true,
                transactionId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                paymentMethod: "Razorpay Gateway",
                timestamp: new Date().toISOString(),
                amount,
                message: "Razorpay payment verified successfully.",
              });
            } else {
              reject(new Error(verifyData.message || "Payment verification failed"));
            }
          } catch (err) {
            reject(err);
          }
        },
        modal: {
          ondismiss: () => {
            reject(new Error("Razorpay payment window closed by user"));
          },
        },
        theme: {
          color: "#16a34a",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        reject(new Error(response.error?.description || "Razorpay payment failed"));
      });
      rzp.open();
    });
  }

  async verifyPayment(transactionId) {
    return { verified: true, transactionId, status: "SUCCESS" };
  }

  async cancelPayment(transactionId) {
    return { cancelled: true, transactionId, status: "CANCELLED" };
  }
}
