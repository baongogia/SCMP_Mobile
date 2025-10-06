"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Pusher, { Channel } from "pusher-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eventBus } from "@/src/utils/eventBus";

// Shape of messages you collect
export interface PusherMessage {
  [key: string]: any;
}

export type ConnectionStatus =
  | "Connecting"
  | "Connected"
  | "Disconnected"
  | "Reconnecting";

export interface UsePusherOptions {
  key: string; // e.g. '26002bf5864a964c0f0e'
  cluster: string; // e.g. 'ap1'
  channelName: string; // e.g. `private-${userId}`
  logToConsole?: boolean; // default false
  // Authorizer endpoint that signs private/presence channels
  authorizerUrl: string; // e.g. `${appSettings.URL_API}/pusher/auth`
  // How to read your JWT (or any auth) for the Authorizer
  getToken?: () => string | null; // default: () => localStorage.getItem('token') ?? null
  // Auto reconnect options
  enableReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}

export interface UsePusherReturn {
  connectionStatus: ConnectionStatus;
  socketId: string;
  messages: {
    data: PusherMessage;
    timestamp: string;
    eventType?: string;
  }[];
  clearMessages: () => void;
  bind: (eventName: string, cb: (data: PusherMessage) => void) => void;
  unbind: (eventName: string, cb?: (data: PusherMessage) => void) => void;
  bindGlobal: (cb: (eventName: string, data: PusherMessage) => void) => void;
  unbindGlobal: (cb?: (eventName: string, data: PusherMessage) => void) => void;
  reconnect: () => void;
  disconnect: () => void;
  isConnected: boolean;
  // Multi-channel helpers
  subscribeChannel: (name: string) => Channel | null;
  unsubscribeChannel: (name: string) => void;
  bindOnChannel: (
    name: string,
    eventName: string,
    cb: (data: PusherMessage) => void
  ) => void;
  unbindOnChannel: (
    name: string,
    eventName: string,
    cb?: (data: PusherMessage) => void
  ) => void;
}

// Enhanced useSocket hook for chat functionality
export interface UseSocketOptions {
  userId: string;
  roomId?: string;
  autoConnect?: boolean;
  debug?: boolean;
  handlers?: {
    onMessage?: (data: any) => void;
    onUserJoin?: (data: any) => void;
    onUserLeave?: (data: any) => void;
    onTyping?: (data: any) => void;
    onStopTyping?: (data: any) => void;
    onError?: (error: any) => void;
  };
}

export interface UseSocketReturn {
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  status: ConnectionStatus;
  isConnected: boolean;
  sendMessage: (message: string, roomId?: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
}

/**
 * usePusher — a typed hook for private channels with custom authorizer
 */
export function usePusher(options: UsePusherOptions): UsePusherReturn {
  const {
    key,
    cluster,
    channelName,
    authorizerUrl,
    logToConsole = false,
    enableReconnect = true,
    maxReconnectAttempts = 5,
    reconnectInterval = 3000,
    getToken = () =>
      typeof window !== "undefined" ? localStorage.getItem("token") : null,
  } = options;

  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const extraChannelsRef = useRef<Record<string, Channel>>({});
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nonRetryableErrorCodeRef = useRef<number | null>(null);

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("Connecting");
  const [socketId, setSocketId] = useState<string>("Connecting...");
  const [messages, setMessages] = useState<
    { data: PusherMessage; timestamp: string; eventType?: string }[]
  >([]);

  // Helpers
  const clearMessages = useCallback(() => setMessages([]), []);

  const bind = useCallback(
    (eventName: string, cb: (data: PusherMessage) => void) => {
      channelRef.current?.bind(eventName, cb);
    },
    []
  );

  const unbind = useCallback(
    (eventName: string, cb?: (data: PusherMessage) => void) => {
      channelRef.current?.unbind(eventName, cb as any);
    },
    []
  );

  const bindGlobal = useCallback(
    (cb: (eventName: string, data: PusherMessage) => void) => {
      channelRef.current?.bind_global(cb as any);
    },
    []
  );

  const unbindGlobal = useCallback(
    (cb?: (eventName: string, data: PusherMessage) => void) => {
      channelRef.current?.unbind_global(cb as any);
    },
    []
  );

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      if (channelRef.current) {
        pusherRef.current?.unsubscribe(channelName);
        channelRef.current = null;
      }
      // Unsubscribe all extra channels
      const names = Object.keys(extraChannelsRef.current || {});
      names.forEach((n) => {
        try {
          pusherRef.current?.unsubscribe(n);
        } catch {}
      });
      extraChannelsRef.current = {};
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    } catch (error) {
      console.error("Error during disconnect:", error);
    }

