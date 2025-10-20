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
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getChannel, sendMessage } from "@/src/services/chat/chatService";
import { showErrorToast } from "@/src/utils/errorHandler";
// import { getClassroomLearningProgress } from "@/src/services/learning_process/course/courseService";
import { useSocketContext } from "@/src/contexts/SocketContext";
import { useUnreadMessages } from "@/src/contexts/UnreadMessagesContext";
import { eventBus } from "@/src/utils/eventBus";
import { Badge } from "@/src/components/ui";
import { MembersBottomSheet } from "@/src/components/layout/sheet/MembersBottomSheet";
import { ClassInfoBottomSheet } from "@/src/components/layout/sheet/ClassInfoBottomSheet";
import { styles } from "@/src/screens/instructor/chat/style";

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

interface ConversationMessages {
  [conversationId: string]: {
    messages: Message[];
    page: number;
    hasMore: boolean;
    lastFetch?: Date;
  };
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [currentView, setCurrentView] = useState<"groups" | "chat">("groups");
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [conversationMessages, setConversationMessages] =
    useState<ConversationMessages>({});
  const [loadingMore, setLoadingMore] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [, setUserName] = useState<string | null>(null);
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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const socketContext = useSocketContext();
  const { markChannelAsViewed, channels, refreshChannels } =
    useUnreadMessages();

