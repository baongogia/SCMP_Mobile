import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  Alert,
  ImageBackground,
  StyleProp,
  TextStyle,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { styles, chatColors } from "./style";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors, IMAGES } from "@/src/constants";
import { showErrorToast } from "@/src/utils/errorHandler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/src/constants/config";
import {
  chatDatabaseService,
  ChatMessage as DBChatMessage,
  Conversation,
} from "@/src/services/chat/chatDatabaseService";
import {
  createLearningPath,
  getLearningPath,
} from "@/src/services/learning_process/learning_path/learningPathServices";
import { getAllCourses } from "@/src/services/learning_process/course/courseService";
import PreviewLearningPath from "@/src/components/modal/chat/PreviewLearningPath";
import { handleSendMessage as handleSendMessageUtil } from "@/src/utils/handleSendMessage";
import { useUserInfo } from "@/src/hooks/useUserInfo";

type LearningPathStep = {
  title: string;
  course: string;
  courseTitle?: string;
  courseDescription?: string;
};

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
  isTyping?: boolean;
  analysisText?: string; // Temporary analysis text shown during typing
  learningPathId?: string; // ID of learning path if this message created one
  learningPathData?: {
    id: string;
    title: string;
    process: LearningPathStep[];
  }; // Full learning path data for preview
}

type ChatType = "learningPath" | "consultation";

interface RouteParams {
  type: ChatType;
}

const isLikelyId = (value?: string | null) => {
  if (!value) return false;
  const trimmed = value.trim();
  return /^[0-9a-f]{12,}$/i.test(trimmed);
};

const getDisplayTitle = (step: LearningPathStep) => {
  if (step.courseTitle && !isLikelyId(step.courseTitle))
    return step.courseTitle;
  if (step.title && !isLikelyId(step.title)) return step.title;
  return "Khóa học";
};

const getDisplayDescription = (
  step: LearningPathStep,
  displayTitle: string
) => {
  if (step.courseDescription && !isLikelyId(step.courseDescription)) {
    return step.courseDescription;
  }
  if (
    step.courseTitle &&
    !isLikelyId(step.courseTitle) &&
    step.courseTitle !== displayTitle
  ) {
    return step.courseTitle;
  }
  if (step.title && !isLikelyId(step.title) && step.title !== displayTitle) {
    return step.title;
  }
  return undefined;
};

// Quick Actions data based on chatType
const getQuickActions = (chatType: ChatType) => {
  if (chatType === "learningPath") {
    return [
      {
        icon: "calendar",
        text: "Lịch tập tuần",
        message: "Gợi ý lịch tập bơi 4 buổi/tuần",
      },
      {
        icon: "body",
        text: "Khởi động khô",
        message: "Chỉ mình chuỗi khởi động trước khi xuống nước",
      },
      {
        icon: "water",
        text: "Kỹ thuật thở chuẩn",
        message: "Hướng dẫn bài tập thở cơ bản cho người mới",
      },
      {
        icon: "walk",
        text: "Drill trượt nước",
        message: "Cho mình drill trượt nước giữ thân nổi",
      },
      {
        icon: "speedometer",
        text: "Tăng sức bền",
        message: "Thiết kế bài tập tăng sức bền 800m",
      },
    ];
  }

  return [
    {
      icon: "chatbubbles",
      text: "Hỏi HLV ngay",
      message: "Mình cần HLV tư vấn lỗi đạp chân bơi sải",
    },
    {
      icon: "medkit",
      text: "Phục hồi",
      message: "Gợi ý bài phục hồi nhẹ sau buổi bơi nặng",
    },
    {
      icon: "help-circle",
      text: "Sửa kỹ thuật thở khi bơi",
      message: "Phân tích giúp mình lỗi thở khi bơi ếch",
    },
    {
      icon: "shield-checkmark",
      text: "An toàn nước",
      message: "Nhắc mình checklist an toàn trước khi bơi biển",
    },
    {
      icon: "construct",
      text: "Điều chỉnh giáo án",
      message: "Tư vấn điều chỉnh giáo án khi bị đau vai",
    },
  ];
};

// Popular Topics data based on chatType
const getPopularTopics = (chatType: ChatType) => {
  if (chatType === "learningPath") {
    return [
      {
        icon: "ribbon",
        title: "Lộ trình bơi sải 6 tuần từ nhập môn tới 400m",
        message: "Lập giúp mình lộ trình bơi sải trong 6 tuần",
      },
      {
        icon: "barbell",
        title: "Dryland tăng sức mạnh vai",
        message: "Gợi ý combo dryland giúp vai khỏe hơn khi bơi",
      },
    ];
  }

  return [
    {
      icon: "alert-circle",
      title: "Sửa lỗi ngẩng đầu khi bơi ếch",
      message: "Phân tích và sửa lỗi ngẩng đầu khi bơi ếch",
    },
    {
      icon: "medical",
      title: "Xử lý chuột rút và căng cơ sau lúc bơi xa",
      message: "Tư vấn phục hồi khi bị chuột rút lúc bơi",
    },
  ];
};

