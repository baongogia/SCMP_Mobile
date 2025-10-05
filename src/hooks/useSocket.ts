import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Pusher, { Channel, PresenceChannel, Options } from "pusher-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPusherAuth } from "../services/auth/authService";

// Types cho tin nhắn
export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  type: "text" | "image" | "file";
  roomId: string;
}

export interface TypingEvent {
  userId: string;
  userName: string;
  isTyping: boolean;
  roomId: string;
}

export interface UserPresence {
  userId: string;
  userName: string;
  status: "online" | "offline";
}

export interface SocketEvent {
  type: "message" | "typing" | "presence" | "notification";
  data: ChatMessage | TypingEvent | UserPresence | any;
  timestamp: string;
}

// Connection status
export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

// Event handlers
export interface SocketEventHandlers {
  onMessage?: (message: ChatMessage) => void;
  onTyping?: (typingEvent: TypingEvent) => void;
  onPresence?: (presence: UserPresence) => void;
  onNotification?: (notification: any) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
}

// Hook options
export interface UseSocketOptions {
  userId: string;
  roomId?: string;
  autoConnect?: boolean;
  debug?: boolean;
  handlers?: SocketEventHandlers;
}

// Constants
const PUSHER_KEY = "26002bf5864a964c0f0e";
const PUSHER_CLUSTER = "ap1";
const API_BASE =
  "https://n4romoz0b1.execute-api.ap-southeast-1.amazonaws.com/dev/api";

