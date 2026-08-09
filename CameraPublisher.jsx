import { useState, useRef, useEffect } from "react";
import { getIceServers, getSignalingServerUrl } from "../utils/webrtc.js";
import { Video, VideoOff, Radio, Users, ShieldAlert, CheckCircle2, RefreshCw, Layers } from "lucide-react";

export default function CameraPublisher({ initialStreamId = "store1", storeName = "Store #1 Camera" }) {
  const [streamId, setStreamId] = useState(initialStreamId);
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState("offline"); // 'offline' | 'requesting' | 'registered' | 'error'
  const [errorMsg, setErrorMsg] = useState("");
  const [viewersCount, setViewersCount] = useState(0);

  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const wsRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());

  const loadCameraDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      setCameraDevices(videoInputs);

      // Auto-select integrated/laptop camera if available (filter out virtual phone cameras)
      if (!selectedDeviceId && videoInputs.length > 0) {
        const preferredLaptopCam = videoInputs.find((d) => {
          const label = (d.label || "").toLowerCase();
          return !label.includes("phone") && !label.includes("oppo") && !label.includes("reno") && !label.includes("android") && !label.includes("iphone");
        });
        if (preferredLaptopCam) {
          setSelectedDeviceId(preferredLaptopCam.deviceId);
        } else {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      }
    } catch (err) {
      console.warn("[CameraPublisher] Error enumerating devices:", err);
    }
  };

  useEffect(() => {
    loadCameraDevices();
    return () => {
      stopCamera();
    };
  }, []);

  // Synchronize local stream with video element when publishing state changes
  useEffect(() => {
    if (isPublishing && localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch((e) => console.warn("Local video play warning:", e));
    }
  }, [isPublishing]);

  const startCamera = async () => {
    setErrorMsg("");
    setStatus("requesting");

    try {
      // 1. Request camera permission & capture video using selected device or front facing mode
      const videoConstraints = selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId } }
        : { facingMode: "user" };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      localStreamRef.current = stream;
      setIsPublishing(true);

      // Refresh labels once permission granted
      loadCameraDevices();

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      // 2. Connect to signaling server
      const wsUrl = getSignalingServerUrl();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // 3. Register as publisher for this stream ID
        ws.send(JSON.stringify({
          type: "PUBLISHER_REGISTER",
          streamId: streamId.trim() || "store1",
        }));
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleSignalingMessage(msg);
        } catch (err) {
          console.warn("[CameraPublisher] Error handling signaling msg:", err);
        }
      };

      ws.onerror = () => {
        setErrorMsg("Failed to connect to signaling server");
        setStatus("error");
      };

      ws.onclose = () => {
        if (isPublishing) {
          setStatus("offline");
          setIsPublishing(false);
        }
      };

      setIsPublishing(true);
    } catch (err) {
      console.error("[CameraPublisher] getUserMedia error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Camera permission required. Please allow webcam access in browser.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMsg("No camera device found on this laptop.");
      } else {
        setErrorMsg(err.message || "Failed to start laptop camera.");
      }
      setStatus("error");
    }
  };

  const handleSignalingMessage = async (msg) => {
    const { type, viewerId, sdp, candidate } = msg;

    switch (type) {
      case "PUBLISHER_REGISTERED":
        setStatus("registered");
        break;

      case "VIEWER_JOINED":
        if (viewerId) {
          await createPeerConnectionForViewer(viewerId);
          setViewersCount((prev) => prev + 1);
        }
        break;

      case "ANSWER":
        if (viewerId && sdp) {
          const pc = peerConnectionsRef.current.get(viewerId);
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          }
        }
        break;

      case "ICE_CANDIDATE":
        if (viewerId && candidate) {
          const pc = peerConnectionsRef.current.get(viewerId);
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
        break;

      case "VIEWER_LEFT":
        if (viewerId) {
          closePeerConnection(viewerId);
          setViewersCount((prev) => Math.max(0, prev - 1));
        }
        break;

      default:
        break;
    }
  };

  const createPeerConnectionForViewer = async (viewerId) => {
    try {
      // Close existing if re-joining
      closePeerConnection(viewerId);

      const pc = new RTCPeerConnection({ iceServers: getIceServers() });
      peerConnectionsRef.current.set(viewerId, pc);

      // Add local tracks to WebRTC peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "ICE_CANDIDATE",
            streamId,
            target: "viewer",
            viewerId,
            candidate: event.candidate,
          }));
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          closePeerConnection(viewerId);
        }
      };

      // Create WebRTC Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "OFFER",
          streamId,
          viewerId,
          sdp: offer,
        }));
      }
    } catch (err) {
      console.error(`[CameraPublisher] Failed to create peer connection for ${viewerId}:`, err);
    }
  };

  const closePeerConnection = (viewerId) => {
    const pc = peerConnectionsRef.current.get(viewerId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(viewerId);
    }
  };

  const stopCamera = () => {
    // 1. Close all WebRTC peer connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    setViewersCount(0);

    // 2. Notify signaling server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "STREAM_STOPPED",
        streamId,
      }));
      wsRef.current.close();
    }
    wsRef.current = null;

    // 3. Stop all webcam tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    setIsPublishing(false);
    setStatus("offline");
  };

  return (
    <div className="bg-surface border-3 border-ink rounded-xl p-5 shadow-brutal space-y-4 text-ink">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-3 border-ink pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 border-ink shadow-brutal-sm ${
            isPublishing ? "bg-accent text-surface" : "bg-base text-ink"
          }`}>
            <Radio className={`w-5 h-5 ${isPublishing ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <h3 className="font-extrabold font-display text-base text-ink flex items-center gap-2">
              <span>Webcam CCTV Live Publisher</span>
              {isPublishing && (
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-red-500">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                  BROADCASTING LIVE
                </span>
              )}
            </h3>
            <p className="text-xs text-ink/70 font-medium">
              Publish your laptop webcam feed directly to customer HyperCon viewers via WebRTC
            </p>
          </div>
        </div>

        {/* Viewers & Status counter */}
        <div className="flex items-center gap-2">
          {isPublishing && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-base border-2 border-ink rounded-lg text-xs font-mono font-bold shadow-brutal-sm">
              <Users className="w-4 h-4 text-accent" />
              <span>{viewersCount} Live Viewer(s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border-2 border-red-600 rounded-lg flex items-center gap-2 text-xs font-bold text-red-700">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Stream Config & Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-bold font-display text-ink flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-accent" />
            <span>Store Stream ID</span>
          </label>
          <input
            type="text"
            value={streamId}
            onChange={(e) => setStreamId(e.target.value)}
            disabled={isPublishing}
            placeholder="e.g. store1"
            className="w-full px-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-mono font-bold disabled:bg-base disabled:text-ink/60 shadow-brutal-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold font-display text-ink flex items-center gap-1">
            <Video className="w-3.5 h-3.5 text-accent" />
            <span>Select Camera Device</span>
          </label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            disabled={isPublishing}
            className="w-full px-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-mono font-bold disabled:bg-base disabled:text-ink/60 shadow-brutal-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {cameraDevices.length === 0 && <option value="">Default Laptop Camera</option>}
            {cameraDevices.map((device, idx) => (
              <option key={device.deviceId || idx} value={device.deviceId}>
                {device.label || `Camera #${idx + 1}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          {!isPublishing ? (
            <button
              onClick={startCamera}
              disabled={status === "requesting"}
              className="w-full py-2.5 px-4 bg-accent hover:bg-accent/90 disabled:opacity-50 text-surface font-extrabold font-display text-xs rounded-lg border-2 border-ink shadow-brutal active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {status === "requesting" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Requesting Permission...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>Start Camera & Broadcast</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-surface font-extrabold font-display text-xs rounded-lg border-2 border-ink shadow-brutal active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <VideoOff className="w-4 h-4" />
              <span>Stop Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Laptop Webcam Preview Box */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-ink shadow-brutal-sm">
        
        {/* Stream ID Badge */}
        <div className="absolute top-3 left-3 z-10 bg-surface/90 backdrop-blur-sm border-2 border-ink px-2.5 py-1 rounded text-[11px] font-mono font-bold text-ink shadow-brutal-sm flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isPublishing ? "bg-red-600 animate-pulse" : "bg-zinc-400"}`}></span>
          <span>Stream ID: {streamId}</span>
        </div>

        {/* Video Element for Webcam Feed */}
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={(e) => e.target.play().catch(() => {})}
          className={`w-full h-full object-cover ${!isPublishing ? "hidden" : ""}`}
        />

        {!isPublishing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2 text-zinc-400">
            <Video className="w-10 h-10 text-zinc-600 stroke-[1.5]" />
            <p className="text-xs font-bold font-display text-zinc-300">Camera Publisher Offline</p>
            <p className="text-[11px] text-zinc-500 max-w-xs font-medium">
              Click &quot;Start Camera &amp; Broadcast&quot; above to capture your laptop webcam and stream live to HyperCon customers.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
