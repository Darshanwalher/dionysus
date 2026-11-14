import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addMessage,
  updateMessageReactions,
  setTypingUser,
  setActiveUsers,
  fetchInitialMessages,
  fetchChatFiles,
  sendChatMessageFallback,
  toggleReactionThunk,
} from "../store/slices/chatSlice";

/**
 * Derives WebSocket base URL from environment or current host
 */
function getWebSocketUrl(projectId, token) {
  const cleanToken = token ? token.replace(/^Bearer\s+/i, '').replace(/['"]/g, '').trim() : '';

  if (import.meta.env.VITE_WS_URL) {
    const base = import.meta.env.VITE_WS_URL.replace(/\/$/, "");
    return `${base}/ws/chat?projectId=${projectId}&token=${encodeURIComponent(cleanToken)}`;
  }

  // Check if API_URL points to a different host (e.g. localhost:5000)
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  try {
    const parsed = new URL(apiUrl);
    const protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${parsed.host}/ws/chat?projectId=${projectId}&token=${encodeURIComponent(cleanToken)}`;
  } catch {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws/chat?projectId=${projectId}&token=${encodeURIComponent(cleanToken)}`;
  }
}

export function useProjectChat(projectId) {
  const dispatch = useDispatch();
  const rawToken = useSelector((state) => state.auth?.token) || localStorage.getItem("token");
  const token = rawToken ? rawToken.replace(/^Bearer\s+/i, '').replace(/['"]/g, '').trim() : '';

  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);
  const typingTimerRef = useRef(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!projectId || !token) return;

    // Gracefully clean up prior socket without closing during CONNECTING state
    if (wsRef.current) {
      const cur = wsRef.current;
      if (cur.readyState === WebSocket.OPEN) {
        cur.close(1000, "Reconnecting");
      } else if (cur.readyState === WebSocket.CONNECTING) {
        cur.onopen = () => cur.close(1000, "Reconnecting");
      }
      wsRef.current = null;
    }

    const wsUrl = getWebSocketUrl(projectId, token);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) {
        ws.close(1000, "Unmounted");
        return;
      }
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      if (!isMountedRef.current) return;
      try {
        const payload = JSON.parse(event.data);
        const { event: evtType, data } = payload;

        switch (evtType) {
          case "message:new": {
            const message = data?.message || data;
            if (message && message._id) {
              dispatch(addMessage(message));
            }
            break;
          }

          case "typing:update":
            if (data) {
              dispatch(setTypingUser(data));
            }
            break;

          case "presence:update":
            if (data?.activeUsers) {
              dispatch(setActiveUsers(data.activeUsers));
            }
            break;

          case "reaction:update":
            if (data?.messageId && data?.reactions) {
              dispatch(updateMessageReactions(data));
            }
            break;

          default:
            break;
        }
      } catch (err) {
        console.warn("[WebSocket] Error parsing incoming message:", err);
      }
    };

    ws.onclose = () => {
      if (!isMountedRef.current) return;
      setIsConnected(false);

      // Exponential backoff reconnect: 1s, 2s, 4s, 8s, max 12s
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 12000);
      reconnectAttemptsRef.current += 1;

      reconnectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          connect();
        }
      }, delay);
    };

    ws.onerror = (err) => {
      console.warn("[WebSocket] Connection error event");
    };
  }, [projectId, token, dispatch]);

  useEffect(() => {
    isMountedRef.current = true;

    if (projectId) {
      dispatch(fetchInitialMessages({ projectId }));
      dispatch(fetchChatFiles(projectId));
      connect();
    }

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      if (wsRef.current) {
        const cur = wsRef.current;
        if (cur.readyState === WebSocket.OPEN) {
          cur.close(1000, "Component unmounted");
        } else if (cur.readyState === WebSocket.CONNECTING) {
          cur.onopen = () => cur.close(1000, "Component unmounted");
        }
        wsRef.current = null;
      }
    };
  }, [projectId, token, dispatch]);

  // Send chat message
  const sendMessage = useCallback(
    async ({ content, taggedFiles = [], replyTo = null }) => {
      if (!content || !content.trim()) return;

      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            event: "message:send",
            action: "message:send",
            data: {
              content: content.trim(),
              taggedFiles,
              replyTo,
            },
          })
        );
      } else {
        // Fallback to REST API immediately
        await dispatch(
          sendChatMessageFallback({
            projectId,
            content: content.trim(),
            taggedFiles,
            replyTo,
          })
        );
      }
    },
    [projectId, dispatch]
  );

  // Notify typing
  const sendTyping = useCallback((isTyping) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          event: isTyping ? "typing:start" : "typing:stop",
          action: isTyping ? "typing:start" : "typing:stop",
          data: { isTyping },
        })
      );
    }
  }, []);

  // Debounced typing handler for text inputs
  const handleUserTyping = useCallback(() => {
    sendTyping(true);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2500);
  }, [sendTyping]);

  // Toggle emoji reaction
  const toggleReaction = useCallback(
    async (messageId, emoji) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            event: "reaction:toggle",
            action: "reaction:toggle",
            data: { messageId, emoji },
          })
        );
      } else {
        // Fallback to REST
        await dispatch(toggleReactionThunk({ projectId, messageId, emoji }));
      }
    },
    [projectId, dispatch]
  );

  return {
    isConnected,
    sendMessage,
    sendTyping,
    handleUserTyping,
    toggleReaction,
  };
}
