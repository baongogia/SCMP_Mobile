import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getAllChannels, getChannel } from "@/src/services/chat/chatService";
import { useSocketContext } from "./SocketContext";
import { eventBus } from "@/src/utils/eventBus";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showErrorToast } from "@/src/utils/errorHandler";

interface Channel {
  _id: string;
  name: string;
  latest_message?: {
    _id: string;
    content: string;
    created_at: string;
    created_by: string;
    is_viewed: boolean;
    viewed_at?: string;
  };
  is_viewed: boolean;
  viewed_at?: string;
}

interface UnreadMessagesContextType {
  unreadCount: number;
  channels: Channel[];
  refreshChannels: () => Promise<void>;
  markChannelAsViewed: (channelId: string) => void;
  isLoading: boolean;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | null>(
  null
);

interface UnreadMessagesProviderProps {
  children: React.ReactNode;
}

export const UnreadMessagesProvider: React.FC<UnreadMessagesProviderProps> = ({
  children,
}) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected } = useSocketContext();

  // Tính toán số tin nhắn chưa xem
  const unreadCount = channels.reduce((count, channel) => {
    // Ưu tiên cờ is_viewed ở cấp channel do backend trả về
    if (typeof channel.is_viewed === "boolean") {
      return count + (channel.is_viewed ? 0 : 1);
    }

    // Fallback: so sánh thời gian đọc với thời gian tin nhắn mới nhất
    if (channel.latest_message) {
      const viewedAtMs = channel.viewed_at
        ? new Date(channel.viewed_at).getTime()
        : 0;
      const latestAtMs = new Date(channel.latest_message.created_at).getTime();
      return count + (latestAtMs > viewedAtMs ? 1 : 0);
    }

    return count;
  }, 0);

  // Lấy danh sách channels và cập nhật trạng thái unread
  const refreshChannels = useCallback(async () => {
    try {
      // Kiểm tra authentication trước khi gọi API
      const [token, tenant] = await Promise.all([
        AsyncStorage.getItem("loginToken"),
        AsyncStorage.getItem("tenant"),
      ]);

      if (!token || !tenant) {
        console.log(
          "[UnreadMessagesContext] Skipping channels fetch - not authenticated"
        );
        setChannels([]);
        return;
      }

      setIsLoading(true);
      const response = await getAllChannels();

      // Kiểm tra nếu response có lỗi
      if (response.data?.error) {
        setChannels([]);
        return;
      }

      const allChannels =
        response.data?.data?.data || response.data?.data || [];

      if (Array.isArray(allChannels)) {
        setChannels(allChannels);
      } else {
        setChannels([]);
      }
    } catch (error: any) {
      setChannels([]);
      showErrorToast(error, {
        title: "Lỗi tải kênh chat",
        message: "Không thể tải danh sách kênh chat",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Đánh dấu channel đã được xem: chỉ update local, không gọi API
  const markChannelAsViewed = useCallback((channelId: string) => {
    console.log("[UnreadMessagesContext] Đánh dấu đã xem channel:", channelId);
    // Optimistic update để badge tắt ngay lập tức
    setChannels((prev) =>
      prev.map((c) =>
        c._id === channelId
          ? { ...c, is_viewed: true, viewed_at: new Date().toISOString() }
          : c
      )
    );
    // Không gọi API getChannel nữa để tránh spam requests
  }, []);

  // Lắng nghe tin nhắn mới từ socket
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      // Cập nhật latest_message cho channel tương ứng
      setChannels((prevChannels) =>
        prevChannels.map((channel) => {
          if (
            channel._id === data.roomId ||
            channel._id === data.class_id ||
            channel._id === data.class
          ) {
            return {
              ...channel,
              is_viewed: false,
              latest_message: {
                _id: data.rawData?._id || data._id || data.id,
                content: data.messageContent || data.content || data.text,
                created_at:
                  data.timestamp || data.created_at || new Date().toISOString(),
                created_by:
                  data.rawData?.created_by || data.created_by || data.user_id,
                is_viewed: false, // Tin nhắn mới chưa được xem
                viewed_at: undefined,
              },
            };
          }
          return channel;
        })
      );
    };

    // Lắng nghe sự kiện tin nhắn mới từ global socket
    const offGlobalMessage = eventBus.on("global:message", handleNewMessage);
    const offNewMessage = eventBus.on("socket:newMessage", handleNewMessage);
    const offMessageReceived = eventBus.on(
      "socket:messageReceived",
      handleNewMessage
    );

    return () => {
      offGlobalMessage();
      offNewMessage();
      offMessageReceived();
    };
  }, []);

  // Lắng nghe khi socket kết nối để refresh channels
  useEffect(() => {
    if (isConnected) {
      refreshChannels();
    }
  }, [isConnected, refreshChannels]);

  // Force refresh channels khi component mount
  useEffect(() => {
    refreshChannels();
  }, [refreshChannels]);

  // Lắng nghe sự kiện refresh từ chat screen
  useEffect(() => {
    const offRefresh = eventBus.on("chat:refreshChannels", refreshChannels);
    // Đánh dấu viewed ngay khi gửi tin trong phòng hiện tại (optimistic)
    const offMarkViewed = eventBus.on(
      "chat:markViewed",
      (channelId: string) => {
        setChannels((prev) =>
          prev.map((c) =>
            c._id === channelId
              ? { ...c, is_viewed: true, viewed_at: new Date().toISOString() }
              : c
          )
        );
      }
    );

    return () => {
      offRefresh();
      offMarkViewed();
    };
  }, [refreshChannels]);

  const contextValue: UnreadMessagesContextType = {
    unreadCount,
    channels,
    refreshChannels,
    markChannelAsViewed,
    isLoading,
  };

  return (
    <UnreadMessagesContext.Provider value={contextValue}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};

export const useUnreadMessages = (): UnreadMessagesContextType => {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    throw new Error(
      "useUnreadMessages must be used within an UnreadMessagesProvider"
    );
  }
  return context;
};
