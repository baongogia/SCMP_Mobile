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
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { styles } from "./style";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  useAIToRecommend,
  useAIToCreateLearningPlan,
} from "@/src/services/AI_agent/aiAgentServices";
import { colors } from "@/src/constants";
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
          backgroundColor: colors.textSecondary,
          transform: [{ translateY: dot1TranslateY }],
        }}
      />
      <Animated.View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.textSecondary,
          transform: [{ translateY: dot2TranslateY }],
        }}
      />
      <Animated.View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.textSecondary,
          transform: [{ translateY: dot3TranslateY }],
        }}
      />
    </View>
  );
};

// Helper function to parse markdown **text** to bold
const parseMarkdownBold = (text: string): React.ReactNode => {
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

  const chatConfig = {
    learningPath: {
      title: "Tạo lộ trình học tập",
      icon: "map" as const,
      placeholder: "Nhập thông tin của bạn...",
    },
    consultation: {
      title: "Tư vấn học tập",
      icon: "aperture-outline" as const,
      placeholder: "Đặt câu hỏi của bạn...",
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
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 200);
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

  const handleSendMessage = async (suggestedText?: string) => {
    const messageText = suggestedText || inputText.trim();
    if (!messageText || isLoading) return;

    // Animate send button
    Animated.sequence([
      Animated.timing(sendButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(sendButtonScale, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    // Update messages state with user message
    setMessages((prev) => [...prev, userMessage]);

    // Create or update conversation
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = Date.now().toString();
      try {
        await chatDatabaseService.createConversation({
          id: conversationId,
          chatType: chatType,
          title:
            messageText.length > 50
              ? messageText.substring(0, 50) + "..."
              : messageText,
          lastMessage: messageText,
          lastMessageTime: userMessage.timestamp.getTime(),
          messageCount: 1,
        });
        setCurrentConversationId(conversationId);
        try {
          await AsyncStorage.setItem(
            `AI_CHAT_LAST_CONV_${chatType}`,
            String(conversationId)
          );
        } catch {}
      } catch (error) {
        console.error("❌ Error creating conversation:", error);
      }
    }

    // Save user message to database
    try {
      const dbMessage: DBChatMessage = {
        id: userMessage.id,
        text: userMessage.text,
        isUser: userMessage.isUser,
        timestamp: userMessage.timestamp.getTime(),
        chatType: chatType,
        conversationId: conversationId || undefined,
      };
      await chatDatabaseService.saveMessage(dbMessage);

      // Update conversation
      if (conversationId) {
        await chatDatabaseService.updateConversation(conversationId, {
          lastMessage: messageText,
          lastMessageTime: userMessage.timestamp.getTime(),
          messageCount: messages.length + 1,
        });

        // Reload conversations only if drawer is open (to avoid unnecessary re-renders)
        if (showDrawer) {
          await loadConversations();
        }
      }
    } catch (error) {
      console.error("❌ Error saving user message:", error);
    }

    const currentInput = messageText;
    if (!suggestedText) {
      setInputText("");
    }
    setIsLoading(true);

    // Add typing message immediately (instead of loading indicator)
    const typingMessageId = `typing-${Date.now()}`;
    const typingMessage: Message = {
      id: typingMessageId,
      text: "",
      isUser: false,
      timestamp: new Date(),
      isTyping: true,
      analysisText: undefined,
    };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      let response;

      if (chatType === "learningPath") {
        // Tạo lộ trình học tập: Sử dụng API tạo lộ trình với tenantId và user requirements
        const tenantId = await getTenantId();
        if (!tenantId) {
          throw new Error("Không tìm thấy thông tin cơ sở");
        }
        // eslint-disable-next-line react-hooks/rules-of-hooks
        response = await useAIToCreateLearningPlan(tenantId, currentInput);
      } else {
        // Tư vấn học tập: Sử dụng API chat conversation với toàn bộ lịch sử tin nhắn
        // Build messages array từ conversation history + userMessage mới để AI có context đầy đủ
        // Note: messages state chưa update ngay sau setMessages, nên cần thêm userMessage vào đây
        const allMessages = [...messages, userMessage];

        console.log("🔍 Debug messages:", {
          originalMessagesCount: messages.length,
          userMessageText: userMessage.text,
          allMessagesCount: allMessages.length,
          allMessages: allMessages.map((m) => ({
            id: m.id,
            text: m.text?.substring(0, 50),
            isUser: m.isUser,
            isLoading: m.isLoading,
          })),
        });

        const messagesForAPI = allMessages
          .filter((m) => {
            const isValid =
              !m.isLoading &&
              m.text &&
              typeof m.text === "string" &&
              m.text.trim().length > 0;
            if (!isValid) {
              console.log("🚫 Filtered out message:", {
                id: m.id,
                isLoading: m.isLoading,
                hasText: !!m.text,
                textType: typeof m.text,
                textLength: m.text?.length,
              });
            }
            return isValid;
          })
          .map((m) => ({
            role: m.isUser ? ("user" as const) : ("assistant" as const),
            content: m.text.trim(),
          }));

        // Đảm bảo messages array không rỗng
        if (messagesForAPI.length === 0) {
          console.error("❌ Messages array is empty after filtering!");
          throw new Error("Không có tin nhắn để gửi");
        }

        console.log("📤 Sending to AI API:", {
          messageCount: messagesForAPI.length,
          messages: messagesForAPI,
          chatType: "consultation",
        });

        // eslint-disable-next-line react-hooks/rules-of-hooks
        response = await useAIToRecommend(messagesForAPI);
      }

      // Remove typing message and replace with actual AI message
      setMessages((prev) => prev.filter((msg) => msg.id !== typingMessageId));

      // Extract AI response text based on API response structure
      let aiResponseText = "";
      let analysisText = ""; // Temporary text to show during typing, will disappear after

      if (chatType === "learningPath") {
        // For learning path API: response.data.data contains { analysis, recommendations, additionalAdvice }
        const responseData = response?.data?.data || response?.data;

        if (responseData) {
          // Store recommendations directly from API for later use
          if (
            responseData.recommendations &&
            Array.isArray(responseData.recommendations) &&
            responseData.recommendations.length > 0
          ) {
            recommendationsRef.current = responseData.recommendations;
            console.log(
              "📚 Stored recommendations from API:",
              responseData.recommendations.length
            );
          } else {
            recommendationsRef.current = null;
          }

          const parts: string[] = [];

          // Extract analysis separately - it will be shown temporarily during typing
          if (responseData.analysis) {
            analysisText = `**Phân tích:**\n${responseData.analysis}`;
          }

          // Add recommendations if exists (NOT analysis)
          if (
            responseData.recommendations &&
            Array.isArray(responseData.recommendations) &&
            responseData.recommendations.length > 0
          ) {
            parts.push(`**Khóa học đề xuất:**`);
            responseData.recommendations.forEach((rec: any, index: number) => {
              const courseName =
                rec.courseName ||
                rec.name ||
                rec.title ||
                `Khóa học ${index + 1}`;
              const matchScore = rec.matchScore;
              const reasons = rec.reasons || [];
              const pros = rec.pros || [];
              const cons = rec.cons || [];

              let recText = `\n\n${index + 1}. **${courseName}**`;

              // Add match score if exists
              if (matchScore !== undefined && matchScore !== null) {
                recText += ` (Độ phù hợp: ${matchScore}%)`;
              }

              // Add reasons if exists
              if (reasons.length > 0) {
                recText += `\n   ${reasons
                  .map((r: string) => `• ${r}`)
                  .join("\n   ")}`;
              }

              // Add pros if exists
              if (pros.length > 0) {
                recText += `\n   **Ưu điểm:**`;
                recText += `\n   ${pros
                  .map((p: string) => `✓ ${p}`)
                  .join("\n   ")}`;
              }

              // Add cons if exists
              if (cons.length > 0) {
                recText += `\n   **Lưu ý:**`;
                recText += `\n   ${cons
                  .map((c: string) => `⚠ ${c}`)
                  .join("\n   ")}`;
              }

              parts.push(recText);
            });
          }

          // Add additional advice if exists
          if (responseData.additionalAdvice) {
            parts.push(
              `\n\n**Lời khuyên bổ sung:**\n${responseData.additionalAdvice}`
            );
          }

          // Add total courses count if exists
          if (responseData.recommendations.length) {
            parts.push(
              `\n\nTìm thấy **${responseData.recommendations.length}** khóa học phù hợp với yêu cầu của bạn.`
            );
          }

          aiResponseText = parts.join("").trim();
        }

        // Fallback if no structured data
        if (!aiResponseText) {
          aiResponseText =
            response?.data?.data?.message ||
            response?.data?.message ||
            response?.data?.response ||
            "Cảm ơn bạn đã cung cấp thông tin. Tôi đã phân tích và tìm thấy các khóa học phù hợp cho bạn.";
        }
      } else {
        // For consultation API: response.data.data.answer exists
        const responseData = response?.data?.data || response?.data;

        aiResponseText =
          responseData?.answer ||
          responseData?.message ||
          response?.data?.answer ||
          response?.data?.message ||
          response?.data?.response ||
          "Cảm ơn bạn đã đặt câu hỏi. Tôi đang xử lý yêu cầu của bạn...";
      }

      // Ensure we have valid text
      if (!aiResponseText || aiResponseText.trim().length === 0) {
        console.error("❌ AI response text is empty!");
        aiResponseText =
          "Xin lỗi, không thể nhận được phản hồi từ AI. Vui lòng thử lại.";
      }

      // Create AI message with typing effect
      const aiMessageId = Date.now().toString();
      // Pin conversation id at the time AI starts replying
      const convIdAtStart = conversationId || currentConversationId || null;
      const aiMessage: Message = {
        id: aiMessageId,
        text: "",
        isUser: false,
        timestamp: new Date(),
        isTyping: true,
        analysisText: undefined, // Start with empty, will be set progressively during typing
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Persist a placeholder AI message immediately so history survives reloads
      try {
        if (convIdAtStart) {
          const placeholder: DBChatMessage = {
            id: aiMessageId,
            text: "",
            isUser: false,
            timestamp: Date.now(),
            chatType: chatType,
            conversationId: convIdAtStart,
          };
          await chatDatabaseService.saveMessage(placeholder);
          try {
            await AsyncStorage.setItem(
              `AI_CHAT_LAST_CONV_${chatType}`,
              String(convIdAtStart)
            );
          } catch {}
        }
      } catch {}

      // Start typing animation
      let currentIndex = 0;
      const typingSpeed = 15 + Math.random() * 10; // Variable typing speed

      // Calculate where analysis ends (if it exists)
      const analysisLength = analysisText.length;
      const hasAnalysis = analysisText.length > 0;
      let analysisTypingComplete = false; // Flag to track if analysis typing is done

      // Scroll to bottom once when starting typing
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);

      const typeNextChar = () => {
        if (hasAnalysis && !analysisTypingComplete) {
          // Phase 1: Type analysis with typing effect
          if (currentIndex < analysisLength) {
            // Typing analysis - show analysis text character by character
            const currentAnalysisText = analysisText.substring(
              0,
              currentIndex + 1
            );

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? {
                      ...msg,
                      text: "", // Recommendations empty during analysis typing
                      isTyping: true,
                      analysisText: currentAnalysisText, // Analysis typing progressively
                    }
                  : msg
              )
            );
            currentIndex++;

            typingTimeoutRef.current = setTimeout(
              typeNextChar,
              typingSpeed
            ) as ReturnType<typeof setTimeout>;
            return;
          } else {
            // Analysis typing complete - mark as done and remove analysis
            analysisTypingComplete = true;

            // Delay a bit before starting recommendations
            setTimeout(() => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? {
                        ...msg,
                        text: "",
                        isTyping: true,
                        analysisText: undefined, // Remove analysis
                      }
                    : msg
                )
              );
              // Start typing recommendations immediately after analysis disappears
              typeNextChar();
            }, 300); // Brief pause before recommendations
            return;
          }
        }

        // Phase 2: Type recommendations
        const recommendationsProgress = hasAnalysis
          ? currentIndex - analysisLength
          : currentIndex;

        if (
          recommendationsProgress >= 0 &&
          recommendationsProgress < aiResponseText.length
        ) {
          const recommendationsText = aiResponseText.substring(
            0,
            recommendationsProgress + 1
          );

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    text: recommendationsText,
                    isTyping: true,
                    analysisText: undefined, // No analysis during recommendations
                  }
                : msg
            )
          );
          currentIndex++;

          // Only scroll every 10 characters to reduce flickering
          if (recommendationsProgress % 10 === 0) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 50);
          }

          typingTimeoutRef.current = setTimeout(
            typeNextChar,
            typingSpeed
          ) as ReturnType<typeof setTimeout>;
        } else {
          // Typing complete - remove analysis and typing indicator, save to DB
          // Final text should NOT include analysis
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    text: aiResponseText,
                    isTyping: false,
                    analysisText: undefined,
                  }
                : msg
            )
          );

          // Final scroll after typing complete - use requestAnimationFrame to prevent flickering
          requestAnimationFrame(() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 50);
          });

          // Save to database after typing is complete (without analysis)
          // Delay to avoid re-render flickering immediately after typing
          setTimeout(async () => {
            try {
              const dbMessage: DBChatMessage = {
                id: aiMessageId,
                text: aiResponseText, // Save without analysis
                isUser: false,
                timestamp: new Date().getTime(),
                chatType: chatType,
                conversationId: convIdAtStart || undefined,
              };
              await chatDatabaseService.saveMessage(dbMessage);
              try {
                if (convIdAtStart) {
                  await AsyncStorage.setItem(
                    `AI_CHAT_LAST_CONV_${chatType}`,
                    String(convIdAtStart)
                  );
                }
              } catch {}

              // After saving AI message, attempt to create learning path from recommendations
              try {
                // If we have recommendations from API, use them directly
                if (
                  chatType === "learningPath" &&
                  recommendationsRef.current &&
                  recommendationsRef.current.length > 0
                ) {
                  // Load courses if not cached
                  if (!coursesCacheRef.current) {
                    const coursesRes = await getAllCourses();
                    coursesCacheRef.current =
                      (coursesRes?.data?.data as any) ||
                      (coursesRes?.data as any) ||
                      [];
                  }
                  const courses: { _id: string; title: string }[] =
                    coursesCacheRef.current || [];

                  const suggestion =
                    await createLearningPathFromRecommendations(
                      recommendationsRef.current,
                      courses
                    );
                  if (suggestion && suggestion.process.length > 0) {
                    console.log(
                      `✅ Created learning path with ${suggestion.process.length} courses from ${recommendationsRef.current.length} recommendations`
                    );
                    setPendingSuggestion({
                      ...suggestion,
                      sourceMessageId: aiMessageId,
                    });
                  }
                } else {
                  // Fallback to text parsing if no recommendations available
                  const suggestion =
                    extractLearningPathSuggestion(aiResponseText);
                  if (suggestion && suggestion.process.length > 0) {
                    setPendingSuggestion({
                      ...suggestion,
                      sourceMessageId: aiMessageId,
                    });
                  }
                }
              } catch (error) {
                console.error(
                  "❌ Error creating learning path suggestion:",
                  error
                );
              }

              // Update conversation - use requestAnimationFrame to batch updates
              if (convIdAtStart) {
                requestAnimationFrame(async () => {
                  await chatDatabaseService.updateConversation(convIdAtStart, {
                    lastMessage: aiResponseText.substring(0, 100),
                    lastMessageTime: new Date().getTime(),
                    messageCount: messages.length + 1,
                  });

                  // Reload conversations only if drawer is open (to avoid unnecessary re-renders)
                  if (showDrawer) {
                    await loadConversations();
                  }
                });
              }
            } catch (error) {
              console.error("❌ Error saving AI message:", error);
            }
          }, 200);
        }
      };

      // Start typing after a short delay
      setTimeout(() => {
        typeNextChar();
      }, 200);
    } catch (error) {
      // Remove typing message
      setMessages((prev) => prev.filter((msg) => msg.id !== typingMessageId));

      showErrorToast(error, {
        title: "Lỗi",
        message: "Không thể gửi tin nhắn. Vui lòng thử lại.",
      });

      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      // Save error message to database
      try {
        const dbMessage: DBChatMessage = {
          id: errorMessage.id,
          text: errorMessage.text,
          isUser: errorMessage.isUser,
          timestamp: errorMessage.timestamp.getTime(),
          chatType: chatType,
        };
        await chatDatabaseService.saveMessage(dbMessage);
      } catch (dbError) {
        console.error("❌ Error saving error message:", dbError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const MessageItem = React.memo(
    ({
      item,
      index,
      chatTypeProp,
      totalMessages,
      onLongPress,
      onPress,
    }: {
      item: Message;
      index: number;
      chatTypeProp: ChatType;
      totalMessages: number;
      onLongPress: (message: Message) => void;
      onPress?: (message: Message) => void;
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
            {!item.isUser && (
              <View style={styles.aiIconContainer}>
                <Ionicons
                  name={
                    chatTypeProp === "learningPath"
                      ? "sparkles"
                      : "aperture-outline"
                  }
                  size={20}
                  color={colors.primary}
                />
              </View>
            )}
            <View style={{ flexShrink: 1, minWidth: 0 }}>
              {item.text ? (
                <Text
                  style={[
                    styles.messageText,
                    item.isUser ? styles.userMessageText : styles.aiMessageText,
                  ]}
                  selectable
                >
                  {parseMarkdownBold(item.text)}
                </Text>
              ) : null}
              {/* Show analysis text with typing effect and low opacity */}
              {!item.isUser && item.isTyping === true && item.analysisText && (
                <Text
                  style={[
                    styles.messageText,
                    styles.aiMessageText,
                    { opacity: 0.4 },
                  ]}
                >
                  {parseMarkdownBold(item.analysisText)}
                </Text>
              )}
              {/* Show typing indicator only when there's no text being typed yet */}
              {!item.isUser &&
                item.isTyping === true &&
                !item.text &&
                !item.analysisText && <TypingIndicator />}
            </View>
          </TouchableOpacity>
        </MessageContainer>
      );
    }
  );

  const handleMessagePress = (message: Message) => {
    // If message has learning path data, open preview modal
    if (message.learningPathData && !message.isUser) {
      console.log(
        "Opening learning path from message:",
        message.learningPathData
      );
      setPreviewLP(message.learningPathData);
      setPreviewError(null);
    } else if (message.learningPathId && !message.isUser) {
      // If only ID is available, try to fetch or show message
      console.log(
        "Message has learningPathId but no data:",
        message.learningPathId
      );
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
    />
  );

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
        console.log("⚠️ Skipped recommendation (no valid course ID):", {
          courseName,
          rec: rec,
        });
      }
    }

    if (processSteps.length === 0) {
      console.log("❌ No valid courses found in recommendations");
      return null;
    }

    console.log(
      `✅ Mapped ${processSteps.length} courses from ${recommendations.length} recommendations`
    );

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
      console.log(
        "📝 createLearningPath response:",
        JSON.stringify(res?.data, null, 2)
      );

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

      console.log("📝 Extracted ID:", id, "from responseData:", responseData);

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
      console.log("📋 Loading conversations for chatType:", chatType);
      const convs = await chatDatabaseService.getConversations(chatType);
      console.log("📋 Loaded conversations from DB:", convs.length);

      // Always include current conversation in the list if it has messages
      if (messages.length > 0) {
        const messageCount = messages.filter(
          (m) => !m.isLoading && !m.isTyping
        ).length;

        console.log("📋 Current state:", {
          messageCount,
          currentConversationId,
          messagesLength: messages.length,
        });

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

          console.log(
            "📋 Existing conversation found:",
            existingConvIndex >= 0
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
            console.log(
              "📋 Updated conversation list with current conversation"
            );
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
            console.log("📋 Added current conversation to list");
          }
          return;
        }
      }

      // If no current conversation, just show DB conversations
      console.log("📋 Setting conversations from DB only:", convs.length);
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
    setCurrentConversationId(null);
    setPendingSuggestion(null);
    recommendationsRef.current = null; // Clear recommendations for new chat
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
      console.log("🔄 Loading conversation:", {
        conversationId: clickedIdStr,
        chatType,
        currentConversationId: currentIdStr,
      });

      // Load messages from database
      const convMessages = await chatDatabaseService.loadMessages(
        chatType,
        clickedIdStr
      );

      console.log("📨 Loaded messages count:", convMessages.length);

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

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 200);
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

  return (
    <View style={styles.container}>
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
            <LinearGradient
              colors={[colors.white, colors.white]}
              style={styles.headerIcon}
            >
              <Ionicons
                name={config.icon}
                size={config.icon !== "aperture-outline" ? 24 : 32}
                color={colors.primary}
              />
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{config.title}</Text>
            <Text style={styles.headerSubtitle}>AI trợ lý</Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.contentContainer}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            ListFooterComponent={
              pendingSuggestion ? (
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
              ) : null
            }
            onContentSizeChange={() => {
              // Only scroll if not currently typing (avoid flickering during typing)
              const hasTypingMessage = messages.some((m) => m.isTyping);
              if (!hasTypingMessage) {
                // Debounce scroll to prevent rapid-fire updates causing flickering
                if (scrollTimeoutRef.current) {
                  clearTimeout(scrollTimeoutRef.current);
                }
                scrollTimeoutRef.current = setTimeout(() => {
                  requestAnimationFrame(() => {
                    flatListRef.current?.scrollToEnd({ animated: false });
                  });
                }, 50) as ReturnType<typeof setTimeout>;
              }
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              messages.length === 0 ? (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text style={{ color: colors.gray[400], fontSize: 14 }}>
                    Bắt đầu cuộc trò chuyện với AI trợ lý
                  </Text>
                </View>
              ) : null
            }
          />

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder={config.placeholder}
                placeholderTextColor={colors.gray[400]}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!isLoading}
              />
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
                  <Ionicons name="copy-outline" size={20} color={colors.text} />
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
                  <Ionicons name="add" size={20} color={colors.primary} />
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
                          color={colors.primary}
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
  );
}
