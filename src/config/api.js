/**
 * Centralized API configuration for HyperCon client.
 */

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
export const API_BASE_URL = rawBaseUrl.endsWith("/api")
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/+$/, "")}/api`;

export const ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health`,
  PRODUCTS: `${API_BASE_URL}/products`,
  STORES: `${API_BASE_URL}/stores`,
  SEARCH: `${API_BASE_URL}/search`,
  STREAMS: (storeId) => `${API_BASE_URL}/streams/${storeId}`,
  CART: `${API_BASE_URL}/cart`,
  CART_ITEMS: `${API_BASE_URL}/cart/items`,
  CART_ITEM_BY_INDEX: (index) => `${API_BASE_URL}/cart/items/${index}`,
  CART_CHECKOUT: `${API_BASE_URL}/cart/checkout`,
  PAYMENT_CREATE_ORDER: `${API_BASE_URL}/payment/create-order`,
  PAYMENT_VERIFY: `${API_BASE_URL}/payment/verify`,
  PAYMENT_KEY: `${API_BASE_URL}/payment/key`,
};

export const MEDIAMTX_HLS_BASE = import.meta.env.VITE_MEDIAMTX_HLS_BASE || "http://localhost:8888";
