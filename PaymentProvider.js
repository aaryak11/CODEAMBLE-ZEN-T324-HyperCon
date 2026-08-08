/**
 * PaymentProvider Abstract Base Interface
 * Every payment gateway integration (Mock, Razorpay, Stripe, UPI) must extend or implement this contract.
 */

export class PaymentProvider {
  /**
   * Initializes the payment session or SDK.
   * @param {Object} _params Payment initialization parameters
   * @returns {Promise<{ sessionToken: string }>}
   */
  async initializePayment(_params) {
    throw new Error("Method 'initializePayment()' must be implemented by payment provider.");
  }

  /**
   * Processes the payment for the given order details.
   * @param {Object} _paymentDetails Payment amount, currency, and items details
   * @returns {Promise<{ success: boolean, transactionId: string, timestamp: string, message?: string }>}
   */
  async processPayment(_paymentDetails) {
    throw new Error("Method 'processPayment()' must be implemented by payment provider.");
  }

  /**
   * Verifies payment authenticity via signature or backend callback.
   * @param {string} _transactionId Transaction ID to verify
   * @returns {Promise<{ verified: boolean }>}
   */
  async verifyPayment(_transactionId) {
    throw new Error("Method 'verifyPayment()' must be implemented by payment provider.");
  }

  /**
   * Cancels or aborts an active payment process.
   * @param {string} _transactionId Transaction ID to cancel
   * @returns {Promise<{ cancelled: boolean }>}
   */
  async cancelPayment(_transactionId) {
    throw new Error("Method 'cancelPayment()' must be implemented by payment provider.");
  }
}
