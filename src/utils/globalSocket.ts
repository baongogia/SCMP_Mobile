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

    // Debug logging to help identify the correct field
    console.log(
      `[GlobalSocket:${
        (this as any).instanceId || "unknown"
      }] Avatar extraction debug:`,
      {
        found: found || "NOT_FOUND",
        dataKeys: data ? Object.keys(data) : [],
        from_avt_type: Array.isArray(data?.from_avt)
          ? "array"
          : typeof data?.from_avt,
        from_avt_length: Array.isArray(data?.from_avt)
          ? data.from_avt.length
          : "N/A",
        from_avt_first: data?.from_avt?.[0],
        from_avt_path: data?.from_avt?.[0]?.path,
        candidates_checked: candidates.map((c, i) => ({
          index: i,
          value: c,
          type: typeof c,
          valid: typeof c === "string" && c.trim().length > 0,
        })),
      }
    );

    return found as string | undefined;
  }

  private constructor() {
    // Add instance ID for debugging
    (this as any).instanceId = Math.random().toString(36).substr(2, 9);
  }

  static getInstance(): GlobalSocket {
    if (!GlobalSocket.instance) {
      console.log("[GlobalSocket] Creating new singleton instance");
      GlobalSocket.instance = new GlobalSocket();
      console.log(
        "[GlobalSocket] Instance ID:",
        (GlobalSocket.instance as any).instanceId
      );
    } else {
      console.log(
        "[GlobalSocket] Returning existing singleton instance, current user:",
        GlobalSocket.instance.currentUserId,
        "Instance ID:",
        (GlobalSocket.instance as any).instanceId
      );
    }
    return GlobalSocket.instance;
  }

  async connect(userId: string, userName?: string): Promise<void> {
    console.log("[GlobalSocket] Connect requested for user:", {
      userId,
      userName,
      currentUserId: this.currentUserId,
      isConnected: this.isConnected,
    });

    if (this.currentUserId === userId && this.isConnected) {
      console.log("[GlobalSocket] Already connected for user:", userId);
      return;
    }

    // Disconnect existing connection if different user
    if (this.currentUserId !== userId && this.pusher) {
      console.log(
        "[GlobalSocket] Disconnecting existing connection for different user:",
        { currentUserId: this.currentUserId, newUserId: userId }
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

    console.log("[GlobalSocket] Connecting with user info:", {
      userId: this.currentUserId,
      userName: this.currentUserName,
    });
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
        console.log("[GlobalSocket] Connected successfully");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        eventBus.emit("socket:connected", { userId });
      });

      this.pusher.connection.bind("disconnected", () => {
        console.log("[GlobalSocket] Disconnected");
        this.isConnected = false;
        eventBus.emit("socket:disconnected", { userId });

        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      });

      this.pusher.connection.bind("error", (err: any) => {
        console.error("[GlobalSocket] Connection error:", err);
        eventBus.emit("socket:error", { userId, error: err });
      });

      // Subscribe to channel
      const channel = this.pusher.subscribe(channelName);

      // Bind global message handler
      const handleEvent = (eventName: string, data: any) => {
        console.log("[GlobalSocket] Received event:", eventName, {
          eventName,
          hasData: !!data,
          dataKeys: data ? Object.keys(data) : [],
          dataStructure: data,
        });

        if (eventName === "notification") {
          console.log("[GlobalSocket] Processing notification event");
          this.handleNotification(data);
          // Also handle as message for chat UI updates
          this.handleMessage(data);
        } else if (eventName === "message" || eventName === "new-message") {
          console.log("[GlobalSocket] Processing message event");
          this.handleMessage(data);
        } else if (eventName === "typing") {
          console.log("[GlobalSocket] Processing typing event");
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
    console.log("[GlobalSocket] Handling notification event:", incoming);

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

    console.log(
      "[GlobalSocket] Processing notification with ID:",
      notificationId
    );

    // Skip if already processed
    if (this.processedMessageIds.has(notificationId)) {
      console.log(
        "[GlobalSocket] Skipping duplicate notification:",
        notificationId
      );
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

    console.log("[GlobalSocket] Notification check:", {
      currentUserId: this.currentUserId,
      currentUserName: this.currentUserName,
      dataFromId: clonedData.from_id,
      dataFrom: clonedData.from,
      dataSenderId: clonedData.senderId,
      isMyNotification,
      messageContent: messageContent.substring(0, 10) + "...",
      fromIdMatches:
        clonedData.from_id &&
        String(clonedData.from_id).trim() === String(this.currentUserId).trim(),
      fromIdRaw: {
        from_id: clonedData.from_id,
        currentUserId: this.currentUserId,
      },
    });

    // Only show toast for notifications from others
    if (!isMyNotification && messageContent) {
      console.log(
        "[GlobalSocket] Showing toast for notification from:",
        clonedData.from || clonedData.username || "Unknown"
      );

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

      console.log("[GlobalSocket] Notification toast debug:", {
        senderName,
        avatarUrl,
        hasAvatar: !!avatarUrl,
        dataStructure: {
          from_avt: clonedData.from_avt,
          created_by: clonedData.created_by
            ? {
                username: clonedData.created_by.username,
                featured_image: clonedData.created_by.featured_image,
                avatar: clonedData.created_by.avatar,
              }
            : null,
          avatar: clonedData.avatar,
          user: clonedData.user,
        },
      });

      // Show toast: title = sender name, body = message (no colon)
      eventBus.emit("toast", {
        title: senderName,
        body: `${messageContent.substring(0, 80)}${
          messageContent.length > 80 ? "..." : ""
        }`,
        avatarUrl,
      });
    } else if (isMyNotification) {
      console.log(
        "[GlobalSocket] Skipping toast - notification from current user"
      );
    } else {
      console.log(
        "[GlobalSocket] No toast - no message content or other reason"
      );
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

    console.log(
      "[GlobalSocket] Processing message with ID:",
      messageId,
      "Current processed set size:",
      this.processedMessageIds.size
    );

    // Skip if already processed
    if (this.processedMessageIds.has(messageId)) {
      console.log("[GlobalSocket] Skipping duplicate message:", messageId);
      return;
    }

    // Add to processed set
    this.processedMessageIds.add(messageId);
    console.log(
      "[GlobalSocket] Added message to processed set:",
      messageId,
      "New set size:",
      this.processedMessageIds.size
    );

    // Clear processed messages after 5 minutes to prevent memory leak
    if (this.clearProcessedMessagesTimeout) {
      clearTimeout(this.clearProcessedMessagesTimeout);
    }
    this.clearProcessedMessagesTimeout = setTimeout(() => {
      console.log(
        "[GlobalSocket] Auto-clearing processed messages after timeout"
      );
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

    console.log("[GlobalSocket] Message check:", {
      currentUserId: this.currentUserId,
      currentUserName: this.currentUserName,
      dataFromId: data.from_id,
      dataFrom: data.from,
      dataSenderId: data.senderId,
      dataSenderName: data.senderName,
      dataUsername: data.username,
      createdById: data.created_by?._id,
      createdByName: data.created_by?.name,
      createdByUsername: data.created_by?.username,
      isMyMessage,
      messageContent: messageContent.substring(0, 10) + "...",
      senderName,
      // Debug comparisons with trim
      fromIdMatches:
        data.from_id &&
        String(data.from_id).trim() === String(this.currentUserId).trim(),
      fromIdRaw: { from_id: data.from_id, currentUserId: this.currentUserId },
      senderIdMatches:
        data.senderId &&
        String(data.senderId).trim() === String(this.currentUserId).trim(),
      senderIdRaw: {
        senderId: data.senderId,
        currentUserId: this.currentUserId,
      },
      createdByIdMatches:
        data.created_by?._id &&
        String(data.created_by._id).trim() ===
          String(this.currentUserId).trim(),
      createdByIdRaw: {
        created_by_id: data.created_by?._id,
        currentUserId: this.currentUserId,
      },
      fromMatchesUserName:
        data.from &&
        this.currentUserName &&
        String(data.from).trim() === String(this.currentUserName).trim(),
      usernameMatches:
        data.username &&
        this.currentUserName &&
        String(data.username).trim() === String(this.currentUserName).trim(),
    });

    // Only show toast for messages from others
    if (!isMyMessage && messageContent) {
      console.log("[GlobalSocket] Showing toast for message from:", senderName);

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

      console.log("[GlobalSocket] Message toast debug:", {
        senderName,
        avatarUrl,
        hasAvatar: !!avatarUrl,
        dataStructure: {
          from_avt: data.from_avt,
          created_by: data.created_by
            ? {
                username: data.created_by.username,
                featured_image: data.created_by.featured_image,
                avatar: data.created_by.avatar,
              }
            : null,
          avatar: data.avatar,
          user: data.user,
        },
      });

      // Show toast: title = sender name, body = message (no colon)
      eventBus.emit("toast", {
        title: senderName,
        body: `${messageContent.substring(0, 80)}${
          messageContent.length > 80 ? "..." : ""
        }`,
        avatarUrl,
      });
    } else if (isMyMessage) {
      console.log("[GlobalSocket] Skipping toast - message from current user");
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

    console.log(
      `[GlobalSocket] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimeout = setTimeout(() => {
      if (this.currentUserId) {
        this.connect(this.currentUserId).catch(console.error);
      }
    }, delay) as unknown as NodeJS.Timeout;
  }

  async disconnect(): Promise<void> {
    console.log("[GlobalSocket] Disconnect requested for user:", {
      currentUserId: this.currentUserId,
      currentUserName: this.currentUserName,
    });

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
    return this.isConnected && this.pusher?.connection.state === "connected";
  }

  clearProcessedMessages(): void {
    console.log(
      "[GlobalSocket] Clearing processed messages, previous size:",
      this.processedMessageIds.size
    );
    this.processedMessageIds.clear();
  }

  async sendMessage(message: string, roomId: string): Promise<void> {
    try {
      const response = await fetch(
        "https://n4romoz0b1.execute-api.ap-southeast-1.amazonaws.com/dev/api/pusher/event",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: `private-${roomId}`,
            event: "message",
            data: {
              content: message,
              senderId: this.currentUserId,
              roomId: roomId,
              timestamp: new Date().toISOString(),
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("[GlobalSocket] Send message error:", error);
      throw error;
    }
  }

  async sendTyping(roomId: string, isTyping: boolean): Promise<void> {
    try {
      const response = await fetch(
        "https://n4romoz0b1.execute-api.ap-southeast-1.amazonaws.com/dev/api/pusher/event",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: `private-${roomId}`,
            event: "typing",
            data: {
              userId: this.currentUserId,
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
