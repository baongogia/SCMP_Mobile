import React from "react";
import { Animated, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  chatDatabaseService,
  ChatMessage as DBChatMessage,
} from "@/src/services/chat/chatDatabaseService";
import { showErrorToast } from "@/src/utils/errorHandler";
import {
  useAIToRecommend,
  useAIToCreateLearningPlan,
} from "@/src/services/AI_agent/aiAgentServices";
import { getAllCourses } from "@/src/services/learning_process/course/courseService";

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  analysisText?: string;
  isLoading?: boolean;
};

type ChatType = "learningPath" | "consultation";

interface HandleSendMessageParams {
  suggestedText?: string;
  inputText: string;
  isLoading: boolean;
  sendButtonScale: Animated.Value;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentConversationId: string | null;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  chatType: ChatType;
  messages: Message[];
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  flatListRef: React.RefObject<FlatList | null>;
  typingTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
  showDrawer: boolean;
  loadConversations: () => Promise<void>;
  getTenantId: () => Promise<string | null>;
  recommendationsRef: React.MutableRefObject<any[] | null>;
  coursesCacheRef: React.MutableRefObject<
    { _id: string; title: string; description?: string }[] | null
  >;
  createLearningPathFromRecommendations: (
    recommendations: any[],
    courses: { _id: string; title: string; description?: string }[]
  ) => Promise<{
    title: string;
    process: {
      title: string;
      course?: string;
      courseTitle?: string;
      courseDescription?: string;
    }[];
  } | null>;
  extractLearningPathSuggestion: (text: string) => {
    title: string;
    process: { title: string; course?: string }[];
  } | null;
  setPendingSuggestion: React.Dispatch<
    React.SetStateAction<{
      title: string;
      process: { title: string; course?: string }[];
      sourceMessageId: string;
    } | null>
  >;
  prefilledUserMessage?: Message;
  skipAddingUserMessage?: boolean;
}

export const handleSendMessage = async (params: HandleSendMessageParams) => {
  const {
    suggestedText,
    inputText,
    isLoading,
    sendButtonScale,
    setMessages,
    currentConversationId,
    setCurrentConversationId,
    chatType,
    messages,
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
    prefilledUserMessage,
    skipAddingUserMessage = false,
  } = params;
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

  const userMessage: Message = prefilledUserMessage || {
    id: Date.now().toString(),
    text: messageText,
    isUser: true,
    timestamp: new Date(),
  };

  // Update messages state with user message
  if (!skipAddingUserMessage) {
    setMessages((prev) => [...prev, userMessage]);
  }

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
      const allMessages = [...messages, userMessage];

      const messagesForAPI = allMessages
        .filter((m) => {
          const isValid =
            !m.isLoading &&
            m.text &&
            typeof m.text === "string" &&
            m.text.trim().length > 0;
          if (!isValid) {
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
    const totalTargetLength = Math.max(
      analysisText.length + aiResponseText.length,
      1
    );
    const charsPerTick =
      totalTargetLength > 1500
        ? 3
        : totalTargetLength > 900
        ? 2
        : totalTargetLength > 450
        ? 1
        : 1;
    const typingDelay =
      (totalTargetLength > 1500
        ? 14
        : totalTargetLength > 900
        ? 16
        : totalTargetLength > 450
        ? 18
        : 20) +
      Math.random() * 4;

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
          const nextIndex = Math.min(
            currentIndex + charsPerTick,
            analysisLength
          );
          const currentAnalysisText = analysisText.substring(0, nextIndex);

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
          currentIndex = nextIndex;

          typingTimeoutRef.current = setTimeout(
            typeNextChar,
            typingDelay
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
      const totalLengthForTyping = analysisLength + aiResponseText.length;

      if (currentIndex < totalLengthForTyping) {
        const nextIndex = Math.min(
          currentIndex + charsPerTick,
          totalLengthForTyping
        );
        const recommendationsProgress = Math.max(0, nextIndex - analysisLength);
        const recommendationsText = aiResponseText.substring(
          0,
          recommendationsProgress
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
        currentIndex = nextIndex;

        // Only scroll every 10 characters to reduce flickering
        if (recommendationsProgress % 10 === 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 50);
        }

        typingTimeoutRef.current = setTimeout(
          typeNextChar,
          typingDelay
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

                const suggestion = await createLearningPathFromRecommendations(
                  recommendationsRef.current,
                  courses
                );
                if (suggestion && suggestion.process.length > 0) {
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
