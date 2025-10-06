import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Animated, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { eventBus } from "@/src/utils/eventBus";

interface ToastData {
  title?: string;
  body: string;
  type?: "info" | "success" | "warning" | "error";
  avatarUrl?: string;
}

const GlobalToast: React.FC = () => {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));
  const [lastToastId, setLastToastId] = useState<string | null>(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    const off = eventBus.on("toast", (data: ToastData) => {
      // Create unique ID for this toast to prevent duplicates
      const toastId = `${data.title || ""}|${data.body}`;

      // Skip if this is the same toast as the last one
      if (toastId === lastToastId) {
        console.log("[GlobalToast] Skipping duplicate toast:", toastId);
        return;
      }

      // Additional check: if current toast is showing and new one is similar, skip
      if (toast && toast.body === data.body) {
        console.log("[GlobalToast] Skipping similar toast:", data.body);
        return;
      }

      setLastToastId(toastId);
      setToast(data);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 3 seconds
      setTimeout(() => {
        hideToast();
      }, 3000);
    });

    return () => off();
  }, [fadeAnim, slideAnim, lastToastId, hideToast, toast]);

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
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.toast}>
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
          <Ionicons
            name="close"
            size={20}
            color="#6B7280"
            onPress={hideToast}
          />
        </View>
      </View>
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
});

export default GlobalToast;
