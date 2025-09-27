import React from "react";
import { View, StyleSheet, ScrollView, Image, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { ThemedText } from "@/src/components/base/ThemedText";
import { ThemedView } from "@/src/components/base/ThemedView";
import { useUserInfo } from "@/src/hooks";

export function PersonalInfoScreen() {
  const navigation = useNavigation();
  const { userInfo, avatarUri } = useUserInfo();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                avatarUri
                  ? { uri: avatarUri }
                  : require("@/assets/images/default-avatar.jpg")
              }
              style={styles.avatar}
            />
          </View>

          <ThemedText style={styles.name}>
            {userInfo?.name || "Instructor Name"}
          </ThemedText>
          <ThemedText style={styles.role}>Huấn luyện viên</ThemedText>
        </ThemedView>

        <ThemedView style={styles.infoContainer}>
          <ThemedText style={styles.sectionTitle}>Thông tin cơ bản</ThemedText>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Họ và tên:</ThemedText>
            <ThemedText style={styles.infoValue}>
              {userInfo?.name || "Chưa cập nhật"}
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Email:</ThemedText>
            <ThemedText style={styles.infoValue}>
              {userInfo?.email || "Chưa cập nhật"}
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Số điện thoại:</ThemedText>
            <ThemedText style={styles.infoValue}>
              {userInfo?.phone || "Chưa cập nhật"}
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Ngày sinh:</ThemedText>
            <ThemedText style={styles.infoValue}>
              {userInfo?.birthday || "Chưa cập nhật"}
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.infoContainer}>
          <ThemedText style={styles.sectionTitle}>
            Thông tin công việc
          </ThemedText>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Chức vụ:</ThemedText>
            <ThemedText style={styles.infoValue}>Huấn luyện viên</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Bộ phận:</ThemedText>
            <ThemedText style={styles.infoValue}>Phòng đào tạo</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Ngày bắt đầu:</ThemedText>
            <ThemedText style={styles.infoValue}>01/01/2023</ThemedText>
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
  },
  headerRight: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  profileContainer: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
  },
  infoContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
});
