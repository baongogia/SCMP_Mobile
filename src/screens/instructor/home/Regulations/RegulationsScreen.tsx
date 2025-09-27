import React from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { ThemedText } from "@/src/components/base/ThemedText";
import { ThemedView } from "@/src/components/base/ThemedView";

export function RegulationsScreen() {
  const navigation = useNavigation();

  const regulations = [
    {
      id: 1,
      title: "Quy định về giờ làm việc",
      content:
        "Giờ làm việc từ 7:00 - 17:00, nghỉ trưa từ 12:00 - 13:00. Cần có mặt đúng giờ và báo cáo khi vắng mặt.",
    },
    {
      id: 2,
      title: "Quy định về trang phục",
      content:
        "Mặc đồng phục theo quy định, trang phục gọn gàng, phù hợp với môi trường làm việc.",
    },
    {
      id: 3,
      title: "Quy định về an toàn",
      content:
        "Tuân thủ các quy định an toàn lao động, sử dụng thiết bị bảo hộ khi cần thiết.",
    },
    {
      id: 4,
      title: "Quy định về bảo mật",
      content:
        "Không tiết lộ thông tin nội bộ ra bên ngoài, bảo mật thông tin học viên.",
    },
    {
      id: 5,
      title: "Quy định về đánh giá",
      content:
        "Thực hiện đánh giá học viên theo đúng quy trình, công bằng và minh bạch.",
    },
  ];

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
        <Text style={styles.headerTitle}>Các quy định</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.introContainer}>
          <ThemedText style={styles.introTitle}>Nội quy và quy định</ThemedText>
          <ThemedText style={styles.introText}>
            Dưới đây là các quy định và nội quy mà tất cả nhân viên cần tuân thủ
          </ThemedText>
        </ThemedView>

        {regulations.map((regulation) => (
          <ThemedView key={regulation.id} style={styles.regulationCard}>
            <View style={styles.regulationHeader}>
              <View style={styles.numberBadge}>
                <ThemedText style={styles.numberText}>
                  {regulation.id}
                </ThemedText>
              </View>
              <ThemedText style={styles.regulationTitle}>
                {regulation.title}
              </ThemedText>
            </View>
            <ThemedText style={styles.regulationContent}>
              {regulation.content}
            </ThemedText>
          </ThemedView>
        ))}

        <ThemedView style={styles.footerContainer}>
          <ThemedText style={styles.footerText}>
            Mọi thắc mắc về quy định, vui lòng liên hệ với quản lý trực tiếp.
          </ThemedText>
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
  introContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  introTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  introText: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 24,
  },
  regulationCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  regulationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  numberBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  numberText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  regulationTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  regulationContent: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.8,
    lineHeight: 24,
  },
  footerContainer: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 24,
  },
});
