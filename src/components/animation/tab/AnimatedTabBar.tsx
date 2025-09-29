import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors } from "@/src/constants/colors";
import { dimensions } from "@/src/constants/dimensions";

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

interface TabItemProps {
  key: string;
  name: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  icon: string;
  label: string;
  index: number;
  totalTabs: number;
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const TabItem: React.FC<TabItemProps> = ({
  isFocused,
  onPress,
  onLongPress,
  icon,
  label,
  index,
  totalTabs,
}) => {
  const scale = useSharedValue(isFocused ? 1 : 0.95);
  const opacity = useSharedValue(isFocused ? 1 : 0.7);
  const iconScale = useSharedValue(isFocused ? 1.1 : 1);

  React.useEffect(() => {
    // Simple, smooth animations
    scale.value = withSpring(isFocused ? 1 : 0.95, {
      damping: 20,
      stiffness: 300,
    });

    opacity.value = withTiming(isFocused ? 1 : 0.7, {
      duration: 200,
    });

    iconScale.value = withSpring(isFocused ? 1.1 : 1, {
      damping: 15,
      stiffness: 200,
    });
  }, [isFocused]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handlePress = () => {
    // Simple haptic feedback
    if (Platform.OS === "ios") {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }

    // Simple press animation
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(isFocused ? 1 : 0.95, {
        damping: 20,
        stiffness: 300,
      })
    );

    onPress();
  };

  const getIconName = (
    iconName: string,
    focused: boolean
  ): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<
      string,
      {
        filled: keyof typeof Ionicons.glyphMap;
        outlined: keyof typeof Ionicons.glyphMap;
      }
    > = {
      home: { filled: "home", outlined: "home-outline" },
      chatbubbles: { filled: "chatbubbles", outlined: "chatbubbles-outline" },
      library: { filled: "library", outlined: "library-outline" },
      notifications: {
        filled: "notifications",
        outlined: "notifications-outline",
      },
      "qr-code": { filled: "qr-code", outlined: "qr-code-outline" },
    };

    return focused
      ? iconMap[iconName]?.filled || "home"
      : iconMap[iconName]?.outlined || "home-outline";
  };

  return (
    <AnimatedTouchableOpacity
      style={[styles.tabItem, animatedContainerStyle]}
      onPress={handlePress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Simple background for active tab */}
      {isFocused && <View style={styles.activeBackground} />}

      {/* Icon */}
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <Ionicons
          name={getIconName(icon, isFocused)}
          size={24}
          color={isFocused ? colors.primary : colors.gray[500]}
        />
      </Animated.View>

      {/* Label */}
      <Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? colors.primary : colors.gray[500],
            fontWeight: isFocused ? "600" : "500",
          },
        ]}
      >
        {label}
      </Text>
    </AnimatedTouchableOpacity>
  );
};

export const AnimatedTabBar: React.FC<TabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  return (
    <View style={styles.tabBar}>
      <View style={styles.tabBarContent}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

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

          // Get icon based on route name
          const getIcon = (routeName: string): string => {
            switch (routeName) {
              case "Home":
                return "home";
              case "Chat":
                return "chatbubbles";
              case "Notification":
                return "notifications";
              case "QR":
                return "qr-code";
              default:
                return "home";
            }
          };

          return (
            <TabItem
              key={route.key}
              name={route.name}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              icon={getIcon(route.name)}
              label={label}
              index={index}
              totalTabs={state.routes.length}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 20 : 16,
    left: 16,
    right: 16,
    height: 70,
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.xxl,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  tabBarContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    zIndex: 2,
    borderRadius: dimensions.borderRadius.lg,
  },
  activeBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary + "10",
    borderRadius: dimensions.borderRadius.lg,
  },
  iconContainer: {
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: dimensions.fontSize.xs,
    textAlign: "center",
    marginTop: 2,
  },
});
