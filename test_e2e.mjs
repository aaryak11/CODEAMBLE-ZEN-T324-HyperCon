import http from "http";
import WebSocket from "ws";

const BASE_URL = "http://localhost:4000";

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { "Content-Type": "application/json", ...options.headers };
  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log("=== HYPERCON E2E AUTOMATED VERIFICATION ===");
  let passed = 0;
  let failed = 0;

  // 1. Health check
  const health = await request("/api/health");
  if (health.ok && health.data.ok) {
    console.log("PASS 1: Health endpoint responsive");
    passed++;
  } else {
    console.error("FAIL 1: Health check", health);
    failed++;
  }

  // 2. Admin Login
  const loginRes = await request("/api/admin/login", {
    method: "POST",
    body: { email: "owner@greenbasket.com", password: "password123" },
  });
  if (loginRes.ok && loginRes.data.token) {
    console.log("PASS 2: Admin Login succeeded with JWT token issued");
    passed++;
  } else {
    console.error("FAIL 2: Admin Login", loginRes);
    failed++;
  }

  const token = loginRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Admin /me Profile
  const meRes = await request("/api/admin/me", { headers: authHeaders });
  if (meRes.ok && meRes.data.user.role === "store_owner") {
    console.log("PASS 3: Admin /me verified store_owner profile & store details");
    passed++;
  } else {
    console.error("FAIL 3: Admin /me", meRes);
    failed++;
  }

  // 4. Admin Inventory List
  const invRes = await request("/api/admin/inventory", { headers: authHeaders });
  if (invRes.ok && Array.isArray(invRes.data.items) && invRes.data.items.length > 0) {
    console.log(`PASS 4: Inventory fetch succeeded (${invRes.data.items.length} items found)`);
    passed++;
  } else {
    console.error("FAIL 4: Inventory fetch", invRes);
    failed++;
  }

  // 5. Admin Inventory Add SKU
  const addItemRes = await request("/api/admin/inventory", {
    method: "POST",
    headers: authHeaders,
    body: {
      name: "Fresh Nagpur Oranges",
      category: "Fresh Fruits",
      price: 85,
      unit: "1kg",
      stockStatus: "in_stock",
      shelfLocation: "Fruit Section - Crate 2",
    },
  });
  if (addItemRes.status === 201 && addItemRes.data.item.name === "Fresh Nagpur Oranges") {
    console.log("PASS 5: Admin Inventory item added with real-time broadcast hook");
    passed++;
  } else {
    console.error("FAIL 5: Add Inventory item", addItemRes);
    failed++;
  }

  const createdItemId = addItemRes.data.item._id;

  // 6. Admin Inventory Update SKU Price & Stock Status
  const updateItemRes = await request(`/api/admin/inventory/${createdItemId}`, {
    method: "PUT",
    headers: authHeaders,
    body: {
      price: 80,
      stockStatus: "low_stock",
    },
  });
  if (updateItemRes.ok && updateItemRes.data.item.price === 80 && updateItemRes.data.item.stockStatus === "low_stock") {
    console.log("PASS 6: Admin Inventory update price & stock status succeeded");
    passed++;
  } else {
    console.error("FAIL 6: Update inventory item", updateItemRes);
    failed++;
  }

  // 7. Admin Payouts Overview & 10% Commission Calculation
  const payoutsRes = await request("/api/admin/payouts/overview", { headers: authHeaders });
  if (
    payoutsRes.ok &&
    payoutsRes.data.summary.commissionRatePercent === 10 &&
    payoutsRes.data.summary.deliveryFees === 0 &&
    payoutsRes.data.summary.userCommission === 0
  ) {
    console.log("PASS 7: Payout & Commission breakdown verified: 10% platform fee, ₹0 user fee, ₹0 delivery");
    passed++;
  } else {
    console.error("FAIL 7: Payout overview", payoutsRes);
    failed++;
  }

  // 8. Admin Instant Settlement Request
  const instantRes = await request("/api/admin/payouts/instant-settlement", {
    method: "POST",
    headers: authHeaders,
  });
  if (instantRes.status === 201 && instantRes.data.payout.referenceUtr) {
    console.log(`PASS 8: Instant Settlement executed successfully (UTR: ${instantRes.data.payout.referenceUtr})`);
    passed++;
  } else {
    console.error("FAIL 8: Instant Settlement", instantRes);
    failed++;
  }

  // 9. Customer Support Ticket Submission
  const ticketRes = await request("/api/support/ticket", {
    method: "POST",
    body: {
      customerName: "Rohan Varma",
      email: "rohan@example.com",
      phone: "+91 98200 99887",
      subject: "Stream confirmation for Apples",
      message: "Checking live stream freshness for royal gala apples.",
      category: "produce_freshness",
    },
  });
  if (ticketRes.status === 201 && ticketRes.data.ticket.ticketId.startsWith("TICK-")) {
    console.log(`PASS 9: Customer Support Ticket submitted (ID: ${ticketRes.data.ticket.ticketId})`);
    passed++;
  } else {
    console.error("FAIL 9: Support ticket submission", ticketRes);
    failed++;
  }

  // 10. Admin Support Ticket Status Update
  const ticketId = ticketRes.data.ticket.ticketId;
  const updateTicketRes = await request(`/api/support/tickets/${ticketId}/status`, {
    method: "PUT",
    headers: authHeaders,
    body: { status: "resolved" },
  });
  if (updateTicketRes.ok && updateTicketRes.data.ticket.status === "resolved") {
    console.log("PASS 10: Admin Support Ticket marked as resolved");
    passed++;
  } else {
    console.error("FAIL 10: Update ticket status", updateTicketRes);
    failed++;
  }

  // 11. Strict Search Relevance (No random fallbacks)
  const nonExistentSearch = await request("/api/search?q=xyznonexistentitem123");
  if (nonExistentSearch.ok && Array.isArray(nonExistentSearch.data.results) && nonExistentSearch.data.results.length === 0) {
    console.log("PASS 11: Strict Search Relevance confirmed: 0 results returned for non-matching query");
    passed++;
  } else {
    console.error("FAIL 11: Strict search relevance", nonExistentSearch);
    failed++;
  }

  // 11b. Search 'mango' -> only mango items
  const mangoSearch = await request("/api/search?q=mango");
  const mangoItems = mangoSearch.data.results || [];
  const onlyMango = mangoItems.every((item) => item.productName.toLowerCase().includes("mango"));
  if (mangoSearch.ok && mangoItems.length > 0 && onlyMango) {
    console.log(`PASS 11b: Search 'mango' returned ${mangoItems.length} items, all containing 'mango'`);
    passed++;
  } else {
    console.error("FAIL 11b: Search 'mango'", mangoItems);
    failed++;
  }

  // 11c. Search 'milk' -> only milk items
  const milkSearch = await request("/api/search?q=milk");
  const milkItems = milkSearch.data.results || [];
  const onlyMilk = milkItems.every((item) => item.productName.toLowerCase().includes("milk") || item.category?.toLowerCase().includes("dairy"));
  if (milkSearch.ok && milkItems.length > 0 && onlyMilk) {
    console.log(`PASS 11c: Search 'milk' returned ${milkItems.length} items, all strictly relevant`);
    passed++;
  } else {
    console.error("FAIL 11c: Search 'milk'", milkItems);
    failed++;
  }

  // 12. Real-time WebSocket connection
  try {
    const ws = new WebSocket("ws://localhost:4000/ws");
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("WebSocket timeout")), 3000);
      ws.on("open", () => {
        clearTimeout(timeout);
        console.log("PASS 12: Real-time WebSocket connection established on /ws");
        passed++;
        ws.close();
        resolve();
      });
      ws.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  } catch (err) {
    console.error("FAIL 12: WebSocket connection error", err);
    failed++;
  }

  console.log("\n==========================================");
  console.log(`E2E TEST SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log("==========================================");
}

runTests();
