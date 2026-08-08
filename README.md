# 🛒 HyperCon

**HyperCon** is a hyperlocal grocery commerce platform that lets shoppers compare live prices across nearby stores, verify freshness through a live in-store camera feed, and check out — while store owners manage inventory, orders, and payouts from a dedicated admin portal.

> **Status:** Runnable scaffold, not a finished product. Core models, routes, price-ranking logic, and the live-video pipeline wiring are in place. Real-time camera feeds, UI polish, and the customer-facing map view are still being built out.

---

## ✨ Features

### Customer-facing
- 📍 Location-aware store discovery with price comparison across nearby stores
- 🏆 "Smartest option" ranking — flags the best price/ETA combination per product
- 📹 Live in-store camera verification via HLS streaming (MediaMTX + hls.js), so shoppers can see the shelf before they buy
- 🛒 Cart, checkout, and order history
- 💳 QR-based mock payment flow
- 🎫 Customer support ticketing

### Store owner (admin)
- 🔐 Dedicated store-owner authentication, separate from customer auth
- 📦 Inventory management (add/update/remove products & prices per store)
- 💰 Payouts overview, instant settlement, and bank settings
- 🎫 Support ticket queue and status management

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Lucide Icons |
| Backend | Node.js (ESM), Express |
| Database | MongoDB, Mongoose |
| Auth | JWT (`jsonwebtoken`), `bcryptjs` for password hashing |
| Real-Time / Streaming | WebSocket (`ws`), MediaMTX, HLS via `hls.js` |
| Maps | Leaflet |
| Payments | QR code mock flow (`qrcode.react`) |

---

## 📂 Project Structure

```text
hypercon-v1.2/
│
├── server/                     # Express + MongoDB API
│   ├── src/
│   │   ├── models/             # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── AdminUser.js
│   │   │   ├── Store.js
│   │   │   ├── Product.js
│   │   │   ├── StoreInventory.js
│   │   │   ├── MockExternalPrice.js
│   │   │   ├── Cart.js
│   │   │   ├── Order.js
│   │   │   └── SupportTicket.js
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js             # customer register/login/location
│   │   │   ├── products.js
│   │   │   ├── stores.js
│   │   │   ├── search.js           # ranked price comparison
│   │   │   ├── streams.js          # HLS stream URL resolution
│   │   │   ├── cart.js
│   │   │   ├── orders.js
│   │   │   ├── support.js
│   │   │   ├── adminAuth.js        # store-owner signup/login
│   │   │   ├── adminInventory.js
│   │   │   └── adminPayouts.js
│   │   │
│   │   ├── db.js               # MongoDB connection
│   │   ├── realtime.js         # WebSocket init
│   │   ├── seed.js             # manual seed script
│   │   └── index.js            # app entry point
│   │
│   ├── .env.example
│   └── package.json
│
├── client/                     # React (Vite) frontend
│   └── src/
│       ├── components/
│       │   ├── admin/          # AdminPortal, InventoryModal, StoreLocationPicker...
│       │   ├── ui/
│       │   ├── Navbar.jsx, HomeView.jsx, CartDrawer.jsx
│       │   ├── LiveStreamModal.jsx, LocationModal.jsx, StoreMap.jsx
│       │   └── ...
│       ├── context/             # AppContext, AuthContext, AdminAuthContext
│       ├── services/            # auth/, cart/, orders/, payment/
│       ├── pages/SearchResults.jsx
│       ├── hooks/useGeolocation.js
│       └── config/api.js
│
├── streaming/                  # MediaMTX config + demo push scripts
│   ├── mediamtx.yml
│   ├── push-loop.sh / push-loop.bat
│   └── demo.mp4
│
└── package.json                 # root-level, minimal (ws dependency only)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm
- A MongoDB Atlas cluster (or local MongoDB instance)
- [MediaMTX](https://github.com/bluenviron/mediamtx/releases) for live streaming (single binary, no install)

### 1. Clone Repository
```bash
git clone <repo-url>
cd hypercon-v1.2
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env     # then edit MONGODB_URI
npm run seed              # populates demo stores/products/prices (optional — server also auto-seeds if empty)
npm run dev                # http://localhost:4000
```

`server/.env`:
```properties
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/hypercon
PORT=4000
MEDIAMTX_HLS_BASE=http://localhost:8888
```

Sanity check:
```bash
curl http://localhost:4000/api/health
# → {"ok":true,"status":"healthy","timestamp":"..."}

curl "http://localhost:4000/api/search?product=tomato&lat=19.2183&lng=73.0864"
# → ranked list of stores, with isSmartestOption flagged on the best entry
```

### 3. Live Streaming (MediaMTX)
1. Download MediaMTX and place `streaming/mediamtx.yml` next to the binary, then run it.
2. Use `streaming/push-loop.sh` (or `.bat` on Windows) to loop a demo video into the `store1` RTSP path via ffmpeg — this removes phone/Wi-Fi as a point of failure for demos.
3. Confirm playback standalone before wiring the frontend: open `http://localhost:8888/store1/index.m3u8` in VLC or a bare `<video>` + `hls.js` test page.
4. Once that works, the app's `LiveStreamModal` component will resolve stream URLs through `/api/streams/:storeId`.

