import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "@/src/components/base/ThemedText";
import { ThemedView } from "@/src/components/base/ThemedView";
import { PopupBase } from "../PopupBase/PopupBase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { courseService } from "@/src/services";

export function CourseInfoPopup() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("loginToken");
      const tenant = await AsyncStorage.getItem("tenant");

      if (!token) {
        throw new Error("No authentication token found");
      }

      if (!tenant) {
        throw new Error("No tenant information found");
      }

      const response = await courseService.getMemberCourses(
        JSON.parse(tenant).value
      );

      setCourses(response?.data || []);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Không thể tải danh sách khóa học");
    } finally {
      setLoading(false);
    }
  };

  const handleCoursePress = (itemId: string) => {
    // Toggle expand/collapse
    setExpandedId((prevId) => (prevId === itemId ? null : itemId));
  };

  const renderCourseItem = ({ item, index }: { item: any; index: number }) => {
    // Sử dụng index làm fallback nếu id không tồn tại
    const itemKey = item._id || `course-${index}`;
    const isExpanded = expandedId === itemKey;

    return (
      <TouchableOpacity
        style={[styles.courseCard, isExpanded && styles.expandedCard]}
        onPress={() => handleCoursePress(item._id)}
        activeOpacity={0.9}
      >
        <View
          style={[styles.cardContent, isExpanded && styles.expandedCardContent]}
        >
          <View style={styles.courseHeader}>
            <View
              style={[
                styles.courseIconContainer,
                isExpanded && styles.expandedIconContainer,
              ]}
            >
              <ThemedText style={styles.iconText}>🏊</ThemedText>
            </View>

            <View style={styles.courseMainInfo}>
              <ThemedText
                style={[styles.courseName, isExpanded && styles.expandedText]}
              >
                {item.course?.title || "Khóa học"}
              </ThemedText>
              <ThemedText
                style={[
                  styles.courseCode,
                  isExpanded && styles.expandedSubText,
                ]}
              >
                Lớp: {item.name}
              </ThemedText>
            </View>

            <ThemedText
              style={[styles.chevron, isExpanded && styles.expandedChevron]}
            >
              {isExpanded ? "▲" : "▼"}
            </ThemedText>
          </View>

          {/* Chỉ hiển thị chi tiết khi item này được expand */}
          {isExpanded && (
            <View style={styles.expandedDetails}>
              <View style={styles.divider} />

              <View style={styles.detailSection}>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailIcon}>👥</ThemedText>
                  <ThemedText style={styles.detailLabel}>Sĩ số:</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {item.member?.length || 0} học viên
                  </ThemedText>
                </View>

                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailIcon}>👤</ThemedText>
                  <ThemedText style={styles.detailLabel}>HLV:</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {item?.instructor?.username || "Đang cập nhật"}
                  </ThemedText>
                </View>
              </View>

              <TouchableOpacity style={styles.actionButton}>
                <ThemedText style={styles.actionButtonText}>
                  Xem chi tiết →
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <ThemedText style={styles.loadingText}>
            Đang tải khóa học...
          </ThemedText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorIcon}>⚠️</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCourses}>
            <ThemedText style={styles.retryButtonText}>Thử lại</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    if (courses.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyIcon}>📚</ThemedText>
          <ThemedText style={styles.emptyText}>
            Không có khóa học nào
          </ThemedText>
          <ThemedText style={styles.emptySubText}>
            Vui lòng liên hệ với quản trị viên để được hỗ trợ
          </ThemedText>
        </View>
      );
    }

    return (
      <FlatList
        data={courses}
        renderItem={renderCourseItem}
        keyExtractor={(item) => item._id}
        style={styles.courseList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        extraData={expandedId} // Force re-render when expandedId changes
      />
    );
  };

  return (
    <PopupBase title="Thông tin các khóa bơi" useScrollView={false}>
      <ThemedView style={styles.container}>{renderContent()}</ThemedView>
    </PopupBase>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  courseList: {
    width: "100%",
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  courseCard: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  expandedCard: {
    elevation: 5,
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  cardContent: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  expandedCardContent: {
    backgroundColor: "#4A90E2",
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  courseIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F4FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  expandedIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  iconText: {
    fontSize: 24,
  },
  courseMainInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  expandedText: {
    color: "#FFFFFF",
  },
  expandedSubText: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  chevron: {
    fontSize: 12,
    color: "#4A90E2",
  },
  expandedChevron: {
    color: "#FFFFFF",
  },
  expandedDetails: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
    minWidth: 70,
  },
  detailValue: {
    fontSize: 14,
    color: "#FFFFFF",
    flex: 1,
    marginLeft: 8,
  },
  actionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#4A90E2",
    fontWeight: "600",
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: "#7F8C8D",
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 15,
  },
  retryButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    color: "#7F8C8D",
    fontSize: 17,
    fontWeight: "500",
    marginBottom: 8,
  },
  emptySubText: {
    color: "#95A5A6",
    fontSize: 14,
    textAlign: "center",
  },
});
