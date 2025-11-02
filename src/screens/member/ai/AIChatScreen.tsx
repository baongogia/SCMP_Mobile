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

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
  isTyping?: boolean;
}

type ChatType = "learningPath" | "consultation";

interface RouteParams {
  type: ChatType;
}

// Typing indicator component
const TypingIndicator = () => {
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [blinkAnim]);

  return (
    <Animated.Text
      style={[styles.messageText, styles.aiMessageText, { opacity: blinkAnim }]}
    >
      |
    </Animated.Text>
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
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as RouteParams) || { type: "consultation" };
  const chatType: ChatType = params.type || "consultation";
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chatConfig = {
    learningPath: {
      title: "Tạo lộ trình học tập",
      icon: "map" as const,
      placeholder: "Nhập thông tin của bạn...",
    },
    consultation: {
      title: "Tư vấn học tập",
      icon: "bulb" as const,
      placeholder: "Đặt câu hỏi của bạn...",
    },
  };

  const config = chatConfig[chatType];

  // Initialize database and load messages
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Initialize database
        await chatDatabaseService.initDatabase();

        // Load saved messages (messages without conversationId for backward compatibility)
        const savedMessages = await chatDatabaseService.loadMessages(chatType);

        if (savedMessages.length > 0) {
          // Get conversationId from first message if exists
          const firstConvId = savedMessages[0]?.conversationId;
          if (firstConvId) {
            setCurrentConversationId(firstConvId);

            // Ensure conversation exists in DB (create if doesn't exist)
            try {
              const existingConvs = await chatDatabaseService.getConversations(
                chatType
              );
              const convExists = existingConvs.some(
                (c) => c.id === firstConvId
              );

              if (!convExists) {
                // Create conversation entry from messages
                const firstUserMessage = savedMessages.find((m) => m.isUser);
                const lastMessage = savedMessages[savedMessages.length - 1];
                const title = firstUserMessage?.text
                  ? firstUserMessage.text.length > 50
                    ? firstUserMessage.text.substring(0, 50) + "..."
                    : firstUserMessage.text
                  : "Cuộc trò chuyện";

                await chatDatabaseService.createConversation({
                  id: firstConvId,
                  chatType: chatType,
                  title: title,
                  lastMessage: lastMessage?.text?.substring(0, 100) || "",
                  lastMessageTime: lastMessage?.timestamp || Date.now(),
                  messageCount: savedMessages.length,
                });
              }
            } catch (error) {
              console.error("❌ Error ensuring conversation exists:", error);
            }
          }

          // Convert DB messages to UI messages - ensure full text is preserved
          const uiMessages: Message[] = savedMessages.map((msg) => ({
            id: msg.id,
            text: msg.text || "", // Ensure text is string
            isUser: msg.isUser,
            timestamp: new Date(msg.timestamp),
            isTyping: false, // Messages from DB should never be typing
          }));

          setMessages(uiMessages);

          // Scroll to bottom after loading
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 200);
        } else {
          console.log("ℹ️ No saved messages found for chatType:", chatType);
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
      }
    } catch (error) {
      console.error("❌ Error saving user message:", error);
    }

    const currentInput = messageText;
    if (!suggestedText) {
      setInputText("");
    }
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      text: "",
      isUser: false,
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

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

      // Remove loading message
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));

      // Extract AI response text based on API response structure
      let aiResponseText = "";

      if (chatType === "learningPath") {
        // For learning path API: response.data.data contains { analysis, recommendations, additionalAdvice }
        const responseData = response?.data?.data || response?.data;

        if (responseData) {
          const parts: string[] = [];

          // Add analysis if exists
          if (responseData.analysis) {
            parts.push(`**Phân tích:**\n${responseData.analysis}`);
          }

          // Add recommendations if exists
          if (
            responseData.recommendations &&
            Array.isArray(responseData.recommendations) &&
            responseData.recommendations.length > 0
          ) {
            parts.push(`\n**Khóa học đề xuất:**`);
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
          if (responseData.totalCourses) {
            parts.push(
              `\n\nTìm thấy **${responseData.totalCourses}** khóa học phù hợp với yêu cầu của bạn.`
            );
          }

          aiResponseText = parts.join("");
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
      const aiMessage: Message = {
        id: aiMessageId,
        text: "",
        isUser: false,
        timestamp: new Date(),
        isTyping: true,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Start typing animation
      let currentIndex = 0;
      const typingSpeed = 15 + Math.random() * 10; // Variable typing speed

      const typeNextChar = () => {
        if (currentIndex < aiResponseText.length) {
          const currentText = aiResponseText.substring(0, currentIndex + 1);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, text: currentText, isTyping: true }
                : msg
            )
          );
          currentIndex++;

          // Auto scroll during typing
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 50);

          typingTimeoutRef.current = setTimeout(
            typeNextChar,
            typingSpeed
          ) as ReturnType<typeof setTimeout>;
        } else {
          // Typing complete - remove typing indicator and save to DB
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId ? { ...msg, isTyping: false } : msg
            )
          );

          // Save to database after typing is complete
          setTimeout(async () => {
            try {
              const dbMessage: DBChatMessage = {
                id: aiMessageId,
                text: aiResponseText,
                isUser: false,
                timestamp: new Date().getTime(),
                chatType: chatType,
                conversationId: currentConversationId || undefined,
              };
              await chatDatabaseService.saveMessage(dbMessage);

              // Update conversation
              if (currentConversationId) {
                await chatDatabaseService.updateConversation(
                  currentConversationId,
                  {
                    lastMessage: aiResponseText.substring(0, 100),
                    lastMessageTime: new Date().getTime(),
                    messageCount: messages.length + 1,
                  }
                );
              }
            } catch (error) {
              console.error("❌ Error saving AI message:", error);
            }
          }, 100);
        }
      };

      // Start typing after a short delay
      setTimeout(() => {
        typeNextChar();
      }, 200);
    } catch (error) {
      // Remove loading message
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));

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
    }: {
      item: Message;
      index: number;
      chatTypeProp: ChatType;
      totalMessages: number;
      onLongPress: (message: Message) => void;
    }) => {
      MessageItem.displayName = "MessageItem";
      const messageOpacity = useRef(new Animated.Value(1)).current; // Start visible
      const messageTranslateY = useRef(new Animated.Value(0)).current; // Start at position

      useEffect(() => {
        // Only animate if this is a new message (near the end of list)
        const isNewMessage = index >= totalMessages - 2;

        if (isNewMessage) {
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
        }
      }, [index, totalMessages, messageOpacity, messageTranslateY]);

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

      return (
        <Animated.View
          style={[
            styles.messageContainer,
            item.isUser
              ? styles.userMessageContainer
              : styles.aiMessageContainer,
            {
              opacity: messageOpacity,
              transform: [{ translateY: messageTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.messageBubble,
              item.isUser ? styles.userBubble : styles.aiBubble,
            ]}
            onLongPress={() => onLongPress(item)}
            activeOpacity={0.8}
          >
            {!item.isUser && (
              <View style={styles.aiIconContainer}>
                <Ionicons
                  name={chatTypeProp === "learningPath" ? "sparkles" : "bulb"}
                  size={16}
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
              {!item.isUser && item.isTyping === true && <TypingIndicator />}
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    }
  );

  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <MessageItem
      item={item}
      index={index}
      chatTypeProp={chatType}
      totalMessages={messages.length}
      onLongPress={handleLongPressMessage}
    />
  );

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Load conversations for history
  const loadConversations = async () => {
    try {
      const convs = await chatDatabaseService.getConversations(chatType);

      // Always include current conversation in the list if it has messages
      if (messages.length > 0) {
        const messageCount = messages.filter(
          (m) => !m.isLoading && !m.isTyping
        ).length;

        if (messageCount > 0) {
          // Get first user message for title
          const firstUserMessage = messages.find((m) => m.isUser);
          const lastMessage = messages[messages.length - 1];
          const title = firstUserMessage?.text
            ? firstUserMessage.text.length > 50
              ? firstUserMessage.text.substring(0, 50) + "..."
              : firstUserMessage.text
            : "Cuộc trò chuyện mới";

          // Use current conversation ID
          // If no conversationId exists, we should have created one when sending first message
          // So we should always have a conversationId here
          const convId = currentConversationId;

          if (!convId) {
            // No conversation ID yet, this shouldn't happen if conversation was created properly
            // Just show conversations from DB
            setConversations(convs);
            return;
          }

          // Check if current conversation is already in the list
          const existingConvIndex = convs.findIndex((c) => c.id === convId);

          if (existingConvIndex >= 0) {
            // Update existing conversation in list with latest info
            const updatedConvs = [...convs];
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
              id: convId,
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

      setConversations(convs);
    } catch (error) {
      console.error("❌ Error loading conversations:", error);
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
    // Don't delete old messages, just create new conversation
  };

  // Delete current conversation
  const handleDeleteConversation = () => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa đoạn chat này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              if (currentConversationId) {
                await chatDatabaseService.deleteConversation(
                  currentConversationId
                );
              } else {
                await chatDatabaseService.deleteMessages(chatType);
              }
              setMessages([]);
              setCurrentConversationId(null);
              await loadConversations();
              Alert.alert("Thành công", "Đã xóa đoạn chat");
            } catch (error) {
              console.error("❌ Error deleting conversation:", error);
              Alert.alert("Lỗi", "Không thể xóa đoạn chat");
            }
          },
        },
      ]
    );
  };

  // Load conversation
  const handleLoadConversation = async (conversationId: string) => {
    // Convert both to string for comparison
    const currentIdStr = String(currentConversationId || "");
    const clickedIdStr = String(conversationId || "");

    // If clicking on the current conversation, just close the modal
    if (currentIdStr === clickedIdStr && currentIdStr !== "") {
      setShowHistoryModal(false);
      return;
    }

    // Handle temp IDs (conversations not yet saved to DB)
    if (clickedIdStr.startsWith("temp-")) {
      // This is a temporary conversation that hasn't been saved
      // Don't load anything, just close modal
      setShowHistoryModal(false);
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
        setShowHistoryModal(false);
        return;
      }

      const uiMessages: Message[] = convMessages.map((msg) => ({
        id: msg.id,
        text: msg.text || "",
        isUser: msg.isUser,
        timestamp: new Date(msg.timestamp),
        isTyping: false,
      }));

      setMessages(uiMessages);
      setCurrentConversationId(clickedIdStr);
      setShowHistoryModal(false);

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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.headerIcon}
            >
              <Ionicons name={config.icon} size={24} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{config.title}</Text>
            <Text style={styles.headerSubtitle}>AI trợ lý</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => {
              loadConversations();
              setShowHistoryModal(true);
            }}
          >
            <Ionicons name="time-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handleNewChat}
          >
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>
          {messages.length > 0 && (
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={handleDeleteConversation}
            >
              <Ionicons
                name="trash-outline"
                size={22}
                color={colors.error || "#F44336"}
              />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            messages.length === 0 ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ color: colors.gray[400], fontSize: 14 }}>
                  Chưa có tin nhắn nào
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
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
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

      {/* History Conversation Modal */}
      <Modal
        visible={showHistoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.historyModal}>
            <View style={styles.historyModalHeader}>
              <Text style={styles.historyModalTitle}>Lịch sử trò chuyện</Text>
              <TouchableOpacity
                onPress={() => setShowHistoryModal(false)}
                style={styles.historyModalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.historyModalContent}>
              {conversations.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={48}
                    color={colors.gray[400]}
                  />
                  <Text style={styles.emptyHistoryText}>
                    Chưa có lịch sử trò chuyện
                  </Text>
                </View>
              ) : (
                conversations.map((conv) => (
                  <TouchableOpacity
                    key={conv.id}
                    style={[
                      styles.conversationItem,
                      currentConversationId === conv.id &&
                        styles.conversationItemActive,
                    ]}
                    onPress={() => handleLoadConversation(conv.id)}
                  >
                    <View style={styles.conversationItemContent}>
                      <Text
                        style={styles.conversationItemTitle}
                        numberOfLines={1}
                      >
                        {conv.title}
                      </Text>
                      <Text
                        style={styles.conversationItemPreview}
                        numberOfLines={2}
                      >
                        {conv.lastMessage}
                      </Text>
                      <Text style={styles.conversationItemTime}>
                        {new Date(conv.lastMessageTime).toLocaleString(
                          "vi-VN",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.conversationDeleteButton}
                      onPress={async () => {
                        Alert.alert(
                          "Xác nhận",
                          "Bạn có chắc chắn muốn xóa đoạn chat này?",
                          [
                            { text: "Hủy", style: "cancel" },
                            {
                              text: "Xóa",
                              style: "destructive",
                              onPress: async () => {
                                try {
                                  await chatDatabaseService.deleteConversation(
                                    conv.id
                                  );
                                  await loadConversations();
                                  if (currentConversationId === conv.id) {
                                    setMessages([]);
                                    setCurrentConversationId(null);
                                  }
                                } catch {
                                  Alert.alert("Lỗi", "Không thể xóa đoạn chat");
                                }
                              },
                            },
                          ]
                        );
                      }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.error || "#F44336"}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
