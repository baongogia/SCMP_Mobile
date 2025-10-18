import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { ThemedView } from "@/src/components/base/ThemedView";
import { ModernLearningProgress } from "@/src/components/layout/process/LearningProgress";
import { PopupBase } from "../PopupBase/PopupBase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/src/constants/colors";
import { showErrorToast } from "@/src/utils/errorHandler";

export function CourseInfoPopup() {
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = await AsyncStorage.getItem("loginToken");
      const tenant = await AsyncStorage.getItem("tenant");

      if (!token) {
        throw new Error("No authentication token found");
      }

      if (!tenant) {
        throw new Error("No tenant information found");
      }
    } catch (err) {
      showErrorToast(err, {
        title: "Lỗi tải khóa học",
        message: "Không thể tải thông tin khóa học",
      });
    } finally {
    }
  };

  return (
    <PopupBase title="" useScrollView={false}>
      <ThemedView style={styles.container}>
        <ModernLearningProgress />
      </ThemedView>
    </PopupBase>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: "#4A90E2",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7F8C8D",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
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
