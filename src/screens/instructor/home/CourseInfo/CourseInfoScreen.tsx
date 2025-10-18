import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { SharedHeader } from "@/src/components/custom";
import {
  getInstructorClasses,
  getInstructorClassDetail,
} from "@/src/services/learning_process/class/classService";
import { ClassItem } from "@/src/types/schedule";
import { ClassDetailModal } from "./ClassDetailModal";
import { showErrorToast } from "@/src/utils/errorHandler";

export function CourseInfoScreen() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const inFlightRef = React.useRef(false);

  // Load classes
  const loadClasses = useCallback(async () => {
    try {
      if (inFlightRef.current) return;
      setLoading(true);

      // cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      let attempt = 0;
      let response: any;
      const maxRetries = 2;
      const baseDelayMs = 400;

      inFlightRef.current = true;
      while (true) {
        try {
          response = await getInstructorClasses();
          break;
        } catch (err: any) {
          const status = err?.response?.status;
          if (status === 429 && attempt < maxRetries) {
            const wait = baseDelayMs * Math.pow(2, attempt);
            await new Promise((r) => setTimeout(r, wait));
            attempt += 1;
            continue;
          }
          throw err;
        }
      }

      console.log("Classes response:", response.data);
      if (response.data && response.data.data && response.data.data.data) {
        setClasses(response.data.data.data);
      } else {
        setClasses([]);
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải lớp học",
        message: "Không thể tải danh sách lớp học",
      });
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadClasses();
    setRefreshing(false);
  };

  // Handle class selection
  const handleClassPress = async (classItem: ClassItem) => {
    try {
      const response = await getInstructorClassDetail(classItem._id);
      console.log("Class detail response:", response.data);
      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data) &&
        response.data.data.length > 0
      ) {
        setSelectedClass(response.data.data[0]);
        setDetailModalVisible(true);
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải chi tiết lớp",
        message: "Không thể tải chi tiết lớp học",
      });
    }
  };

  // Close detail modal
  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedClass(null);
  };

  // Initial load
  useEffect(() => {
    loadClasses();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadClasses]);

  const renderClassItem = ({ item }: { item: ClassItem }) => (
    <TouchableOpacity
      style={styles.classItem}
      onPress={() => handleClassPress(item)}
    >
      <View style={styles.classHeader}>
        <View style={styles.classIcon}>
          <Ionicons name="school-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.classInfo}>
          <Text style={styles.className}>{item.name}</Text>
          <Text style={styles.courseTitle}>{item.course.title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text} />
      </View>

      <View style={styles.classDetails}>
        <View style={styles.detailRow}>
          <Ionicons
            name="document-text-outline"
            size={16}
            color={colors.primary}
          />
          <Text style={styles.detailText}>{item.course.description}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={styles.detailText}>
            {item.course.session_number} buổi
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color={colors.primary} />
          <Text style={styles.detailText}>
            {Array.isArray(item.member) ? item.member.length : 0} học viên
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <SharedHeader title="Thông tin khóa học" />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.listTitle}>
          Danh sách các lớp bơi bạn đang giảng dạy:
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải danh sách lớp...</Text>
          </View>
        ) : (
          <FlatList
            data={classes}
            renderItem={renderClassItem}
            keyExtractor={(item) => item._id}
            style={styles.classList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconWrapper}>
                  <Ionicons
                    name="file-tray-outline"
                    size={48}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.emptyTitle}>Chưa có lớp nào</Text>
                <Text style={styles.emptySubtitle}>
                  Khi bạn được phân công lớp, chúng sẽ hiển thị tại đây.
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={onRefresh}
                >
                  <Ionicons name="refresh" size={18} color={colors.white} />
                  <Text style={styles.retryText}>Tải lại</Text>
                </TouchableOpacity>
              </View>
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>

      {/* Class Detail Modal */}
      <ClassDetailModal
        visible={detailModalVisible}
        onClose={closeDetailModal}
        classItem={selectedClass}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
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
  menuButton: {
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 0.5,
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(0, 119, 190, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  classList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  classItem: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  classHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  classIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  classDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
  },
});
