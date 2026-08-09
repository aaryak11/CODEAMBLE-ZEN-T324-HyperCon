import { WebSocketServer, WebSocket } from "ws";

let wss = null;
const clients = new Set();

// Map<streamId, { publisherWs: ws, viewers: Map<viewerId, ws> }>
const streams = new Map();

export function initRealtime(server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.id = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Send connection handshake acknowledgment
    ws.send(JSON.stringify({ type: "connection_established", timestamp: new Date().toISOString() }));

    ws.on("message", (rawMessage) => {
      try {
        const msg = JSON.parse(rawMessage.toString());
        handleSignalingMessage(ws, msg);
      } catch (err) {
        console.warn("[realtime] Error parsing WebSocket message:", err.message);
      }
    });

    ws.on("close", () => {
      handleDisconnect(ws);
      clients.delete(ws);
    });

    ws.on("error", () => {
      handleDisconnect(ws);
      clients.delete(ws);
    });
  });

  return wss;
}

function handleSignalingMessage(ws, msg) {
  const { type, streamId, viewerId, sdp, candidate, target } = msg;

  switch (type) {
    case "PUBLISHER_REGISTER": {
      if (!streamId) return;

      let stream = streams.get(streamId);
      if (!stream) {
        stream = { publisherWs: null, viewers: new Map() };
        streams.set(streamId, stream);
      }

      stream.publisherWs = ws;
      ws.streamId = streamId;
      ws.isPublisher = true;

      console.log(`[realtime] Publisher registered for stream: ${streamId}`);
      ws.send(JSON.stringify({ type: "PUBLISHER_REGISTERED", streamId, timestamp: new Date().toISOString() }));

      // Notify any waiting viewers that publisher is online
      for (const [vId, vWs] of stream.viewers.entries()) {
        if (vWs.readyState === WebSocket.OPEN) {
          vWs.send(JSON.stringify({ type: "STREAM_ONLINE", streamId }));
          // Notify publisher to connect to this viewer
          ws.send(JSON.stringify({ type: "VIEWER_JOINED", streamId, viewerId: vId }));
        }
      }

      broadcastEvent("STREAM_STATUS_CHANGED", { streamId, status: "online" });
      break;
    }

    case "VIEWER_REQUEST": {
      if (!streamId) return;

      const currentViewerId = ws.viewerId || `viewer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      ws.viewerId = currentViewerId;
      ws.streamId = streamId;
      ws.isViewer = true;

      let stream = streams.get(streamId);
      if (!stream) {
        stream = { publisherWs: null, viewers: new Map() };
        streams.set(streamId, stream);
      }

      stream.viewers.set(currentViewerId, ws);
      console.log(`[realtime] Viewer ${currentViewerId} requesting stream: ${streamId}`);

      if (stream.publisherWs && stream.publisherWs.readyState === WebSocket.OPEN) {
        stream.publisherWs.send(JSON.stringify({
          type: "VIEWER_JOINED",
          streamId,
          viewerId: currentViewerId,
        }));
      } else {
        ws.send(JSON.stringify({
          type: "STREAM_OFFLINE",
          streamId,
          message: "Store camera is currently offline.",
        }));
      }
      break;
    }

    case "OFFER": {
      if (!streamId || !viewerId || !sdp) return;
      const stream = streams.get(streamId);
      if (stream) {
        const viewerWs = stream.viewers.get(viewerId);
        if (viewerWs && viewerWs.readyState === WebSocket.OPEN) {
          viewerWs.send(JSON.stringify({
            type: "OFFER",
            streamId,
            viewerId,
            sdp,
          }));
        }
      }
      break;
    }

    case "ANSWER": {
      if (!streamId || !viewerId || !sdp) return;
      const stream = streams.get(streamId);
      if (stream && stream.publisherWs && stream.publisherWs.readyState === WebSocket.OPEN) {
        stream.publisherWs.send(JSON.stringify({
          type: "ANSWER",
          streamId,
          viewerId,
          sdp,
        }));
      }
      break;
    }

    case "ICE_CANDIDATE": {
      if (!streamId || !candidate) return;
      const stream = streams.get(streamId);
      if (!stream) return;

      if (target === "publisher") {
        if (stream.publisherWs && stream.publisherWs.readyState === WebSocket.OPEN) {
          stream.publisherWs.send(JSON.stringify({
            type: "ICE_CANDIDATE",
            streamId,
            viewerId,
            candidate,
          }));
        }
      } else if (target === "viewer" && viewerId) {
        const viewerWs = stream.viewers.get(viewerId);
        if (viewerWs && viewerWs.readyState === WebSocket.OPEN) {
          viewerWs.send(JSON.stringify({
            type: "ICE_CANDIDATE",
            streamId,
            viewerId,
            candidate,
          }));
        }
      }
      break;
    }

    case "STREAM_STOPPED": {
      if (!streamId) return;
      handleStreamStopped(streamId);
      break;
    }

    case "VIEWER_DISCONNECT": {
      if (streamId && ws.viewerId) {
        handleViewerLeft(streamId, ws.viewerId);
      }
      break;
    }

    default:
      break;
  }
}

function handleStreamStopped(streamId) {
  const stream = streams.get(streamId);
  if (stream) {
    for (const [, vWs] of stream.viewers.entries()) {
      if (vWs.readyState === WebSocket.OPEN) {
        vWs.send(JSON.stringify({
          type: "STREAM_STOPPED",
          streamId,
          message: "Live camera disconnected.",
        }));
      }
    }
    streams.delete(streamId);
    broadcastEvent("STREAM_STATUS_CHANGED", { streamId, status: "offline" });
  }
}

function handleViewerLeft(streamId, viewerId) {
  const stream = streams.get(streamId);
  if (stream) {
    stream.viewers.delete(viewerId);
    if (stream.publisherWs && stream.publisherWs.readyState === WebSocket.OPEN) {
      stream.publisherWs.send(JSON.stringify({
        type: "VIEWER_LEFT",
        streamId,
        viewerId,
      }));
    }
  }
}

function handleDisconnect(ws) {
  if (ws.isPublisher && ws.streamId) {
    console.log(`[realtime] Publisher disconnected for stream: ${ws.streamId}`);
    handleStreamStopped(ws.streamId);
  } else if (ws.isViewer && ws.streamId && ws.viewerId) {
    console.log(`[realtime] Viewer ${ws.viewerId} disconnected from stream: ${ws.streamId}`);
    handleViewerLeft(ws.streamId, ws.viewerId);
  }
}

export function broadcast(data) {
  const message = typeof data === "string" ? data : JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        // ignore send error
      }
    }
  }
}

export function broadcastEvent(eventType, payload) {
  broadcast({ type: eventType, payload, timestamp: new Date().toISOString() });
}

export function getActiveStreams() {
  const active = [];
  for (const [streamId, data] of streams.entries()) {
    if (data.publisherWs && data.publisherWs.readyState === WebSocket.OPEN) {
      active.push({
        streamId,
        viewersCount: data.viewers.size,
      });
    }
  }
  return active;
}
