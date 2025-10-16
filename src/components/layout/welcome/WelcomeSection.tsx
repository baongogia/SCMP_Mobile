import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";

export interface WelcomeSectionProps {
  username?: string | null;
  currentTime: Date;
  location?: string;
  temperatureC?: number;
  weatherDesc?: string;
  backgroundUri?: string;
  notificationCount?: number;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

const getGreeting = (date: Date) => {
  const hour = date.getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};

const getWeatherTheme = (
  desc?: string
): { gradient: readonly [string, string]; icon: any } => {
  const text = (desc || "").toLowerCase();
  if (text.includes("mưa") || text.includes("rain")) {
    return {
      gradient: ["#0F2027", "#203A43"] as const,
      icon: "rainy-outline" as const,
    };
  }
  if (text.includes("mây") || text.includes("cloud") || text.includes("âm")) {
    return {
      gradient: ["#2C3E50", "#4CA1AF"] as const,
      icon: "cloud-outline" as const,
    };
  }
  if (text.includes("nắng") || text.includes("sun") || text.includes("clear")) {
    return {
      gradient: ["#0077BE", "#4DB6E6"] as const,
      icon: "sunny-outline" as const,
    };
  }
  return {
    gradient: ["#0C3E78", "#0E5FA8"] as const,
    icon: "partly-sunny-outline" as const,
  };
};

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  username,
  currentTime,
  location = "TP.HCM",
  temperatureC = 29,
  weatherDesc = "Nắng nhẹ",
  backgroundUri = "https://i.pinimg.com/1200x/f7/9e/88/f79e88852e415e92342c20e406de6288.jpg",
  notificationCount = 0,
  onNotificationPress,
  onProfilePress,
}) => {
  const theme = getWeatherTheme(weatherDesc);

  return (
    <View style={styles.welcomeSection}>
      <ImageBackground
        source={{ uri: backgroundUri }}
        style={StyleSheet.absoluteFillObject as any}
        resizeMode="cover"
      />

      {/* Simple overlay */}
      <View style={styles.simpleOverlay} />

      {/* Floating decoration elements */}
      <View style={styles.decorationCircleLarge} />
      <View style={styles.decorationCircleSmall} />
      <View style={styles.decorationCircleMedium} />

      {/* App Header */}
      <View style={styles.appHeader}>
        <View style={styles.appBranding}>
          <View style={styles.appIconContainer}>
            <Ionicons name="water" size={24} color={colors.white} />
          </View>
          <Text style={styles.appName}>SwimCenter</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.white}
            />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 99 ? "99+" : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={onProfilePress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-circle-outline"
              size={28}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.compactGlassContainer}>
        <View style={styles.blurLayer1} />
        <View style={styles.blurLayer2} />
        <View style={styles.blurLayer3} />
        <View style={styles.compactContent}>
          <View style={styles.greetingSection}>
            <Text style={styles.headerGreeting}>
              {getGreeting(currentTime)}
            </Text>
            <Text style={styles.headerUsername}>{username ?? "bạn"}</Text>

            <View style={styles.locationChip}>
              <Ionicons name="location" size={12} color="#4A90E2" />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          </View>

          <View style={styles.weatherTimeSection}>
            <View style={styles.weatherInfo}>
              <View style={styles.weatherRow}>
                <Ionicons name={theme.icon} size={18} color={colors.white} />
                <Text style={styles.temperature}>
                  {Math.round(temperatureC)}°
                </Text>
              </View>
              <Text style={styles.weatherDescription}>{weatherDesc}</Text>
            </View>

            <View style={styles.timeDisplay}>
              <Text style={styles.currentTime}>
                {currentTime.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Text style={styles.currentDate}>
                {currentTime.toLocaleDateString("vi-VN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  welcomeSection: {
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 44 : 32,
    overflow: "hidden",
    minHeight: Platform.OS === "ios" ? 200 : 170,
    position: "relative",
  },

  simpleOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },

  decorationCircleLarge: {
    position: "absolute",
    right: -20,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  decorationCircleSmall: {
    position: "absolute",
    right: 16,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  decorationCircleMedium: {
    position: "absolute",
    left: -25,
    top: 80,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  appHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    zIndex: 10,
  },
  appBranding: {
    flexDirection: "row",
    alignItems: "center",
  },
  appIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  appName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF4757",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "700",
  },

  // Compact Glass Container with blur effect
  compactGlassContainer: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    marginBottom: Platform.OS === "android" ? 8 : 0,
    borderColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },

  // Multi-layer blur effect simulation
  blurLayer1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  blurLayer2: {
    position: "absolute",
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 15,
  },
  blurLayer3: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
  },
  compactContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    position: "relative",
    zIndex: 1,
  },

  // Greeting Section - more compact
  greetingSection: {
    flex: 1,
    marginRight: 12,
  },
  headerGreeting: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.white,
    marginBottom: 2,
  },
  headerUsername: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F0F8FF",
    marginBottom: 8,
  },
  locationChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  locationText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2C3E50",
    marginLeft: 4,
  },

  // Weather & Time Section - simplified
  weatherTimeSection: {
    alignItems: "flex-end",
  },
  weatherInfo: {
    alignItems: "flex-end",
    marginBottom: 8,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  temperature: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.white,
  },
  weatherDescription: {
    fontSize: 10,
    color: "#F0F8FF",
    opacity: 0.9,
    marginTop: 2,
  },
  timeDisplay: {
    alignItems: "flex-end",
  },
  currentTime: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.white,
    lineHeight: 32,
  },
  currentDate: {
    fontSize: 12,
    color: "#F0F8FF",
    opacity: 0.9,
    marginTop: 1,
  },
});

export default WelcomeSection;
