/**
 * WebRTC and Signaling Helper Utilities
 */

export const getIceServers = () => {
  const stunUrl = import.meta.env.VITE_WEBRTC_STUN_SERVER || "stun:stun.l.google.com:19302";
  return [
    { urls: stunUrl },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ];
};

export const getSignalingServerUrl = () => {
  if (import.meta.env.VITE_SIGNALING_URL) {
    return import.meta.env.VITE_SIGNALING_URL;
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname || "localhost";
  return `${protocol}//${hostname}:4000/ws`;
};