    setConnectionStatus("Disconnected");
    setSocketId("Not connected");
    reconnectAttemptsRef.current = 0;
  }, [channelName]);

  const attemptReconnect = useCallback(() => {
    if (
      !enableReconnect ||
      reconnectAttemptsRef.current >= maxReconnectAttempts
    ) {
      console.log("Max reconnect attempts reached or reconnect disabled");
      return;
    }

    reconnectAttemptsRef.current += 1;
    setConnectionStatus("Reconnecting");

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(
        `Reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`
      );
      // Force re-initialization by clearing refs and triggering useEffect
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      channelRef.current = null;
    }, reconnectInterval) as any;
  }, [enableReconnect, maxReconnectAttempts, reconnectInterval]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    // Trigger reconnection after a short delay
    setTimeout(() => {
      setConnectionStatus("Connecting");
    }, 100);
  }, [disconnect]);

  const isConnected = connectionStatus === "Connected";

  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined") return;

    // Đừng khởi tạo khi chưa có userId (kênh mặc định) để tránh connect rồi disconnect ngay sau đó
    if (channelName === "private-default") {
      setConnectionStatus("Disconnected");
      return;
    }

    // Configure console logs
    Pusher.logToConsole = !!logToConsole;
    if (logToConsole) {
      console.log("[Socket] Khởi tạo Pusher", {
        cum: cluster,
        kenh: channelName,
      });
    }

    // Custom authorizer for private/presence channels
    const pusher = new Pusher(key, {
      cluster,
      authorizer: (channel: Channel) => {
        return {
          authorize: async (socketId: string, callback: any) => {
            try {
              const token = getToken();
              if (logToConsole) {
                console.log("[Socket] Đang xác thực kênh", {
                  kenh: channel.name,
                  socketId,
                  coToken: !!token,
                });
              }
              const res = await fetch(authorizerUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body:
                  "socket_id=" +
                  encodeURIComponent(socketId) +
                  "&channel_name=" +
                  encodeURIComponent(channel.name),
              });
              if (!res.ok) {
                const text = await res.text();
                if (logToConsole)
                  console.error("[Socket] Xác thực kênh thất bại", text);
              }
              const data = await res.json().catch(() => ({} as any));
              const auth = data?.data?.auth ?? data?.auth;
              if (auth) {
                callback(null, { auth });
              } else {
                callback(new Error("Auth failed"), null);
              }
            } catch (err) {
              if (logToConsole)
                console.error("[Socket] Lỗi xác thực kênh", err);
              callback(err, null);
            }
          },
        };
      },
    });

    pusherRef.current = pusher;

    // Connection events
    pusher.connection.bind("connected", () => {
      setSocketId(pusher.connection.socket_id ?? "Unknown");
      setConnectionStatus("Connected");
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
      if (logToConsole) {
        console.log("[Socket] Đã kết nối thành công");
      }
    });

    pusher.connection.bind("disconnected", () => {
      setSocketId("Not connected");
      setConnectionStatus("Disconnected");
      if (logToConsole) console.log("[Socket] Đã ngắt kết nối");
      // Attempt reconnection if enabled
      if (
        enableReconnect &&
        reconnectAttemptsRef.current < maxReconnectAttempts &&
        nonRetryableErrorCodeRef.current == null
      ) {
        attemptReconnect();
      }
    });

    pusher.connection.bind("connecting", () => {
      setSocketId("Connecting...");
      setConnectionStatus("Connecting");
      if (logToConsole) console.log("[Socket] Đang kết nối...");
    });

    pusher.connection.bind("error", (err: any) => {
      if (logToConsole) console.error("[Socket] Lỗi kết nối", err);
      const code = err?.error?.data?.code ?? err?.data?.code;
      // 4004: over quota -> don't retry until key is changed or quota resets
      if (code === 4004) {
        nonRetryableErrorCodeRef.current = 4004;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      }
    });

    pusher.connection.bind("unavailable", () => {
      setSocketId("Unavailable");
      setConnectionStatus("Disconnected");
      if (logToConsole) console.log("[Socket] Máy chủ Pusher không khả dụng");
      // Attempt reconnection if enabled
      if (
        enableReconnect &&
        reconnectAttemptsRef.current < maxReconnectAttempts &&
        nonRetryableErrorCodeRef.current == null
      ) {
        attemptReconnect();
      }
    });

    pusher.connection.bind("failed", () => {
      setSocketId("Failed");
      setConnectionStatus("Disconnected");
      if (logToConsole) console.log("[Socket] Kết nối thất bại");
      // Attempt reconnection if enabled
      if (
        enableReconnect &&
        reconnectAttemptsRef.current < maxReconnectAttempts &&
        nonRetryableErrorCodeRef.current == null
      ) {
        attemptReconnect();
      }
    });

    // Subscribe channel
    if (logToConsole) console.log("[Socket] Đăng ký kênh", channelName);
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    // Collect all events (like your original bind_global)
    const collectAll = (eventName: string, data: PusherMessage) => {
      setMessages((prev) => [
        ...prev,
        { data, timestamp: new Date().toLocaleString(), eventType: eventName },
      ]);
    };
    channel.bind_global(collectAll as any);

    return () => {
      // Cleanup
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      try {
        if (channel) {
          channel.unbind_global(collectAll as any);
        }
        // Unsubscribe all extra channels on effect cleanup
        const names = Object.keys(extraChannelsRef.current || {});
        names.forEach((n) => {
          try {
            pusher.unsubscribe(n);
          } catch {}
        });
        extraChannelsRef.current = {};
        if (pusher) {
          pusher.unsubscribe(channelName);
          pusher.disconnect();
        }
      } catch (error) {
        console.error("Error during cleanup:", error);
      } finally {
        pusherRef.current = null;
        channelRef.current = null;
      }
    };
  }, [
    key,
    cluster,
    channelName,
    authorizerUrl,
    getToken,
    logToConsole,
    enableReconnect,
    maxReconnectAttempts,
    attemptReconnect,
  ]);

  // Multi-channel helpers
  const subscribeChannel = useCallback((name: string): Channel | null => {
    if (!pusherRef.current) return null;
    if (extraChannelsRef.current[name]) return extraChannelsRef.current[name];
    try {
      const ch = pusherRef.current.subscribe(name);
      extraChannelsRef.current[name] = ch;
      return ch;
    } catch (e) {
      console.error("Failed to subscribe channel:", name, e);
      return null;
    }
  }, []);

  const unsubscribeChannel = useCallback((name: string) => {
    try {
      if (extraChannelsRef.current[name]) {
        pusherRef.current?.unsubscribe(name);
        delete extraChannelsRef.current[name];
      }
    } catch (e) {
      console.error("Failed to unsubscribe channel:", name, e);
    }
  }, []);

  const bindOnChannel = useCallback(
    (name: string, eventName: string, cb: (data: PusherMessage) => void) => {
      const ch = extraChannelsRef.current[name] || null;
      ch?.bind(eventName, cb);
    },
    []
  );

  const unbindOnChannel = useCallback(
    (name: string, eventName: string, cb?: (data: PusherMessage) => void) => {
      const ch = extraChannelsRef.current[name] || null;
      ch?.unbind(eventName, cb as any);
    },
    []
  );

  return {
    connectionStatus,
    socketId,
    messages,
    clearMessages,
    bind,
    unbind,
    bindGlobal,
    unbindGlobal,
    reconnect,
    disconnect,
    isConnected,
    subscribeChannel,
    unsubscribeChannel,
    bindOnChannel,
    unbindOnChannel,
  };
}

