import Pusher, { Channel } from "pusher-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eventBus } from "./eventBus";

class GlobalSocket {
  private static instance: GlobalSocket;
  private pusher: Pusher | null = null;
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private processedMessageIds: Set<string> = new Set();
  private clearProcessedMessagesTimeout: NodeJS.Timeout | null = null;
  private messageQueue: {
    message: string;
    roomId: string;
    timestamp: number;
  }[] = [];
  private isProcessingQueue: boolean = false;

  // Try multiple possible fields because different senders may shape payloads differently
  private extractAvatarUrl(data: any): string | undefined {
    const candidates = [
      // Common avatar field variations - array format first
      data?.from_avt?.[0]?.path,
      data?.from_avt?.path,
      data?.avatar?.[0]?.path,
      data?.avatar?.path,
      data?.avatarUrl,
      data?.avatar_url,
      data?.from_avatar?.[0]?.path,
      data?.from_avatar?.path,
      data?.sender_avatar?.[0]?.path,
      data?.sender_avatar?.path,
      data?.created_by?.avatar?.[0]?.path,
      data?.created_by?.avatar?.path,
      data?.created_by?.featured_image?.[0]?.path,
      data?.created_by?.featured_image?.path,
      data?.user?.avatar?.[0]?.path,
      data?.user?.avatar?.path,
      data?.user?.featured_image?.[0]?.path,
      data?.user?.featured_image?.path,
      // Direct path fields
      data?.avatar,
      data?.avatarPath,
      data?.image,
      data?.photo,
    ];

    const found = candidates.find(
      (u) => typeof u === "string" && u.trim().length > 0
    );
    return found as string | undefined;
  }

  private constructor() {
    // Add instance ID for debugging
    (this as any).instanceId = Math.random().toString(36).substr(2, 9);
  }

  static getInstance(): GlobalSocket {
    if (!GlobalSocket.instance) {
      GlobalSocket.instance = new GlobalSocket();
    }
    return GlobalSocket.instance;
  }

  async connect(userId: string, userName?: string): Promise<void> {
    if (this.currentUserId === userId && this.isConnected) {
      console.log("[GlobalSocket] Already connected for user:", userId);
      return;
    }

    // Disconnect existing connection if different user
    if (this.currentUserId !== userId && this.pusher) {
      console.log(
        "[GlobalSocket] Disconnecting previous user:",
        this.currentUserId
      );
      await this.disconnect();
    }

    this.currentUserId = userId;
    this.currentUserName = userName || null;

    // If userName is not provided, try to get it from AsyncStorage
    if (!this.currentUserName) {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (userString) {
          const userObj = JSON.parse(userString);
          this.currentUserName = userObj?.username || userObj?.name || null;
        }
      } catch (error) {
        console.error(
          "[GlobalSocket] Error getting user info from storage:",
          error
        );
      }
    }

    const channelName = `private-${userId}`;

    try {
      // Get token
      const token = await AsyncStorage.getItem("loginToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Create Pusher instance
      this.pusher = new Pusher("26002bf5864a964c0f0e", {
        cluster: "ap1",
        authorizer: (channel: Channel) => {
          return {
            authorize: async (socketId: string, callback: any) => {
              try {
                const res = await fetch(
                  "https://n4romoz0b1.execute-api.ap-southeast-1.amazonaws.com/dev/api/pusher/auth",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/x-www-form-urlencoded",
                      Authorization: `Bearer ${token}`,
                    },
                    body:
                      "socket_id=" +
                      encodeURIComponent(socketId) +
                      "&channel_name=" +
                      encodeURIComponent(channel.name),
                  }
                );

                if (!res.ok) {
                  throw new Error("Auth failed");
                }

                const data = await res.json();
                const auth = data?.data?.auth ?? data?.auth;
                if (auth) {
                  callback(null, { auth });
                } else {
                  callback(new Error("Auth failed"), null);
                }
              } catch (err) {
                console.error("[GlobalSocket] Auth error:", err);
                callback(err, null);
              }
            },
          };
        },
      });

      // Connection events
      this.pusher.connection.bind("connected", () => {
        console.log(
          "[GlobalSocket] ✅ Connected successfully for user:",
          userId
        );
        this.isConnected = true;
        this.reconnectAttempts = 0;
        eventBus.emit("socket:connected", { userId });

        // Process queued messages after connection
        this.processMessageQueue();
      });

