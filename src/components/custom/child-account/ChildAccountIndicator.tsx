import React, { useState, useEffect, useRef } from "react";
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
import { useNavigation } from "@react-navigation/native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ChildAccountIndicator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [childInfo, setChildInfo] = useState<{ id: string; name: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const expandAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkChildAccount();

    const offSwitchToChild = eventBus.on("auth:switch-to-child", (info: { id: string; name: string }) => {
      setChildInfo(info);
      setIsVisible(true);
      animateIn();
    });

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
  }, []);

  const checkChildAccount = async () => {
    const isViewing = await authService.isViewingChildAccount();
    if (isViewing) {
      const info = await authService.getChildAccountInfo();
      if (info) {
        setChildInfo(info);
        setIsVisible(true);
        animateIn();
      }
    }
  };

  const animateIn = () => {
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const toggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);

    Animated.spring(expandAnim, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  };

  const handleSwitchBack = async () => {
    try {
      await authService.switchBackToParentAccount();
      // Navigate to home
      (navigation as any).navigate("BottomTabs", { screen: "Home" });
    } catch (error) {
      // Error is already handled in authService
    }
  };

  if (!isVisible || !childInfo) {
    return null;
  }

  const width = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [56, Math.min(280, SCREEN_WIDTH - 32)],
  });

  const opacity = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1],
  });

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, 16) + 60, // 60 for bottom tab bar
          left: 16,
          transform: [{ translateX }],
          width,
          opacity: slideAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.indicator}
        onPress={toggleExpand}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="person" size={20} color={colors.white} />
        </View>

        {isExpanded && (
          <Animated.View
            style={[
              styles.expandedContent,
              {
                opacity: expandAnim,
              },
            ]}
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
        )}

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
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 1000,
  },
  indicator: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 56,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  expandedContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 4,
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

