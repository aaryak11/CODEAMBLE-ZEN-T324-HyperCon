import { PaymentProvider } from "./PaymentProvider.js";

/**
 * MockPaymentProvider
 * Production-ready mock implementation simulating gateway responses for HyperCon demo.
 */
export class MockPaymentProvider extends PaymentProvider {
  constructor(delayMs = 1500) {
    super();
    this.delayMs = delayMs;
  }

  async initializePayment(params) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      sessionToken: `MOCK_SESSION_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      orderId: params?.orderId || null,
    };
  }

  async processPayment(paymentDetails) {
    // Simulate payment gateway delay (1-2s)
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));

    const txnId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return {
      success: true,
      transactionId: txnId,
      timestamp: new Date().toISOString(),
      amount: paymentDetails?.amount || 0,
      paymentMethod: paymentDetails?.paymentMethod || "HyperCon Direct Pay (Demo)",
      message: "Payment processed and verified successfully.",
    };
  }

  async verifyPayment(transactionId) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      verified: true,
      transactionId,
      status: "SUCCESS",
    };
  }

  async cancelPayment(transactionId) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      cancelled: true,
      transactionId,
      status: "CANCELLED",
    };
  }
}