/* ------------------------------------------------------------------ */
/* Optional: helper to trigger events (your cURL rewritten in TS/Fetch)
   NOTE: this hits your AWS API gateway to broadcast to a channel.
*/
export interface TriggerEventPayload {
  channel: string; // e.g. 'private-6711e8a47b45b2974bd6133c'
  event: string; // e.g. 'notification'
  data: PusherMessage; // any JSON-serializable payload
}

export async function triggerPusherEvent(
  endpoint = "https://n4romoz0b1.execute-api.ap-southeast-1.amazonaws.com/dev/api/pusher/event",
  payload: TriggerEventPayload
): Promise<Response> {
  return fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify(payload),
  });
}

/**
 * Enhanced useSocket hook for chat functionality
 * This hook provides a higher-level interface for chat-specific socket operations
 */
export function useSocket(options: UseSocketOptions): UseSocketReturn {
  const { userId, roomId, debug = false, handlers } = options;

  const [status, setStatus] = useState<ConnectionStatus>("Disconnected");
  const [currentRoomId, setCurrentRoomId] = useState<string | undefined>(
    roomId
  );
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRef = useRef<string | null>(null);
  const usernameRef = useRef<string | null>(null);
  // Keep latest external handlers and prevent duplicate processing
  const handlersRef = useRef<typeof handlers | undefined>(handlers);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const messageHandlerRef = useRef<((d: any) => void) | null>(null);
  const typingHandlerRef = useRef<((d: any) => void) | null>(null);
  // Note: backend only authorizes private-<userId>. We DO NOT subscribe to room channels.

  // Load token once and keep it in a ref so authorizer can read synchronously
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const t = await AsyncStorage.getItem("loginToken");
        if (isMounted) tokenRef.current = t;
        const u = await AsyncStorage.getItem("user");
        if (u) {
          try {
            const parsed = JSON.parse(u);
            usernameRef.current = parsed?.username || parsed?.name || null;
          } catch {}
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Keep latest handlers in a ref so the bind effect doesn't need to re-run
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // Stable getters/memos to avoid unnecessary re-inits
  const getAuthToken = useCallback(() => tokenRef.current, []);
  // Backend is signing private-<userId> (see successful 201 auth screenshot)
  // → subscribe user channel; filter by roomId in handlers
  const resolvedChannelName = userId ? `private-${userId}` : "private-default";

  // Initialize Pusher options (memoized)
  const pusherOptions: UsePusherOptions = useMemo(
    () => ({
      key: "26002bf5864a964c0f0e",
      cluster: "ap1",
      channelName: resolvedChannelName,
      authorizerUrl:
        "https://n4romoz0b1.execute-api.ap-southeast-1.amazonaws.com/dev/api/pusher/auth",
      logToConsole: debug,
      enableReconnect: true,
      maxReconnectAttempts: 5,
      reconnectInterval: 3000,
      getToken: getAuthToken,
    }),
    [resolvedChannelName, debug, getAuthToken]
  );

  // Always call usePusher to avoid conditional hook call
  const pusherInstance = usePusher(pusherOptions);

  // Update status from pusher instance
  useEffect(() => {
    if (pusherInstance && userId) {
      setStatus(pusherInstance.connectionStatus);
    } else {
      setStatus("Disconnected");
    }
  }, [pusherInstance, pusherInstance?.connectionStatus, userId]);

  // Connect function
  const connect = useCallback(() => {
    if (debug) {
      console.log("[Socket] Connect requested, current status:", status);
    }
    // Connection is handled automatically by usePusher when options are provided
    // Only reconnect if disconnected
    if (status === "Disconnected" && pusherInstance) {
      if (debug) console.log("[Socket] Attempting to reconnect...");
      pusherInstance.reconnect();
    }
  }, [debug, status, pusherInstance]);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (pusherInstance) {
      pusherInstance.disconnect();
    }
    setStatus("Disconnected");
  }, [pusherInstance]);

  // Reconnect function
  const reconnect = useCallback(() => {
    // Hạn chế tự reconnect trừ khi cần; Pusher tự quản lý tốt.
    if (pusherInstance && pusherInstance.connectionStatus !== "Connected") {
      if (debug) console.log("[Socket] Manual reconnect requested");
      pusherInstance.reconnect();
    } else if (debug) {
      console.log(
        "[Socket] Reconnect skipped - already connected or no instance"
      );
    }
  }, [pusherInstance, debug]);

  // Send message function
  const sendMessage = useCallback(
    async (message: string, targetRoomId?: string) => {
      const roomToUse = targetRoomId || currentRoomId;
      if (!roomToUse) {
        console.error("No room ID specified for sending message");
        return;
      }

      try {
        await triggerPusherEvent(undefined, {
          channel: `private-${roomToUse}`,
          event: "message",
          data: {
            content: message,
            senderId: userId,
            roomId: roomToUse,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error("Failed to send message:", error);
        handlers?.onError?.(error);
      }
    },
    [currentRoomId, userId, handlers]
  );

  // Join room function
  const joinRoom = useCallback(
    (newRoomId: string) => {
      setCurrentRoomId(newRoomId);
      if (debug) {
        console.log(`Joining room: ${newRoomId}`);
      }
    },
    [debug]
  );

  // Leave room function
  const leaveRoom = useCallback(
    (roomIdToLeave: string) => {
      if (currentRoomId === roomIdToLeave) {
        setCurrentRoomId(undefined);
      }
      if (debug) {
        console.log(`Leaving room: ${roomIdToLeave}`);
      }
    },
    [currentRoomId, debug]
  );

  // Start typing function
  const startTyping = useCallback(
    async (targetRoomId: string) => {
      try {
        await triggerPusherEvent(undefined, {
          channel: `private-${targetRoomId}`,
          event: "typing",
          data: {
            userId,
            roomId: targetRoomId,
            isTyping: true,
          },
        });
      } catch (error) {
        console.error("Failed to send typing indicator:", error);
      }
    },
    [userId]
  );

  // Stop typing function
  const stopTyping = useCallback(
    async (targetRoomId: string) => {
      try {
        await triggerPusherEvent(undefined, {
          channel: `private-${targetRoomId}`,
          event: "typing",
          data: {
            userId,
            roomId: targetRoomId,
            isTyping: false,
          },
        });
      } catch (error) {
        console.error("Failed to send stop typing indicator:", error);
      }
    },
    [userId]
  );

  // Bind event handlers on user channel (backend authorizes only private-<userId>)
  useEffect(() => {
    if (!pusherInstance) {
      if (debug)
        console.log("[Socket] No pusher instance or handlers:", {
          pusherInstance: !!pusherInstance,
          handlers: !!handlersRef.current,
        });
      return;
    }

    if (debug)
      console.log(
        "[Socket] Binding event handlers, connection status:",
        pusherInstance.connectionStatus
      );

    // Unbind previous to avoid duplicate events
    if (messageHandlerRef.current) {
      pusherInstance.unbind("message", messageHandlerRef.current);
      pusherInstance.unbind("new-message", messageHandlerRef.current);
      pusherInstance.unbind("notification", messageHandlerRef.current as any);
      messageHandlerRef.current = null;
    }
    if (typingHandlerRef.current) {
      pusherInstance.unbind("typing", typingHandlerRef.current as any);
      typingHandlerRef.current = null;
    }

    const currentHandlers = handlersRef.current;

    // Wrap handlers to in-Vietnamese debug before forwarding
    const onMessageWrap = currentHandlers?.onMessage
      ? (data: any) => {
          if (debug) console.log("[Socket] Nhận tin nhắn", data);

          // Always call the message handler first
          currentHandlers?.onMessage?.(data);

          // Normalize and broadcast globally (with de-dup)
          try {
            const raw = (data as any)?.data ?? data;
            const messageId =
              data?.notification ||
              raw?.notification ||
              raw?._id ||
              raw?.id ||
              `${raw?.content ?? ""}|${raw?.from ?? raw?.senderId ?? ""}|${
                raw?.timestamp ?? raw?.created_at ?? ""
              }`;
            if (!processedMessageIdsRef.current.has(messageId)) {
              processedMessageIdsRef.current.add(messageId);
              const normalized = {
                id: messageId,
                roomId: raw?.roomId || raw?.class_id || roomId,
                content: raw?.content ?? raw?.message,
                senderId:
                  raw?.senderId || raw?.created_by?._id || raw?.created_by?.id,
                senderName:
                  raw?.senderName || raw?.from || raw?.created_by?.username,
                timestamp:
                  raw?.timestamp || raw?.created_at || new Date().toISOString(),
                raw,
              };
              eventBus.emit("chat:message", normalized);
            }
          } catch {}

          // Handle notifications separately - but don't show toast for own messages
          const eventType = (data?.event as string) || (data?.type as string);
          if (eventType === "notification") {
            try {
              const raw = (data as any)?.data ?? data;

              // Check if this is from current user - don't show toast for own messages
              const isFromCurrentUser =
                (raw?.senderId && raw.senderId === userId) ||
                (raw?.from && raw.from === userId) ||
                (raw?.created_by?._id && raw.created_by._id === userId) ||
                (raw?.created_by?.id && raw.created_by.id === userId);

              if (debug) {
                const sender =
                  raw?.username || raw?.created_by?.username || raw?.from;
                const email = raw?.email;
                const roles = Array.isArray(raw?.role_front)
                  ? raw?.role_front.join(", ")
                  : raw?.role_front;
                const tenant = raw?.tenant_id;
                console.log("[Thông báo] Người gửi:", sender || "(không rõ)");
                console.log(
                  "[Thông báo] Is from current user:",
                  isFromCurrentUser
                );
                if (email) console.log("[Thông báo] Email:", email);
                if (roles) console.log("[Thông báo] Vai trò:", roles);
                if (tenant) console.log("[Thông báo] Tenant:", tenant);
              }

              // Only show toast if not from current user
              if (!isFromCurrentUser) {
                // Get sender name for toast
                const senderName =
                  raw?.username ||
                  raw?.created_by?.username ||
                  raw?.created_by?.name ||
                  raw?.from ||
                  raw?.senderName ||
                  "Người dùng";

                const messageContent =
                  data?.message ||
                  data?.content ||
                  raw?.message ||
                  raw?.content ||
                  "Bạn có thông báo mới";

                const detail = {
                  title: "Thông báo",
                  body: `${senderName}: ${messageContent}`,
                };
                // Bắn thông báo qua eventBus – UI có thể lắng nghe và hiển thị CustomToast
                eventBus.emit("toast", detail);
              }
            } catch {}
          }
        }
      : undefined;

    const onTypingWrap = (data: any) => {
      if (debug) console.log("[Socket] Trạng thái đang nhập", data);
      if (data?.isTyping) handlersRef.current?.onTyping?.(data);
      else handlersRef.current?.onStopTyping?.(data);
    };

    // Bind message handler (nhiều tên sự kiện phía server)
    if (onMessageWrap) {
      if (debug) console.log("[Socket] Binding message handlers...");
      pusherInstance.bind("message", onMessageWrap);
      pusherInstance.bind("new-message", onMessageWrap);
      // notification: luôn phát toast (kể cả payload thiếu message) và xử lý như message
      pusherInstance.bind("notification", (payload: any) => {
        if (debug) console.log("[Socket] Nhận notification", payload);

        const raw = payload?.data ?? payload;

        // Check if this is from current user - don't show toast for own messages
        const isFromCurrentUser =
          (raw?.senderId && raw.senderId === userId) ||
          (raw?.from &&
            (raw.from === userId || raw.from === usernameRef.current)) ||
          (raw?.created_by?._id && raw.created_by._id === userId) ||
          (raw?.created_by?.id && raw.created_by.id === userId) ||
          (raw?.created_by?.username &&
            raw.created_by.username === usernameRef.current);

        // Only emit toast if not from current user
        if (!isFromCurrentUser) {
          // Get sender name for toast
          const senderName =
            raw?.username ||
            raw?.created_by?.username ||
            raw?.created_by?.name ||
            raw?.from ||
            raw?.senderName ||
            payload?.username ||
            payload?.senderName ||
            "Người dùng";

          const messageContent =
            raw?.message ||
            raw?.content ||
            payload?.message ||
            payload?.content ||
            "Bạn có thông báo mới";

          const body = `${senderName}: ${messageContent}`;
          eventBus.emit("toast", { title: "Thông báo", body });
        }

        // ALWAYS handle as message if there's content - this is crucial for sync
        if (
          raw?.content ||
          raw?.message ||
          payload?.content ||
          payload?.message
        ) {
          if (debug) console.log("[Socket] Processing notification as message");
          onMessageWrap(payload);
        }
      });
      messageHandlerRef.current = onMessageWrap;
    }

    // Bind typing handler
    if (handlersRef.current?.onTyping || handlersRef.current?.onStopTyping) {
      pusherInstance.bind("typing", onTypingWrap);
      typingHandlerRef.current = onTypingWrap as any;
    }

    // Bind user join/leave handlers
    if (handlersRef.current?.onUserJoin) {
      pusherInstance.bind("user-join", handlersRef.current.onUserJoin);
    }

    if (handlersRef.current?.onUserLeave) {
      pusherInstance.bind("user-leave", handlersRef.current.onUserLeave);
    }

    return () => {
      // Cleanup bindings
      if (messageHandlerRef.current) {
        pusherInstance.unbind("message", messageHandlerRef.current);
        pusherInstance.unbind("notification", messageHandlerRef.current as any);
        pusherInstance.unbind("new-message", messageHandlerRef.current);
        messageHandlerRef.current = null;
      }
      if (typingHandlerRef.current) {
        pusherInstance.unbind("typing", typingHandlerRef.current as any);
        typingHandlerRef.current = null;
      }
      if (handlersRef.current?.onUserJoin) {
        pusherInstance.unbind("user-join", handlersRef.current.onUserJoin);
      }
      if (handlersRef.current?.onUserLeave) {
        pusherInstance.unbind("user-leave", handlersRef.current.onUserLeave);
      }
    };
  }, [pusherInstance, debug, userId]);

  // Cleanup on unmount
  useEffect(() => {
    const currentTypingTimeout = typingTimeoutRef.current;

    return () => {
      if (currentTypingTimeout) {
        clearTimeout(currentTypingTimeout);
      }
    };
  }, []);

  const isConnected = status === "Connected";

  return {
    connect,
    disconnect,
    reconnect,
    status,
    isConnected,
    sendMessage,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping,
  };
}
