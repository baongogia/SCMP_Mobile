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
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { SharedHeader } from "@/src/components/custom";
import { getInstructorClasses } from "@/src/services/learning_process/class/classService";
import { ClassItem } from "@/src/types/schedule";
import { showErrorToast } from "@/src/utils/errorHandler";

export function UpdatePassedStudentsScreen() {
  const navigation = useNavigation();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const handleClassPress = (classItem: ClassItem) => {
    (navigation as any).navigate("StudentList", {
      class_id: classItem._id,
      class_name: classItem.name,
      course_title: classItem.course.title,
    });
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
      activeOpacity={0.8}
    >
      {/* Primary color accent bar */}
      <View style={styles.accentBar} />

      <View style={styles.classContent}>
        <View style={styles.classHeader}>
          <View style={styles.classIcon}>
            <Ionicons name="trophy" size={22} color={colors.white} />
          </View>
          <View style={styles.classInfo}>
            <Text style={styles.className}>{item.name}</Text>
            <Text style={styles.courseTitle}>{item.course.title}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </View>

        <View style={styles.classDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color={colors.primary} />
            <Text style={styles.detailText}>
              {item.course.session_number} buổi
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="people" size={16} color={colors.primary} />
            <Text style={styles.detailText}>
              {Array.isArray(item.member) ? item.member.length : 0} học viên
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <SharedHeader title="Cập nhật học viên đã tốt nghiệp" />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.listTitle}>
          Chọn lớp để cập nhật học viên đã tốt nghiệp:
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
                    name="trophy-outline"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    color: colors.text,
    letterSpacing: 0.3,
    paddingHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.lightPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: 8,
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    marginBottom: 12,
    marginHorizontal: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
  },
  classContent: {
    padding: 14,
  },
  classHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  classIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  classInfo: {
    flex: 1,
    paddingRight: 8,
  },
  className: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  courseTitle: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    opacity: 0.9,
  },
  classDetails: {
    flexDirection: "row",
    gap: 16,
    paddingLeft: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.8,
  },
});

