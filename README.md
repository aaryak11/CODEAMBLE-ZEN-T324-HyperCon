# HyperCon Live Stock CCTV Streaming Guide (MediaMTX & HLS)

This folder contains the MediaMTX RTSP-to-HLS media server and helper scripts for pushing simulated CCTV live camera feeds from store produce shelves to the HyperCon platform.

---

## 1. Architecture Overview

```
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

---

## 2. Quick Start Guide

### Step 1: Start MediaMTX Server
Run `mediamtx.exe` from the `streaming/` directory:

**Windows (PowerShell / Command Prompt):**
```bash
cd c:\hypercon\streaming
.\mediamtx.exe
```

MediaMTX will bind to:
- **RTSP Port**: `8554` (`rtsp://localhost:8554`)
- **HLS Port**: `8888` (`http://localhost:8888`)

---

### Step 2: Push RTSP Loop Stream via FFmpeg
Ensure `ffmpeg` is installed and available in system `PATH`. Run the loop pusher script:

**Windows (CMD/PowerShell):**
```cmd
cd c:\hypercon\streaming
.\push-loop.bat demo.mp4 store1
```

**Linux / macOS / Git Bash:**
```bash
cd c:\hypercon\streaming
./push-loop.sh demo.mp4 store1
```

To stream multiple store feeds (e.g. `store2`), open a second terminal and push to `store2`:
```cmd
.\push-loop.bat demo.mp4 store2
```

---

## 3. Verifying HLS Playback

1. Test HLS manifest URL directly in browser or VLC:
   - `http://localhost:8888/store1/index.m3u8`
   - `http://localhost:8888/store2/index.m3u8`
2. In HyperCon Web App:
   - Click **"Watch Camera Feed"** on any partner store card.
   - The stream will auto-connect to the HLS endpoint.
   - If the stream is offline or disconnected, HyperCon automatically attempts reconnects with exponential backoff before gracefully displaying the verified demo loop.

---

## 4. MediaMTX Configuration (`mediamtx.yml`)

- **RTSP Address**: `:8554`
- **HLS Address**: `:8888`
- **HLS Always Remux**: Enabled
- **HLS Segment Duration**: `1s` for ultra-low latency live shelf inspection.