### 4. Frontend Setup
```bash
cd client
npm install
npm run dev   # http://localhost:5173, proxies /api to :4000
```

---

## 📡 API Reference

### Customer

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/auth/register` | POST | Register a new customer |
| `/api/auth/login` | POST | Customer login |
| `/api/auth/location` | PUT | Update customer's selected location |
| `/api/products` | GET | List all products |
| `/api/products/:id` | GET | Get a single product |
| `/api/stores` | GET | List all stores |
| `/api/stores/:id` | GET | Get a single store |
| `/api/search` | GET | Ranked price comparison across nearby stores |
| `/api/streams/:storeId` | GET | Resolve the HLS stream URL for a store's camera |
| `/api/cart` | GET | Get current cart |
| `/api/cart/items` | POST | Add item to cart |
| `/api/cart/items/:index` | PATCH | Update cart item quantity |
| `/api/cart/items/:index` | DELETE | Remove cart item |
| `/api/cart/checkout` | POST | Checkout cart |
| `/api/orders` | POST | Place an order |
| `/api/orders` | GET | List orders |
| `/api/support/ticket` | POST | Raise a support ticket |

### Store Owner (Admin)

| Endpoint | Method | Description | Auth |
|---|---|---|---|
| `/api/admin/signup` | POST | Store owner signup | — |
| `/api/admin/login` | POST | Store owner login | — |
| `/api/admin/me` | GET | Current admin profile | ✅ |
| `/api/admin/inventory` | GET | List store's inventory | ✅ |
| `/api/admin/inventory` | POST | Add inventory item | ✅ |
| `/api/admin/inventory/:id` | PUT | Update inventory item | ✅ |
| `/api/admin/inventory/:id` | DELETE | Remove inventory item | ✅ |
| `/api/admin/payouts/overview` | GET | Payouts summary | ✅ |
| `/api/admin/payouts/instant-settlement` | POST | Trigger instant settlement | ✅ |
| `/api/admin/payouts/bank-settings` | PUT | Update bank details | ✅ |
| `/api/support/tickets` | GET | List support tickets | ✅ |
| `/api/support/tickets/:ticketId/status` | PUT | Update ticket status | ✅ |

*Admin routes marked ✅ require a Bearer JWT issued by `/api/admin/login`.*

---

## 📊 Core Data Models

| Model | Purpose |
|---|---|
| `User` | Customer account, with a saved default location |
| `AdminUser` | Store owner account, linked to a `Store` |
| `Store` | A physical store — name, geo-location, address, camera stream ID, rating |
| `Product` | A sellable product — name, category, unit, image |
| `StoreInventory` | Price + stock status of a `Product` at a specific `Store` |
| `MockExternalPrice` | Reference prices from external platforms (Amazon, Flipkart, Smartprix) used for comparison |
| `Cart` | A user's in-progress cart, keyed by `userId` |
| `Order` | A placed order — items, subtotal, store commission split, delivery details |
| `SupportTicket` | Customer support request, categorized and tracked to resolution |

---

## ⚡ System Logic

```text
Customer searches for a product
        │
        ▼
/api/search ranks nearby stores by price + distance
        │
        ├── Best match flagged as "isSmartestOption"
        │
        ▼
Customer opens LiveStreamModal to verify freshness
        │
        ▼
HLS stream resolved via /api/streams/:storeId → MediaMTX
        │
        ▼
Customer adds to cart → checks out → Order created
        │
        ▼
Order split: storeEarnings (90%) vs platform commission (10%)
```

---

## 💰 Commission Model

Orders are split automatically on creation (`Order.js`):
- **Delivery fee:** ₹0 to the customer
- **Platform markup:** ₹0 to the customer
- **Store commission:** 10% of subtotal
- **Store earnings:** 90% of subtotal

---

## 🔮 What's Stubbed / Left To Build

- **Map view** — Leaflet is installed but the nearby-store map UI isn't wired up yet.
- **Real geolocation** — `SearchResults.jsx` currently hardcodes a demo lat/lng instead of using `useGeolocation.js`.
- **Cart UI polish** — backend routes exist and work; frontend cart flow needs refinement.
- **Seed data breadth** — only a handful of demo stores/products; add more once the core pipeline (search → stream → cart → order) is proven end-to-end.
- **Live camera source** — currently intended to run off a looped demo video via `push-loop.sh`; wiring a real RTSP camera is a follow-up.

---

## 🧠 Core Design Concepts

- Price comparison is computed server-side in `/api/search`, combining `StoreInventory` and `MockExternalPrice` data
- Live video is decoupled from the app server — MediaMTX handles RTSP ingestion and HLS output independently
- Customer and store-owner auth are fully separate (`User`/`auth.js` vs `AdminUser`/`adminAuth.js`), each with their own JWT scope
- Commission split is calculated and stored at order-creation time, not derived later

---

## 👥 Team

HyperCon — Hackathon Build
- Pratik kalambe [@Pratikk404](https://github.com/Pratikk404)
- Khushi Kadkal [@khushicodeslabs](https://github.com/khushicodeslabs)
- Aarya Kadam [@aaryak11](https://github.com/aaryak11)
- Mayuresh Jagadale @MAYURESH90
- Mayuresh Jagadale [@MAYURESH90](https://github.com/MAYURESH90)
