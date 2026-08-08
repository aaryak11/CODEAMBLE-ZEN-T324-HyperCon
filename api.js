/**
 * Centralized API configuration for HyperCon client.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

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
};

export const MEDIAMTX_HLS_BASE = import.meta.env.VITE_MEDIAMTX_HLS_BASE || "http://localhost:8888";
