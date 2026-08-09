# HyperCon 🚀
**Live Shelf Camera Verification Platform for Local Retail**

*Built by Team KAMPASTRA | ZEN-T324 | CodeAmble 2026 | Watumull Institute*

## 📖 The Vision
HyperCon is a next-generation hyper-local e-commerce platform that bridges the trust gap in online grocery shopping. Instead of relying on static warehouse inventory, HyperCon connects users directly to local partner stores and uses **Real-Time Live Feed Verification**. See the exact shelf, check the freshness, and verify stock *before* you order.

## 🛠 Tech Stack
HyperCon is built with a modern, high-performance web architecture:

- **Frontend:** React 18, Vite, Tailwind CSS (Neo-Brutalist Design System)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ODMs)
- **Live Streaming / Video:** HLS (HTTP Live Streaming) / WebRTC simulation for live store feeds
- **Maps / Geolocation:** Leaflet.js with custom UI markers
- **AI / Computer Vision:** Simulated TensorFlow.js + Groq integrations for real-time bounding boxes (Trust Score computation)

## ✨ Key Features
1. **Intelligent Hyperlocal Search:** Compare price, proximity, and delivery speed across multiple local partner stores and standard e-commerce platforms.
2. **"Smartest Option" Engine:** Algorithmic recommendation balancing Trust Score, ETA, and Price.
3. **Live Camera Feed Modal:** Real-time stream of the store shelf with AI verification overlays (timestamp, tracking boxes, feed latency, and motion score).
4. **Trust Score System:** Real-time computed score evaluating store freshness, delivery accuracy, price consistency, and camera uptime.
5. **Enhanced Interactive Map:** Real-time GPS plotting using Leaflet, showing Live-verified stores, Unreliable/Offline stores, and user location.
6. **Demo Safety Net:** Comprehensive error boundaries and local API interceptors (`MOCK_DATA`) to ensure zero downtime during critical demonstrations.

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on port `27017`

### 1. Backend Setup
\`\`\`bash
cd server
npm install
# Ensure .env is configured:
# MONGODB_URI=mongodb://127.0.0.1:27017/hypercon_db
# PORT=4000
npm run seed # Populate local mock data
npm run dev
\`\`\`

### 2. Frontend Setup
\`\`\`bash
cd client
npm install
npm run dev
\`\`\`

### 3. Media Streaming Server (Optional/Simulation)
\`\`\`bash
cd streaming
# Run the push loop batch script to simulate stream ingestion
./push-loop.bat
\`\`\`

The client will be available at `http://localhost:5173` and the backend at `http://localhost:4000`.

## 🤝 Team KAMPASTRA
Developed with ❤️ during the CodeAmble 2026 Hackathon at Watumull Institute.
