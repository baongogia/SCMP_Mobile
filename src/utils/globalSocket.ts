import Pusher, { Channel } from "pusher-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eventBus } from "./eventBus";
import { STORAGE_KEYS } from "../constants/config";
import { showErrorToast } from "./errorHandler";

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
    retryCount?: number;
  }[] = [];
  private isProcessingQueue: boolean = false;
  private maxQueueSize: number = 50; // Giới hạn kích thước queue
  private maxRetries: number = 3; // Số lần retry tối đa
  private sendMessageLock: boolean = false; // Mutex để tránh race condition

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
    console.log(
      "🔗 [GlobalSocket] Bắt đầu kết nối cho user:",
      userId,
      "lúc:",
      new Date().toLocaleTimeString("vi-VN")
    );

    if (this.currentUserId === userId && this.isConnected) {
      console.log("✅ [GlobalSocket] Đã kết nối cho user:", userId);
      return;
    }

    // Disconnect existing connection if different user
    if (this.currentUserId !== userId && this.pusher) {
      console.log(
        "🔄 [GlobalSocket] Ngắt kết nối user cũ:",
        this.currentUserId,
        "để kết nối user mới:",
        userId
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
        showErrorToast(error, {
          title: "Lỗi lấy thông tin người dùng",
          message: "Không thể lấy thông tin người dùng từ storage",
        });
      }
    }

    const channelName = `private-${userId}`;

    try {
      // Get token
      const token = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TOKEN);
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
                  if (res.status === 401 || res.status === 403) {
                    try {
                      await AsyncStorage.multiRemove([
                        STORAGE_KEYS.LOGIN_TOKEN,
                        STORAGE_KEYS.REFRESH_TOKEN,
                        STORAGE_KEYS.USER,
                        STORAGE_KEYS.TENANT,
                      ]);
                    } catch {}
                    eventBus.emit("auth:logout");
                  }
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
                showErrorToast(err, {
                  title: "Lỗi xác thực",
                  message: "Lỗi xác thực socket",
                });
                callback(err, null);
              }
            },
          };
        },
      });

      // Connection events
      this.pusher.connection.bind("connected", () => {
        console.log(
          "✅ [GlobalSocket] Kết nối thành công cho user:",
          userId,
          "lúc:",
          new Date().toLocaleTimeString("vi-VN"),
          "Queue size:",
          this.messageQueue.length
        );
        this.isConnected = true;
        this.reconnectAttempts = 0;
        eventBus.emit("socket:connected", { userId });

        // Process queued messages after connection với delay nhỏ để đảm bảo connection ổn định
        setTimeout(() => {
          this.processMessageQueue();
        }, 500);
      });

      this.pusher.connection.bind("state_change", (states: any) => {
        console.log(
          "🔄 [GlobalSocket] Connection state changed:",
          states.previous,
          "->",
          states.current,
          "lúc:",
          new Date().toLocaleTimeString("vi-VN")
        );
        // Đồng bộ isConnected với state thực tế
        if (states.current === "connected") {
          this.isConnected = true;
        } else if (
          states.current === "disconnected" ||
          states.current === "failed" ||
          states.current === "unavailable"
        ) {
          this.isConnected = false;
        }
      });

      this.pusher.connection.bind("disconnected", () => {
        console.log(
          "❌ [GlobalSocket] Mất kết nối cho user:",
          userId,
          "lúc:",
          new Date().toLocaleTimeString("vi-VN")
        );
        this.isConnected = false;
        eventBus.emit("socket:disconnected", { userId });

        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(
            "🔄 [GlobalSocket] Lên lịch thử kết nối lại lần:",
            this.reconnectAttempts + 1
          );
          this.scheduleReconnect();
        } else {
          console.log(
            "⚠️ [GlobalSocket] Đã đạt giới hạn số lần thử kết nối lại"
          );
        }
      });

      this.pusher.connection.bind("error", (err: any) => {
        showErrorToast(err, {
          title: "Lỗi kết nối socket",
          message: `Lỗi kết nối cho user: ${userId}`,
        });
        eventBus.emit("socket:error", { userId, error: err });
      });

      // Add more connection state events
      this.pusher.connection.bind("connecting", () => {
        console.log(
          "🔄 [GlobalSocket] Đang kết nối cho user:",
          userId,
          "lúc:",
          new Date().toLocaleTimeString("vi-VN")
        );
      });

      this.pusher.connection.bind("unavailable", () => {
        console.log(
          "⚠️ [GlobalSocket] Kết nối không khả dụng cho user:",
          userId,
          "lúc:",
          new Date().toLocaleTimeString("vi-VN")
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
      showErrorToast(error, {
        title: "Lỗi kết nối",
        message: "Không thể kết nối socket",
      });
      throw error;
    }
  }

  private handleNotification = (incoming: any): void => {
    const data = incoming?.data || incoming;
    console.log("🔔 [GlobalSocket] Nhận notification:", {
      from: data?.from || data?.created_by?.username || "Không xác định",
      content:
        data?.content?.substring(0, 50) +
        (data?.content?.length > 50 ? "..." : ""),
      roomId: data?.roomId || data?.class_id,
      timestamp: new Date().toLocaleTimeString("vi-VN"),
    });

    // Deep clone data to prevent mutation issues
    const clonedData = JSON.parse(JSON.stringify(data));
    // Create unique notification ID for deduplication - always include timestamp + random to ensure uniqueness
    const serverTimestamp = data?.timestamp || data?.created_at;
    const currentTimestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const notificationId =
      incoming?.notification ||
      data?.notification ||
      data?._id ||
      data?.id ||
      `notification_${data?.content || ""}_${
        data?.from_id || data?.from || ""
      }_${serverTimestamp || currentTimestamp}_${currentTimestamp}_${random}`;

    console.log("🆔 [GlobalSocket] Notification ID được tạo:", notificationId);

    // Skip if already processed
    if (this.processedMessageIds.has(notificationId)) {
      console.log(
        "⚠️ [GlobalSocket] Bỏ qua notification đã xử lý:",
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

      console.log("📱 [GlobalSocket] Hiển thị toast notification:", {
        sender: senderName,
        message: messageContent.substring(0, 30) + "...",
        roomId: clonedData.roomId || clonedData.class_id,
      });

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
      console.log("👤 [GlobalSocket] Bỏ qua notification từ chính mình");
    } else {
      console.log("❌ [GlobalSocket] Notification không có nội dung");
    }

    // Don't emit global message here - let handleMessage do it to avoid duplication
  };

  private handleMessage = (incoming: any): void => {
    const data = incoming?.data || incoming;
    console.log("💬 [GlobalSocket] Nhận tin nhắn:", {
      from: data?.from || data?.created_by?.username || "Không xác định",
      content:
        data?.content?.substring(0, 50) +
        (data?.content?.length > 50 ? "..." : ""),
      roomId: data?.roomId || data?.class_id,
      timestamp: new Date().toLocaleTimeString("vi-VN"),
    });

    // Create unique message ID for deduplication - always include timestamp + random to ensure uniqueness
    const serverTimestamp = data.timestamp || data.created_at;
    const currentTimestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const messageId =
      data.notification ||
      data._id ||
      data.id ||
      `${data.content || ""}|${
        data.from_id || data.from || data.senderId || data.created_by?._id || ""
      }|${serverTimestamp || currentTimestamp}|${
        data.roomId || data.class_id || ""
      }|${currentTimestamp}|${random}`;

    console.log("🆔 [GlobalSocket] Message ID được tạo:", messageId);

    // Skip if already processed
    if (this.processedMessageIds.has(messageId)) {
      console.log("⚠️ [GlobalSocket] Bỏ qua tin nhắn đã xử lý:", messageId);
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
      console.log("📤 [GlobalSocket] Phát tin nhắn global:", {
        sender: senderName,
        message: messageContent.substring(0, 30) + "...",
        roomId: data.roomId || data.class_id,
      });

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
      console.log("👤 [GlobalSocket] Bỏ qua tin nhắn từ chính mình");
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
        this.connect(this.currentUserId).catch((err) =>
          showErrorToast(err, {
            title: "Lỗi kết nối lại",
            message: "Không thể kết nối lại",
          })
        );
      }
    }, delay) as unknown as NodeJS.Timeout;
  }

  async disconnect(): Promise<void> {
    console.log(
      "🔌 [GlobalSocket] Bắt đầu ngắt kết nối lúc:",
      new Date().toLocaleTimeString("vi-VN"),
      "Queue size:",
      this.messageQueue.length
    );

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.clearProcessedMessagesTimeout) {
      clearTimeout(this.clearProcessedMessagesTimeout);
      this.clearProcessedMessagesTimeout = null;
    }

    // Release lock nếu đang bị lock
    this.sendMessageLock = false;
    this.isProcessingQueue = false;

    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }

    this.isConnected = false;
    this.currentUserId = null;
    this.currentUserName = null;
    this.reconnectAttempts = 0;
    this.processedMessageIds.clear();

    // Giữ lại message queue để có thể gửi lại sau khi reconnect
    // Chỉ clear khi user logout hoàn toàn (khi currentUserId = null)
    if (this.messageQueue.length > 0) {
      console.log(
        `⚠️ [GlobalSocket] Còn ${this.messageQueue.length} tin nhắn trong queue, sẽ được gửi lại khi reconnect`
      );
    }

    console.log("🔌 [GlobalSocket] Đã ngắt kết nối hoàn toàn");
  }

  // Method để clear message queue (gọi khi logout)
  clearMessageQueue(): void {
    const queueSize = this.messageQueue.length;
    this.messageQueue = [];
    if (queueSize > 0) {
      console.log(`🗑️ [GlobalSocket] Đã xóa ${queueSize} tin nhắn khỏi queue`);
    }
  }

  getConnectionStatus(): string {
    if (!this.pusher) return "Disconnected";
    return this.pusher.connection.state;
  }

  isSocketConnected(): boolean {
    const pusherState = this.pusher?.connection.state;
    const isConnected =
      this.isConnected &&
      pusherState === "connected" &&
      !!this.pusher &&
      !!this.currentUserId;

    // Đồng bộ isConnected flag nếu không khớp
    if (this.isConnected && pusherState !== "connected") {
      console.warn(
        "⚠️ [GlobalSocket] isConnected flag không khớp với pusher state, đồng bộ lại"
      );
      this.isConnected = false;
    }

    console.log("🔍 [GlobalSocket] Kiểm tra trạng thái kết nối:", {
      isConnected: this.isConnected,
      pusherState,
      finalResult: isConnected,
      currentUserId: this.currentUserId,
      timestamp: new Date().toLocaleTimeString("vi-VN"),
    });
    return isConnected;
  }

  // Method để đảm bảo kết nối ổn định
  async ensureConnection(timeoutMs: number = 10000): Promise<boolean> {
    console.log("🔧 [GlobalSocket] Đảm bảo kết nối ổn định...");

    if (!this.currentUserId) {
      console.log("❌ [GlobalSocket] Không có currentUserId");
      return false;
    }

    // Nếu đã kết nối và trạng thái ổn định, return true
    if (this.isSocketConnected()) {
      console.log("✅ [GlobalSocket] Kết nối đã ổn định");
      return true;
    }

    // Nếu chưa kết nối hoặc kết nối không ổn định, thử kết nối lại
    console.log("🔄 [GlobalSocket] Kết nối không ổn định, thử kết nối lại...");
    try {
      const connectPromise = this.connect(
        this.currentUserId,
        this.currentUserName || undefined
      );
      const timeoutPromise = new Promise<boolean>((resolve) =>
        setTimeout(() => resolve(false), timeoutMs)
      );

      await Promise.race([connectPromise, timeoutPromise]);

      // Đợi thêm một chút để đảm bảo connection state được cập nhật
      await new Promise((resolve) => setTimeout(resolve, 500));

      const isConnected = this.isSocketConnected();
      if (!isConnected) {
        console.warn(
          "⚠️ [GlobalSocket] Kết nối không thành công sau khi đảm bảo"
        );
      }
      return isConnected;
    } catch (error) {
      console.error("❌ [GlobalSocket] Lỗi khi đảm bảo kết nối:", error);
      // Không show toast ở đây vì có thể là timeout, không phải lỗi thực sự
      return false;
    }
  }

  // Force reconnect method
  async forceReconnect(): Promise<void> {
    console.log(
      "🔄 [GlobalSocket] Bắt đầu kết nối lại cưỡng chế lúc:",
      new Date().toLocaleTimeString("vi-VN")
    );
    if (this.currentUserId) {
      await this.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      console.log("🔄 [GlobalSocket] Đang kết nối lại sau 1 giây...");
      await this.connect(this.currentUserId, this.currentUserName || undefined);
    } else {
      console.log("⚠️ [GlobalSocket] Không có currentUserId để kết nối lại");
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
      // Đảm bảo kết nối trước khi xử lý queue
      const isConnected = await this.waitForConnection(3000);
      if (!isConnected) {
        console.warn(
          "⚠️ [GlobalSocket] Không thể kết nối, giữ lại tin nhắn trong queue"
        );
        return;
      }

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
              retryCount: queuedMessage.retryCount || 0,
            });
          } catch (error) {
            const retryCount = (queuedMessage.retryCount || 0) + 1;
            console.error(
              `❌ [GlobalSocket] Failed to send queued message (attempt ${retryCount}):`,
              error
            );

            // Re-add to queue if retry count hasn't exceeded max
            if (
              retryCount < this.maxRetries &&
              this.messageQueue.length < this.maxQueueSize
            ) {
              this.messageQueue.push({
                ...queuedMessage,
                retryCount,
              });
              console.log(
                `🔄 [GlobalSocket] Re-queued failed message (retry ${retryCount}/${this.maxRetries})`
              );
            } else {
              console.error(
                `⚠️ [GlobalSocket] Dropping message after ${retryCount} failed attempts:`,
                {
                  message: queuedMessage.message.substring(0, 50),
                  roomId: queuedMessage.roomId,
                }
              );
              // Chỉ show toast cho lỗi cuối cùng
              if (retryCount >= this.maxRetries) {
                showErrorToast(error, {
                  title: "Lỗi gửi tin nhắn",
                  message: "Không thể gửi tin nhắn sau nhiều lần thử",
                });
              }
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

    while (Date.now() - startTime < timeoutMs) {
      // Check cả isConnected flag và pusher state
      if (this.isSocketConnected()) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return this.isSocketConnected();
  }

  private async sendMessageDirect(
    message: string,
    roomId: string
  ): Promise<void> {
    const url =
      "https://n4romoz0b1.execute-api.ap-southeast-1.amazonaws.com/dev/api/pusher/event";
    const payload = {
      channel: `private-${this.currentUserId}`,
      event: "message",
      data: {
        content: message,
        senderId: this.currentUserId,
        senderName: this.currentUserName,
        roomId: roomId,
        timestamp: new Date().toISOString(),
      },
    };

    console.log("🔧 [GlobalSocket] Gửi tin nhắn qua socket API:", {
      url,
      channel: payload.channel,
      roomId,
      messageLength: message.length,
      timestamp: new Date().toLocaleTimeString("vi-VN"),
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("❌ [GlobalSocket] Socket API failed:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          roomId,
          message: message.substring(0, 50),
        });
        throw new Error(
          `Socket API failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("✅ [GlobalSocket] Socket API thành công:", {
        result,
        roomId,
        message: message.substring(0, 50),
      });
      return result;
    } catch (error: any) {
      console.error("❌ [GlobalSocket] Socket API error:", {
        error: error.message,
        stack: error.stack,
        roomId,
        message: message.substring(0, 50),
      });
      throw error;
    }
  }

  async sendMessage(message: string, roomId: string): Promise<void> {
    // Sử dụng lock để tránh race condition khi nhiều tin nhắn được gửi đồng thời
    while (this.sendMessageLock) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    this.sendMessageLock = true;

    try {
      console.log("📤 [GlobalSocket] Bắt đầu gửi tin nhắn:", {
        message: message.substring(0, 50) + "...",
        roomId,
        isConnected: this.isConnected,
        pusherState: this.pusher?.connection.state,
        hasPusher: !!this.pusher,
        currentUserId: this.currentUserId,
        queueSize: this.messageQueue.length,
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      });

      // Kiểm tra queue size trước khi thêm
      if (this.messageQueue.length >= this.maxQueueSize) {
        console.error(
          `⚠️ [GlobalSocket] Message queue đã đầy (${this.messageQueue.length}/${this.maxQueueSize}), không thể thêm tin nhắn mới`
        );
        throw new Error("Message queue is full");
      }

      // Đảm bảo kết nối ổn định trước khi gửi
      const connectionStable = await this.ensureConnection(8000);

      if (!connectionStable) {
        console.warn(
          "⚠️ [GlobalSocket] Không thể đảm bảo kết nối ổn định, thêm vào hàng đợi..."
        );

        // Add to queue instead of waiting
        this.messageQueue.push({
          message,
          roomId,
          timestamp: Date.now(),
          retryCount: 0,
        });

        console.log(
          "📝 [GlobalSocket] Tin nhắn đã thêm vào hàng đợi. Số lượng:",
          this.messageQueue.length
        );

        // Thử kết nối lại và xử lý queue
        setTimeout(() => {
          this.processMessageQueue();
        }, 1000);

        // Không throw error, message đã được queue
        return;
      }

      // Đảm bảo kết nối vẫn ổn định trước khi gửi
      if (!this.isSocketConnected()) {
        console.warn(
          "⚠️ [GlobalSocket] Kết nối không ổn định ngay trước khi gửi, thêm vào queue"
        );
        this.messageQueue.push({
          message,
          roomId,
          timestamp: Date.now(),
          retryCount: 0,
        });
        return;
      }

      try {
        const result = await this.sendMessageDirect(message, roomId);
        console.log("✅ [GlobalSocket] Gửi tin nhắn thành công qua API:", {
          message: message.substring(0, 50) + "...",
          roomId,
          result,
        });
      } catch (error: any) {
        console.error("❌ [GlobalSocket] Lỗi khi gửi tin nhắn qua socket:", {
          error: error.message,
          roomId,
          message: message.substring(0, 50),
          timestamp: new Date().toLocaleTimeString("vi-VN"),
        });

        // Thêm vào queue để retry
        if (this.messageQueue.length < this.maxQueueSize) {
          this.messageQueue.push({
            message,
            roomId,
            timestamp: Date.now(),
            retryCount: 0,
          });
          console.log(
            "🔄 [GlobalSocket] Thêm tin nhắn lỗi vào hàng đợi để thử lại. Queue size:",
            this.messageQueue.length
          );
        } else {
          console.error("❌ [GlobalSocket] Không thể thêm vào queue vì đã đầy");
          throw error; // Throw error nếu queue đầy
        }

        // Không throw error để không làm gián đoạn flow
        // Tin nhắn đã được gửi qua API POST thành công rồi, socket chỉ là backup
      }
    } finally {
      this.sendMessageLock = false;
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
      showErrorToast(error, {
        title: "Lỗi gửi trạng thái",
        message: "Không thể gửi trạng thái đang gõ",
      });
    }
  }
}

export default GlobalSocket;
