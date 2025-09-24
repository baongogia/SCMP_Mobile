import React, { useEffect, useState } from "react";
import { View, StyleSheet, Platform, Image, Text } from "react-native";
import CustomDrawerContent from "@/src/components/layout/CustomDrawerContent";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/src/constants/colors";

export default function ProfileScreen() {
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  useEffect(() => {
    const loadUserAvatar = async () => {
      try {
        const userRaw = await AsyncStorage.getItem("user");
        if (!userRaw) return;
        const user = JSON.parse(userRaw);
        const uri = user?.featured_image?.[0]?.path || null;
        if (uri) setAvatarUri(uri);
      } catch {
        // ignore error
      }
    };
    loadUserAvatar();
  }, []);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>SWIM COURSE</Text>
          <Text style={styles.headerSubtitle}>Hồ sơ</Text>
        </View>
        <View style={styles.profileButton}>
          <Image
            source={
              avatarUri
                ? { uri: avatarUri }
                : require("@/assets/images/default-avatar.jpg")
            }
            style={styles.profileAvatar}
          />
        </View>
      </View>

      <CustomDrawerContent userRole="instructor" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "500",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    marginTop: 2,
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
});
