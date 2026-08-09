// Demo Safety Net - Global Fetch Interceptor
const originalFetch = window.fetch;

const MOCK_DATA = {
  "/api/search": {
    results: [
      {
        id: "mock-1",
        productName: "Fresh Tomato (Mock Data)",
        storeName: "Demo Store",
        price: 45,
        type: "local_store",
        hasLiveFeed: true,
        trustScore: 92,
        distanceKm: 1.2
      }
    ],
    metadata: { analysisTimeMs: 120, aiConfidence: 0.95 }
  },
  "/api/stores": [
    {
      _id: "store-1",
      name: "Demo Store (Mock Data)",
      location: { lat: 19.2183, lng: 73.0864 },
      feedStatus: "live",
      trustScore: 90
    }
  ],
  "/api/cart": [],
  "/api/orders": []
};

window.fetch = async (...args) => {
  const [resource, config] = args;
  
  try {
    // Add a strict timeout to prevent infinite hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s max wait
    
    const fetchConfig = { ...config, signal: controller.signal };
    const response = await originalFetch(resource, fetchConfig);
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.warn("DEMO SAFETY NET TRIGGERED:", error);
    
    // Find mock data
    let mockResponse = {};
    if (typeof resource === "string") {
      for (const [key, val] of Object.entries(MOCK_DATA)) {
        if (resource.includes(key)) {
          mockResponse = val;
          break;
        }
      }
    }
    
    // Provide a mocked response that won't break the UI
    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};
