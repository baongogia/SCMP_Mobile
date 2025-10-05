import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";

interface CustomToastProps {
  message: string;
  type: "success" | "error" | "warning" | "info";
  onHide: () => void;
  duration?: number;
}

const CustomToast: React.FC<CustomToastProps> = ({
  message,
  type,
  onHide,
  duration = 3000,
}) => {
  const slideAnim = new Animated.Value(-100);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    // Show animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
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
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
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

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={[styles.toast, { backgroundColor: config.backgroundColor }]}>
        <Ionicons
          name={config.icon}
          size={20}
          color={config.iconColor}
          style={styles.icon}
        />
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Ionicons name="close" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default CustomToast;