  useEffect(() => {
    const getUserId = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (userString) {
          const userObj = JSON.parse(userString);
          setUserId(userObj?.id || userObj?._id || null);
          setUserName(userObj?.username || userObj?.name || null);
        }
      } catch {}
    };
    getUserId();
  }, []);

  const parseApiTimestamp = (timestampString: string) =>
    new Date(timestampString);

  const fetchChatGroups = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);
        setError(null);
        const tenantString = await AsyncStorage.getItem("tenant");
        const token = await AsyncStorage.getItem("loginToken");
        if (!tenantString || !token) {
          setLoading(false);
          return;
        }
        await refreshChannels();
      } catch (err: any) {
        setError(err.message || "Không thể tải danh sách kênh chat");
        if (!showRefreshing) setChatGroups([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [refreshChannels]
  );

  useEffect(() => {
    if (channels && Array.isArray(channels)) {
      const transformed: ChatGroup[] = [];
      channels.forEach((c: any) => {
        let unreadCount = 0;
        if (typeof c.is_viewed === "boolean") unreadCount = c.is_viewed ? 0 : 1;
        else if (c.latest_message) {
          const viewedAtMs = c.viewed_at ? new Date(c.viewed_at).getTime() : 0;
          const latestAtMs = new Date(c.latest_message.created_at).getTime();
          unreadCount = latestAtMs > viewedAtMs ? 1 : 0;
        }
        transformed.push({
          id: c._id,
          groupName: c.name || "Lớp học",
          lastMessage: c.latest_message?.content || "Chưa có tin nhắn",
          lastMessageTime: new Date(
            c.latest_message?.created_at || c.updated_at || c.created_at
          ),
          memberCount: (c.member?.length || 0) + 1,
          unreadCount,
          isManager: false,
          conversationType: ["class"],
          classInfo: { id: c._id, name: c.name, course: c.course },
          createdAt: new Date(c.created_at),
          updatedAt: new Date(c.updated_at),
        });
      });
      setChatGroups(transformed);
      if (transformed.length === 0) setError("Không có kênh chat nào");
      else setError(null);
    } else setChatGroups([]);
  }, [channels]);

  useEffect(() => {
    fetchChatGroups();
  }, [fetchChatGroups]);

  const filteredGroups = useMemo(
    () =>
      chatGroups.filter((g) =>
        g.groupName.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [chatGroups, searchQuery]
  );

  const currentMessages = useMemo(
    () =>
      selectedGroup?.id && conversationMessages[selectedGroup.id]
        ? conversationMessages[selectedGroup.id].messages
        : [],
    [selectedGroup?.id, conversationMessages]
  );

  useEffect(() => {
    if (!selectedGroup) return;
    markChannelAsViewed(selectedGroup.id);
    const conversationData = conversationMessages[selectedGroup.id];
    const shouldFetch =
      !conversationData ||
      !conversationData.lastFetch ||
      Date.now() - conversationData.lastFetch.getTime() > 5 * 60 * 1000;
    if (shouldFetch) fetchConversationMessages(selectedGroup.id, 1, false);
  }, [selectedGroup?.id, conversationMessages, markChannelAsViewed]);

  const selectGroup = useCallback(
    (group: ChatGroup) => {
      setSelectedGroup(group);
      setCurrentView("chat");
      markChannelAsViewed(group.id);
      setChatGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, unreadCount: 0 } : g))
      );
      const conversationData = conversationMessages[group.id];
      const shouldFetch =
        !conversationData ||
        !conversationData.lastFetch ||
        Date.now() - conversationData.lastFetch.getTime() > 5 * 60 * 1000;
      if (shouldFetch) fetchConversationMessages(group.id, 1, false);
    },
    [markChannelAsViewed, conversationMessages]
  );

  const goBackToGroups = useCallback(() => {
    setCurrentView("groups");
    setSelectedGroup(null);
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() && selectedMedia.length === 0) return;
    if (!selectedGroup) return;
    try {
      setSendingMessage(true);
      const messageText = inputText.trim();
      const now = new Date();
      const messageTimestamp = new Date(now.getTime() + 7 * 60 * 60 * 1000);

      setChatGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.id === selectedGroup.id
            ? {
                ...group,
                lastMessage: messageText,
                lastMessageTime: messageTimestamp,
              }
            : group
        )
      );

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
      eventBus.emit("chat:markViewed", selectedGroup.id);

      setInputText("");
      setSelectedMedia([]);
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (err: any) {
      showErrorToast(err, {
        title: "Lỗi gửi tin nhắn",
        message: err.message || "Không thể gửi tin nhắn",
      });
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
      if (!Array.isArray(rawMessages)) return;

      const mapped = rawMessages.map((msg: any, idx: number) => {
        let baseId = msg._id ? String(msg._id) : "";
        let created = msg.created_at ? String(msg.created_at) : "";
        let uniqueKey = `${baseId}-${created}-p${pageNum}-i${idx}`;
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
            ? msg.media.map((m: any) => ({
                _id: m._id || `media_${Date.now()}_${Math.random()}`,
                filename: m.filename || "Unknown file",
                path: m.path || "",
                mime: m.mime || "application/octet-stream",
                title: m.title || m.filename || "Media file",
                alt: m.alt || m.title || m.filename,
                size: m.size || 0,
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
      showErrorToast(e, {
        title: "Lỗi tải tin nhắn",
        message: "Không thể tải tin nhắn",
      });
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
    fetchConversationMessages(selectedGroup.id, nextPage, true);
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

  const removeMedia = (index: number) =>
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));

  const openImageViewer = (imageUri: string) => {
    console.log("Open image viewer for:", imageUri);
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
    [selectGroup]
  );

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isMe =
        item.sender === "me" || (userId && item.senderName === userId);
      const screenWidth = Dimensions.get("window").width;
      const imageWidth = screenWidth * 0.6;
      const maxImageHeight = 150;
      const shouldShowDateSeparator = () => {
        if (index === 0) return true;
        const currentTime = item.timestamp;
        const prevMessage = currentMessages[index - 1];
        if (!prevMessage) return true;
        const prevTime = prevMessage.timestamp;
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
      const formatDateSeparator = (ts: Date) => {
        const now = new Date();
        const todayUTC = Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate()
        );
        const yesterdayUTC = todayUTC - 24 * 60 * 60 * 1000;
        const tsUTC = Date.UTC(
          ts.getUTCFullYear(),
          ts.getUTCMonth(),
          ts.getUTCDate()
        );
        if (tsUTC === todayUTC) return "Hôm nay";
        if (tsUTC === yesterdayUTC) return "Hôm qua";
        const dd = String(ts.getUTCDate()).padStart(2, "0");
        const mm = String(ts.getUTCMonth() + 1).padStart(2, "0");
        const yyyy = String(ts.getUTCFullYear());
        return `${dd}/${mm}/${yyyy}`;
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
                      {item.media.map((mediaItem, i) => {
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
                              key={`${mediaItem._id}-${i}`}
                              style={styles.imageContainer}
                              onPress={() => openImageViewer(mediaItem.path)}
                              activeOpacity={0.8}
                            >
                              <Image
                                source={{ uri: mediaItem.path }}
                                style={[
                                  styles.messageImage,
                                  { width: imageWidth, height: maxImageHeight },
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
                  {formatTime(item.timestamp)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [userId, currentMessages]
  );

  if (currentView === "groups") {
    return (
      <View style={styles.container}>
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
              <Ionicons name="close-circle" size={20} color="#999" />
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
      keyboardVerticalOffset={Platform.OS === "ios" ? tabBarHeight || 0 : 0}
    >
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "ios" ? insets.top : 0 },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => setCurrentView("groups")}
            style={styles.backButton}
          >
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
        scrollEventThrottle={16}
        ListFooterComponent={
          <>
            {loadingMore && <ActivityIndicator size="small" color="#667eea" />}
          </>
        }
      />
      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: Math.max(
              insets.bottom + (tabBarHeight || 0) + 24,
              32
            ),
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
              if (selectedGroup?.id && text.trim()) {
                socketContext.startTyping(selectedGroup.id);
                if (typingTimeoutRef.current)
                  clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  if (selectedGroup?.id)
                    socketContext.stopTyping(selectedGroup.id);
                }, 2000) as any;
              } else if (selectedGroup?.id && !text.trim()) {
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
      <ClassInfoBottomSheet
        visible={false}
        onClose={() => {}}
        classData={null}
        className={selectedGroup?.groupName || ""}
        memberCount={selectedGroup?.memberCount || 0}
      />
      <MembersBottomSheet
        visible={false}
        onClose={() => {}}
        members={[]}
        className={selectedGroup?.groupName || ""}
      />
    </KeyboardAvoidingView>
  );
}
