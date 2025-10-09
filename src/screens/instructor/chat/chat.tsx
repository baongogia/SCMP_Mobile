/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getChannel, sendMessage } from "@/src/services/chat/chatService";
import { useSocketContext } from "@/src/contexts/SocketContext";
import { useUnreadMessages } from "@/src/contexts/UnreadMessagesContext";
import { eventBus } from "@/src/utils/eventBus";
import { Badge } from "@/src/components/ui";
import { styles } from "./style";

interface ChatGroup {
  id: string;
  groupName: string;
  lastMessage: string;
  lastMessageTime: Date;
  memberCount: number;
  unreadCount: number;
  isManager: boolean;
  conversationType: string[];
  classInfo?: {
    id: string;
    name: string;
    course: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: number | string;
  text: string;
  sender: "instructor" | "student" | "me" | "other";
  senderName: string;
  senderRole?: string;
  timestamp: Date;
  timestampString?: string;
  avatarUrl?: string;
  media?: {
    _id: string;
    filename: string;
    path: string;
    mime: string;
    title?: string;
    alt?: string;
    size?: number;
  }[];
}

// State lưu tin nhắn cho mỗi conversation
interface ConversationMessages {
  [conversationId: string]: {
    messages: Message[];
    page: number;
    hasMore: boolean;
    lastFetch?: Date;
  };
}

export default function Chat() {
  const insets = useSafeAreaInsets();
  const [currentView, setCurrentView] = useState<"groups" | "chat">("groups");
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lưu tin nhắn cho từng conversation
  const [conversationMessages, setConversationMessages] =
    useState<ConversationMessages>({});
  const [loadingMore, setLoadingMore] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<
    {
      uri: string;
      type: string;
      name: string;
      title: string;
      alt: string;
    }[]
  >([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  // Local toast removed; rely on GlobalToast
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [groupTypingUsers, setGroupTypingUsers] = useState<
    Record<string, string[]>
  >({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sử dụng global socket context
  const socketContext = useSocketContext();
  const { markChannelAsViewed, channels, refreshChannels } =
    useUnreadMessages();
  const fetchChatGroups = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const tenantString = await AsyncStorage.getItem("tenant");
        const token = await AsyncStorage.getItem("loginToken");

        if (!tenantString || !token) {
          setLoading(false);
          return;
        }

        // Sử dụng dữ liệu từ UnreadMessagesContext
        await refreshChannels();
      } catch (err: any) {
        setError(err.message || "Không thể tải danh sách kênh chat");
        if (!showRefreshing) {
          setChatGroups([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [refreshChannels]
  );

  // Transform channels to chat groups khi channels thay đổi
  useEffect(() => {
    if (channels && Array.isArray(channels)) {
      const transformedGroups: ChatGroup[] = [];

      channels.forEach((classItem: any) => {
        const unreadCount =
          classItem.latest_message && !classItem.latest_message.is_viewed
            ? 1
            : 0;
        transformedGroups.push({
          id: classItem._id,
          groupName: classItem.name || "Lớp học",
          lastMessage: classItem.latest_message?.content || "Chưa có tin nhắn",
          lastMessageTime: new Date(
            classItem.latest_message?.created_at ||
              classItem.updated_at ||
              classItem.created_at
          ),
          memberCount: (classItem.member?.length || 0) + 1,
          unreadCount,
          isManager: false,
          conversationType: ["class"],
          classInfo: {
            id: classItem._id,
            name: classItem.name,
            course: classItem.course,
          },
          createdAt: new Date(classItem.created_at),
          updatedAt: new Date(classItem.updated_at),
        });
      });

      setChatGroups(transformedGroups);

      if (transformedGroups.length === 0) {
        setError("Không có kênh chat nào");
      } else {
        setError(null);
      }
    } else {
      setChatGroups([]);
    }
  }, [channels]);

  // Lắng nghe global socket events
  useEffect(() => {
    // Lắng nghe global message events từ socket context
    const offGlobalMessage = eventBus.on("global:message", (data: any) => {
      // Update chat groups list với tin nhắn mới
      setChatGroups((prevGroups) => {
        return prevGroups.map((group) => {
          const isForThisGroup =
            group.id === data.roomId ||
            group.id === data.tenantId ||
            group.groupName === data.className ||
            group.classInfo?.name === data.className;

          if (isForThisGroup) {
            const rawTime =
              (data as any)?.created_at || (data as any)?.timestamp;
            const messageTimestamp = new Date(rawTime || Date.now());

            return {
              ...group,
              lastMessage: `${data.senderName}: ${data.messageContent}`,
              lastMessageTime: messageTimestamp,
            };
          }
          return group;
        });
      });

      // Nếu đang ở trong phòng chat này, cập nhật messages
      setConversationMessages((prev) => {
        const currentSelectedGroup = selectedGroup;
        if (
          currentSelectedGroup &&
          (currentSelectedGroup.id === data.roomId ||
            currentSelectedGroup.id === data.tenantId ||
            currentSelectedGroup.groupName === data.className ||
            currentSelectedGroup.classInfo?.name === data.className)
        ) {
          const conversationKey = currentSelectedGroup.id;
          const existing = prev[conversationKey] || {
            messages: [],
            page: 1,
            hasMore: true,
          };

          // Check if message already exists to avoid duplicates
          const messageExists = existing.messages.some(
            (msg) =>
              msg.text === data.messageContent &&
              msg.senderName === data.senderName &&
              Math.abs(
                new Date(msg.timestamp).getTime() -
                  new Date(data.timestamp || Date.now()).getTime()
              ) < 5000
          );

          if (messageExists) {
            return prev;
          }

          const messageId = `global-${Date.now()}-${Math.random()}`;
          const rawTime2 =
            (data as any)?.created_at || (data as any)?.timestamp;
          const messageTimestamp = new Date(rawTime2 || Date.now());

          // Try to extract avatar url from socket payload if present
          const raw = (data as any)?.rawData || data;
          const avatarCandidates = [
            raw?.from_avt?.[0]?.path,
            raw?.from_avt?.path,
            raw?.avatar?.[0]?.path,
            raw?.avatar?.path,
            raw?.avatarUrl,
            raw?.avatar_url,
            raw?.from_avatar?.[0]?.path,
            raw?.from_avatar?.path,
            raw?.sender_avatar?.[0]?.path,
            raw?.sender_avatar?.path,
            raw?.created_by?.avatar?.[0]?.path,
            raw?.created_by?.avatar?.path,
            raw?.created_by?.featured_image?.[0]?.path,
            raw?.created_by?.featured_image?.path,
            raw?.user?.avatar?.[0]?.path,
            raw?.user?.avatar?.path,
            raw?.user?.featured_image?.[0]?.path,
            raw?.user?.featured_image?.path,
            raw?.avatar,
            raw?.avatarPath,
            raw?.image,
            raw?.photo,
          ];
          const avatarUrl = avatarCandidates.find(
            (u) => typeof u === "string" && u.trim().length > 0
          ) as string | undefined;

          const mapped: Message = {
            id: messageId,
            text: data.messageContent,
            sender: "other",
            senderName: data.senderName,
            timestamp: messageTimestamp,
            timestampString:
              (data as any)?.created_at || (data as any)?.timestamp,
            avatarUrl,
          };

          // Check for duplicates
          const isDuplicate = existing.messages.some(
            (m) =>
              m.text === mapped.text &&
              Math.abs(
                new Date(m.timestamp).getTime() - messageTimestamp.getTime()
              ) < 1000
          );

          if (!isDuplicate) {
            return {
              ...prev,
              [conversationKey]: {
                ...existing,
                messages: [mapped, ...existing.messages],
                lastFetch: existing.lastFetch || new Date(),
              },
            };
          }
        }
        return prev;
      });
    });

    // Lắng nghe typing events
    const offGlobalTyping = eventBus.on("global:typing", (data: any) => {
      if (data.userId !== userId) {
        // Update typing users for current chat if it matches
        setTypingUsers((prev) => {
          if (
            data.roomId === selectedGroup?.id &&
            !prev.includes(data.userId)
          ) {
            return [...prev, data.userId];
          }
          return prev;
        });

        // Update typing users for group list
        setGroupTypingUsers((prev) => {
          const currentTyping = prev[data.roomId] || [];
          if (!currentTyping.includes(data.userId)) {
            return {
              ...prev,
              [data.roomId]: [...currentTyping, data.userId],
            };
          }
          return prev;
        });
      }
    });

    const offGlobalStopTyping = eventBus.on(
      "global:stopTyping",
      (data: any) => {
        if (data.userId !== userId) {
          // Update typing users for current chat if it matches
          setTypingUsers((prev) => {
            if (data.roomId === selectedGroup?.id) {
              return prev.filter((id) => id !== data.userId);
            }
            return prev;
          });

          // Update typing users for group list
          setGroupTypingUsers((prev) => {
            const currentTyping = prev[data.roomId] || [];
            return {
              ...prev,
              [data.roomId]: currentTyping.filter((id) => id !== data.userId),
            };
          });
        }
      }
    );

    // Lắng nghe event navigate:chat từ GlobalToast
    const offNavigateChat = eventBus.on("navigate:chat", (data: any) => {
      if (data.roomId) {
        // Tìm chat group tương ứng với roomId
        setChatGroups((currentGroups) => {
          const targetGroup = currentGroups.find((group) => {
            return (
              group.id === data.roomId ||
              group.classInfo?.id === data.roomId ||
              group.classInfo?.name === data.className ||
              group.groupName === data.className
            );
          });

          if (targetGroup) {
            setSelectedGroup(targetGroup);
            setCurrentView("chat");
          } else {
            // Nếu không tìm thấy group, refresh danh sách và thử lại
            fetchChatGroups();
          }
          return currentGroups;
        });
      }
    });

    return () => {
      offGlobalMessage();
      offGlobalTyping();
      offGlobalStopTyping();
      offNavigateChat();
    };
  }, [userId, selectedGroup?.id]);

  const parseApiTimestamp = (timestampString: string) => {
    return new Date(timestampString);
  };

  useEffect(() => {
    fetchChatGroups();
  }, [fetchChatGroups]);

  // Check for pending navigation from toast
  useEffect(() => {
    const checkPendingNavigation = async () => {
      try {
        const pendingNav = await AsyncStorage.getItem("pendingChatNavigation");
        if (pendingNav) {
          const navData = JSON.parse(pendingNav);

          // Clear the pending navigation
          await AsyncStorage.removeItem("pendingChatNavigation");

          // Wait a bit for chatGroups to load
          setTimeout(() => {
            if (chatGroups.length > 0) {
              const targetGroup = chatGroups.find((group) => {
                return (
                  group.id === navData.roomId ||
                  group.classInfo?.id === navData.roomId ||
                  group.classInfo?.name === navData.className ||
                  group.groupName === navData.className
                );
              });

              if (targetGroup) {
                setSelectedGroup(targetGroup);
                setCurrentView("chat");
              } else {
              }
            } else {
              // Retry after another second if chatGroups not loaded
              setTimeout(() => {
                if (chatGroups.length > 0) {
                  const targetGroup = chatGroups.find((group) => {
                    return (
                      group.id === navData.roomId ||
                      group.classInfo?.id === navData.roomId ||
                      group.classInfo?.name === navData.className ||
                      group.groupName === navData.className
                    );
                  });

                  if (targetGroup) {
                    setSelectedGroup(targetGroup);
                    setCurrentView("chat");
                  }
                }
              }, 1000);
            }
          }, 1000);
        }
      } catch (error) {
        console.error(
          "[Instructor Chat] Error checking pending navigation:",
          error
        );
      }
    };

    checkPendingNavigation();
  }, [chatGroups]);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (userString) {
          const userObj = JSON.parse(userString);
          setUserId(userObj?.id || userObj?._id || null);
          setUserName(userObj?.username || userObj?.name || null);
        }
      } catch {
        // Silent fail
      }
    };
    getUserId();
  }, []);

  const filteredGroups = useMemo(
    () =>
      chatGroups.filter((group) =>
        group.groupName.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [chatGroups, searchQuery]
  );

  // Lấy tin nhắn hiện tại từ conversation được chọn
  const currentMessages = useMemo(
    () =>
      selectedGroup?.id && conversationMessages[selectedGroup.id]
        ? conversationMessages[selectedGroup.id].messages
        : [],
    [selectedGroup?.id, conversationMessages]
  );

  const selectGroup = useCallback(
    (group: ChatGroup) => {
      setSelectedGroup(group);
      setCurrentView("chat");

      // Đánh dấu channel đã được xem
      markChannelAsViewed(group.id);

      // Chỉ fetch nếu chưa có data hoặc data cũ quá 5 phút
      const conversationData = conversationMessages[group.id];
      const shouldFetch =
        !conversationData ||
        !conversationData.lastFetch ||
        Date.now() - conversationData.lastFetch.getTime() > 5 * 60 * 1000;

      if (shouldFetch) {
        fetchConversationMessages(group.id, 1, false);
      }

      // Bảo đảm join ngay lập tức khi chọn phòng (tránh đợi effect)
      if (joinedRoomRef.current !== group.id) {
        socketContext.connect();
        socketContext.joinRoom(group.id);
        joinedRoomRef.current = group.id;
      }
    },
    [markChannelAsViewed, conversationMessages, socketContext]
  );

  // Track which room we actually joined to avoid leaving wrong room during rerenders
  const joinedRoomRef = useRef<string | null>(null);

  // Join room only when entering chat or switching to a different room
  useEffect(() => {
    const ready = currentView === "chat" && !!selectedGroup?.id;
    if (!ready) return;

    if (joinedRoomRef.current !== selectedGroup!.id) {
      socketContext.joinRoom(selectedGroup!.id); // Tham gia phòng
      joinedRoomRef.current = selectedGroup!.id;
    }
  }, [currentView, selectedGroup, socketContext]);

  // Leave room when leaving chat view
  useEffect(() => {
    if (currentView !== "chat" && joinedRoomRef.current) {
      socketContext.leaveRoom(joinedRoomRef.current);
      joinedRoomRef.current = null;
    }
  }, [currentView, socketContext]);

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
      if (joinedRoomRef.current) {
        socketContext.leaveRoom(joinedRoomRef.current);
        joinedRoomRef.current = null;
      }
    };
  }, [socketContext]);

  const goBackToGroups = useCallback(() => {
    setCurrentView("groups");
    setSelectedGroup(null);
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() && selectedMedia.length === 0) return;
    if (!selectedGroup) return;

    try {
      setSendingMessage(true);

      // Đảm bảo đã join đúng phòng trước khi gửi
      if (selectedGroup?.id && joinedRoomRef.current !== selectedGroup.id) {
        socketContext.joinRoom(selectedGroup.id);
        joinedRoomRef.current = selectedGroup.id;
      }

      const messageText = inputText.trim();
      const messageTimestamp = new Date();

      // Update chat groups list immediately with the new message
      setChatGroups((prevGroups) => {
        return prevGroups.map((group) => {
          if (group.id === selectedGroup.id) {
            return {
              ...group,
              lastMessage: messageText, // For own messages, don't show sender name
              lastMessageTime: messageTimestamp,
            };
          }
          return group;
        });
      });

      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMsg: Message = {
        id: optimisticId,
        text: messageText,
        sender: "me",
        senderName: "Tôi",
        timestamp: messageTimestamp,
        timestampString: messageTimestamp.toISOString(),
      };
      setConversationMessages((prev) => {
        const existing = prev[selectedGroup.id] || {
          messages: [],
          page: 1,
          hasMore: true,
        };
        return {
          ...prev,
          [selectedGroup.id]: {
            ...existing,
            messages: [optimisticMsg, ...existing.messages],
            lastFetch: new Date(),
          },
        };
      });

      await sendMessage(selectedGroup.id, messageText);

      setInputText("");
      setSelectedMedia([]);
      // Socket will deliver server message; keep optimistic until then
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (err: any) {
      console.error("Error sending message:", err);
      Alert.alert("Lỗi", err.message || "Không thể gửi tin nhắn");
      if (selectedGroup) {
        setConversationMessages((prev) => {
          const existing = prev[selectedGroup.id];
          if (!existing) return prev;
          return {
            ...prev,
            [selectedGroup.id]: {
              ...existing,
              messages: existing.messages.filter(
                (m) => !String(m.id).startsWith("optimistic-")
              ),
            },
          };
        });
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (date: Date) => {
    // Luôn hiển thị giờ:phút dưới mỗi tin; ngày hiển thị ở separator
    const hh = String(date.getUTCHours()).padStart(2, "0");
    const mm = String(date.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const fetchConversationMessages = async (
    conversationId: string,
    pageNum = 1,
    append = false
  ) => {
    try {
      if (pageNum === 1) setLoading(true);
      if (pageNum > 1) setLoadingMore(true);

      const tenantString = await AsyncStorage.getItem("tenant");
      const token = await AsyncStorage.getItem("loginToken");
      const userString = await AsyncStorage.getItem("user");

      let myId = null;
      if (userString) {
        try {
          const userObj = JSON.parse(userString);
          myId = userObj?._id || userObj?.id;
        } catch {}
      }
      if (!tenantString || !token) return;
      const response = await getChannel(conversationId, pageNum, 10);
      const rawMessages = response.data?.data?.data || [];
      const pageSize = rawMessages.length;
      if (!Array.isArray(rawMessages)) {
        return;
      }
      const mapped = rawMessages.map((msg: any, idx: number) => {
        let baseId = msg._id ? String(msg._id) : "";
        let created = msg.created_at ? String(msg.created_at) : "";
        let uniqueKey = `${baseId}-${created}-p${pageNum}-i${idx}`;

        // Extract avatar path from API message payload
        const avatarCandidates = [
          msg?.created_by?.avatar?.[0]?.path,
          msg?.created_by?.avatar?.path,
          msg?.created_by?.featured_image?.[0]?.path,
          msg?.created_by?.featured_image?.path,
          msg?.user?.avatar?.[0]?.path,
          msg?.user?.avatar?.path,
          msg?.user?.featured_image?.[0]?.path,
          msg?.user?.featured_image?.path,
          msg?.avatar,
          msg?.avatarUrl,
        ];
        const avatarUrl = avatarCandidates.find(
          (u) => typeof u === "string" && u.trim().length > 0
        ) as string | undefined;

        return {
          id: uniqueKey,
          text: msg.content,
          sender: (myId &&
          (msg.created_by?._id === myId || msg.created_by?.id === myId)
            ? "me"
            : "other") as "instructor" | "student" | "me" | "other",
          senderName: msg.created_by?.username || "Người dùng",
          senderRole: Array.isArray(msg.created_by?.role_front)
            ? msg.created_by?.role_front.join(", ")
            : msg.created_by?.role_front || "",
          timestamp: parseApiTimestamp(msg.created_at),
          timestampString: msg.created_at,
          avatarUrl,
          media: msg.media
            ? msg.media.map((mediaItem: any) => ({
                _id: mediaItem._id || `media_${Date.now()}_${Math.random()}`,
                filename: mediaItem.filename || "Unknown file",
                path: mediaItem.path || "",
                mime: mediaItem.mime || "application/octet-stream",
                title: mediaItem.title || mediaItem.filename || "Media file",
                alt: mediaItem.alt || mediaItem.title || mediaItem.filename,
                size: mediaItem.size || 0,
              }))
            : undefined,
        };
      });

      const sorted = mapped.sort((a: any, b: any) => {
        const timeA = new Date(a.timestampString || a.timestamp).getTime();
        const timeB = new Date(b.timestampString || b.timestamp).getTime();
        return timeA - timeB;
      });

      const reversed = sorted.reverse();

      // Cập nhật state cho conversation cụ thể
      setConversationMessages((prev) => {
        const existing = prev[conversationId] || {
          messages: [],
          page: 1,
          hasMore: true,
        };

        if (append) {
          return {
            ...prev,
            [conversationId]: {
              messages: [...existing.messages, ...reversed],
              page: pageNum,
              hasMore: pageSize === 10,
              lastFetch: new Date(),
            },
          };
        } else {
          return {
            ...prev,
            [conversationId]: {
              messages: reversed,
              page: 1,
              hasMore: pageSize === 10,
              lastFetch: new Date(),
            },
          };
        }
      });
    } catch (e) {
      console.error("Error fetching messages:", e);
    } finally {
      if (pageNum === 1) setLoading(false);
      if (pageNum > 1) setLoadingMore(false);
    }
  };

  // Khi selectedGroup được set từ notification (không đi qua selectGroup),
  // đảm bảo đánh dấu đã xem và tải tin nhắn lần đầu
  useEffect(() => {
    if (!selectedGroup) return;

    // Đánh dấu đã xem cho channel hiện tại
    markChannelAsViewed(selectedGroup.id);

    // Chỉ fetch nếu chưa có data hoặc data cũ quá 5 phút
    const conversationData = conversationMessages[selectedGroup.id];
    const shouldFetch =
      !conversationData ||
      !conversationData.lastFetch ||
      Date.now() - conversationData.lastFetch.getTime() > 5 * 60 * 1000;

    if (shouldFetch) {
      fetchConversationMessages(selectedGroup.id, 1, false);
    }
  }, [selectedGroup?.id, conversationMessages, markChannelAsViewed]);

  const loadMoreMessages = () => {
    if (!selectedGroup?.id || loadingMore) return;

    const conversationData = conversationMessages[selectedGroup.id];
    if (!conversationData?.hasMore) return;

    const nextPage = (conversationData?.page || 1) + 1;
    console.log("[Chat][Instructor] loadMore -> next page:", nextPage);
    fetchConversationMessages(selectedGroup.id, nextPage, true);
  };

  const renderChatGroup = useCallback(
    ({ item }: { item: ChatGroup }) => {
      return (
        <TouchableOpacity
          style={styles.groupItem}
          onPress={() => selectGroup(item)}
          activeOpacity={0.7}
        >
          <View style={styles.groupItemContent}>
            <View
              style={[styles.groupIcon, item.isManager && styles.managerIcon]}
            >
              <Ionicons
                name={item.isManager ? "person-circle" : "people"}
                size={24}
                color={item.isManager ? "#ff6b6b" : "#667eea"}
              />
              {item.unreadCount > 0 && (
                <View style={styles.groupIconBadge}>
                  <Badge count={item.unreadCount} size="small" />
                </View>
              )}
            </View>
            <View style={styles.groupInfo}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupName} numberOfLines={1}>
                  {item.groupName}
                </Text>
                <Text style={styles.lastMessageTime}>
                  {formatTime(item.lastMessageTime)}
                </Text>
              </View>
              <View style={styles.groupFooter}>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
                <View style={styles.groupStats}>
                  <View style={styles.memberInfo}>
                    <Ionicons name="people" size={12} color="#718096" />
                    <Text style={styles.memberCount}>
                      {item.memberCount} thành viên
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#cbd5e0" />
          </View>
        </TouchableOpacity>
      );
    },
    [groupTypingUsers, selectGroup]
  );

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isMe =
        item.sender === "me" ||
        (userId && userName && item.senderName === userName);
      const screenWidth = Dimensions.get("window").width;
      const imageWidth = screenWidth * 0.6;
      const maxImageHeight = 150;

      const shouldShowDateSeparator = () => {
        if (index === 0) return true;
        const currentTime = new Date(item.timestamp);
        const prevMessage = currentMessages[index - 1];
        if (!prevMessage) return true;

        const prevTime = new Date(prevMessage.timestamp);

        // So sánh ngày theo UTC (không quan tâm giờ)
        const currentDateUTC = Date.UTC(
          currentTime.getUTCFullYear(),
          currentTime.getUTCMonth(),
          currentTime.getUTCDate()
        );
        const prevDateUTC = Date.UTC(
          prevTime.getUTCFullYear(),
          prevTime.getUTCMonth(),
          prevTime.getUTCDate()
        );

        return currentDateUTC !== prevDateUTC;
      };

      const formatDateSeparator = (timestamp: Date) => {
        const now = new Date();
        const todayUTC = Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate()
        );
        const yesterdayUTC = todayUTC - 24 * 60 * 60 * 1000;

        const tsUTC = Date.UTC(
          timestamp.getUTCFullYear(),
          timestamp.getUTCMonth(),
          timestamp.getUTCDate()
        );

        if (tsUTC === todayUTC) {
          return "Hôm nay";
        } else if (tsUTC === yesterdayUTC) {
          return "Hôm qua";
        } else {
          const dd = String(timestamp.getUTCDate()).padStart(2, "0");
          const mm = String(timestamp.getUTCMonth() + 1).padStart(2, "0");
          const yyyy = String(timestamp.getUTCFullYear());
          return `${dd}/${mm}/${yyyy}`;
        }
      };

      return (
        <View>
          {shouldShowDateSeparator() && (
            <View style={styles.dateSeparatorContainer}>
              <View style={styles.dateSeparatorLine} />
              <Text style={styles.dateSeparatorText}>
                {formatDateSeparator(item.timestamp)}
              </Text>
              <View style={styles.dateSeparatorLine} />
            </View>
          )}

          <View
            style={[
              styles.messageContainer,
              isMe ? styles.myMessageContainer : styles.otherMessageContainer,
            ]}
          >
            {!isMe && (
              <View style={styles.avatarContainer}>
                {item.avatarUrl ? (
                  <Image
                    source={{ uri: item.avatarUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.senderName?.charAt(0)?.toUpperCase() || "U"}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.messageContent}>
              <View style={styles.messageBubbleContainer}>
                <View
                  style={[
                    styles.messageBubble,
                    isMe ? styles.myBubble : styles.otherBubble,
                  ]}
                >
                  {!isMe && (
                    <Text style={styles.senderNameInBubble}>
                      {item.senderName}
                    </Text>
                  )}

                  {item.text && (
                    <Text
                      style={[
                        styles.messageText,
                        isMe ? styles.myText : styles.otherText,
                      ]}
                    >
                      {item.text}
                    </Text>
                  )}

                  {item.media && item.media.length > 0 && (
                    <View style={styles.mediaContainer}>
                      {item.media.map((mediaItem, index) => {
                        const isImage =
                          mediaItem.mime?.startsWith("image/") ||
                          mediaItem.path?.match(
                            /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i
                          ) ||
                          mediaItem.filename?.match(
                            /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i
                          );

                        if (isImage && mediaItem.path) {
                          return (
                            <TouchableOpacity
                              key={`${mediaItem._id}-${index}`}
                              style={styles.imageContainer}
                              onPress={() => openImageViewer(mediaItem.path)}
                              activeOpacity={0.8}
                            >
                              <Image
                                source={{ uri: mediaItem.path }}
                                style={[
                                  styles.messageImage,
                                  {
                                    width: imageWidth,
                                    height: maxImageHeight,
                                  },
                                ]}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          );
                        }

                        return null;
                      })}
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.messageTime,
                    isMe ? styles.messageTimeRight : styles.messageTimeLeft,
                  ]}
                >
                  {formatTime(new Date(item.timestamp))}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [userId, userName, currentMessages]
  );

  const requestMediaPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập",
        "Cần quyền truy cập thư viện ảnh để chọn hình ảnh"
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `image_${Date.now()}.jpg`;

        const mediaItem = {
          uri: asset.uri,
          type: asset.type || "image/jpeg",
          name: fileName,
          title: fileName,
          alt: fileName,
        };

        setSelectedMedia((prev) => [...prev, mediaItem]);
      }
    } catch {
      Alert.alert("Lỗi", "Không thể chọn hình ảnh");
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const openImageViewer = (imageUri: string) => {
    // TODO: Implement image viewer
    console.log("Open image viewer for:", imageUri);
  };

  if (currentView === "groups") {
    return (
      <View style={styles.container}>
        {/* Global toast is rendered at app level */}
        {/* Header */}
        <View
          style={[
            styles.header,
            { paddingTop: Platform.OS === "ios" ? insets.top : 0 },
          ]}
        >
          <Text style={styles.headerTitle}>Tin nhắn</Text>
          <Text style={styles.headerSubtitle}>
            {chatGroups.length} cuộc trò chuyện
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#718096"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#718096" />
            </TouchableOpacity>
          )}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>
              Đang tải danh sách cuộc trò chuyện...
            </Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchChatGroups()}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <FlatList
            data={filteredGroups}
            renderItem={renderChatGroup}
            keyExtractor={(item) => item.id}
            style={styles.groupsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchChatGroups(true)}
                colors={["#667eea"]}
                tintColor="#667eea"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={64}
                  color="#cbd5e0"
                />
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? "Không tìm thấy cuộc trò chuyện nào"
                    : "Chưa có cuộc trò chuyện nào"}
                </Text>
                {!searchQuery && (
                  <Text style={styles.emptySubtext}>
                    Các cuộc trò chuyện sẽ xuất hiện khi bạn tham gia lớp học
                  </Text>
                )}
              </View>
            }
          />
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      {/* Global toast is rendered at app level */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "ios" ? insets.top : 0 },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={goBackToGroups} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {selectedGroup?.groupName}
            </Text>
            <Text style={styles.headerSubtitle}>
              {selectedGroup?.memberCount} thành viên
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={currentMessages}
        renderItem={({ item, index }) => renderMessage({ item, index })}
        keyExtractor={(item, index) => {
          const baseId =
            (typeof item.id === "string" && item.id) ||
            (typeof item.id === "number" && String(item.id)) ||
            "unknown";
          const t =
            item.timestampString || item.timestamp?.toISOString?.() || "t0";
          const sender = item.senderName || "unk";
          return `${baseId}|${t}|${sender}|${index}`;
        }}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        inverted={true}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.1}
        onScroll={({ nativeEvent }) => {
          const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
          const threshold = 48;
          const nearVisualTop =
            contentOffset.y + layoutMeasurement.height >=
            contentSize.height - threshold;
          if (nearVisualTop) {
            loadMoreMessages();
          }
        }}
        scrollEventThrottle={16}
        ListFooterComponent={
          <>
            {loadingMore && <ActivityIndicator size="small" color="#667eea" />}
            {typingUsers.length > 0 && (
              <View style={styles.typingIndicator}>
                <View style={styles.typingBubble}>
                  <Text style={styles.typingText}>
                    {typingUsers.length === 1
                      ? "Đang nhập..."
                      : `${typingUsers.length} người đang nhập...`}
                  </Text>
                </View>
              </View>
            )}
          </>
        }
      />

      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        {selectedMedia.length > 0 && (
          <View style={styles.mediaPreviewContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedMedia.map((media, index) => (
                <View key={index} style={styles.mediaPreviewItem}>
                  <Image
                    source={{ uri: media.uri }}
                    style={styles.mediaPreviewImage}
                  />
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => removeMedia(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#FF6B35" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={pickImage}
            disabled={sendingMessage}
          >
            <Ionicons name="camera" size={24} color="#667eea" />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Nhập tin nhắn..."
            value={inputText}
            onChangeText={(text) => {
              setInputText(text);
              // Handle typing indicators
              if (selectedGroup?.id && text.trim()) {
                // Start typing
                socketContext.startTyping(selectedGroup.id);

                // Clear existing timeout
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }

                // Set timeout to stop typing after 2 seconds of inactivity
                typingTimeoutRef.current = setTimeout(() => {
                  if (selectedGroup?.id) {
                    socketContext.stopTyping(selectedGroup.id);
                  }
                }, 2000) as any;
              } else if (selectedGroup?.id && !text.trim()) {
                // Stop typing immediately if text is empty
                socketContext.stopTyping(selectedGroup.id);
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = null;
                }
              }
            }}
            multiline
            maxLength={500}
            placeholderTextColor="#999"
            editable={!sendingMessage}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() &&
                selectedMedia.length === 0 &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={
              (!inputText.trim() && selectedMedia.length === 0) ||
              sendingMessage
            }
          >
            {sendingMessage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={
                  inputText.trim() || selectedMedia.length > 0 ? "#fff" : "#ccc"
                }
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