// Empty State Component with greeting, quick actions, and popular topics
const EmptyStateComponent = ({
  chatType,
  config,
  fadeAnim,
  onActionPress,
  topInset,
  onMenuPress,
  inputText,
  setInputText,
  handleSendMessage,
  isLoading,
  sendButtonScale,
  bottomInset,
}: {
  chatType: ChatType;
  config: {
    title: string;
    icon: string;
    placeholder: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyIcon: string;
  };
  fadeAnim: Animated.Value;
  onActionPress: (message: string) => void;
  topInset: number;
  onMenuPress: () => void;
  inputText: string;
  setInputText: (text: string) => void;
  handleSendMessage: () => void;
  isLoading: boolean;
  sendButtonScale: Animated.Value;
  bottomInset: number;
}) => {
  const { userInfo } = useUserInfo();
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const greetingTranslateY = useRef(new Animated.Value(20)).current;
  const quickActionsOpacity = useRef(new Animated.Value(0)).current;
  const quickActionsTranslateY = useRef(new Animated.Value(30)).current;
  const topicsOpacity = useRef(new Animated.Value(0)).current;
  const topicsTranslateY = useRef(new Animated.Value(30)).current;

  const quickActions = getQuickActions(chatType);
  const popularTopics = getPopularTopics(chatType);

  const userName = userInfo?.username || userInfo?.name || "Bạn";
  const displayName = userName.split(" ")[0] || userName;

  useEffect(() => {
    // Greeting animation
    Animated.parallel([
      Animated.timing(greetingOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(greetingTranslateY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Quick actions animation (staggered)
    Animated.parallel([
      Animated.timing(quickActionsOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(quickActionsTranslateY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Popular topics animation
    Animated.parallel([
      Animated.timing(topicsOpacity, {
        toValue: 1,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.spring(topicsTranslateY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.emptyStateContainer}>
      <ScrollView
        style={styles.emptyStateScrollView}
        contentContainerStyle={styles.emptyStateScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Section - No gradient, use mainBackground */}
        <View style={styles.gradientContainer}>
          <View style={styles.greetingSection}>
            {/* Menu Button */}
            <TouchableOpacity
              style={[styles.emptyStateMenuButton, { top: topInset + 16 }]}
              onPress={onMenuPress}
              activeOpacity={0.7}
            >
              <View style={styles.emptyStateMenuIcon}>
                <Ionicons name="menu" size={24} color={colors.white} />
              </View>
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.greetingContainer,
                {
                  opacity: greetingOpacity,
                  transform: [{ translateY: greetingTranslateY }],
                  paddingTop: topInset + 60,
                },
              ]}
            >
              <Text style={styles.greetingTitle}>Xin chào, {displayName}!</Text>
              <Text style={styles.greetingSubtitle}>
                Tôi có thể giúp gì cho bạn?
              </Text>
              <Text style={styles.greetingDescription}>
                Trợ lý Swim Coach luôn sẵn sàng.
              </Text>
            </Animated.View>
          </View>

          {/* Quick Actions Section - On Gradient Background */}
          <View style={styles.quickActionsSection}>
            <Animated.View
              style={[
                styles.quickActionsContainer,
                {
                  opacity: quickActionsOpacity,
                  transform: [{ translateY: quickActionsTranslateY }],
                },
              ]}
            >
              {/* First row: 2 buttons */}
              <View style={styles.quickActionsRow}>
                {quickActions.slice(0, 2).map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickActionButton}
                    onPress={() => onActionPress(action.message)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.quickActionIcon}>
                      <Ionicons
                        name={action.icon as any}
                        size={20}
                        color={colors.white}
                      />
                    </View>
                    <Text style={styles.quickActionText} numberOfLines={1}>
                      {action.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Second row: 2 buttons */}
              <View style={styles.quickActionsRow}>
                {quickActions.slice(2, 4).map((action, index) => (
                  <TouchableOpacity
                    key={index + 2}
                    style={styles.quickActionButton}
                    onPress={() => onActionPress(action.message)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.quickActionIcon}>
                      <Ionicons
                        name={action.icon as any}
                        size={20}
                        color={colors.white}
                      />
                    </View>
                    <Text style={styles.quickActionText} numberOfLines={1}>
                      {action.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Third row: 1 centered button */}
              <View style={styles.quickActionsRowCentered}>
                {quickActions.slice(4, 5).map((action, index) => (
                  <TouchableOpacity
                    key={index + 4}
                    style={styles.quickActionButton}
                    onPress={() => onActionPress(action.message)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.quickActionIcon}>
                      <Ionicons
                        name={action.icon as any}
                        size={20}
                        color={colors.white}
                      />
                    </View>
                    <Text style={styles.quickActionText} numberOfLines={1}>
                      {action.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </View>
        </View>
      </ScrollView>

      {/* Popular Topics Section - Fixed above input bar */}
      <View style={styles.popularTopicsSection}>
        <Animated.View
          style={[
            styles.popularTopicsContainer,
            {
              opacity: topicsOpacity,
              transform: [{ translateY: topicsTranslateY }],
            },
          ]}
        >
          <View style={styles.popularTopicsHeader}>
            <Text style={styles.popularTopicsTitle}>Popular topics</Text>
            <TouchableOpacity>
              <Text style={styles.popularTopicsSeeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.popularTopicsCards}>
            {popularTopics.map((topic, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.popularTopicCard,
                  index === popularTopics.length - 1 &&
                    styles.popularTopicCardLast,
                ]}
                onPress={() => onActionPress(topic.message)}
                activeOpacity={0.8}
              >
                <View style={styles.popularTopicIcon}>
                  <Ionicons
                    name={topic.icon as any}
                    size={24}
                    color={colors.white}
                  />
                </View>
                <Text style={styles.popularTopicText}>{topic.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>

      {/* Input Bar - Fixed at bottom */}
      <View style={[styles.inputContainer]}>
        <View style={styles.inputWrapper}>
          <View style={styles.inputField}>
            <TextInput
              style={styles.input}
              placeholder={config.placeholder}
              placeholderTextColor={chatColors.inputPlaceholder}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.microphoneButton}
              onPress={() => {
                // Voice input functionality - placeholder
                Alert.alert("Voice Input", "Voice input will be implemented");
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="pulse" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Animated.View
            style={{
              transform: [{ scale: sendButtonScale }],
            }}
          >
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

// Quick Reply Suggestions Component
const QuickReplySuggestions = ({
  suggestions,
  onSuggestionPress,
  onSharePress,
}: {
  suggestions: { icon: string; text: string; message: string }[];
  onSuggestionPress: (message: string) => void;
  onSharePress?: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <View style={styles.quickReplyContainer}>
      <TouchableOpacity
        style={styles.quickReplyHeader}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.quickReplyTitle}>Quick reply suggestions</Text>
        <Ionicons
          name={isExpanded ? "chevron-down" : "chevron-up"}
          size={16}
          color={chatColors.aiBubbleText}
        />
      </TouchableOpacity>
      {isExpanded && (
        <>
          <View style={styles.quickReplySuggestions}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickReplyItem}
                onPress={() => onSuggestionPress(suggestion.message)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={suggestion.icon as any}
                  size={20}
                  color={chatColors.aiBubbleText}
                  style={styles.quickReplyIcon}
                />
                <Text style={styles.quickReplyText}>{suggestion.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {onSharePress && (
            <TouchableOpacity
              style={styles.quickReplyShareButton}
              onPress={onSharePress}
              activeOpacity={0.7}
            >
              <Text style={styles.quickReplyShareText}>Share</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

// Typing indicator component - 3 dots bouncing animation
const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation for each dot with staggered delay
    const createDotAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createDotAnimation(dot1, 0);
    const anim2 = createDotAnimation(dot2, 150);
    const anim3 = createDotAnimation(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  const dot1TranslateY = dot1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const dot2TranslateY = dot2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const dot3TranslateY = dot3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 4,
        paddingTop: 8,
        gap: 4,
      }}
    >
      <Animated.View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: chatColors.aiBubbleText,
          opacity: 0.6,
          transform: [{ translateY: dot1TranslateY }],
        }}
      />
      <Animated.View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: chatColors.aiBubbleText,
          opacity: 0.6,
          transform: [{ translateY: dot2TranslateY }],
        }}
      />
      <Animated.View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: chatColors.aiBubbleText,
          opacity: 0.6,
          transform: [{ translateY: dot3TranslateY }],
        }}
      />
    </View>
  );
};

// Helper function to parse markdown **text** to bold
const renderInlineMarkdown = (text: string): React.ReactNode => {
  if (!text) return "";

  // Check if text contains markdown
  if (!text.includes("**")) {
    return text;
  }

  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      if (beforeText) {
        parts.push(<Text key={key++}>{beforeText}</Text>);
      }
    }

    // Add bold text
    if (match[1]) {
      parts.push(
        <Text key={key++} style={{ fontWeight: "700" }}>
          {match[1]}
        </Text>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(<Text key={key++}>{remainingText}</Text>);
    }
  }

  // If no parts were added, return original text
  if (parts.length === 0) {
    return text;
  }

  return <>{parts}</>;
};

const renderMarkdownText = (
  text: string,
  textStyle: StyleProp<TextStyle>
): React.ReactNode => {
  if (!text) return null;

  const toArray = (style?: StyleProp<TextStyle>): any[] => {
    if (!style) return [];
    return Array.isArray(style) ? style : [style];
  };

  const baseStyles = toArray(textStyle);
  const applyStyles = (...extra: StyleProp<TextStyle>[]): any[] => [
    ...baseStyles,
    ...extra.flatMap((style) => toArray(style)),
  ];

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((rawLine, index) => {
    const line = rawLine.replace(/\t/g, "    ");
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      elements.push(
        <View key={`space-${index}`} style={styles.markdownSpacer} />
      );
      return;
    }

    if (/^###\s+/.test(trimmed)) {
      elements.push(
        <Text key={`h3-${index}`} style={applyStyles(styles.markdownHeading3)}>
          {renderInlineMarkdown(trimmed.replace(/^###\s+/, ""))}
        </Text>
      );
      return;
    }

    if (/^##\s+/.test(trimmed)) {
      elements.push(
        <Text key={`h2-${index}`} style={applyStyles(styles.markdownHeading2)}>
          {renderInlineMarkdown(trimmed.replace(/^##\s+/, ""))}
        </Text>
      );
      return;
    }

    if (/^#\s+/.test(trimmed)) {
      elements.push(
        <Text key={`h1-${index}`} style={applyStyles(styles.markdownHeading1)}>
          {renderInlineMarkdown(trimmed.replace(/^#\s+/, ""))}
        </Text>
      );
      return;
    }

    if (/^-\s+/.test(trimmed)) {
      elements.push(
        <View key={`li-${index}`} style={styles.markdownListItem}>
          <Text style={applyStyles(styles.markdownListBullet)}>•</Text>
          <Text style={applyStyles(styles.markdownListText)}>
            {renderInlineMarkdown(trimmed.replace(/^-+\s*/, ""))}
          </Text>
        </View>
      );
      return;
    }

    elements.push(
      <Text key={`p-${index}`} style={applyStyles(styles.markdownParagraph)}>
        {renderInlineMarkdown(trimmed)}
      </Text>
    );
  });

  return elements;
};

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const params = (route.params as RouteParams) || { type: "consultation" };
  const chatType: ChatType = params.type || "consultation";
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] =
    useState<Conversation | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawerAnim = useRef(new Animated.Value(-1)).current; // -1 = hidden, 0 = visible
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoScrollFrameRef = useRef<ReturnType<
    typeof requestAnimationFrame
  > | null>(null);
  const initialScrollDoneRef = useRef(false);
  const autoScrollEnabledRef = useRef(true);
  const [inputContainerHeight, setInputContainerHeight] = useState(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const scrollButtonAnim = useRef(new Animated.Value(0)).current;

  // Learning Path suggestion & creation states
  const [pendingSuggestion, setPendingSuggestion] = useState<{
    title: string;
    process: { title: string; course?: string }[];
    sourceMessageId: string;
  } | null>(null);
  const [isCreatingLP, setIsCreatingLP] = useState(false);
  const [previewLP, setPreviewLP] = useState<{
    id: string;
    title: string;
    process: LearningPathStep[];
  } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [successLP, setSuccessLP] = useState<{
    id: string;
    title: string;
    process?: LearningPathStep[];
  } | null>(null);
  const coursesCacheRef = useRef<{ _id: string; title: string }[] | null>(null);
  // Store recommendations directly from API response
  const recommendationsRef = useRef<any[] | null>(null);
  // Track message actions (copied, liked, disliked)
  const [messageActions, setMessageActions] = useState<{
    [messageId: string]: {
      copied: boolean;
      liked: boolean;
      disliked: boolean;
    };
  }>({});

  const chatConfig = {
    learningPath: {
      title: "Tạo lộ trình học tập",
      icon: "map" as const,
      placeholder: "Type a message...",
      emptyTitle: "Tạo lộ trình học tập thông minh",
      emptyDescription:
        "Chia sẻ mục tiêu và trình độ của bạn, AI sẽ thiết kế lộ trình học tập cá nhân hóa phù hợp nhất",
      emptyIcon: "sparkles" as const,
    },
    consultation: {
      title: "Tư vấn học tập",
      icon: "aperture-outline" as const,
      placeholder: "Type a message...",
      emptyTitle: "Tư vấn học tập 24/7",
      emptyDescription:
        "Đặt bất kỳ câu hỏi nào về học tập, AI trợ lý thông minh sẽ giải đáp chi tiết và đưa ra lời khuyên hữu ích",
      emptyIcon: "bulb" as const,
    },
  };

  const config = chatConfig[chatType];

  // Initialize database - don't auto-load messages, start with empty conversation
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Initialize database
        await chatDatabaseService.initDatabase();
        // Load conversations for drawer
        await loadConversations();
        // Restore last opened conversation for this chat type
        try {
          const lastKey = `AI_CHAT_LAST_CONV_${chatType}`;
          const lastId = await AsyncStorage.getItem(lastKey);
          if (lastId) {
            const convMessages = await chatDatabaseService.loadMessages(
              chatType,
              String(lastId)
            );
            if (convMessages && convMessages.length > 0) {
              // Load learningPathData from AsyncStorage for each message
              const uiMessages: Message[] = await Promise.all(
                convMessages.map(async (msg) => {
                  const message: Message = {
                    id: msg.id,
                    text: msg.text || "",
                    isUser: msg.isUser,
                    timestamp: new Date(msg.timestamp),
                    isTyping: false,
                  };

                  // Try to load learningPathData from AsyncStorage
                  try {
                    const lpDataKey = `LP_DATA_${msg.id}`;
                    const lpDataStr = await AsyncStorage.getItem(lpDataKey);
                    if (lpDataStr) {
                      const lpData = JSON.parse(lpDataStr);
                      message.learningPathData = lpData;
                      message.learningPathId = lpData?.id;
                    }
                  } catch {
                    // Ignore errors
                  }

                  return message;
                })
              );
              setMessages(uiMessages);
              setCurrentConversationId(String(lastId));
            }
          }
        } catch {
          // ignore restore errors
        }
      } catch (error) {
        console.error("❌ Error initializing chat:", error);
      }
    };

    initializeChat();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatType]);

  useEffect(() => {
    if (messages.length === 0) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({
          offset: 0,
          animated: false,
        });
      });
    }
  }, [messages.length]);

  useEffect(() => {
    if (chatType !== "learningPath") {
      if (pendingSuggestion) {
        setPendingSuggestion(null);
      }
      return;
    }

    if (messages.length === 0) {
      if (pendingSuggestion) {
        setPendingSuggestion(null);
      }
      return;
    }

    let restoredSuggestion: {
      title: string;
      process: { title: string; course?: string }[];
      sourceMessageId: string;
    } | null = null;

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (!msg || msg.isTyping) continue;
      if (msg.isUser) continue;

      const text = (msg.text || "").trim();
      if (!text) continue;

      const lowerText = text.toLowerCase();
      if (
        msg.learningPathId ||
        msg.learningPathData ||
        lowerText.includes("đã tạo lộ trình")
      ) {
        restoredSuggestion = null;
        break;
      }

      const suggestion = extractLearningPathSuggestion(text);
      if (suggestion && suggestion.process.length > 0) {
        restoredSuggestion = {
          ...suggestion,
          sourceMessageId: msg.id,
        };
        break;
      }
    }

    if (
      restoredSuggestion &&
      restoredSuggestion.sourceMessageId !== pendingSuggestion?.sourceMessageId
    ) {
      setPendingSuggestion(restoredSuggestion);
    } else if (!restoredSuggestion && pendingSuggestion) {
      setPendingSuggestion(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, chatType]);

  useEffect(() => {
    initialScrollDoneRef.current = false;
  }, [chatType, currentConversationId]);

  useEffect(() => {
    return () => {
      if (autoScrollFrameRef.current) {
        cancelAnimationFrame(autoScrollFrameRef.current);
        autoScrollFrameRef.current = null;
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    };
  }, []);

  // Handler for copy action with animation
  const handleCopyAction = async (messageId: string, text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setMessageActions((prev) => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          copied: true,
        },
      }));
      // Reset copy icon after 2 seconds
      setTimeout(() => {
        setMessageActions((prev) => ({
          ...prev,
          [messageId]: {
            ...prev[messageId],
            copied: false,
          },
        }));
      }, 2000);
    } catch (error) {
      console.error("❌ Error copying message:", error);
    }
  };

  // Handler for like action
  const handleLikeMessage = (messageId: string) => {
    setMessageActions((prev) => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        liked: !prev[messageId]?.liked,
        disliked: false, // Dislike is mutually exclusive
      },
    }));
  };

  // Handler for dislike action
  const handleDislikeMessage = (messageId: string) => {
    setMessageActions((prev) => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        disliked: !prev[messageId]?.disliked,
        liked: false, // Like is mutually exclusive
      },
    }));
  };

  // Handler for reload - resend previous user message
  const handleReloadMessage = async (currentMessageIndex: number) => {
    // Find the previous user message before this AI message
    let previousUserMessage: Message | null = null;
    for (let i = currentMessageIndex - 1; i >= 0; i--) {
      if (messages[i]?.isUser) {
        previousUserMessage = messages[i];
        break;
      }
    }

    if (previousUserMessage && previousUserMessage.text) {
      // Resend the previous user message
      await handleSendMessage(previousUserMessage.text);
    }
  };

  const handleSendMessage = async (suggestedText?: string) => {
    const messageText = suggestedText || inputText.trim();
    if (!messageText || isLoading) return;

    // Immediately add user message to state to prevent empty state from showing
    // This ensures the UI updates before async operations
    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    // Update messages immediately to hide empty state
    setMessages((prev) => {
      // Check if message already exists to avoid duplicates
      if (prev.some((m) => m.id === userMessageId)) {
        return prev;
      }
      return [...prev, userMessage];
    });

    // Then call the async handler (it will also add the message, but we check for duplicates)
    await handleSendMessageUtil({
      suggestedText,
      inputText,
      isLoading,
      sendButtonScale,
      setMessages: (updater) => {
        // Custom setter that prevents duplicates
        setMessages((prev) => {
          const updated =
            typeof updater === "function" ? updater(prev) : updater;
          // Remove duplicates based on id
          const seen = new Set();
          return updated.filter((msg) => {
            if (seen.has(msg.id)) return false;
            seen.add(msg.id);
            return true;
          });
        });
      },
      currentConversationId,
      setCurrentConversationId,
      chatType,
      messages: [...messages, userMessage], // Pass updated messages
      setInputText,
      setIsLoading,
      flatListRef,
      typingTimeoutRef,
      showDrawer,
      loadConversations,
      getTenantId,
      recommendationsRef,
      coursesCacheRef,
      createLearningPathFromRecommendations,
      extractLearningPathSuggestion,
      setPendingSuggestion,
      prefilledUserMessage: userMessage,
      skipAddingUserMessage: true,
    });
  };

  const MessageItem = React.memo(
    ({
      item,
      index,
      chatTypeProp,
      totalMessages,
      onLongPress,
      onPress,
      onSuggestionPress,
      messageActions,
      onCopy,
      onLike,
      onDislike,
      onReload,
    }: {
      item: Message;
      index: number;
      chatTypeProp: ChatType;
      totalMessages: number;
      onLongPress: (message: Message) => void;
      onPress?: (message: Message) => void;
      onSuggestionPress?: (message: string) => void;
      messageActions: {
        [messageId: string]: {
          copied: boolean;
          liked: boolean;
          disliked: boolean;
        };
      };
      onCopy: (messageId: string, text: string) => void;
      onLike: (messageId: string) => void;
      onDislike: (messageId: string) => void;
      onReload: (messageIndex: number) => void;
    }) => {
      MessageItem.displayName = "MessageItem";
      // Use simple values instead of Animated for typing messages and user messages to avoid flickering
      const isTyping = item.isTyping === true;
      const isUserMessage = item.isUser === true;

      // Only use Animated for AI messages that are NOT typing
      // User messages and typing messages should use regular View
      const messageOpacity = useRef(new Animated.Value(1)).current; // Start visible
      const messageTranslateY = useRef(new Animated.Value(0)).current; // Start at position
      const hasAnimated = useRef(false);

      // Animation for copy icon
      const copyIconScale = useRef(new Animated.Value(1)).current;
      const copyIconOpacity = useRef(new Animated.Value(1)).current;
      const messageActionState = messageActions[item.id] || {
        copied: false,
        liked: false,
        disliked: false,
      };

      // Animate copy icon when copied state changes
      useEffect(() => {
        if (messageActionState.copied) {
          // Animate to checkmark
          Animated.parallel([
            Animated.sequence([
              Animated.timing(copyIconScale, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
              }),
              Animated.timing(copyIconScale, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(copyIconOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          // Reset to copy icon
          copyIconScale.setValue(1);
          copyIconOpacity.setValue(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [messageActionState.copied]);

      useEffect(() => {
        // Skip animation entirely for typing messages and user messages - they should always be visible
        if (isTyping || isUserMessage) {
          // Ensure message is visible immediately without animation
          messageOpacity.setValue(1);
          messageTranslateY.setValue(0);
          if (!hasAnimated.current) {
            hasAnimated.current = true;
          }
          return;
        }

        // Only animate once for non-typing AI messages when they first appear
        // Check if this message was previously typing to avoid re-animation
        const isNewMessage = index >= totalMessages - 2;
        const wasPreviouslyTyping =
          item.isTyping === false && hasAnimated.current === false;

        // Only animate if this is a new message AND hasn't been animated yet
        // This prevents animation when message transitions from typing to non-typing
        if (isNewMessage && !hasAnimated.current && !wasPreviouslyTyping) {
          messageOpacity.setValue(0);
          messageTranslateY.setValue(20);

          Animated.parallel([
            Animated.timing(messageOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.spring(messageTranslateY, {
              toValue: 0,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
          ]).start();
          hasAnimated.current = true;
        } else if (!isTyping && !isUserMessage && !hasAnimated.current) {
          // If message is not typing and hasn't animated yet, just make it visible
          messageOpacity.setValue(1);
          messageTranslateY.setValue(0);
          hasAnimated.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [index, totalMessages]); // Remove isTyping and isUserMessage from deps to prevent re-animation

      if (item.isLoading) {
        return (
          <Animated.View
            style={[
              styles.messageContainer,
              styles.aiMessageContainer,
              {
                opacity: messageOpacity,
                transform: [{ translateY: messageTranslateY }],
              },
            ]}
          >
            <View style={styles.messageBubble}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </Animated.View>
        );
      }

      // For typing messages and user messages, use regular View to avoid animation conflicts
      const MessageContainer = isTyping || isUserMessage ? View : Animated.View;
      const containerStyle =
        isTyping || isUserMessage
          ? [
              styles.messageContainer,
              item.isUser
                ? styles.userMessageContainer
                : styles.aiMessageContainer,
            ]
          : [
              styles.messageContainer,
              item.isUser
                ? styles.userMessageContainer
                : styles.aiMessageContainer,
              {
                opacity: messageOpacity,
                transform: [{ translateY: messageTranslateY }],
              },
            ];

      const showActionIcons =
        !item.isUser &&
        !item.isTyping &&
        item.text &&
        index === totalMessages - 1;

      return (
        <MessageContainer style={containerStyle}>
          <TouchableOpacity
            style={[
              styles.messageBubble,
              item.isUser ? styles.userBubble : styles.aiBubble,
            ]}
            onPress={() => {
              if (onPress) {
                onPress(item);
              }
            }}
            onLongPress={() => onLongPress(item)}
            activeOpacity={item.learningPathData ? 0.7 : 0.8}
          >
            <View style={{ flexShrink: 1, minWidth: 0 }}>
              {item.text ? (
                <View style={styles.markdownTextWrapper}>
                  {renderMarkdownText(item.text, [
                    styles.messageText,
                    item.isUser ? styles.userMessageText : styles.aiMessageText,
                  ])}
                </View>
              ) : null}
              {/* Show analysis text with typing effect and low opacity */}
              {!item.isUser && item.isTyping === true && item.analysisText && (
                <View style={styles.markdownTextWrapper}>
                  {renderMarkdownText(item.analysisText, [
                    styles.messageText,
                    styles.aiMessageText,
                    styles.analysisTextFaded,
                  ])}
                </View>
              )}
              {/* Show typing indicator only when there's no text being typed yet */}
              {!item.isUser &&
                item.isTyping === true &&
                !item.text &&
                !item.analysisText && <TypingIndicator />}
            </View>
          </TouchableOpacity>
          {/* Copy/Share buttons for AI messages */}
          {showActionIcons && (
            <View style={styles.messageActions}>
              <TouchableOpacity
                style={styles.messageActionButton}
                onPress={() => onCopy(item.id, item.text || "")}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={{
                    transform: [{ scale: copyIconScale }],
                    opacity: copyIconOpacity,
                  }}
                >
                  <Ionicons
                    name={
                      messageActionState.copied
                        ? "checkmark-done"
                        : "copy-outline"
                    }
                    size={18}
                    color={chatColors.aiBubbleText}
                  />
                </Animated.View>
                <Text style={styles.messageActionText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.messageActionButton}
                onPress={() => {}}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="volume-medium-outline"
                  size={22}
                  color={chatColors.aiBubbleText}
                />
                <Text style={styles.messageActionText}>Voice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.messageActionButton}
                onPress={() => onLike(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    messageActionState.liked ? "thumbs-up" : "thumbs-up-outline"
                  }
                  size={17}
                  color={chatColors.aiBubbleText}
                />
                <Text style={styles.messageActionText}>Like</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.messageActionButton}
                onPress={() => onDislike(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    messageActionState.disliked
                      ? "thumbs-down"
                      : "thumbs-down-outline"
                  }
                  size={17}
                  color={chatColors.aiBubbleText}
                />
                <Text style={styles.messageActionText}>Dislike</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.messageActionButton}
                onPress={() => onReload(index)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="refresh-outline"
                  size={18}
                  color={chatColors.aiBubbleText}
                />
                <Text style={styles.messageActionText}>Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.messageActionButton}
                onPress={() => {}}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="share-outline"
                  size={18}
                  color={chatColors.aiBubbleText}
                />
                <Text style={styles.messageActionText}>Share</Text>
              </TouchableOpacity>
            </View>
          )}
          {/* Quick Reply Suggestions - show for certain AI messages */}
          {!item.isUser &&
            !item.isTyping &&
            item.text &&
            chatTypeProp === "consultation" &&
            item.text.toLowerCase().includes("music") && (
              <QuickReplySuggestions
                suggestions={[
                  {
                    icon: "headset",
                    text: "Lofi Beats",
                    message: "Play lofi beats for studying",
                  },
                  {
                    icon: "leaf",
                    text: "Nature & Ambient Sounds",
                    message: "Play nature and ambient sounds",
                  },
                  {
                    icon: "flame",
                    text: "Motivational & Classical",
                    message: "Play motivational and classical music",
                  },
                ]}
                onSuggestionPress={(message) => {
                  if (onSuggestionPress) {
                    onSuggestionPress(message);
                  }
                }}
                onSharePress={() => {
                  Alert.alert("Share", "Share suggestions");
                }}
              />
            )}
        </MessageContainer>
      );
    }
  );

  const handleMessagePress = (message: Message) => {
    // If message has learning path data, open preview modal
    if (message.learningPathData && !message.isUser) {
      setPreviewLP(message.learningPathData);
      setPreviewError(null);
    } else if (message.learningPathId && !message.isUser) {
      // If only ID is available, try to fetch or show message
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <MessageItem
      item={item}
      index={index}
      chatTypeProp={chatType}
      totalMessages={messages.length}
      onLongPress={handleLongPressMessage}
      onPress={handleMessagePress}
      onSuggestionPress={(message) => handleSendMessage(message)}
      messageActions={messageActions}
      onCopy={handleCopyAction}
      onLike={handleLikeMessage}
      onDislike={handleDislikeMessage}
      onReload={handleReloadMessage}
    />
  );

  const getTenantId = async (): Promise<string | null> => {
    try {
      const tenantData = await AsyncStorage.getItem(STORAGE_KEYS.TENANT);
      if (!tenantData) return null;

      try {
        const tenant = JSON.parse(tenantData);
        return tenant.value || tenant._id || tenant.id || tenant || null;
      } catch {
        return tenantData;
      }
    } catch {
      return null;
    }
  };

  // --- Learning Path: create from recommendations directly ---
  const createLearningPathFromRecommendations = async (
    recommendations: any[],
    courses: { _id: string; title: string; description?: string }[]
  ): Promise<{
    title: string;
    process: {
      title: string;
      course?: string;
      courseTitle?: string;
      courseDescription?: string;
    }[];
  } | null> => {
    if (
      !recommendations ||
      !Array.isArray(recommendations) ||
      recommendations.length === 0
    ) {
      return null;
    }

    const normalize = (s: string) =>
      (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const STOP = new Set([
      "khoa",
      "kho",
      "hoc",
      "boi",
      "cho",
      "nguoi",
      "lon",
      "tre",
      "moi",
      "bat",
      "dau",
      "co",
      "ban",
      "danh",
      "de",
      "danhcho",
    ]);
    const tokenize = (s: string) =>
      normalize(s)
        .split(" ")
        .filter((t) => t && t.length > 1 && !STOP.has(t));
    const jaccard = (a: string, b: string) => {
      const A = new Set(tokenize(a));
      const B = new Set(tokenize(b));
      if (A.size === 0 || B.size === 0) return 0;
      let inter = 0;
      for (const t of A) if (B.has(t)) inter++;
      return inter / (A.size + B.size - inter);
    };

    const findCourseId = (maybeName?: string): string | null => {
      if (!maybeName) return null;
      const needle = normalize(maybeName);
      if (!needle) return null;
      const exact = courses.find((c) => normalize(c.title) === needle);
      if (exact) return exact._id;
      const starts = courses.find((c) => normalize(c.title).startsWith(needle));
      if (starts) return starts._id;
      const includes = courses.find((c) => normalize(c.title).includes(needle));
      if (includes) return includes._id;
      const reverse = courses.find((c) => needle.includes(normalize(c.title)));
      if (reverse) return reverse._id;
      // Fuzzy fallback
      let best: { id: string; sim: number } | null = null;
      for (const c of courses) {
        const sim = jaccard(c.title, maybeName);
        if (!best || sim > best.sim) best = { id: c._id, sim };
      }
      if (best && best.sim >= 0.4) return best.id;
      return null;
    };

    // Filter and map recommendations - only include items with valid course IDs
    const processSteps: {
      title: string;
      course?: string;
      courseTitle?: string;
      courseDescription?: string;
    }[] = [];

    for (const rec of recommendations) {
      // Check if this recommendation has a course ID directly
      const directCourseId = rec.courseId || rec.course?._id || rec.course?.id;

      // Get course name from various possible fields
      const courseName =
        rec.courseName ||
        rec.name ||
        rec.title ||
        rec.course?.name ||
        rec.course?.title;

      // Try to find course ID
      let courseId: string | null = null;
      let courseTitle: string | undefined = undefined;
      let courseDescription: string | undefined = undefined;

      if (directCourseId) {
        // If we have a direct course ID, use it
        courseId = String(directCourseId);
        const courseObj = courses.find((c) => c._id === courseId);
        if (courseObj) {
          courseTitle = courseObj.title;
          courseDescription = courseObj.description;
        } else {
          courseTitle = courseName;
        }
      } else if (courseName) {
        // Try to match by name
        courseId = findCourseId(courseName);
        if (courseId) {
          const courseObj = courses.find((c) => c._id === courseId);
          if (courseObj) {
            courseTitle = courseObj.title;
            courseDescription = courseObj.description;
          } else {
            courseTitle = courseName;
          }
        }
      }

      // Only add if we found a valid course ID
      if (courseId && courseId.length > 0) {
        const stepTitle =
          courseTitle || courseName || `Khóa học ${processSteps.length + 1}`;
        processSteps.push({
          title: stepTitle.slice(0, 120),
          course: courseId,
          courseTitle: courseTitle || courseName,
          courseDescription: courseDescription,
        });
      } else {
        // Log skipped items for debugging
      }
    }

    if (processSteps.length === 0) {
      return null;
    }

    return {
      title: "Lộ trình học tập đề xuất",
      process: processSteps,
    };
  };

  // --- Learning Path: extract suggestion utils ---
  const extractLearningPathSuggestion = (
    text: string
  ): {
    title: string;
    process: { title: string; course?: string }[];
  } | null => {
    if (!text || typeof text !== "string") return null;

    // Try parse JSON block inside triple backticks
    const codeBlockMatch = text.match(/```(?:json)?\n([\s\S]*?)```/i);
    if (codeBlockMatch) {
      try {
        const obj = JSON.parse(codeBlockMatch[1]);
        if (obj && obj.title && Array.isArray(obj.process)) {
          const process = obj.process
            .filter((p: any) => p && p.title)
            .map((p: any) => ({
              title: String(p.title),
              course: p.course ? String(p.course) : undefined,
            }));
          if (process.length > 0) {
            return { title: String(obj.title), process };
          }
        }
      } catch {
        // ignore and fall back
      }
    }

    // Heuristic detection: look for keywords indicating recommendations
    const hasKeywords =
      /lộ trình|learning path|khóa học|gợi ý học|đề xuất/i.test(text);
    if (!hasKeywords) return null;

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Title: first line containing lộ trình/learning path; else fallback
    const titleLine =
      lines.find((l) => /lộ trình|learning path/i.test(l)) ||
      lines.find((l) => /khóa học đề xuất|gợi ý/i.test(l));
    const title = titleLine
      ? titleLine
          .replace(/^[#*\d\-.\s]+/, "")
          .replace(/\*\*/g, "")
          .slice(0, 80)
      : "Lộ trình theo đề xuất";

    // Process: lines starting with number list or dash bullets
    // Limit to first 5 courses to avoid too many
    const stepLines = lines.filter((l) => /^(\d+\.|[-•])\s+/.test(l));
    const process = stepLines.slice(0, 5).map((l) => {
      const raw = l.replace(/^(\d+\.|[-•])\s+/, "");
      // If bold course name exists
      const boldMatch = raw.match(/\*\*(.*?)\*\*/);
      const course = boldMatch ? boldMatch[1] : undefined;
      return { title: raw.replace(/\*\*/g, "").slice(0, 120), course };
    });

    if (process.length === 0) return null;
    return { title, process };
  };

  // --- Local message helpers (no AI call) ---
  const ensureConversation = async () => {
    // Do not create a new conversation here; use existing one only
    return currentConversationId;
  };

  const appendLocalMessage = async (
    text: string,
    isUserMsg: boolean,
    learningPathData?: {
      id: string;
      title: string;
      process: { title: string; course: string; courseTitle?: string }[];
    }
  ): Promise<Message> => {
    const msg = {
      id: Date.now().toString(),
      text,
      isUser: isUserMsg,
      timestamp: new Date(),
      isTyping: false,
      learningPathData,
      learningPathId: learningPathData?.id,
    } as Message;
    setMessages((prev) => [...prev, msg]);

    // Save learningPathData to AsyncStorage if available
    if (learningPathData) {
      try {
        const lpDataKey = `LP_DATA_${msg.id}`;
        await AsyncStorage.setItem(lpDataKey, JSON.stringify(learningPathData));
      } catch (error) {
        console.error("❌ Error saving learningPathData:", error);
      }
    }

    try {
      const convId = await ensureConversation();
      const dbMsg: DBChatMessage = {
        id: msg.id,
        text: msg.text,
        isUser: msg.isUser,
        timestamp: msg.timestamp.getTime(),
        chatType: chatType,
        conversationId: convId || undefined,
      };
      if (convId) {
        await chatDatabaseService.saveMessage(dbMsg);
        await chatDatabaseService.updateConversation(convId, {
          lastMessage: msg.text.substring(0, 100),
          lastMessageTime: msg.timestamp.getTime(),
          messageCount: messages.length + 1,
        });
        try {
          await AsyncStorage.setItem(
            `AI_CHAT_LAST_CONV_${chatType}`,
            String(convId)
          );
        } catch {}
      }
    } catch {
      // silent
    }

    return msg;
  };

  // Ensure the latest assistant message is persisted with current conversation id
  const persistLastAssistantIfNeeded = async () => {
    try {
      const convId = currentConversationId;
      if (!convId) return;
      const lastAssistant = [...messages]
        .reverse()
        .find((m) => !m.isUser && !m.isTyping && m.text && m.text.length > 0);
      if (!lastAssistant) return;
      const dbMsg: DBChatMessage = {
        id: lastAssistant.id,
        text: lastAssistant.text,
        isUser: false,
        timestamp: lastAssistant.timestamp.getTime(),
        chatType: chatType,
        conversationId: convId,
      };
      await chatDatabaseService.saveMessage(dbMsg);
    } catch {
      // silent
    }
  };

  const onCreateLearningPathFromSuggestion = async () => {
    if (!pendingSuggestion || isCreatingLP) return;
    try {
      setIsCreatingLP(true);
      // 0) Immediately append a user message reflecting the action
      const previewText = (() => {
        const title = pendingSuggestion.title || "Lộ trình đề xuất bởi AI";
        const steps = pendingSuggestion.process
          .slice(0, 6)
          .map((s, i) => `${i + 1}. ${s.title}`)
          .join("\n");
        return `Tạo lộ trình theo đề xuất:\n${title}\n${steps}`;
      })();
      await appendLocalMessage(previewText, true);
      // make sure the previous assistant reply is persisted in this conversation
      await persistLastAssistantIfNeeded();
      // Load courses to map names -> ObjectId (with cache)
      if (!coursesCacheRef.current) {
        const coursesRes = await getAllCourses();
        coursesCacheRef.current =
          (coursesRes?.data?.data as any) || (coursesRes?.data as any) || [];
      }
      const courses: { _id: string; title: string; description?: string }[] =
        coursesCacheRef.current || [];

      const normalize = (s: string) =>
        (s || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .replace(/[^a-z0-9\s]/g, "")
          .replace(/\s+/g, " ")
          .trim();

      const STOP = new Set([
        "khoa",
        "kho",
        "hoc",
        "boi",
        "cho",
        "nguoi",
        "lon",
        "tre",
        "moi",
        "bat",
        "dau",
        "co",
        "ban",
        "danh",
        "de",
        "danhcho",
      ]);
      const tokenize = (s: string) =>
        normalize(s)
          .split(" ")
          .filter((t) => t && t.length > 1 && !STOP.has(t));
      const jaccard = (a: string, b: string) => {
        const A = new Set(tokenize(a));
        const B = new Set(tokenize(b));
        if (A.size === 0 || B.size === 0) return 0;
        let inter = 0;
        for (const t of A) if (B.has(t)) inter++;
        return inter / (A.size + B.size - inter);
      };

      const findCourseId = (maybeName?: string): string | null => {
        if (!maybeName) return null;
        const needle = normalize(maybeName);
        if (!needle) return null;
        const exact = courses.find((c) => normalize(c.title) === needle);
        if (exact) return exact._id;
        const starts = courses.find((c) =>
          normalize(c.title).startsWith(needle)
        );
        if (starts) return starts._id;
        const includes = courses.find((c) =>
          normalize(c.title).includes(needle)
        );
        if (includes) return includes._id;
        const reverse = courses.find((c) =>
          needle.includes(normalize(c.title))
        );
        if (reverse) return reverse._id;
        // Fuzzy fallback
        let best: { id: string; sim: number } | null = null;
        for (const c of courses) {
          const sim = jaccard(c.title, maybeName);
          if (!best || sim > best.sim) best = { id: c._id, sim };
        }
        if (best && best.sim >= 0.4) return best.id;
        return null;
      };

      // Map all steps from AI suggestion - use data directly from AI, don't try to match
      // Just display what AI returned, user can edit later
      const mappedSteps = pendingSuggestion.process.map((p) => {
        // Try to find course ID if course name is provided, but don't require it
        const courseId = p.course
          ? findCourseId(p.course) || findCourseId(p.title)
          : null;
        const courseObj = courseId
          ? courses.find((c) => c._id === courseId)
          : null;

        return {
          title: p.title.slice(0, 120),
          course: courseId || p.course || "", // Use courseId if found, otherwise keep original course name
          courseTitle: courseObj ? courseObj.title : p.course || p.title, // Use matched title or fallback to original course name/title
          courseDescription: courseObj?.description, // Include description if available
        };
      });

      if (mappedSteps.length === 0) {
        showErrorToast(new Error("Không khớp được khóa học"), {
          title: "Không thể tạo lộ trình",
          message:
            "Không tìm thấy khóa học phù hợp từ đề xuất. Vui lòng thử lại.",
        });
        return;
      }

      const safeTitle = (pendingSuggestion.title || "Lộ trình đề xuất bởi AI")
        .replace(/^[-•\d.\s]+/, "")
        .slice(0, 80);

      // Don't create learning path yet - just show preview
      // API will be called when user confirms in PreviewLearningPath
      const previewTitle = safeTitle || "Lộ trình đề xuất bởi AI";
      const previewData = {
        id: "", // Empty ID until confirmed
        title: previewTitle,
        process: mappedSteps,
      };
      setPreviewLP(previewData);
      setPreviewError(null);

      // 3) Append assistant confirmation locally with learning path data
      await appendLocalMessage(
        `Đã tạo lộ trình "${previewTitle}" gồm ${mappedSteps.length} bước.`,
        false,
        previewData // Save data so user can click to view again
      );
      // Clear suggestion once created
      setPendingSuggestion(null);
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi",
        message: "Không thể tạo lộ trình học theo đề xuất",
      });
    } finally {
      setIsCreatingLP(false);
    }
  };

  const onCancelLearningPath = () => {
    setPreviewLP(null);
    setPreviewError(null);
  };

  const onConfirmLearningPath = async (title?: string, process?: any[]) => {
    // Use provided title/process or fallback to previewLP
    const finalTitle = title || previewLP?.title;
    const finalProcess = process || previewLP?.process;

    if (!previewLP || !finalTitle || !finalProcess) return;

    let shouldClosePreview = true;
    try {
      // Check if title already exists
      try {
        const existingPathsRes = await getLearningPath();
        const existingPaths =
          existingPathsRes?.data?.data?.data ||
          existingPathsRes?.data?.data ||
          existingPathsRes?.data ||
          [];

        const titleToCheck = finalTitle.trim().toLowerCase();
        const isDuplicate = existingPaths.some((path: any) => {
          const existingTitle = (path.title || "").trim().toLowerCase();
          return existingTitle === titleToCheck;
        });

        if (isDuplicate) {
          shouldClosePreview = false;
          setPreviewError(
            "Đã có lộ trình với tiêu đề này. Vui lòng chọn tiêu đề khác."
          );
          return;
        }
      } catch (error) {
        // If check fails, log but continue (don't block creation)
        console.error("❌ Error checking duplicate title:", error);
      }

      const payload = {
        title: finalTitle,
        process: finalProcess.map((s: any) => ({
          title: s.title,
          course: s.course,
        })),
      };

      // Create learning path via API
      const res = await createLearningPath(payload);

      // Try multiple response structures
      const responseData =
        res?.data?.data?.data || res?.data?.data || res?.data || {};
      const id =
        responseData?.insertedId || // MongoDB insert result
        responseData?._id ||
        responseData?.id ||
        responseData?.learning_path_id ||
        responseData?.learning_path?._id ||
        responseData?.learning_path?.id ||
        responseData?.result?.id ||
        "";

      if (id) {
        const learningPathData = {
          id,
          title: finalTitle,
          process: finalProcess,
        };

        // Update the last assistant message with learning path data
        setMessages((prev) => {
          const updated = [...prev];
          // Find the last assistant message about creating learning path
          for (let i = updated.length - 1; i >= 0; i--) {
            if (
              !updated[i].isUser &&
              updated[i].text.includes("Đã tạo lộ trình")
            ) {
              updated[i] = {
                ...updated[i],
                learningPathId: id,
                learningPathData: learningPathData,
              };

              // Save learningPathData to AsyncStorage
              try {
                const lpDataKey = `LP_DATA_${updated[i].id}`;
                AsyncStorage.setItem(
                  lpDataKey,
                  JSON.stringify(learningPathData)
                );
              } catch (error) {
                console.error("❌ Error saving learningPathData:", error);
              }

              break;
            }
          }
          return updated;
        });
        setSuccessLP({ id, title: finalTitle, process: finalProcess });
        setPreviewError(null);
      } else {
        showErrorToast(new Error("Không nhận được ID từ server"), {
          title: "Lỗi",
          message:
            "Đã tạo lộ trình nhưng không nhận được ID. Vui lòng thử lại.",
        });
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi",
        message: "Không thể tạo lộ trình học tập",
      });
    } finally {
      if (shouldClosePreview) {
        setPreviewLP(null);
        setPreviewError(null);
      }
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Load conversations for drawer
  const loadConversations = async () => {
    try {
      const convs = await chatDatabaseService.getConversations(chatType);

      // Always include current conversation in the list if it has messages
      if (messages.length > 0) {
        const messageCount = messages.filter(
          (m) => !m.isLoading && !m.isTyping
        ).length;

        if (messageCount > 0 && currentConversationId) {
          // Get first user message for title
          const firstUserMessage = messages.find((m) => m.isUser);
          const lastMessage = messages[messages.length - 1];
          const title = firstUserMessage?.text
            ? firstUserMessage.text.length > 50
              ? firstUserMessage.text.substring(0, 50) + "..."
              : firstUserMessage.text
            : "Cuộc trò chuyện mới";

          // Check if current conversation is already in the list
          const existingConvIndex = convs.findIndex(
            (c) => c.id === currentConversationId
          );

          if (existingConvIndex >= 0) {
            // Update existing conversation in list with latest info from DB
            const updatedConvs = [...convs];
            // Use DB data for more accurate info
            updatedConvs[existingConvIndex] = {
              ...updatedConvs[existingConvIndex],
              title: title,
              lastMessage: lastMessage?.text?.substring(0, 100) || "",
              lastMessageTime: lastMessage?.timestamp.getTime() || Date.now(),
              messageCount: messageCount,
            };
            // Move to top
            const [currentConv] = updatedConvs.splice(existingConvIndex, 1);
            setConversations([currentConv, ...updatedConvs]);
          } else {
            // Create conversation entry for current conversation
            const currentConv: Conversation = {
              id: currentConversationId,
              chatType: chatType,
              title: title,
              lastMessage: lastMessage?.text?.substring(0, 100) || "",
              lastMessageTime: lastMessage?.timestamp.getTime() || Date.now(),
              messageCount: messageCount,
            };

            // Add to the beginning of the list
            setConversations([currentConv, ...convs]);
          }
          return;
        }
      }

      // If no current conversation, just show DB conversations
      setConversations(convs);
    } catch (error) {
      console.error("❌ Error loading conversations:", error);
    }
  };

  // Filter conversations based on search query
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(query) ||
        conv.lastMessage.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  // Toggle drawer
  const toggleDrawer = () => {
    if (showDrawer) {
      // Close drawer
      Animated.parallel([
        Animated.timing(drawerAnim, {
          toValue: -1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowDrawer(false);
      });
    } else {
      // Open drawer
      loadConversations();
      setShowDrawer(true);
      Animated.parallel([
        Animated.timing(drawerAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // Copy message to clipboard
  const handleCopyMessage = async (message: Message) => {
    try {
      await Clipboard.setStringAsync(message.text);
      // Show toast notification (you may need to import Toast)
      Alert.alert("Thành công", "Đã sao chép vào clipboard");
      setShowMessageMenu(false);
    } catch (error) {
      console.error("❌ Error copying message:", error);
      Alert.alert("Lỗi", "Không thể sao chép tin nhắn");
    }
  };

  // Edit message
  const handleEditMessage = (message: Message) => {
    if (!message.isUser) {
      Alert.alert("Thông báo", "Chỉ có thể chỉnh sửa tin nhắn của bạn");
      return;
    }
    setEditingMessageId(message.id);
    setEditText(message.text);
    setShowMessageMenu(false);
  };

  // Save edited message
  const handleSaveEdit = async () => {
    if (!editingMessageId || !editText.trim()) return;

    const updatedMessages = messages.map((msg) =>
      msg.id === editingMessageId ? { ...msg, text: editText.trim() } : msg
    );
    setMessages(updatedMessages);
    setEditingMessageId(null);
    setEditText("");

    // Update in database
    try {
      const messageToUpdate = updatedMessages.find(
        (m) => m.id === editingMessageId
      );
      if (messageToUpdate) {
        const dbMessage: DBChatMessage = {
          id: messageToUpdate.id,
          text: messageToUpdate.text,
          isUser: messageToUpdate.isUser,
          timestamp: messageToUpdate.timestamp.getTime(),
          chatType: chatType,
          conversationId: currentConversationId || undefined,
        };
        await chatDatabaseService.saveMessage(dbMessage);
      }
    } catch (error) {
      console.error("❌ Error saving edited message:", error);
    }
  };

  // Create new chat
  const handleNewChat = async () => {
    setMessages([]);
    setInputText("");
    setIsLoading(false);
    setCurrentConversationId(null);
    setPendingSuggestion(null);
    setSelectedMessage(null);
    setEditingMessageId(null);
    setEditText("");
    recommendationsRef.current = null; // Clear recommendations for new chat

    // Clear any pending timeouts
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }

    try {
      await AsyncStorage.removeItem(`AI_CHAT_LAST_CONV_${chatType}`);
    } catch {}
    toggleDrawer(); // Close drawer after creating new chat
  };

  // Load conversation
  const handleLoadConversation = async (conversationId: string) => {
    // Convert both to string for comparison
    const currentIdStr = String(currentConversationId || "");
    const clickedIdStr = String(conversationId || "");

    // If clicking on the current conversation, just close the drawer
    if (currentIdStr === clickedIdStr && currentIdStr !== "") {
      toggleDrawer();
      return;
    }

    // Handle temp IDs (conversations not yet saved to DB)
    if (clickedIdStr.startsWith("temp-")) {
      // This is a temporary conversation that hasn't been saved
      // Don't load anything, just close drawer
      toggleDrawer();
      return;
    }

    try {
      // Load messages from database
      const convMessages = await chatDatabaseService.loadMessages(
        chatType,
        clickedIdStr
      );

      if (convMessages.length === 0) {
        Alert.alert("Thông báo", "Cuộc trò chuyện này không có tin nhắn");
        toggleDrawer();
        return;
      }

      // Load learningPathData from AsyncStorage for each message
      const uiMessages: Message[] = await Promise.all(
        convMessages.map(async (msg) => {
          const message: Message = {
            id: msg.id,
            text: msg.text || "",
            isUser: msg.isUser,
            timestamp: new Date(msg.timestamp),
            isTyping: false,
          };

          // Try to load learningPathData from AsyncStorage
          try {
            const lpDataKey = `LP_DATA_${msg.id}`;
            const lpDataStr = await AsyncStorage.getItem(lpDataKey);
            if (lpDataStr) {
              const lpData = JSON.parse(lpDataStr);
              message.learningPathData = lpData;
              message.learningPathId = lpData?.id;
            }
          } catch {
            // Ignore errors
          }

          return message;
        })
      );

      setMessages(uiMessages);
      setCurrentConversationId(clickedIdStr);
      try {
        await AsyncStorage.setItem(
          `AI_CHAT_LAST_CONV_${chatType}`,
          String(clickedIdStr)
        );
      } catch {}
      toggleDrawer(); // Close drawer after loading conversation
    } catch (error) {
      console.error("❌ Error loading conversation:", error);
      Alert.alert("Lỗi", "Không thể tải đoạn chat");
    }
  };

  // Show message menu
  const handleLongPressMessage = (message: Message) => {
    setSelectedMessage(message);
    setShowMessageMenu(true);
  };

  const isEmpty = messages.length === 0;
  const footerSpacerHeight = React.useMemo(() => {
    if (isEmpty) return 0;
    if (inputContainerHeight === 0) return 140;
    return Math.max(inputContainerHeight + 2, 0);
  }, [inputContainerHeight, isEmpty]);

  const listContentStyles = React.useMemo(() => {
    if (isEmpty) {
      return [styles.messagesListEmpty];
    }
    return [styles.messagesList];
  }, [isEmpty]);

  const scrollToBottom = React.useCallback((animated: boolean) => {
    if (autoScrollFrameRef.current) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
    autoScrollFrameRef.current = requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated });
      initialScrollDoneRef.current = true;
      autoScrollFrameRef.current = null;
      setShowScrollToBottom(false);
    });
  }, []);

  const handleListScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const {
        nativeEvent: { contentOffset, layoutMeasurement, contentSize },
      } = event;
      const isAtBottom =
        contentOffset.y + layoutMeasurement.height >= contentSize.height - 32;
      autoScrollEnabledRef.current =
        isAtBottom || contentSize.height <= layoutMeasurement.height;

      // Show scroll-to-bottom button if scrolled up more than 200px from bottom
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      setShowScrollToBottom(
        distanceFromBottom > 200 &&
          contentSize.height > layoutMeasurement.height
      );
    },
    []
  );

  // Animate scroll button
  useEffect(() => {
    Animated.timing(scrollButtonAnim, {
      toValue: showScrollToBottom ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showScrollToBottom, scrollButtonAnim]);

  const handleInputLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      if (Math.abs(height - inputContainerHeight) > 2) {
        setInputContainerHeight(height);
      }
    },
    [inputContainerHeight]
  );

  const listKey = `${chatType}-${
    isEmpty ? "empty" : currentConversationId || "active"
  }`;

  const renderListFooter = () => {
    if (isEmpty) {
      return null;
    }

    return (
      <View style={styles.listFooterContainer}>
        {/* Hide the "create learning path from suggestion" action when chatType is learningPath (now used as consultation)
            so users won't see the auto-create button for suggested learning paths. */}
        {pendingSuggestion && chatType !== "learningPath" ? (
          <View style={styles.suggestionContainer}>
            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={onCreateLearningPathFromSuggestion}
              activeOpacity={0.85}
              disabled={isCreatingLP}
            >
              <Ionicons
                name="sparkles"
                size={16}
                color={colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.suggestionChipText}>
                {isCreatingLP
                  ? "Đang tạo lộ trình..."
                  : "Tạo lộ trình theo đề xuất này"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={{ height: footerSpacerHeight }} />
      </View>
    );
  };

  return (
    <View style={styles.screenBackground}>
      <ImageBackground
        source={{ uri: IMAGES.AI_CHAT_BACKGROUND }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View
          style={[
            styles.backgroundOverlay,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
          pointerEvents="none"
        />
      </ImageBackground>
      <View style={styles.container}>
        {!isEmpty && (
          <Animated.View
            style={[
              styles.header,
              {
                paddingTop: insets.top,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.headerIconContainer}
                activeOpacity={0.85}
                onPress={toggleDrawer}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={24}
                  color={colors.white}
                />
              </TouchableOpacity>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>{config.title}</Text>
              </View>
              <TouchableOpacity
                style={styles.headerIconContainer}
                activeOpacity={0.85}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <View
          style={[
            styles.contentContainer,
            isEmpty && styles.contentContainerEmpty,
          ]}
        >
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <FlatList
              key={listKey}
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={listContentStyles}
              style={{ backgroundColor: "transparent" }}
              ListFooterComponent={renderListFooter}
              onScroll={handleListScroll}
              scrollEventThrottle={16}
              onContentSizeChange={(width, contentHeight) => {
                if (contentHeight <= 0 || messages.length === 0) {
                  return;
                }
                const lastMessage = messages[messages.length - 1];
                const shouldForceScroll =
                  lastMessage?.isUser ||
                  lastMessage?.isTyping ||
                  lastMessage?.isLoading;

                if (!shouldForceScroll && !autoScrollEnabledRef.current) {
                  if (!initialScrollDoneRef.current) {
                    scrollToBottom(false);
                  }
                  return;
                }

                scrollToBottom(initialScrollDoneRef.current);
              }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                messages.length === 0 ? (
                  <EmptyStateComponent
                    chatType={chatType}
                    config={config}
                    fadeAnim={fadeAnim}
                    onActionPress={(message) => {
                      handleSendMessage(message);
                    }}
                    topInset={insets.top}
                    onMenuPress={toggleDrawer}
                    inputText={inputText}
                    setInputText={setInputText}
                    handleSendMessage={() => handleSendMessage()}
                    isLoading={isLoading}
                    sendButtonScale={sendButtonScale}
                    bottomInset={insets.bottom}
                  />
                ) : null
              }
            />

            {/* Scroll to bottom button */}
            {!isEmpty && (
              <Animated.View
                style={[
                  styles.scrollToBottomButton,
                  {
                    bottom: inputContainerHeight,
                    opacity: scrollButtonAnim,
                    transform: [
                      {
                        translateY: scrollButtonAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [60, 0],
                        }),
                      },
                    ],
                  },
                ]}
                pointerEvents={showScrollToBottom ? "auto" : "none"}
              >
                <TouchableOpacity
                  style={styles.scrollToBottomButtonTouchable}
                  onPress={() => scrollToBottom(true)}
                  activeOpacity={0.7}
                  disabled={!showScrollToBottom}
                >
                  <Ionicons name="arrow-down" size={24} color={colors.white} />
                </TouchableOpacity>
              </Animated.View>
            )}

            {!isEmpty && (
              <View style={styles.inputContainer} onLayout={handleInputLayout}>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputField}>
                    <TextInput
                      style={styles.input}
                      placeholder={config.placeholder}
                      placeholderTextColor={chatColors.inputPlaceholder}
                      value={inputText}
                      onChangeText={setInputText}
                      multiline
                      maxLength={500}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      style={styles.microphoneButton}
                      onPress={() => {
                        // Voice input functionality - placeholder
                        Alert.alert(
                          "Voice Input",
                          "Voice input will be implemented"
                        );
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pulse" size={18} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                  <Animated.View
                    style={{
                      transform: [{ scale: sendButtonScale }],
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        (!inputText.trim() || isLoading) &&
                          styles.sendButtonDisabled,
                      ]}
                      onPress={() => handleSendMessage()}
                      disabled={!inputText.trim() || isLoading}
                      activeOpacity={0.7}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="send" size={20} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>
            )}
          </KeyboardAvoidingView>
        </View>

        {/* Preview Modal for Learning Path */}
        <PreviewLearningPath
          onCancelLearningPath={onCancelLearningPath}
          onConfirmLearningPath={onConfirmLearningPath}
          previewLP={previewLP || null}
          setPreviewLP={setPreviewLP}
          errorMessage={previewError}
          setErrorMessage={setPreviewError}
        />

        {/* Success Modal after saving Learning Path */}
        <Modal
          visible={!!successLP}
          transparent
          animationType="fade"
          onRequestClose={() => setSuccessLP(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSuccessLP(null)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={styles.successContainer}
            >
              <View style={styles.successHeader}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={18} color={colors.white} />
                </View>
                <Text style={styles.successTitle}>Đã lưu lộ trình</Text>
              </View>
              <Text style={styles.successSubtitle} numberOfLines={2}>
                {successLP?.title}
              </Text>
              {successLP?.process && successLP.process.length > 0 && (
                <View style={styles.successStepsContainer}>
                  <ScrollView
                    style={styles.successStepsScroll}
                    contentContainerStyle={styles.successStepsContent}
                    showsVerticalScrollIndicator={
                      (successLP?.process?.length || 0) > 4
                    }
                  >
                    {successLP.process.map((step, index) => {
                      const isLast =
                        index === (successLP?.process?.length || 0) - 1;
                      const displayTitle = getDisplayTitle(step);
                      const displayDescription = getDisplayDescription(
                        step,
                        displayTitle
                      );
                      return (
                        <View
                          style={[
                            styles.successStepRow,
                            isLast && { borderBottomWidth: 0 },
                          ]}
                          key={`${step.course || step.title}-${index}`}
                        >
                          <View style={styles.successStepIndex}>
                            <Text style={styles.successStepIndexText}>
                              {index + 1}
                            </Text>
                          </View>
                          <View style={styles.successStepInfo}>
                            <Text style={styles.successStepTitle}>
                              {displayTitle}
                            </Text>
                            {displayDescription && (
                              <Text
                                style={styles.successStepDescription}
                                numberOfLines={2}
                              >
                                {displayDescription}
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
              <View style={styles.successActions}>
                <TouchableOpacity
                  style={styles.successClose}
                  onPress={() => setSuccessLP(null)}
                >
                  <Text style={styles.successCloseText}>Đóng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.successNavigate}
                  onPress={() => {
                    setSuccessLP(null);
                    // Adjust route name if different in your navigator
                    (navigation as any).navigate("LearningPath");
                  }}
                >
                  <Text style={styles.successNavigateText}>Xem lộ trình</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Edit Message Input */}
        {editingMessageId && (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              autoFocus
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={() => {
                  setEditingMessageId(null);
                  setEditText("");
                }}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editSaveButton}
                onPress={handleSaveEdit}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Message Menu Modal */}
        <Modal
          visible={showMessageMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMessageMenu(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMessageMenu(false)}
          >
            <View style={styles.messageMenu}>
              {selectedMessage && (
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleCopyMessage(selectedMessage)}
                  >
                    <Ionicons
                      name="copy-outline"
                      size={20}
                      color={colors.text}
                    />
                    <Text style={styles.menuItemText}>Sao chép</Text>
                  </TouchableOpacity>
                  {selectedMessage.isUser && (
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleEditMessage(selectedMessage)}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={20}
                        color={colors.text}
                      />
                      <Text style={styles.menuItemText}>Chỉnh sửa</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDeleteModal(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={styles.deleteModalContainer}
            >
              <View style={styles.deleteModalIcon}>
                <Ionicons name="trash-outline" size={32} color="#EF4444" />
              </View>
              <Text style={styles.deleteModalTitle}>Xác nhận xóa</Text>
              <Text style={styles.deleteModalMessage}>
                Bạn có chắc chắn muốn xóa &quot;{conversationToDelete?.title}
                &quot;? Hành động này không thể hoàn tác.
              </Text>
              <View style={styles.deleteModalActions}>
                <TouchableOpacity
                  style={styles.deleteModalCancelButton}
                  onPress={() => {
                    setShowDeleteModal(false);
                    setConversationToDelete(null);
                  }}
                >
                  <Text style={styles.deleteModalCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteModalConfirmButton}
                  onPress={async () => {
                    if (!conversationToDelete) return;

                    try {
                      await chatDatabaseService.deleteConversation(
                        conversationToDelete.id
                      );

                      // Update current conversation if needed
                      if (currentConversationId === conversationToDelete.id) {
                        setMessages([]);
                        setCurrentConversationId(null);
                        setIsLoading(false);
                        setPendingSuggestion(null);
                        setSelectedMessage(null);
                        setEditingMessageId(null);
                        setEditText("");

                        // Clear any pending timeouts
                        if (typingTimeoutRef.current) {
                          clearTimeout(typingTimeoutRef.current);
                          typingTimeoutRef.current = null;
                        }
                        if (scrollTimeoutRef.current) {
                          clearTimeout(scrollTimeoutRef.current);
                          scrollTimeoutRef.current = null;
                        }
                      }

                      // Reload conversations and ensure UI updates immediately
                      await loadConversations();

                      // Force a state update to ensure the drawer refreshes
                      setConversations((prev) =>
                        prev.filter((c) => c.id !== conversationToDelete.id)
                      );

                      setShowDeleteModal(false);
                      setConversationToDelete(null);
                    } catch {
                      Alert.alert("Lỗi", "Không thể xóa đoạn chat");
                      setShowDeleteModal(false);
                      setConversationToDelete(null);
                    }
                  }}
                >
                  <Text style={styles.deleteModalConfirmText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Drawer for Conversation History */}
        {showDrawer && (
          <>
            {/* Overlay */}
            <Animated.View
              style={[
                styles.drawerOverlay,
                {
                  opacity: overlayAnim,
                },
              ]}
            >
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                activeOpacity={1}
                onPress={toggleDrawer}
              />
            </Animated.View>

            {/* Drawer */}
            <Animated.View
              style={[
                styles.drawer,
                {
                  transform: [
                    {
                      translateX: drawerAnim.interpolate({
                        inputRange: [-1, 0],
                        outputRange: [-300, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Drawer Header */}
              <View
                style={[styles.drawerHeader, { paddingTop: insets.top + 16 }]}
              >
                <View style={styles.drawerHeaderTop}>
                  <Text style={styles.drawerTitle}>Trò chuyện</Text>
                  <TouchableOpacity
                    style={styles.drawerCloseButton}
                    onPress={toggleDrawer}
                  >
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.drawerSearchContainer}>
                  <View style={styles.drawerSearchBar}>
                    <Ionicons
                      name="search-outline"
                      size={20}
                      color={colors.gray[400]}
                      style={{ marginRight: 10 }}
                    />
                    <TextInput
                      style={styles.drawerSearchInput}
                      placeholder="Tìm kiếm"
                      placeholderTextColor={colors.gray[400]}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSearchQuery("")}
                        style={{ padding: 4 }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={colors.gray[400]}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* New Chat Button */}
                <TouchableOpacity
                  style={styles.drawerNewChatButton}
                  onPress={handleNewChat}
                >
                  <View style={styles.drawerNewChatIcon}>
                    <Ionicons name="add" size={20} color={colors.white} />
                  </View>
                  <Text style={styles.drawerNewChatText}>Đoạn chat mới</Text>
                </TouchableOpacity>
              </View>

              {/* Conversations List */}
              <ScrollView
                style={styles.drawerContent}
                showsVerticalScrollIndicator={false}
              >
                {filteredConversations.length === 0 ? (
                  <View style={styles.drawerEmpty}>
                    <Ionicons
                      name="chatbubbles-outline"
                      size={48}
                      color={colors.gray[400]}
                    />
                    <Text style={styles.drawerEmptyText}>
                      {searchQuery
                        ? "Không tìm thấy kết quả"
                        : "Chưa có cuộc trò chuyện"}
                    </Text>
                  </View>
                ) : (
                  filteredConversations.map((conv) => (
                    <TouchableOpacity
                      key={conv.id}
                      style={[
                        styles.drawerConversationItem,
                        currentConversationId === conv.id &&
                          styles.drawerConversationItemActive,
                      ]}
                      onPress={() => handleLoadConversation(conv.id)}
                      onLongPress={() => {
                        setConversationToDelete(conv);
                        setShowDeleteModal(true);
                      }}
                    >
                      <View style={styles.drawerConversationContent}>
                        <View style={styles.drawerConversationIcon}>
                          <Ionicons
                            name="chatbubble-ellipses"
                            size={18}
                            color={colors.white}
                          />
                        </View>
                        <Text
                          style={styles.drawerConversationTitle}
                          numberOfLines={2}
                        >
                          {conv.title}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </Animated.View>
          </>
        )}
      </View>
    </View>
  );
}
