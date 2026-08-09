# 🛒 HyperCon

**HyperCon** is a hyperlocal grocery commerce platform that bridges the trust gap in online grocery shopping. Instead of a dark warehouse, HyperCon connects shoppers directly to local partner stores — letting them compare prices, search in natural language (including Hindi/Hinglish), watch a **live shelf camera feed with real-time AI object detection**, and check out — while store owners manage inventory, orders, and payouts from a dedicated admin portal.

> **Status:** Runnable hackathon build. Core commerce flow (search → verify → cart → checkout), the live-video pipeline, AI-assisted search, and client-side object detection are wired up end-to-end. Some AI/verification logic is deterministic simulation dressed up for demo purposes (see [How "AI" Works Here](#-how-ai-works-here-honest-notes) below) rather than production-grade computer vision.

*Built during **CodeAmble 2026** (Watumull Institute) by **Team KAMPASTRA**.*

---

## ✨ Features

### Customer-facing
- 📍 Location-aware store discovery with price comparison across nearby stores
- 🗣️ **AI Natural Language Search** — type queries like *"sabji 100 rupees mein"* or *"fresh tomato chahiye"* in English/Hindi/Hinglish; a Groq-hosted Llama 3.3 model extracts product, budget, category, and intent (falls back to a rule-based keyword parser if Groq isn't configured)
- 🏆 "Smartest option" ranking — balances Trust Score, ETA, and price per product
- 📹 **Live Stock CCTV verification** — real in-store shelf footage streamed via RTSP → HLS, so shoppers can see the shelf before they buy
- 🎯 **Client-side object detection** — TensorFlow.js + COCO-SSD (`lite_mobilenet_v2`) runs in the browser on the live video feed, drawing bounding boxes and mapping detected objects (apples, bananas, carrots, etc.) to grocery labels
- 🛡️ **Trust Score badges** — per-store feed reliability status (verified / unreliable / offline) surfaced on store cards and the map
- 🗺️ Enhanced interactive Leaflet map — color-coded store pins by live-feed health
- 🛒 Cart, checkout, and order history
- 💳 **Razorpay checkout** (test-mode) with signature verification, alongside the original QR-based mock payment flow
- 🎫 Customer support ticketing
- 🧯 Error boundaries + local `MOCK_DATA` interceptors so the demo keeps working even if the backend hiccups

### Store owner (admin)
- 🔐 Dedicated store-owner authentication, separate from customer auth
- 📦 Inventory management (add/update/remove products & prices per store)
- 💰 Payouts overview, instant settlement, and bank settings
- 🎫 Support ticket queue and status management

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS (Neo-Brutalist design system) |
| Backend | Node.js (ESM), Express |
| Database | MongoDB, Mongoose |
| Auth | JWT (`jsonwebtoken`), `bcryptjs` for password hashing |
| AI Search | Groq SDK, Llama 3.3 70B (`llama-3.3-70b-versatile`), with rule-based fallback |
| Computer Vision | TensorFlow.js, `@tensorflow-models/coco-ssd` (client-side, in-browser inference) |
| Real-Time / Streaming | WebSocket (`ws`), MediaMTX (RTSP → HLS), FFmpeg, `hls.js` |
| Payments | Razorpay (test mode) + QR code mock flow (`qrcode.react`) |
| Maps | Leaflet |

---

## 📂 Project Structure

```text
hypercon-v1.3/
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
│   │   │   ├── aiSearch.js         # Groq/Llama natural-language search
│   │   │   ├── streams.js          # HLS stream URL resolution + feed health
│   │   │   ├── cart.js
│   │   │   ├── orders.js
│   │   │   ├── payment.js          # Razorpay order creation + verification
│   │   │   ├── support.js
│   │   │   ├── adminAuth.js        # store-owner signup/login
│   │   │   ├── adminInventory.js
│   │   │   └── adminPayouts.js
│   │   │
│   │   ├── services/
│   │   │   └── feedVerifier.js # background worker: simulated feed-reliability / trust scoring
│   │   │
│   │   ├── db.js               # MongoDB connection
│   │   ├── realtime.js         # WebSocket init + broadcast()
│   │   ├── seed.js             # manual seed script
│   │   └── index.js            # app entry point
│   │
│   ├── .env.example
│   └── package.json
│
├── client/                     # React (Vite) frontend
│   └── src/
│       ├── components/
│       │   ├── admin/              # AdminPortal, InventoryModal, StoreLocationPicker...
│       │   ├── ui/                 # Skeleton, Toast, ...
│       │   ├── CameraPublisher.jsx # pushes a browser camera/video into the live pipeline
│       │   ├── ErrorBoundary.jsx
│       │   ├── TrustScoreBadge.jsx
│       │   ├── Navbar.jsx, HomeView.jsx, CartDrawer.jsx
│       │   ├── LiveStreamModal.jsx, LocationModal.jsx, StoreMap.jsx
│       │   └── ...
│       ├── context/                # AppContext, AuthContext, AdminAuthContext
│       ├── services/
│       │   └── payment/            # PaymentService.js, RazorpayPaymentProvider.js
│       ├── pages/
│       │   ├── SearchResults.jsx
│       │   └── StoreDetail.jsx
│       ├── hooks/
│       │   ├── useGeolocation.js
│       │   └── useObjectDetection.js   # TensorFlow.js / COCO-SSD detection loop
│       ├── utils/
│       └── config/api.js
│
├── streaming/                  # MediaMTX server + Live Stock CCTV pipeline
│   ├── mediamtx.exe / mediamtx.yml
│   ├── push-loop.sh / push-loop.bat
│   └── demo.mp4
│
├── DEMO_SCRIPT.md              # 3-minute hackathon pitch script
├── PROJECT_DOCS.md             # vision / feature summary
└── package.json                 # root-level, minimal (ws dependency only)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm
- MongoDB (Atlas cluster, or local instance on `27017`)
- [MediaMTX](https://github.com/bluenviron/mediamtx/releases) for live streaming (single binary, no install)
- FFmpeg installed and available on system `PATH`
- (Optional) A [Groq API key](https://console.groq.com/) for real AI search — the app degrades gracefully to a rule-based parser without one
- (Optional) Razorpay test-mode keys for the card/UPI checkout flow — the QR mock flow works without them

### 1. Clone Repository
```bash
git clone <repo-url>
cd hypercon-v1.3
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env     # then fill in your own values — see below
npm run seed              # populates demo stores/products/prices (optional — server also auto-seeds if empty)
npm run dev                # http://localhost:4000
```

`server/.env`:
```properties
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/hypercon
PORT=4000
MEDIAMTX_HLS_BASE=http://localhost:8888

# Optional — enables real LLM-powered search; omit to use the rule-based fallback
GROQ_API_KEY=your_groq_api_key

# Optional — enables Razorpay checkout; omit to fall back to the QR mock flow
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

> ⚠️ **Security note:** the `.env.example` shipped in this repo currently contains live-looking Razorpay test keys. Treat any committed API keys as compromised — rotate them in the Razorpay dashboard and keep real credentials only in a local, git-ignored `.env`, never in `.env.example`.

Sanity check:
```bash
curl http://localhost:4000/api/health
# → {"ok":true,"status":"healthy","timestamp":"..."}

curl "http://localhost:4000/api/search?product=tomato&lat=19.2183&lng=73.0864"
# → ranked list of stores, with isSmartestOption flagged on the best entry

curl http://localhost:4000/api/ai-search/status
# → { "groqConfigured": false, "provider": "Rule-based fallback", "ready": true }
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
 [ Local Video MP4 / CCTV RTSP / Browser Camera via CameraPublisher.jsx ]
             │
             ▼ FFmpeg Stream Loop
 [ MediaMTX Server (RTSP :8554) ]
             │
             ▼ Auto HLS Transmuxing
 [ HLS Server (:8888/<stream>/index.m3u8) ]
             │
             ▼ Frontend hls.js Player  ──►  useObjectDetection.js (TensorFlow.js / COCO-SSD, in-browser)
 [ HyperCon Live Stock Modal — bounding boxes + grocery labels overlaid ]
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
   - Click **"Watch Camera Feed"** / **"Live View"** on any partner store card.
   - The stream auto-connects to the resolved HLS endpoint via `GET /api/streams/:storeId`.
   - `useObjectDetection.js` loads the COCO-SSD model client-side and starts drawing bounding boxes over detected produce once the video is playing.
   - If the stream is offline or disconnected, HyperCon automatically retries with exponential backoff before gracefully falling back to the verified demo loop.
3. Trigger an on-demand reliability check any time via `POST /api/streams/verify-now`.

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
| `/api/ai-search/interpret` | POST | Parse a natural-language query (Groq Llama 3.3, or rule-based fallback) into structured search filters |
| `/api/ai-search/status` | GET | Whether Groq is configured, and which provider is active |
| `/api/streams/:storeId` | GET | Resolve the HLS stream URL for a store's Live Stock camera |
| `/api/streams/health` | GET | Streaming subsystem health check |
| `/api/streams/verify-now` | POST | Trigger an on-demand feed-reliability check across stores |
| `/api/cart` | GET | Get current cart |
| `/api/cart/items` | POST | Add item to cart |
| `/api/cart/items/:index` | PATCH | Update cart item quantity |
| `/api/cart/items/:index` | DELETE | Remove cart item |
| `/api/cart/checkout` | POST | Checkout cart |
| `/api/orders` | POST | Place an order |
| `/api/orders` | GET | List orders |
| `/api/payment/key` | GET | Get the public Razorpay key ID |
| `/api/payment/create-order` | POST | Create a Razorpay order for a given amount |
| `/api/payment/verify` | POST | Verify a Razorpay payment signature |
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
| `Store` | A physical store — name, geo-location, address, camera stream ID, rating, feed reliability status |
| `Product` | A sellable product — name, category, unit, image |
| `StoreInventory` | Price + stock status of a `Product` at a specific `Store` |
| `MockExternalPrice` | Reference prices from external platforms (Amazon, Flipkart, Smartprix) used for comparison |
| `Cart` | A user's in-progress cart, keyed by `userId` |
| `Order` | A placed order — items, subtotal, store commission split, delivery details |
| `SupportTicket` | Customer support request, categorized and tracked to resolution |

---

## ⚡ System Logic

```text
Customer types a query (plain or Hindi/Hinglish)
        │
        ▼
/api/ai-search/interpret → Groq Llama 3.3 (or fallback parser)
extracts product, category, budget, priority
        │
        ▼
/api/search ranks nearby stores by price + distance + Trust Score
        │
        ├── Best match flagged as "isSmartestOption"
        │
        ▼
Customer opens Live Stock Modal to verify freshness
        │
        ▼
HLS stream resolved via /api/streams/:storeId → MediaMTX (RTSP → HLS)
        │
        ├── useObjectDetection.js (TensorFlow.js/COCO-SSD) overlays bounding boxes client-side
        │
        ▼
Customer adds to cart → checks out (Razorpay or QR mock) → Order created
        │
        ▼
Order split: storeEarnings (90%) vs platform commission (10%)
```

Independently, a background worker (`feedVerifier.js`) periodically re-checks every store's stream, updates its `feedReliability` status (verified / unreliable / offline), and broadcasts the change over WebSocket so Trust Score badges update live across all connected clients.

---

## 💰 Commission Model

Orders are split automatically on creation (`Order.js`):
- **Delivery fee:** ₹0 to the customer
- **Platform markup:** ₹0 to the customer
- **Store commission:** 10% of subtotal
- **Store earnings:** 90% of subtotal

---

## 🧠 How "AI" Works Here (honest notes)

- **Natural-language search** is real: a live call to Groq's `llama-3.3-70b-versatile` parses free-text queries (including Hindi/Hinglish) into structured filters, with a deterministic rule-based parser as a same-shape fallback when no Groq key is set.
- **Object detection** is real: `useObjectDetection.js` loads TensorFlow.js and the COCO-SSD model directly in the browser and runs inference frame-by-frame on the live `<video>` element — no server round-trip.
- **Feed reliability / Trust Score** (`feedVerifier.js`) is a **deterministic simulation** built for demo purposes — it uses per-store name/status rules and a synthetic perceptual-hash generator rather than actual motion analysis on camera bytes. Treat "loop detected" / "unreliable" verdicts as scripted demo states, not production-grade stream forensics.

---

## 🔮 What's Stubbed / Left To Build

- **Real motion/loop detection** — `feedVerifier.js` simulates diff-scores and perceptual hashes rather than analyzing actual frame data; a genuine implementation would hash real video frames.
- **Real geolocation in search results** — worth double-checking whether `SearchResults.jsx` still hardcodes a demo lat/lng vs. using `useGeolocation.js` end-to-end.
- **Secrets hygiene** — rotate the committed Razorpay test keys and keep `.env` out of version control (see the security note above).
- **Seed data breadth** — a handful of demo stores/products cover the core pipeline (search → stream → cart → order); expand once the flow is validated further.
- **Live camera source** — Live Stock still runs primarily off a looped demo video via `push-loop`; `CameraPublisher.jsx` is a step toward pushing a real browser camera into the pipeline, but wiring an actual store CCTV/RTSP feed end-to-end is a follow-up.

---

## 🧠 Core Design Concepts

- Price comparison is computed server-side in `/api/search`, combining `StoreInventory` and `MockExternalPrice` data
- Live video is fully decoupled from the app server — MediaMTX handles RTSP ingestion and HLS transmuxing independently, with 1-second HLS segments for low-latency shelf inspection
- The frontend never talks to MediaMTX directly for stream resolution — it goes through `/api/streams/:storeId`, and falls back to a verified demo loop with exponential-backoff retries if the live feed is unreachable
- Object detection runs entirely client-side (no video frames sent to a server), keeping inference latency low and avoiding a server-side ML dependency
- AI search degrades gracefully: the same response shape is returned whether Groq answers or the rule-based fallback kicks in, so the frontend doesn't need to branch on which one ran
- Customer and store-owner auth are fully separate (`User`/`auth.js` vs `AdminUser`/`adminAuth.js`), each with their own JWT scope
- Commission split is calculated and stored at order-creation time, not derived later

---

## 👥 Team KAMPASTRA

*ZEN-T324 · CodeAmble 2026 · Watumull Institute*

- Pratik Kalambe — [@Pratikk404](https://github.com/Pratikk404)
- Khushi Kadkal — [@khushicodeslabs](https://github.com/khushicodeslabs)
- Aarya Kadam — [@aaryak11](https://github.com/aaryak11)
- Mayuresh Jagadale — [@MAYURESH90](https://github.com/MAYURESH90)