export const useSocket = (options: UseSocketOptions) => {
  const {
    userId,
    roomId,
    autoConnect = true,
    debug = false,
    handlers = {},
  } = options;

  // State
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [socketId, setSocketId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | PresenceChannel | null>(null);
  const roomChannelRef = useRef<Channel | PresenceChannel | null>(null);
  const handlersRef = useRef<SocketEventHandlers>(handlers);

  // Update handlers ref when handlers change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // Pusher options
  const pusherOptions: Options = useMemo(
    () => ({
      cluster: PUSHER_CLUSTER,
      authorizer: (channel: any) => ({
        authorize: async (socketId: string, callback: any) => {
          try {
            const resp = await getPusherAuth(socketId, channel.name);
            const data = await resp.data;
            const auth = data?.data?.auth ?? data?.auth;
            if (!auth) throw new Error("Auth failed");
            callback(null, { auth });
          } catch (err) {
            callback(err as Error, null);
          }
        },
      }),
    }),
    []
  );

  // Connection handlers
  const handleConnected = useCallback(() => {
    setConnectionStatus("connected");
    setIsConnected(true);
    setSocketId(pusherRef.current?.connection.socket_id || null);
    handlersRef.current.onConnectionChange?.("connected");

    if (debug) {
      console.log("Socket connected:", pusherRef.current?.connection.socket_id);
    }
  }, [debug]);

  const handleDisconnected = useCallback(() => {
    setConnectionStatus("disconnected");
    setIsConnected(false);
    setSocketId(null);
    handlersRef.current.onConnectionChange?.("disconnected");

    if (debug) {
      console.log("Socket disconnected");
    }
  }, [debug]);

  const handleConnecting = useCallback(() => {
    setConnectionStatus("connecting");
    setIsConnected(false);
    handlersRef.current.onConnectionChange?.("connecting");

    if (debug) {
      console.log("Socket connecting...");
    }
  }, [debug]);

  const handleError = useCallback(
    (error: any) => {
      setConnectionStatus("error");
      setIsConnected(false);
      handlersRef.current.onConnectionChange?.("error");

      if (debug) {
        console.error("Socket error:", error);
      }
    },
    [debug]
  );

  // Message handlers
  const handleMessage = useCallback(
    (data: any) => {
      const message: ChatMessage = {
        id: data.id || Date.now().toString(),
        content: data.content,
        senderId: data.senderId,
        senderName: data.senderName,
        timestamp: data.timestamp || new Date().toISOString(),
        type: data.type || "text",
        roomId: data.roomId,
      };

      handlersRef.current.onMessage?.(message);

      if (debug) {
        console.log("New message received:", message);
      }
    },
    [debug]
  );

  const handleTyping = useCallback(
    (data: any) => {
      const typingEvent: TypingEvent = {
        userId: data.userId,
        userName: data.userName,
        isTyping: data.isTyping,
        roomId: data.roomId,
      };

      handlersRef.current.onTyping?.(typingEvent);

      if (debug) {
        console.log("Typing event:", typingEvent);
      }
    },
    [debug]
  );

  const handlePresence = useCallback(
    (data: any) => {
      const presence: UserPresence = {
        userId: data.userId,
        userName: data.userName,
        status: data.status,
      };

      handlersRef.current.onPresence?.(presence);

      if (debug) {
        console.log("Presence update:", presence);
      }
    },
    [debug]
  );

  const handleNotification = useCallback(
    (data: any) => {
      handlersRef.current.onNotification?.(data);

      if (debug) {
        console.log("Notification received:", data);
      }
    },
    [debug]
  );

  // Connect function
  const connect = useCallback(async () => {
    if (!PUSHER_KEY) {
      console.error("Missing PUSHER_KEY");
      return;
    }

    if (pusherRef.current) {
      console.warn("Socket already connected");
      return;
    }

    try {
      setConnectionStatus("connecting");

      if (debug) {
        (Pusher as any).logToConsole = true;
      }

      const pusher = new Pusher(PUSHER_KEY, pusherOptions);
      pusherRef.current = pusher;

      // Bind connection events
      const connection = pusher.connection;
      connection.bind("connected", handleConnected);
      connection.bind("disconnected", handleDisconnected);
      connection.bind("connecting", handleConnecting);
      connection.bind("error", handleError);

      // Subscribe to user channel
      const userChannelName = `private-user-${userId}`;
      const channel = pusher.subscribe(userChannelName);
      channelRef.current = channel;

      // Bind message events
      channel.bind("message", handleMessage);
      channel.bind("typing", handleTyping);
      channel.bind("presence", handlePresence);
      channel.bind("notification", handleNotification);

      // Subscribe to room channel if roomId provided
      if (roomId) {
        const roomChannelName = `private-room-${roomId}`;
        const roomChannel = pusher.subscribe(roomChannelName);
        roomChannelRef.current = roomChannel;

        roomChannel.bind("message", handleMessage);
        roomChannel.bind("typing", handleTyping);
        roomChannel.bind("presence", handlePresence);
      }
    } catch (error) {
      console.error("Failed to connect socket:", error);
      setConnectionStatus("error");
    }
  }, [
    userId,
    roomId,
    pusherOptions,
    handleConnected,
    handleDisconnected,
    handleConnecting,
    handleError,
    handleMessage,
    handleTyping,
    handlePresence,
    handleNotification,
    debug,
  ]);

  // Disconnect function
  const disconnect = useCallback(() => {
    const pusher = pusherRef.current;
    if (!pusher) return;

    // Unbind channel events (user channel)
    if (channelRef.current) {
      channelRef.current.unbind("message", handleMessage);
      channelRef.current.unbind("typing", handleTyping);
      channelRef.current.unbind("presence", handlePresence);
      channelRef.current.unbind("notification", handleNotification);

      try {
        pusher.unsubscribe(channelRef.current.name);
      } catch {}
      channelRef.current = null;
    }

    // Unbind room channel events
    if (roomChannelRef.current) {
      roomChannelRef.current.unbind("message", handleMessage);
      roomChannelRef.current.unbind("typing", handleTyping);
      roomChannelRef.current.unbind("presence", handlePresence);

      try {
        pusher.unsubscribe(roomChannelRef.current.name);
      } catch {}
      roomChannelRef.current = null;
    }

    // Unbind connection events
    const connection = pusher.connection;
    connection.unbind("connected", handleConnected);
    connection.unbind("disconnected", handleDisconnected);
    connection.unbind("connecting", handleConnecting);
    connection.unbind("error", handleError);

    pusher.disconnect();
    pusherRef.current = null;

    setConnectionStatus("disconnected");
    setIsConnected(false);
    setSocketId(null);
  }, [
    handleMessage,
    handleTyping,
    handlePresence,
    handleNotification,
    handleConnected,
    handleDisconnected,
    handleConnecting,
    handleError,
  ]);

  // Send message function
  const sendMessage = useCallback(
    async (message: Omit<ChatMessage, "id" | "timestamp">) => {
      if (!isConnected || !pusherRef.current) {
        console.error("Socket not connected");
        return false;
      }

      try {
        const messageData = {
          ...message,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        };

        // Trigger event on server
        await fetch(`${API_BASE}/chat/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
          },
          body: JSON.stringify(messageData),
        });

        return true;
      } catch (error) {
        console.error("Failed to send message:", error);
        return false;
      }
    },
    [isConnected]
  );

  // Send typing event
  const sendTyping = useCallback(
    async (isTyping: boolean, roomId: string) => {
      if (!isConnected) {
        return false;
      }

      try {
        await fetch(`${API_BASE}/chat/typing`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            userId,
            isTyping,
            roomId,
          }),
        });

        return true;
      } catch (error) {
        console.error("Failed to send typing event:", error);
        return false;
      }
    },
    [isConnected, userId]
  );

  // Auto connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    // State
    connectionStatus,
    socketId,
    isConnected,

    // Actions
    connect,
    disconnect,
    sendMessage,
    sendTyping,

    // Pusher instance (for advanced usage)
    pusher: pusherRef.current,
    channel: channelRef.current,
  };
};
