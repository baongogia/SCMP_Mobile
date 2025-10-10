import React from "react";
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Text,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Canvas,
  Rect,
  Blur,
  LinearGradient,
  vec,
} from "@shopify/react-native-skia";
import { colors } from "@/src/constants/colors";

const { width } = Dimensions.get("window");

interface BlurHeaderProps {
  onMenuPress: () => void;
  onChatPress: () => void;
  onQRPress: () => void;
  onNotificationPress: () => void;
  onProfilePress: () => void;
  avatarUri?: string;
  unreadCount?: number;
  title?: string;
}

export const BlurHeader: React.FC<BlurHeaderProps> = ({
  onMenuPress,
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
      {/* Skia Blur Background */}
      <Canvas style={StyleSheet.absoluteFillObject}>
        <Rect
          x={0}
          y={0}
          width={width}
          height={Platform.OS === "ios" ? 100 : 80}
        >
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, Platform.OS === "ios" ? 100 : 80)}
            colors={["rgba(0, 119, 190, 0.5)", "rgba(77, 182, 230, 0.4)"]}
          />
          <Blur blur={50} />
        </Rect>
      </Canvas>

      {/* Header Content */}
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
          <Ionicons name="menu" size={28} color={colors.white} />
        </TouchableOpacity>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    zIndex: 1,
  },
  menuButton: {
    marginRight: 16,
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
