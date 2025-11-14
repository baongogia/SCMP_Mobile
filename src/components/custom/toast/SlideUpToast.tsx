import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SlideUpToastProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onHide: () => void;
  duration?: number;
  visible: boolean;
}

const SlideUpToast: React.FC<SlideUpToastProps> = ({
  message,
  type = "info",
  onHide,
  duration = 3000,
  visible,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation - slide up from bottom
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Reset when hidden
      slideAnim.setValue(SCREEN_HEIGHT);
      opacityAnim.setValue(0);
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: colors.success,
          icon: "checkmark-circle" as const,
          iconColor: colors.white,
        };
      case "error":
        return {
          backgroundColor: colors.error,
          icon: "close-circle" as const,
          iconColor: colors.white,
        };
      case "warning":
        return {
          backgroundColor: colors.warning,
          icon: "warning" as const,
          iconColor: colors.white,
        };
      case "info":
        return {
          backgroundColor: colors.info,
          icon: "information-circle" as const,
          iconColor: colors.white,
        };
      default:
        return {
          backgroundColor: colors.primary,
          icon: "information-circle" as const,
          iconColor: colors.white,
        };
    }
  };

  const config = getToastConfig();

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, 20),
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.toast, { backgroundColor: config.backgroundColor }]}>
        <View style={styles.iconContainer}>
          <Ionicons name={config.icon} size={22} color={config.iconColor} />
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity
          onPress={hideToast}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 10000,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 56,
  },
  iconContainer: {
    marginRight: 12,
    width: 24,
    alignItems: "center",
  },
  message: {
    flex: 1,
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
});

export default SlideUpToast;
