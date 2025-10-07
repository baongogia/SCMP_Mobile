import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GlobalSocket from "@/src/utils/globalSocket";

interface SocketContextType {
  isConnected: boolean;
  status: string;
  connect: () => void;
  disconnect: () => void;
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

  // Kiểm tra trạng thái đăng nhập
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

  // Kết nối socket khi đăng nhập - chỉ connect 1 lần
  useEffect(() => {
    if (isLoggedIn && userId) {
      console.log("[SocketContext] User logged in, will connect socket for:", {
        userId,
        userName,
      });
      globalSocket.connect(userId, userName || undefined).catch(console.error);
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

  const joinRoom = (roomId: string) => {
    if (isLoggedIn) {
      currentRoomRef.current = roomId;
      // GlobalSocket doesn't need explicit join/leave room for private channels
    }
  };

  const leaveRoom = (roomId: string) => {
    if (currentRoomRef.current === roomId) {
      currentRoomRef.current = null;
    }
  };

  const sendMessage = (message: string, roomId?: string) => {
    if (isLoggedIn && roomId) {
      console.log("[SocketContext] Sending message:", {
        message,
        roomId,
        userId,
        userName,
      });
      globalSocket.sendMessage(message, roomId).catch(console.error);
    }
  };

  const startTyping = (roomId: string) => {
    if (isLoggedIn) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      console.log("[SocketContext] Starting typing:", {
        roomId,
        userId,
        userName,
      });
      globalSocket.sendTyping(roomId, true).catch(console.error);

      // Auto stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(roomId);
      }, 3000) as unknown as NodeJS.Timeout;
    }
  };

  const stopTyping = (roomId: string) => {
    if (isLoggedIn) {
      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      console.log("[SocketContext] Stopping typing:", {
        roomId,
        userId,
        userName,
      });
      globalSocket.sendTyping(roomId, false).catch(console.error);
    }
  };

  const contextValue: SocketContextType = {
    isConnected: globalSocket.isSocketConnected(),
    status: globalSocket.getConnectionStatus(),
    connect,
    disconnect,
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
