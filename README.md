# 🛒 HyperCon

**HyperCon** is a hyperlocal grocery commerce platform that lets shoppers compare live prices across nearby stores, verify freshness through a live in-store camera feed, and check out — while store owners manage inventory, orders, and payouts from a dedicated admin portal.

> **Status:** Runnable scaffold, not a finished product. Core models, routes, price-ranking logic, and the live-video pipeline wiring are in place. UI polish and the customer-facing map view are still being built out.

---

## ✨ Features

### Customer-facing
- 📍 Location-aware store discovery with price comparison across nearby stores
- 🏆 "Smartest option" ranking — flags the best price/ETA combination per product
- 📹 **Live Stock CCTV verification** — real in-store shelf footage streamed via RTSP → HLS, so shoppers can see the shelf before they buy
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
| Real-Time / Streaming | WebSocket (`ws`), MediaMTX (RTSP → HLS), FFmpeg, `hls.js` |
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
├── streaming/                  # MediaMTX server + Live Stock CCTV pipeline
│   ├── mediamtx.exe / mediamtx.yml
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
- FFmpeg installed and available on system `PATH`

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

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev   # http://localhost:5173, proxies /api to :4000
```

---

## 📹 Live Stock CCTV Streaming (MediaMTX & HLS)

The `streaming/` folder holds the MediaMTX RTSP-to-HLS media server and helper scripts used to push simulated (or real) CCTV feeds of store produce shelves into HyperCon, so shoppers can visually verify stock before ordering.

### Architecture

```text
 [ Local Video MP4 / CCTV RTSP ]
             │
             ▼ FFmpeg Stream Loop
 [ MediaMTX Server (RTSP :8554) ]
             │
             ▼ Auto HLS Transmuxing
 [ HLS Server (:8888/<stream>/index.m3u8) ]
             │
             ▼ Frontend hls.js Player
 [ HyperCon Live Stock Modal ]
```

### Step 1 — Start the MediaMTX Server

Run `mediamtx.exe` from the `streaming/` directory:

**Windows (PowerShell / Command Prompt):**
```powershell
cd c:\hypercon\streaming
.\mediamtx.exe
```

MediaMTX will bind to:
- **RTSP Port:** `8554` (`rtsp://localhost:8554`)
- **HLS Port:** `8888` (`http://localhost:8888`)

### Step 2 — Push an RTSP Loop Stream via FFmpeg

Ensure `ffmpeg` is installed and available in your system `PATH`, then run the loop-pusher script.

**Windows (CMD/PowerShell):**
```cmd
cd c:\hypercon\streaming
.\push-loop.bat demo.mp4 store1
```

**Linux / macOS / Git Bash:**
```bash
cd streaming
./push-loop.sh demo.mp4 store1
```

To simulate multiple store feeds (e.g. `store2`), open a second terminal and push to a different stream name:
```cmd
.\push-loop.bat demo.mp4 store2
```

### Step 3 — Verify HLS Playback

1. Test the HLS manifest URL directly in a browser or VLC:
   - `http://localhost:8888/store1/index.m3u8`
   - `http://localhost:8888/store2/index.m3u8`
2. In the HyperCon web app:
   - Click **"Watch Camera Feed"** on any partner store card.
   - The stream auto-connects to the resolved HLS endpoint via `GET /api/streams/:storeId`.
   - If the stream is offline or disconnected, HyperCon automatically retries with exponential backoff before gracefully falling back to the verified demo loop.

### MediaMTX Configuration (`mediamtx.yml`)

| Setting | Value |
|---|---|
| RTSP address | `:8554` |
| HLS address | `:8888` |
| HLS always remux | Enabled |
| HLS segment duration | `1s` (tuned for ultra-low-latency live shelf inspection) |

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
| `/api/streams/:storeId` | GET | Resolve the HLS stream URL for a store's Live Stock camera |
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
Customer opens Live Stock Modal to verify freshness
        │
        ▼
HLS stream resolved via /api/streams/:storeId → MediaMTX (RTSP → HLS)
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
- **Live camera source** — Live Stock currently runs off a looped demo video via `push-loop`; wiring a real store CCTV/RTSP feed is a follow-up.

---

## 🧠 Core Design Concepts

- Price comparison is computed server-side in `/api/search`, combining `StoreInventory` and `MockExternalPrice` data
- Live video is fully decoupled from the app server — MediaMTX handles RTSP ingestion and HLS transmuxing independently, with 1-second HLS segments for low-latency shelf inspection
- The frontend never talks to MediaMTX directly for stream resolution — it goes through `/api/streams/:storeId`, and falls back to a verified demo loop with exponential-backoff retries if the live feed is unreachable
- Customer and store-owner auth are fully separate (`User`/`auth.js` vs `AdminUser`/`adminAuth.js`), each with their own JWT scope
- Commission split is calculated and stored at order-creation time, not derived later

---

## 👥 Team

HyperCon — Hackathon Build 
- Pratik kalambe [@Pratikk404](https://github.com/Pratikk404)
- Khushi Kadkal [@khushicodeslabs](https://github.com/khushicodeslabs)
- Aarya Kadam [@aaryak11](https://github.com/aaryak11)
- Mayuresh Jagadale [@MAYURESH90](https://github.com/MAYURESH90)
