import React, { useRef, useEffect, useState, useMemo } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/src/constants";
import { useUnreadMessages } from "@/src/contexts/UnreadMessagesContext";

const { width: screenWidth } = Dimensions.get("window");
const Tab = createBottomTabNavigator();

interface TabBarButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
  accessibilityState: any;
  accessibilityLabel: string;
}

const TabBarButton: React.FC<TabBarButtonProps> = ({
  children,
  onPress,
  onLongPress,
  accessibilityState,
  accessibilityLabel,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  // Modernize: keep a subtle scale animation only

  useEffect(() => {
    if (accessibilityState?.selected) {
      // Subtle scale on focus
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(animatedValue, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [accessibilityState?.selected, animatedValue]);

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1.0],
  });

  return (
    <Animated.View
      style={[
        styles.tabButton,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.tabButtonTouchable}
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
        activeOpacity={0.8}
      >
        <View style={styles.tabContent}>{children}</View>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { unreadCount } = useUnreadMessages();
  const animationController = useRef(new Animated.Value(0)).current;
  const indicatorX = useRef(new Animated.Value(0)).current;
  const [contentWidth, setContentWidth] = useState(0);

  const CENTER_GAP = 100; // must match styles.centerSpacing.width
  const INDICATOR_WIDTH = 64;
  const INDICATOR_HEIGHT = 44;

  useEffect(() => {
    Animated.timing(animationController, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [animationController]);

  const centerButtonScale = animationController.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const tabItemWidth = useMemo(() => {
    if (contentWidth <= 0) return 0;
    return (contentWidth - CENTER_GAP) / 4;
  }, [contentWidth]);

  useEffect(() => {
    if (tabItemWidth <= 0) return;
    const index = state.index;
    const base = index * tabItemWidth + (index >= 2 ? CENTER_GAP : 0);
    const targetX = base + (tabItemWidth - INDICATOR_WIDTH) / 2;
    Animated.spring(indicatorX, {
      toValue: targetX,
      useNativeDriver: true,
      tension: 120,
      friction: 14,
    }).start();
  }, [state.index, tabItemWidth, indicatorX]);

  return (
    <View style={styles.tabBarContainer}>
      <Animated.View style={[styles.tabBar, { elevation: 16 }]}>
        {/* Simple white background */}
        <View style={styles.tabBarBackground} />

        <View
          style={styles.tabBarContent}
          onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
        >
          {/* Animated active indicator */}
          {contentWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.activeIndicator,
                {
                  width: INDICATOR_WIDTH,
                  height: INDICATOR_HEIGHT,
                  transform: [{ translateX: indicatorX }],
                },
              ]}
            >
              <LinearGradient
                colors={["#0050D4", "#003E9F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeIndicatorGradient}
              />
            </Animated.View>
          )}
          {/* Left side - 2 tabs (Home, Message) */}
          {state.routes.slice(0, 2).map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            const getIcons = (index: number) => {
              switch (index) {
                case 0: // Home
                  return {
                    icon: "home-outline" as const,
                    focused: "home" as const,
                    color: isFocused ? "#007AFF" : "#8E8E93",
                  };
                case 1: // Message
                  return {
                    icon: "chatbubble-outline" as const,
                    focused: "chatbubble" as const,
                    color: isFocused ? "#007AFF" : "#8E8E93",
                  };
                default:
                  return {
                    icon: "home-outline" as const,
                    focused: "home" as const,
                    color: isFocused ? "#007AFF" : "#8E8E93",
                  };
              }
            };

            const iconConfig = getIcons(index);

            return (
              <TabBarButton
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                accessibilityState={{
                  selected: isFocused,
                }}
              >
                <View style={styles.tabContent}>
                  <Ionicons
                    name={isFocused ? iconConfig.focused : iconConfig.icon}
                    size={26}
                    color={isFocused ? "#FFFFFF" : iconConfig.color}
                  />
                  {index === 1 && unreadCount > 0 && (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeText} numberOfLines={1}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TabBarButton>
            );
          })}

          {/* Center spacing for add button */}
          <View style={styles.centerSpacing} />

          {/* Right side - 2 tabs (Search, Profile) */}
          {state.routes.slice(2, 4).map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index + 2;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            const getIcons = (index: number) => {
              switch (index) {
                case 0: // Search
                  return {
                    icon: "search-outline" as const,
                    focused: "search" as const,
                    color: isFocused ? "#007AFF" : "#8E8E93",
                  };
                case 1: // Profile
                  return {
                    icon: "person-outline" as const,
                    focused: "person" as const,
                    color: isFocused ? "#007AFF" : "#8E8E93",
                  };
                default:
                  return {
                    icon: "search-outline" as const,
                    focused: "search" as const,
                    color: isFocused ? "#007AFF" : "#8E8E93",
                  };
              }
            };

            const iconConfig = getIcons(index);

            return (
              <TabBarButton
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                accessibilityState={{
                  selected: isFocused,
                }}
              >
                <View style={styles.tabContent}>
                  <Ionicons
                    name={isFocused ? iconConfig.focused : iconConfig.icon}
                    size={26}
                    color={isFocused ? "#FFFFFF" : iconConfig.color}
                  />
                </View>
              </TabBarButton>
            );
          })}
        </View>

        {/* Center Add Button - ELEVATED */}
        <View style={styles.centerButtonContainer}>
          <Animated.View
            style={[
              styles.centerButton,
              {
                transform: [{ scale: centerButtonScale }],
              },
            ]}
          >
            <LinearGradient
              colors={["#0050D4", "#003E9F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.centerButtonGradient}
            >
              <TouchableOpacity
                style={styles.centerButtonTouchable}
                onPress={() => {
                  const route = state.routes[2];
                  if (route) {
                    navigation.navigate(route.name);
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="qr-code" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

interface BottomTabNavigatorProps {
  children: React.ReactNode;
}

const BottomTabNavigator: React.FC<BottomTabNavigatorProps> & {
  Screen: typeof Tab.Screen;
} = ({ children }) => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      {children}
    </Tab.Navigator>
  );
};

BottomTabNavigator.Screen = Tab.Screen;

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  tabBar: {
    flex: 1,
    backgroundColor: "transparent",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  tabBarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  tabBarContent: {
    position: "absolute",
    top: 4,
    left: 8,
    right: 8,
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: (62 - 44) / 2,
    borderRadius: 22,
    backgroundColor: "transparent",
    shadowColor: "#3C6BFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  activeIndicatorGradient: {
    flex: 1,
    borderRadius: 22,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonTouchable: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeContainer: {
    position: "absolute",
    top: -2,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  centerSpacing: {
    width: 100,
    height: 62,
  },
  centerButtonContainer: {
    position: "absolute",
    bottom: 35,
    left: screenWidth / 2 - 35,
    width: 70,
    height: 80,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  centerButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 8,
      height: 16,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  centerButtonGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: colors.mainBackground,
  },
  centerButtonTouchable: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  // Particle effects (exact match to Flutterversion)
  particle1: {
    position: "absolute",
    top: 4,
    left: 6,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
  particle2: {
    position: "absolute",
    top: 0,
    left: 6,
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#007AFF",
  },
  particle3: {
    position: "absolute",
    top: 6,
    right: 8,
    bottom: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default BottomTabNavigator;
