import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { eventBus } from "@/src/utils/eventBus";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showErrorToast } from "@/src/utils/errorHandler";

interface ToastData {
  title?: string;
  body: string;
  type?: "info" | "success" | "warning" | "error";
  avatarUrl?: string;
  roomId?: string;
  className?: string;
  tenantId?: string;
}

const GlobalToast: React.FC = () => {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-120));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  // Bỏ lastToastId vì không còn cần lọc lặp
  const [autoHideTimeout, setAutoHideTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const hideToast = useCallback(() => {
    // Clear auto hide timeout if exists
    if (autoHideTimeout) {
      clearTimeout(autoHideTimeout);
      setAutoHideTimeout(null);
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [fadeAnim, slideAnim, scaleAnim, autoHideTimeout]);

  const handleToastPress = useCallback(async () => {
    console.log("[GlobalToast] handleToastPress called, toast:", toast);
    if (toast?.roomId) {
      console.log("[GlobalToast] Toast has roomId, proceeding with navigation");
      // Navigate to chat screen with roomId
      hideToast();

      try {
        // Get user info to determine user type
        const userString = await AsyncStorage.getItem("user");
        if (userString) {
          const userObj = JSON.parse(userString);
          const role_front = userObj?.role_front;

          console.log("[GlobalToast] User role_front:", role_front);
          console.log(
            "[GlobalToast] Navigating to chat with roomId:",
            toast.roomId
          );
          console.log("[GlobalToast] Toast data:", {
            roomId: toast.roomId,
            className: toast.className,
            tenantId: toast.tenantId,
          });

          if (Array.isArray(role_front)) {
            if (role_front.includes("member")) {
              // Navigate to member chat screen
              console.log("[GlobalToast] Navigating to member chat");
              // Lưu thông tin navigation vào AsyncStorage
              await AsyncStorage.setItem(
                "pendingChatNavigation",
                JSON.stringify({
                  roomId: toast.roomId,
                  className: toast.className,
                  timestamp: Date.now(),
                })
              );
              // Navigate đến member screen và emit event để chuyển đến Chat
              router.push("/member" as any);
              // Emit event để member home screen navigate đến Chat
              setTimeout(() => {
                eventBus.emit("navigate:chat", {
                  roomId: toast.roomId,
                  className: toast.className,
                  timestamp: Date.now(),
                });
              }, 500);
            } else if (role_front.includes("instructor")) {
              // Navigate to instructor chat screen
              console.log("[GlobalToast] Navigating to instructor chat");
              // Lưu thông tin navigation vào AsyncStorage
              await AsyncStorage.setItem(
                "pendingChatNavigation",
                JSON.stringify({
                  roomId: toast.roomId,
                  className: toast.className,
                  timestamp: Date.now(),
                })
              );
              // Navigate đến instructor screen và emit event để chuyển đến Chat
              router.push("/instructor" as any);
              // Emit event để instructor home screen navigate đến Chat
              setTimeout(() => {
                eventBus.emit("navigate:chat", {
                  roomId: toast.roomId,
                  className: toast.className,
                  timestamp: Date.now(),
                });
              }, 500);
            }
          }
        }
      } catch (error) {
        showErrorToast(error, {
          title: "Lỗi lấy thông tin người dùng",
          message: "Không thể lấy thông tin người dùng để điều hướng",
        });
        // Fallback to member chat if error
        router.push("/member" as any);
        setTimeout(() => {
          eventBus.emit("navigate:chat", {
            roomId: toast.roomId,
            className: toast.className,
          });
        }, 500);
      }
    }
  }, [toast, hideToast]);

  useEffect(() => {
    const off = eventBus.on("toast", (data: ToastData) => {
      // Tắt tất cả toast thông báo lỗi theo yêu cầu
      if (data.type === "error") {
        return;
      }

      // Create unique ID for this toast - use timestamp + random to ensure uniqueness
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const toastId = `${data.title || ""}|${data.body}|${timestamp}|${random}`;

      console.log("[GlobalToast] Toast ID được tạo:", toastId);

      // Bỏ hẳn logic lọc lặp - luôn hiển thị toast mới

      // Clear existing timeout
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout);
        setAutoHideTimeout(null);
      }

      // Không cần set lastToastId nữa
      setToast(data);
      console.log("[GlobalToast] Toast set with data:", {
        toastId: toastId,
        title: data.title,
        body: data.body,
        roomId: data.roomId,
        className: data.className,
        tenantId: data.tenantId,
      });

      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(-120);
      scaleAnim.setValue(0.8);

      // Animate in with smooth spring animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 3 seconds
      const timeout = setTimeout(() => {
        hideToast();
      }, 3000);
      setAutoHideTimeout(timeout);
    });

    return () => {
      off();
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout);
      }
    };
  }, [fadeAnim, slideAnim, scaleAnim, hideToast, toast, autoHideTimeout]);

  if (!toast) return null;

  const getIconName = () => {
    switch (toast.type) {
      case "success":
        return "checkmark-circle";
      case "warning":
        return "warning";
      case "error":
        return "close-circle";
      default:
        return "chatbubbles";
    }
  };

  const getIconColor = () => {
    switch (toast.type) {
      case "success":
        return "#10B981";
      case "warning":
        return "#F59E0B";
      case "error":
        return "#EF4444";
      default:
        return "#3B82F6";
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.toast]}
        onPress={() => {
          console.log("[GlobalToast] Toast pressed, roomId:", toast.roomId);
          handleToastPress();
        }}
        activeOpacity={0.8}
        disabled={!toast.roomId}
      >
        <View style={styles.iconContainer}>
          {toast.avatarUrl ? (
            <Image
              source={{ uri: toast.avatarUrl }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name={getIconName()} size={24} color={getIconColor()} />
          )}
        </View>
        <View style={styles.content}>
          {toast.title && <Text style={styles.title}>{toast.title}</Text>}
          <Text style={styles.bodyBold} numberOfLines={2}>
            {toast.body}
          </Text>
        </View>
        <View style={styles.closeContainer}>
          <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  iconContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  body: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  bodyBold: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
    fontWeight: "600",
  },
  closeContainer: {
    marginLeft: 12,
    padding: 4,
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
  },
});

export default GlobalToast;
