import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { SharedHeader } from "@/src/components/custom";
import {
  getInstructorClasses,
  getInstructorClassDetail,
} from "@/src/services/learning_process/class/classService";
import { ClassItem } from "@/src/types/schedule";
import { showErrorToast } from "@/src/utils/errorHandler";
import { ClassOptionsModal } from "@/src/components/modal/class/ClassOptionsModal";
import { ClassDetailModal } from "../CourseInfo/ClassDetailModal";
import { styles } from "./style";

export function ClassManagementScreen() {
  const navigation = useNavigation();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const inFlightRef = React.useRef(false);
  const scaleAnims = useRef<Map<string, Animated.Value>>(new Map()).current;

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

  // Handle options menu toggle
  const handleOptionsPress = (classItem: ClassItem) => {
    if (showOptionsMenu === classItem._id) {
      setShowOptionsMenu(null);
      setSelectedClass(null);
    } else {
      setShowOptionsMenu(classItem._id);
      setSelectedClass(classItem);
    }
  };

  // Handle option selection
  const handleOptionSelect = async (
    option: "detail" | "notes" | "updatePassed"
  ) => {
    if (!selectedClass) return;

    if (option === "detail") {
      try {
        const response = await getInstructorClassDetail(selectedClass._id);
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
    } else if (option === "notes") {
      const courseId =
        typeof selectedClass.course === "object" &&
        selectedClass.course !== null
          ? selectedClass.course._id
          : selectedClass.course;

      if (!selectedClass._id || !courseId) {
        showErrorToast(new Error("Thiếu thông tin lớp học"), {
          title: "Lỗi",
          message: "Không thể mở ghi chú. Vui lòng thử lại.",
        });
        return;
      }

      (navigation as any).navigate("Note", {
        class_id: selectedClass._id,
        course_id: courseId,
        class_name: selectedClass.name,
        course_title:
          typeof selectedClass.course === "object" &&
          selectedClass.course !== null
            ? selectedClass.course.title
            : "Khóa học",
      });
    } else if (option === "updatePassed") {
      (navigation as any).navigate("StudentList", {
        class_id: selectedClass._id,
        class_name: selectedClass.name,
        course_title:
          typeof selectedClass.course === "object" &&
          selectedClass.course !== null
            ? selectedClass.course.title
            : "Khóa học",
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

  const renderClassItem = ({ item }: { item: ClassItem }) => {
    const isMenuOpen = showOptionsMenu === item._id;

    if (!scaleAnims.has(item._id)) {
      scaleAnims.set(item._id, new Animated.Value(1));
    }
    const scaleAnim = scaleAnims.get(item._id)!;

    return (
      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.classItem,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Primary color accent bar */}
          <View style={styles.accentBar} />

          <View style={styles.classContent}>
            <View style={styles.classHeader}>
              <View style={styles.classIcon}>
                <Ionicons name="school" size={22} color={colors.white} />
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{item.name}</Text>
                <Text style={styles.courseTitle}>
                  {typeof item.course === "object" && item.course !== null
                    ? item.course.title
                    : "Khóa học"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.optionsButton}
                onPress={() => handleOptionsPress(item)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.classDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="time" size={16} color={colors.primary} />
                <Text style={styles.detailText}>
                  {typeof item.course === "object" && item.course !== null
                    ? `${item.course.session_number} buổi`
                    : "N/A"}
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
        </Animated.View>

        {/* Options Menu */}
        {isMenuOpen && (
          <ClassOptionsModal
            visible={isMenuOpen}
            classItem={item}
            onClose={() => {
              setShowOptionsMenu(null);
              setSelectedClass(null);
            }}
            onSelectOption={handleOptionSelect}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["left", "right", "bottom"]}
    >
      <SharedHeader title="Quản lý lớp học" />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.listTitle}>
          Các lớp bơi bạn đang giảng dạy:
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
                    name="school-outline"
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

