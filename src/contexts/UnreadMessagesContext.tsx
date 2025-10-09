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
import { Alert } from "react-native";

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
    // Nếu có tin nhắn mới và chưa được xem
    if (channel.latest_message && !channel.latest_message.is_viewed) {
      return count + 1;
    }
    return count;
  }, 0);

  // Lấy danh sách channels và cập nhật trạng thái unread
  const refreshChannels = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getAllChannels();

      // Kiểm tra nếu response có lỗi
      if (response.data?.error) {
        console.warn(
          "[UnreadMessagesContext] API returned error:",
          response.data.error
        );
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
      console.error("[UnreadMessagesContext] Network error:", error.message);
      // Chỉ hiển thị alert cho lỗi thực sự, không phải lỗi network tạm thời
      if (error.code !== "NETWORK_ERROR" && error.message !== "Network Error") {
        Alert.alert(
          "[UnreadMessagesContext] Error fetching channels:",
          error.message
        );
      }
      setChannels([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Đánh dấu channel đã được xem: dựa vào API, không tự set local
  const markChannelAsViewed = useCallback(
    (channelId: string) => {
      (async () => {
        try {
          // Nhiều backend sẽ tự mark viewed khi gọi lấy chi tiết channel
          await getChannel(channelId, 1, 1);
        } catch (e) {
          // Bỏ qua lỗi tạm thời; vẫn cố refresh từ server
        } finally {
          refreshChannels();
        }
      })();
    },
    [refreshChannels]
  );

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
    return () => offRefresh();
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
