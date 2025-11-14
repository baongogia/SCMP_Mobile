import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { authService } from "@/src/services/auth/authService";
import { eventBus } from "@/src/utils/eventBus";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ChildAccountIndicator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [childInfo, setChildInfo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const expandAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    // Use native driver for opacity and translateX (better performance)
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true, // Can use native driver for opacity and transform
      tension: 50,
      friction: 8,
    }).start();
  }, [slideAnim]);

  const animateOut = useCallback(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [slideAnim]);

  const checkChildAccount = useCallback(async () => {
    const isViewing = await authService.isViewingChildAccount();
    if (isViewing) {
      const info = await authService.getChildAccountInfo();
      if (info) {
        setChildInfo(info);
        setIsVisible(true);
        // Auto expand when first showing to display child name
        setIsExpanded(true);
        expandAnim.setValue(1);
        animateIn();
      }
    }
  }, [expandAnim, animateIn]);

  useEffect(() => {
    checkChildAccount();

    const offSwitchToChild = eventBus.on(
      "auth:switch-to-child",
      (info: { id: string; name: string }) => {
        setChildInfo(info);
        setIsVisible(true);
        // Auto expand when switching to child to display name
        setIsExpanded(true);
        expandAnim.setValue(1);
        animateIn();
      }
    );

    const offSwitchToParent = eventBus.on("auth:switch-to-parent", () => {
      setChildInfo(null);
      setIsVisible(false);
      setIsExpanded(false);
      animateOut();
    });

    return () => {
      offSwitchToChild();
      offSwitchToParent();
    };
  }, [checkChildAccount, expandAnim, animateIn, animateOut]);

  const toggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);

    // Use timing for smoother width animation
    Animated.timing(expandAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false, // Must be false for width animation
    }).start();
  };

  const handleSwitchBack = async () => {
    try {
      console.log(
        "🔄 [ChildAccountIndicator] Switching back to parent account..."
      );
      await authService.switchBackToParentAccount();
      console.log("✅ [ChildAccountIndicator] Switched back successfully");

      // Force refresh by emitting logout and re-triggering auth flow
      // This ensures all APIs are called with the correct parent token
      console.log("🔄 [ChildAccountIndicator] Triggering app refresh...");

      // Emit a custom event to trigger app refresh
      eventBus.emit("auth:token-switched");

      // Small delay to let the event propagate, then reset to main home screen
      setTimeout(() => {
        try {
          router.replace("/member");
        } catch (navError) {
          console.error(
            "❌ [ChildAccountIndicator] Navigation error:",
            navError
          );
          // Fallback: emit a global refresh event
          eventBus.emit("auth:force-refresh");
        }
      }, 100);
    } catch (error) {
      console.error("❌ [ChildAccountIndicator] Error switching back:", error);
      // Error is already handled in authService
    }
  };

  if (!isVisible || !childInfo) {
    return null;
  }

  const width = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [48, Math.min(280, SCREEN_WIDTH - 32)], // Smaller collapsed width
  });

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  // Separate opacity animation for smoother fade
  const slideOpacity = slideAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, 16) + 80,
          left: 16,
          transform: [{ translateX }],
          opacity: slideOpacity,
        },
      ]}
    >
      <Animated.View style={[styles.innerContainer, { width }]}>
        <TouchableOpacity
          style={styles.indicator}
          onPress={toggleExpand}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="person" size={18} color={colors.white} />
          </View>

          <Animated.View
            style={[
              styles.expandedContent,
              {
                opacity: expandAnim,
              },
            ]}
            pointerEvents={isExpanded ? "auto" : "none"}
          >
            <View style={styles.textContainer}>
              <Text style={styles.label}>Đang xem:</Text>
              <Text style={styles.childName} numberOfLines={1}>
                {childInfo.name}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={handleSwitchBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={16} color={colors.primary} />
              <Text style={styles.switchButtonText}>Quay về</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.chevronContainer,
              {
                opacity: expandAnim,
              },
            ]}
          >
            <Ionicons
              name={isExpanded ? "chevron-back" : "chevron-forward"}
              size={16}
              color={colors.white}
            />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 1000,
  },
  innerContainer: {
    overflow: "hidden",
  },
  indicator: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    elevation: 8,
    height: 48,
  },
  iconContainer: {
    width: 32, // Smaller icon container
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6, // Smaller margin
  },
  expandedContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 4,
    overflow: "hidden",
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    marginBottom: 2,
  },
  childName: {
    fontSize: 14,
    color: colors.white,
    fontWeight: "600",
  },
  switchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  switchButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  chevronContainer: {
    marginLeft: 4,
  },
});
