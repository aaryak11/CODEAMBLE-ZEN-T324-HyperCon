import { WebSocketServer, WebSocket } from "ws";

let wss = null;
const clients = new Set();

export function initRealtime(server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    clients.add(ws);

    // Send connection handshake acknowledgment
    ws.send(JSON.stringify({ type: "connection_established", timestamp: new Date().toISOString() }));

    ws.on("close", () => {
      clients.delete(ws);
    });

    ws.on("error", () => {
      clients.delete(ws);
    });
  });

  return wss;
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
