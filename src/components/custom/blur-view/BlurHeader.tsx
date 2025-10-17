import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/src/constants/colors";

interface BlurHeaderProps {
  onChatPress: () => void;
  onQRPress: () => void;
  onNotificationPress: () => void;
  onProfilePress: () => void;
  avatarUri?: string;
  unreadCount?: number;
  title?: string;
}

export const BlurHeader: React.FC<BlurHeaderProps> = ({
  onChatPress,
  onQRPress,
  onNotificationPress,
  onProfilePress,
  avatarUri,
  unreadCount = 0,
  title = "SWIM COURSE",
}) => {
  return (
    <View style={styles.container}>
      {/* Native Backdrop Blur that affects views behind the header */}
      <BlurView
        intensity={35}
        tint="light"
        style={[StyleSheet.absoluteFillObject]}
      >
        {/* Optional translucent tint to increase contrast */}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(255,255,255,0.08)",
          }}
        />
      </BlurView>

      {/* Header Content with SafeAreaView */}
      <SafeAreaView style={styles.safeArea} edges={["top"]} mode="padding">
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{title}</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIcon} onPress={onChatPress}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={24}
                  color={colors.white}
                />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerIcon} onPress={onQRPress}>
              <Ionicons name="qr-code-outline" size={24} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIcon}
              onPress={onNotificationPress}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={colors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={onProfilePress}
            >
              <Image
                source={
                  avatarUri && avatarUri !== "null"
                    ? { uri: avatarUri }
                    : require("@/assets/images/default-avatar.jpg")
                }
                style={styles.profileAvatar}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  safeArea: {
    backgroundColor: "transparent",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 4,
    paddingHorizontal: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    zIndex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginLeft: 12,
    padding: 4,
  },
  iconContainer: {
    position: "relative",
  },
  profileButton: {
    marginLeft: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.white,
    padding: 2,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
});
