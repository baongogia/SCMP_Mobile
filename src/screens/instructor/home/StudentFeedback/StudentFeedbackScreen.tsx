import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { ThemedText } from "@/src/components/base/ThemedText";
import { ThemedView } from "@/src/components/base/ThemedView";

const feedbackData = [
  {
    id: "1",
    studentName: "Nguyễn Văn A",
    course: "Bơi cơ bản",
    rating: 5,
    comment: "Thầy dạy rất nhiệt tình và dễ hiểu. Em cảm ơn thầy!",
    date: "15/08/2023",
  },
  {
    id: "2",
    studentName: "Trần Thị B",
    course: "Bơi sải nâng cao",
    rating: 4,
    comment: "Phương pháp dạy tốt, nhưng có thể giải thích kỹ hơn một chút.",
    date: "14/08/2023",
  },
  {
    id: "3",
    studentName: "Lê Văn C",
    course: "Bơi ếch kỹ thuật",
    rating: 5,
    comment: "Thầy rất kiên nhẫn và tận tình. Em đã tiến bộ rất nhiều!",
    date: "13/08/2023",
  },
];

export function StudentFeedbackScreen() {
  const navigation = useNavigation();

  const renderFeedbackItem = ({ item }: any) => (
    <ThemedView style={styles.feedbackCard}>
      <View style={styles.feedbackHeader}>
        <View style={styles.studentInfo}>
          <ThemedText style={styles.studentName}>{item.studentName}</ThemedText>
          <ThemedText style={styles.courseName}>{item.course}</ThemedText>
        </View>
        <View style={styles.ratingContainer}>
          {[...Array(5)].map((_, index) => (
            <Ionicons
              key={index}
              name={index < item.rating ? "star" : "star-outline"}
              size={16}
              color="#FFD700"
            />
          ))}
        </View>
      </View>

      <ThemedText style={styles.comment}>{item.comment}</ThemedText>

      <ThemedText style={styles.date}>{item.date}</ThemedText>
    </ThemedView>
  );

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
        <Text style={styles.headerTitle}>Góp ý học viên</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ThemedView style={styles.summaryContainer}>
          <ThemedText style={styles.summaryTitle}>
            Tổng quan đánh giá
          </ThemedText>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>4.8</ThemedText>
              <ThemedText style={styles.statLabel}>Điểm TB</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>24</ThemedText>
              <ThemedText style={styles.statLabel}>Đánh giá</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>95%</ThemedText>
              <ThemedText style={styles.statLabel}>Hài lòng</ThemedText>
            </View>
          </View>
        </ThemedView>

        <FlatList
          data={feedbackData}
          renderItem={renderFeedbackItem}
          keyExtractor={(item) => item.id}
          style={styles.feedbackList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
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
  summaryContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    marginTop: 4,
  },
  feedbackList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  feedbackCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  courseName: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  ratingContainer: {
    flexDirection: "row",
  },
  comment: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.8,
    lineHeight: 24,
    marginBottom: 12,
  },
  date: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
    textAlign: "right",
  },
});