      this.pusher.connection.bind("disconnected", () => {
        console.log("[GlobalSocket] ❌ Disconnected for user:", userId);
        this.isConnected = false;
        eventBus.emit("socket:disconnected", { userId });

        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(
            "[GlobalSocket] 🔄 Scheduling reconnection attempt:",
            this.reconnectAttempts + 1
          );
          this.scheduleReconnect();
        } else {
          console.log("[GlobalSocket] ⚠️ Max reconnection attempts reached");
        }
      });

      this.pusher.connection.bind("error", (err: any) => {
        console.error(
          "[GlobalSocket] ❌ Connection error for user:",
          userId,
          err
        );
        eventBus.emit("socket:error", { userId, error: err });
      });

      // Add more connection state events
      this.pusher.connection.bind("connecting", () => {
        console.log("[GlobalSocket] 🔄 Connecting for user:", userId);
      });

      this.pusher.connection.bind("unavailable", () => {
        console.log(
          "[GlobalSocket] ⚠️ Connection unavailable for user:",
          userId
        );
      });

      // Subscribe to channel
      const channel = this.pusher.subscribe(channelName);

      // Bind global message handler
      const handleEvent = (eventName: string, data: any) => {
        if (eventName === "notification") {
          this.handleNotification(data);
          this.handleMessage(data);
        } else if (eventName === "message" || eventName === "new-message") {
          this.handleMessage(data);
        } else if (eventName === "typing") {
          this.handleTyping(data);
        }
      };

      channel.bind_global(handleEvent);
    } catch (error) {
      console.error("[GlobalSocket] Connection failed:", error);
      throw error;
    }
  }

  private handleNotification = (incoming: any): void => {
    const data = incoming?.data || incoming;
    // Deep clone data to prevent mutation issues
    const clonedData = JSON.parse(JSON.stringify(data));
    // Create unique notification ID for deduplication
    const notificationId =
      incoming?.notification ||
      data?.notification ||
      data?._id ||
      data?.id ||
      `notification_${data?.content || ""}_${
        data?.from_id || data?.from || ""
      }_${data?.timestamp || Date.now()}`;

    // Skip if already processed
    if (this.processedMessageIds.has(notificationId)) {
      return;
    }

    // Add to processed set
    this.processedMessageIds.add(notificationId);

    // Enhanced check if notification is from current user - use cloned data
    const isMyNotification = Boolean(
      // Most reliable: from_id comparison
      (clonedData.from_id &&
        String(clonedData.from_id).trim() ===
          String(this.currentUserId).trim()) ||
        // Fallback: senderId comparison
        (clonedData.senderId &&
          String(clonedData.senderId).trim() ===
            String(this.currentUserId).trim()) ||
        // Fallback: created_by._id comparison
        (clonedData.created_by?._id &&
          String(clonedData.created_by._id).trim() ===
            String(this.currentUserId).trim()) ||
        // Fallback: created_by.id comparison
        (clonedData.created_by?.id &&
          String(clonedData.created_by.id).trim() ===
            String(this.currentUserId).trim()) ||
        // Fallback: userId comparison
        (clonedData.userId &&
          String(clonedData.userId).trim() ===
            String(this.currentUserId).trim()) ||
        // Username-based comparisons (less reliable but still useful)
        (clonedData.from &&
          this.currentUserName &&
          String(clonedData.from).trim() ===
            String(this.currentUserName).trim()) ||
        (clonedData.username &&
          this.currentUserName &&
          String(clonedData.username).trim() ===
            String(this.currentUserName).trim()) ||
        (clonedData.created_by?.username &&
          this.currentUserName &&
          String(clonedData.created_by.username).trim() ===
            String(this.currentUserName).trim())
    );

    const messageContent = String(
      clonedData.content ?? clonedData.message ?? ""
    );

    // Only show toast for notifications from others
    if (!isMyNotification && messageContent) {
      // Get sender name for toast - use cloned data
      const senderName =
        clonedData.username ||
        clonedData.created_by?.username ||
        clonedData.created_by?.name ||
        clonedData.from ||
        clonedData.senderName ||
        "Người dùng";

      // Resolve avatar url if provided - use cloned data
      const avatarUrl = this.extractAvatarUrl(clonedData);
      // Show toast: title = sender name, body = message (no colon)
      eventBus.emit("toast", {
        title: senderName,
        body: `${messageContent.substring(0, 80)}${
          messageContent.length > 80 ? "..." : ""
        }`,
        avatarUrl,
        roomId: clonedData.roomId || clonedData.class_id,
        className: clonedData.class || clonedData.className,
        tenantId: clonedData.tenant_id,
      });
    } else if (isMyNotification) {
    } else {
    }

    // Don't emit global message here - let handleMessage do it to avoid duplication
  };

  private handleMessage = (incoming: any): void => {
    const data = incoming?.data || incoming;

    // Create unique message ID for deduplication
    const messageId =
      data.notification ||
      data._id ||
      data.id ||
      `${data.content || ""}|${
        data.from_id || data.from || data.senderId || data.created_by?._id || ""
      }|${data.timestamp || data.created_at || ""}|${
        data.roomId || data.class_id || ""
      }`;

    // Skip if already processed
    if (this.processedMessageIds.has(messageId)) {
      return;
    }

    // Add to processed set
    this.processedMessageIds.add(messageId);

    // Clear processed messages after 5 minutes to prevent memory leak
    if (this.clearProcessedMessagesTimeout) {
      clearTimeout(this.clearProcessedMessagesTimeout);
    }
    this.clearProcessedMessagesTimeout = setTimeout(() => {
      this.processedMessageIds.clear();
    }, 5 * 60 * 1000) as unknown as NodeJS.Timeout;

    // Get sender info
    const senderName =
      data.senderName ||
      data.from ||
      data.created_by?.username ||
      data.created_by?.name ||
      data.username ||
      "Người dùng";

    // Enhanced check if message is from current user
    // Primary check: compare from_id with current user ID (most reliable)
    const isMyMessage = Boolean(
      // Most reliable: from_id comparison
      (data.from_id &&
        String(data.from_id).trim() === String(this.currentUserId).trim()) ||
        // Fallback: senderId comparison
        (data.senderId &&
          String(data.senderId).trim() === String(this.currentUserId).trim()) ||
        // Fallback: created_by._id comparison
        (data.created_by?._id &&
          String(data.created_by._id).trim() ===
            String(this.currentUserId).trim()) ||
        // Fallback: created_by.id comparison
        (data.created_by?.id &&
          String(data.created_by.id).trim() ===
            String(this.currentUserId).trim()) ||
        // Fallback: userId comparison
        (data.userId &&
          String(data.userId).trim() === String(this.currentUserId).trim()) ||
        // Username-based comparisons (less reliable but still useful)
        (data.from &&
          this.currentUserName &&
          String(data.from).trim() === String(this.currentUserName).trim()) ||
        (data.username &&
          this.currentUserName &&
          String(data.username).trim() ===
            String(this.currentUserName).trim()) ||
        (data.created_by?.username &&
          this.currentUserName &&
          String(data.created_by.username).trim() ===
            String(this.currentUserName).trim())
    );

    const messageContent = String(data.content ?? data.message ?? "");

    // Only show toast for messages from others
    if (!isMyMessage && messageContent) {
      // Emit global message event
      eventBus.emit("global:message", {
        roomId: data.roomId || data.class_id,
        className: data.class,
        tenantId: data.tenant_id,
        senderName,
        messageContent,
        timestamp: data.timestamp || data.created_at,
        rawData: data,
        rawIncoming: incoming,
      });
      // Resolve avatar url if provided
      const avatarUrl = this.extractAvatarUrl(data);
      // Show toast: title = sender name, body = message (no colon)
      eventBus.emit("toast", {
        title: senderName,
        body: `${messageContent.substring(0, 80)}${
          messageContent.length > 80 ? "..." : ""
        }`,
        avatarUrl,
        roomId: data.roomId || data.class_id,
        className: data.class || data.className,
        tenantId: data.tenant_id,
      });
    } else if (isMyMessage) {
    }
  };

  private handleTyping = (data: any): void => {
    if (data.isTyping) {
      eventBus.emit("global:typing", data);
    } else {
      eventBus.emit("global:stopTyping", data);
    }
  };

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    this.reconnectTimeout = setTimeout(() => {
      if (this.currentUserId) {
        this.connect(this.currentUserId).catch(console.error);
      }
    }, delay) as unknown as NodeJS.Timeout;
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.clearProcessedMessagesTimeout) {
      clearTimeout(this.clearProcessedMessagesTimeout);
      this.clearProcessedMessagesTimeout = null;
    }

    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }

    this.isConnected = false;
    this.currentUserId = null;
    this.currentUserName = null;
    this.reconnectAttempts = 0;
    this.processedMessageIds.clear();

    console.log("[GlobalSocket] Disconnected");
  }

  getConnectionStatus(): string {
    if (!this.pusher) return "Disconnected";
    return this.pusher.connection.state;
  }

  isSocketConnected(): boolean {
    const isConnected =
      this.isConnected && this.pusher?.connection.state === "connected";
    console.log("[GlobalSocket] Connection status check:", {
      isConnected: this.isConnected,
      pusherState: this.pusher?.connection.state,
      finalResult: isConnected,
    });
    return isConnected;
  }

  // Force reconnect method
  async forceReconnect(): Promise<void> {
    console.log("[GlobalSocket] 🔄 Force reconnecting...");
    if (this.currentUserId) {
      await this.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      await this.connect(this.currentUserId, this.currentUserName || undefined);
    }
  }

  clearProcessedMessages(): void {
    this.processedMessageIds.clear();
  }

  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    console.log(
      `📤 [GlobalSocket] Processing ${this.messageQueue.length} queued messages`
    );

    try {
      // Process messages in order
      while (this.messageQueue.length > 0) {
        const queuedMessage = this.messageQueue.shift();
        if (queuedMessage) {
          try {
            // Add a small delay between messages to avoid overwhelming the server
            await new Promise((resolve) => setTimeout(resolve, 100));

            await this.sendMessageDirect(
              queuedMessage.message,
              queuedMessage.roomId
            );
            console.log("✅ [GlobalSocket] Queued message sent successfully:", {
              message: queuedMessage.message.substring(0, 50) + "...",
              roomId: queuedMessage.roomId,
            });
          } catch (error) {
            console.error(
              "❌ [GlobalSocket] Failed to send queued message:",
              error
            );
            // Re-add to queue if failed (with limit to prevent infinite loop)
            if (this.messageQueue.length < 10) {
              this.messageQueue.push(queuedMessage);
              console.log("🔄 [GlobalSocket] Re-queued failed message");
            } else {
              console.log(
                "⚠️ [GlobalSocket] Message queue full, dropping message"
              );
            }
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async waitForConnection(timeoutMs: number = 5000): Promise<boolean> {
    const startTime = Date.now();

    while (!this.isConnected && Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return this.isConnected;
  }

  private async sendMessageDirect(
    message: string,
    roomId: string
  ): Promise<void> {
    const response = await fetch(
      "https://n4romoz0b1.execute-api.ap-southeast-1.amazonaws.com/dev/api/pusher/event",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: `private-${this.currentUserId}`,
          event: "message",
          data: {
            content: message,
            senderId: this.currentUserId,
            senderName: this.currentUserName,
            roomId: roomId,
            timestamp: new Date().toISOString(),
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    return response.json();
  }

  async sendMessage(message: string, roomId: string): Promise<void> {
    console.log("📤 [GlobalSocket] Attempting to send message:", {
      message: message.substring(0, 50) + "...",
      roomId,
      isConnected: this.isConnected,
      hasPusher: !!this.pusher,
    });

    // Check if socket is connected before sending
    if (!this.isConnected || !this.pusher) {
      console.warn(
        "⚠️ [GlobalSocket] Socket not connected, adding to queue..."
      );

      // Add to queue instead of waiting
      this.messageQueue.push({
        message,
        roomId,
        timestamp: Date.now(),
      });

      console.log(
        "📝 [GlobalSocket] Message added to queue. Queue length:",
        this.messageQueue.length
      );

      // Wait for connection with timeout
      const connected = await this.waitForConnection(5000);

      if (!connected) {
        console.warn(
          "⚠️ [GlobalSocket] Connection timeout, message queued for later"
        );
        return; // Don't throw error, message is queued
      }
    }

    try {
      const result = await this.sendMessageDirect(message, roomId);
      console.log("✅ [GlobalSocket] Gửi tin nhắn thành công qua API:", {
        message: message.substring(0, 50) + "...",
        roomId,
        result,
      });
    } catch (error) {
      console.error("❌ [GlobalSocket] Lỗi gửi tin nhắn:", error);

      // If sending fails, add to queue for retry
      this.messageQueue.push({
        message,
        roomId,
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  async sendTyping(roomId: string, isTyping: boolean): Promise<void> {
    // Check if socket is connected before sending
    if (!this.isConnected || !this.pusher) {
      console.warn(
        "⚠️ [GlobalSocket] Socket not connected, skipping typing indicator"
      );
      return;
    }

    try {
      const response = await fetch(
        "https://n4romoz0b1.execute-api.ap-southeast-1.amazonaws.com/dev/api/pusher/event",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: `private-${this.currentUserId}`,
            event: "typing",
            data: {
              userId: this.currentUserId,
              userName: this.currentUserName,
              roomId: roomId,
              isTyping: isTyping,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send typing indicator");
      }
    } catch (error) {
      console.error("[GlobalSocket] Send typing error:", error);
    }
  }
}

export default GlobalSocket;
