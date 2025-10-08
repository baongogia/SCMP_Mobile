import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GlobalSocket from "@/src/utils/globalSocket";
import { eventBus } from "@/src/utils/eventBus";

interface SocketContextType {
  isConnected: boolean;
  status: string;
  connect: () => void;
  disconnect: () => void;
  forceReconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (message: string, roomId?: string) => void;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  userId: string | null;
  userName: string | null;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const currentRoomRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get global socket instance
  const globalSocket = GlobalSocket.getInstance();

  // Kiểm tra trạng thái đăng nhập ban đầu
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("loginToken");
        const userString = await AsyncStorage.getItem("user");

        if (token && userString) {
          const userObj = JSON.parse(userString);
          const userIdValue = userObj?.id || userObj?._id;
          const userNameValue = userObj?.username || userObj?.name || null;

          if (userIdValue) {
            setUserId(userIdValue);
            setUserName(userNameValue);
            setIsLoggedIn(true);
          }
        } else {
          setIsLoggedIn(false);
          setUserId(null);
          setUserName(null);
        }
      } catch (error) {
        console.error("[SocketContext] Error checking login status:", error);
        setIsLoggedIn(false);
        setUserId(null);
        setUserName(null);
      }
    };

    checkLoginStatus();
  }, []);

  // Lắng nghe sự kiện đăng nhập/đăng xuất để cập nhật ngay lập tức
  useEffect(() => {
    const offLogin = eventBus.on("auth:login", (user: any) => {
      try {
        const userIdValue = user?.id || user?._id;
        const userNameValue = user?.username || user?.name || null;
        if (userIdValue) {
          setUserId(userIdValue);
          setUserName(userNameValue);
          setIsLoggedIn(true);
        }
      } catch {}
    });
    const offLogout = eventBus.on("auth:logout", () => {
      setIsLoggedIn(false);
      setUserId(null);
      setUserName(null);
      globalSocket.disconnect().catch(() => {});
    });
    return () => {
      offLogin();
      offLogout();
    };
  }, [globalSocket]);

  // Kết nối socket khi đăng nhập - chỉ connect 1 lần
  useEffect(() => {
    if (isLoggedIn && userId) {
      console.log("[SocketContext] User logged in, will connect socket for:", {
        userId,
        userName,
      });

      // Add a small delay to ensure app is fully initialized
      const connectWithDelay = async () => {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Tăng delay lên 500ms
        try {
          await globalSocket.connect(userId, userName || undefined);
          console.log(
            "[SocketContext] Socket connection initiated successfully"
          );
        } catch (error) {
          console.error("[SocketContext] Socket connection failed:", error);
          // Retry connection after 2 seconds
          setTimeout(() => {
            if (isLoggedIn && userId) {
              console.log("[SocketContext] Retrying socket connection...");
              globalSocket
                .connect(userId, userName || undefined)
                .catch(console.error);
            }
          }, 2000);
        }
      };

      connectWithDelay();
    } else if (!isLoggedIn) {
      console.log("[SocketContext] User logged out, disconnecting socket");
      globalSocket.disconnect().catch(console.error);
    }
  }, [isLoggedIn, userId, userName]); // Removed globalSocket from dependencies

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Wrapper functions
  const connect = () => {
    if (isLoggedIn && userId) {
      console.log("[SocketContext] Manual connect for user:", {
        userId,
        userName,
      });
      globalSocket.connect(userId, userName || undefined).catch(console.error);
    }
  };

  const disconnect = () => {
    globalSocket.disconnect().catch(console.error);
  };

  const forceReconnect = () => {
    globalSocket.forceReconnect().catch(console.error);
  };

  const joinRoom = (roomId: string) => {
    if (isLoggedIn) {
      console.log("🚪 [SocketContext] Tham gia phòng:", {
        roomId,
        previousRoom: currentRoomRef.current,
        userId,
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      });
      currentRoomRef.current = roomId;
      // GlobalSocket doesn't need explicit join/leave room for private channels
    } else {
      console.log(
        "⚠️ [SocketContext] Không thể tham gia phòng - chưa đăng nhập"
      );
    }
  };

  const leaveRoom = (roomId: string) => {
    if (currentRoomRef.current === roomId) {
      console.log("🚪 [SocketContext] Rời khỏi phòng:", {
        roomId,
        userId,
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      });
      currentRoomRef.current = null;
    } else {
      console.log(
        "⚠️ [SocketContext] Không thể rời phòng - không phải phòng hiện tại:",
        {
          currentRoom: currentRoomRef.current,
          requestedRoom: roomId,
        }
      );
    }
  };

  const sendMessage = (message: string, roomId?: string) => {
    if (isLoggedIn && roomId) {
      console.log("📤 [SocketContext] Gửi tin nhắn:", {
        message: message.substring(0, 30) + "...",
        roomId,
        userId,
        userName,
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      });
      globalSocket.sendMessage(message, roomId).catch(console.error);
    } else {
      console.log("⚠️ [SocketContext] Không thể gửi tin nhắn:", {
        isLoggedIn,
        roomId,
        userId,
      });
    }
  };

  const startTyping = (roomId: string) => {
    if (isLoggedIn) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      globalSocket.sendTyping(roomId, true).catch(console.error);

      // Auto stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(roomId);
      }, 3000) as unknown as NodeJS.Timeout;
    } else {
      console.warn("[SocketContext] startTyping called but user not logged in");
    }
  };

  const stopTyping = (roomId: string) => {
    if (isLoggedIn) {
      console.log("[SocketContext] stopTyping called:", {
        roomId,
        userId,
        userName,
        isLoggedIn,
      });

      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      globalSocket.sendTyping(roomId, false).catch(console.error);
    } else {
      console.warn("[SocketContext] stopTyping called but user not logged in");
    }
  };

  const contextValue: SocketContextType = {
    isConnected: globalSocket.isSocketConnected(),
    status: globalSocket.getConnectionStatus(),
    connect,
    disconnect,
    forceReconnect,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    userId,
    userName,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
};
