import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
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
import {
  getAllChannels,
  getChannel,
  sendMessage,
} from "@/src/services/chat/chatService";
import { useSocketContext } from "@/src/contexts/SocketContext";
import { eventBus } from "@/src/utils/eventBus";

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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sử dụng global socket context
  const socketContext = useSocketContext();

  // Lắng nghe global socket events
  useEffect(() => {
    // Lắng nghe global message events từ socket context
    const offGlobalMessage = eventBus.on("global:message", (data: any) => {
      console.log("[Instructor Chat] Received global message:", data);

      // Update chat groups list với tin nhắn mới
      setChatGroups((prevGroups) => {
        return prevGroups.map((group) => {
          const isForThisGroup =
            group.id === data.roomId ||
            group.id === data.tenantId ||
            group.groupName === data.className ||
            group.classInfo?.name === data.className;

          if (isForThisGroup) {
            console.log(
              "[Instructor Chat] Updating chat group with global message:",
              group.groupName
            );
            const messageTimestamp = new Date(data.timestamp || Date.now());

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
      if (
        selectedGroup &&
        (selectedGroup.id === data.roomId ||
          selectedGroup.id === data.tenantId ||
          selectedGroup.groupName === data.className ||
          selectedGroup.classInfo?.name === data.className)
      ) {
        console.log("[Instructor Chat] Updating current room messages");

        setConversationMessages((prev) => {
          const conversationKey = selectedGroup.id;
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
            console.log("[Instructor Chat] Message already exists, skipping");
            return prev;
          }

          const messageId = `global-${Date.now()}-${Math.random()}`;
          const messageTimestamp = new Date(data.timestamp || Date.now());

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
            timestampString: data.timestamp,
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
          return prev;
        });
      }
    });

    // Lắng nghe typing events
    const offGlobalTyping = eventBus.on("global:typing", (data: any) => {
      if (data.userId !== userId && data.roomId === selectedGroup?.id) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      }
    });

    const offGlobalStopTyping = eventBus.on(
      "global:stopTyping",
      (data: any) => {
        if (data.userId !== userId && data.roomId === selectedGroup?.id) {
          setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
        }
      }
    );

    return () => {
      offGlobalMessage();
      offGlobalTyping();
      offGlobalStopTyping();
    };
  }, [userId, selectedGroup]);

  const parseApiTimestamp = (timestampString: string) => {
    return new Date(timestampString);
  };

  const fetchChatGroups = async (showRefreshing = false) => {
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

      const transformedGroups: ChatGroup[] = [];

      try {
        const response = await getAllChannels();
        const allChannels = response.data?.data?.data || [];
        if (allChannels && Array.isArray(allChannels)) {
          // Build base groups first
          allChannels.forEach((classItem: any) => {
            transformedGroups.push({
              id: classItem._id,
              groupName: classItem.name || "Lớp học",
              lastMessage: "Chưa có tin nhắn",
              lastMessageTime: new Date(
                classItem.updated_at || classItem.created_at
              ),
              memberCount: (classItem.member?.length || 0) + 1,
              unreadCount: 0,
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

          // Fetch latest message for each class in parallel (page=1, limit=1)
          try {
            const latestResults = await Promise.all(
              transformedGroups.map((g) =>
                getChannel(g.id, 1, 1).catch(() => null)
              )
            );

            latestResults.forEach((res, idx) => {
              const list = res?.data?.data?.data || [];
              const newest =
                Array.isArray(list) && list.length > 0 ? list[0] : null;
              if (newest) {
                const content = newest.content || "";
                const createdAt = newest.created_at || newest.updated_at;
                transformedGroups[idx].lastMessage =
                  content || "(Hình ảnh/Tệp)";
                transformedGroups[idx].lastMessageTime = createdAt
                  ? new Date(createdAt)
                  : transformedGroups[idx].lastMessageTime;
              }
            });
          } catch {}
        }
      } catch (err) {
        console.log("Could not fetch channels:", err);
      }

      setChatGroups(transformedGroups);

      if (transformedGroups.length === 0) {
        setError("Không có kênh chat nào");
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách kênh chat");
      if (!showRefreshing) {
        setChatGroups([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChatGroups();
  }, []);

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

  const filteredGroups = chatGroups.filter((group) =>
    group.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Lấy tin nhắn hiện tại từ conversation được chọn
  const currentMessages =
    selectedGroup?.id && conversationMessages[selectedGroup.id]
      ? conversationMessages[selectedGroup.id].messages
      : [];

  const selectGroup = (group: ChatGroup) => {
    setSelectedGroup(group);
    setCurrentView("chat");

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
  };

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
  }, [currentView, selectedGroup?.id, socketContext]);

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

  const goBackToGroups = () => {
    setCurrentView("groups");
    setSelectedGroup(null);
  };

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
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} giờ trước`;
    } else {
      return date.toLocaleDateString("vi-VN", {
        month: "short",
        day: "numeric",
      });
    }
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

  const loadMoreMessages = () => {
    if (!selectedGroup?.id || loadingMore) return;

    const conversationData = conversationMessages[selectedGroup.id];
    if (!conversationData?.hasMore) return;

    const nextPage = (conversationData?.page || 1) + 1;
    console.log("[Chat][Instructor] loadMore -> next page:", nextPage);
    fetchConversationMessages(selectedGroup.id, nextPage, true);
  };

  const renderChatGroup = ({ item }: { item: ChatGroup }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => selectGroup(item)}
      activeOpacity={0.7}
    >
      <View style={styles.groupItemContent}>
        <View style={[styles.groupIcon, item.isManager && styles.managerIcon]}>
          <Ionicons
            name={item.isManager ? "person-circle" : "people"}
            size={24}
            color={item.isManager ? "#ff6b6b" : "#667eea"}
          />
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
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#cbd5e0" />
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    // Cải thiện logic xác định tin nhắn của mình
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

      // So sánh ngày (không quan tâm giờ)
      const currentDate = new Date(
        currentTime.getFullYear(),
        currentTime.getMonth(),
        currentTime.getDate()
      );
      const prevDate = new Date(
        prevTime.getFullYear(),
        prevTime.getMonth(),
        prevTime.getDate()
      );

      return currentDate.getTime() !== prevDate.getTime();
    };

    const formatDateSeparator = (timestamp: Date) => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const messageDate = new Date(
        timestamp.getFullYear(),
        timestamp.getMonth(),
        timestamp.getDate()
      );

      if (messageDate.getTime() === today.getTime()) {
        return "Hôm nay";
      } else if (messageDate.getTime() === yesterday.getTime()) {
        return "Hôm qua";
      } else {
        return timestamp.toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
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
            </View>
          </View>
        </View>
      </View>
    );
  };

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
        <View style={styles.header}>
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
      <View style={styles.header}>
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
          // ensure uniqueness by including sender and index
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
                  <View style={styles.typingDots}>
                    <View style={[styles.typingDot, styles.typingDot1]} />
                    <View style={[styles.typingDot, styles.typingDot2]} />
                    <View style={[styles.typingDot, styles.typingDot3]} />
                  </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f9ff",
  },
  header: {
    backgroundColor: "#1e40af",
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  headerButton: {
    padding: 5,
  },
  backButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  chatHeaderInfo: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(102, 126, 234, 0.1)",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  groupsList: {
    flex: 1,
  },
  groupItem: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginVertical: 6,
    borderRadius: 16,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(102, 126, 234, 0.1)",
  },
  groupItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  groupIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  managerIcon: {
    backgroundColor: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  groupName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2d3748",
    flex: 1,
    marginRight: 10,
    letterSpacing: 0.3,
  },
  lastMessageTime: {
    fontSize: 12,
    color: "#718096",
    fontWeight: "500",
  },
  groupFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: "#718096",
    flex: 1,
    marginRight: 10,
    fontWeight: "500",
  },
  groupStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberCount: {
    fontSize: 12,
    color: "#718096",
    marginLeft: 4,
    fontWeight: "500",
  },
  unreadBadge: {
    backgroundColor: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCount: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginRight: 8,
    marginTop: 20,
    alignSelf: "flex-end",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1e40af",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e2e8f0",
  },
  avatarText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  messageContent: {
    flex: 1,
    maxWidth: "80%",
  },
  senderName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4a5568",
    marginBottom: 6,
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  senderNameInBubble: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  messageBubbleContainer: {
    flexDirection: "column",
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  myBubble: {
    backgroundColor: "#1e40af",
    borderBottomRightRadius: 6,
    alignSelf: "flex-end",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  otherBubble: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(30, 64, 175, 0.1)",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
  },
  myText: {
    color: "#fff",
    fontWeight: "600",
  },
  otherText: {
    color: "#212529",
    fontWeight: "500",
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 6,
    marginHorizontal: 8,
    fontWeight: "500",
  },
  myTimestamp: {
    color: "#718096",
    textAlign: "right",
  },
  otherTimestamp: {
    color: "#718096",
    textAlign: "left",
  },
  inputContainer: {
    flexDirection: "column",
    padding: 16,
    backgroundColor: "#f0f9ff",
    borderTopWidth: 1,
    borderTopColor: "rgba(30, 64, 175, 0.1)",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(30, 64, 175, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mediaPreviewContainer: {
    marginBottom: 12,
    maxHeight: 80,
  },
  mediaPreviewItem: {
    position: "relative",
    marginRight: 8,
  },
  mediaPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  removeMediaButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(30, 64, 175, 0.2)",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: "#ffffff",
    fontWeight: "500",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1e40af",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: "#e2e8f0",
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 64,
    minHeight: 200,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
  },
  mediaContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  imageContainer: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  messageImage: {
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  imageViewerCloseButton: {
    alignSelf: "flex-end",
    padding: 10,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  imageViewerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
  imageViewerFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
  },
  imageViewerInfo: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.8,
    textAlign: "center",
  },
  dateSeparatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    marginHorizontal: 20,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(102, 126, 234, 0.2)",
  },
  dateSeparatorText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: "700",
    color: "#1e40af",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    letterSpacing: 0.5,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "flex-start",
  },
  typingBubble: {
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "70%",
  },
  typingText: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#999",
    marginHorizontal: 1,
  },
  typingDot1: {
    opacity: 1,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 0.4,
  },
});
