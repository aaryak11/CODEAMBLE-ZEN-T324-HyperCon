import { MockPaymentProvider } from "./MockPaymentProvider.js";
import { RazorpayPaymentProvider } from "./RazorpayPaymentProvider.js";

/**
 * PaymentService
 * Orchestrates payment gateway calls across the application.
 * Default provider is configured for Razorpay.
 */
class PaymentService {
  constructor(provider) {
    this.provider = provider || new RazorpayPaymentProvider();
  }

  /**
   * Sets or swaps the active payment provider implementation.
   * @param {import('./PaymentProvider.js').PaymentProvider} provider 
   */
  setProvider(provider) {
    this.provider = provider;
  }

  async initializePayment(params) {
    return this.provider.initializePayment(params);
  }

  async processPayment(paymentDetails) {
    return this.provider.processPayment(paymentDetails);
  }

  async verifyPayment(transactionId) {
    return this.provider.verifyPayment(transactionId);
  }

  async cancelPayment(transactionId) {
    return this.provider.cancelPayment(transactionId);
  }
}

export const defaultPaymentService = new PaymentService(new RazorpayPaymentProvider());
export { PaymentService, MockPaymentProvider, RazorpayPaymentProvider };
