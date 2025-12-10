import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors } from "../../../../constants/colors";
import { getClassByCourseId } from "../../../../services/learning_process/course/courseService";
import { getClassScheduleDetail } from "../../../../services/learning_process/schedules/scheduleServices";
import { showErrorToast } from "../../../../utils/errorHandler";
import { SharedHeader } from "@/src/components/custom/header/SharedHeader";
import { styles } from "./style";
import ClassCardComponent from "../../../../components/custom/card/class/ClassCard";

interface ClassSelectionProps {
  course: any;
}

export default function ClassSelectionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { course } = route.params as ClassSelectionProps;
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingClass, setPendingClass] = useState<any | null>(null);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Loader
  const loadClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!course?._id) {
        setError("Không tìm thấy thông tin khóa học");
        setLoading(false);
        return;
      }

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("API call timeout")), 10000)
      );

      const response: any = await Promise.race([
        getClassByCourseId(course?._id),
        timeoutPromise,
      ]);

      // Normalize various API shapes: {data:[...]}, {data:{data:[...]}}, or [...]
      let classesData: any[] = [];
      const root = response?.data;
      if (Array.isArray(root)) {
        classesData = root;
      } else if (Array.isArray(root?.data)) {
        classesData = root.data;
      } else if (Array.isArray(root?.data?.data)) {
        classesData = root.data.data;
      }

      if (classesData.length > 0) {
        const getMemberCount = (obj: any): number => {
          if (!obj || typeof obj !== "object") return 0;
          const keys = [
            "member",
            "members",
            "member_list",
            "class_member",
            "class_members",
            "student",
            "students",
            "student_list",
            "students_list",
            "learners",
            "participants",
            "participant",
            "trainees",
            "registrations",
            "enrollments",
            "attendees",
            "users",
          ];
          for (const key of keys) {
            const value = obj[key];
            if (Array.isArray(value)) return value.length;
            if (value && Array.isArray(value?.data)) return value.data.length;
          }
          return 0;
        };
        // Map API data to component format
        const mappedClasses = classesData.map(
          (classItem: any, index: number) => ({
            id: classItem.id || classItem._id || `class-${index}`,
            name: classItem.name || classItem.class_name || `Lớp ${index + 1}`,
            instructor:
              classItem.instructor?.name ||
              classItem.instructor_name ||
              "Huấn luyện viên",
            level: classItem.level || classItem.difficulty || "Cơ bản",
            maxStudents: classItem.max_students || classItem.maxStudents || 8,
            currentStudents:
              classItem.current_students ||
              classItem.currentStudents ||
              getMemberCount(classItem) ||
              0,
            schedule: classItem.schedule || classItem.sessions || [],
            // mark whether schedule details already loaded from API payload
            scheduleLoaded: !!(
              classItem.schedule ||
              classItem.sessions ||
              classItem.schedule_plan
            ),
            pool: classItem.pool?.name || classItem.pool_name || "Bể bơi",
            duration: classItem.duration || "4 tuần",
            startDate:
              classItem.start_date || classItem.startDate || "2024-10-21",
            endDate: classItem.end_date || classItem.endDate || "2024-11-15",
            // Keep original data for reference
            originalData: classItem,
          })
        );

        setAvailableClasses(mappedClasses);
      } else {
        setAvailableClasses([]);
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải lớp học",
        message: "Không thể tải danh sách lớp học",
      });
      setError("Không thể tải danh sách lớp học");
      setAvailableClasses([]);
    } finally {
      setLoading(false);
    }
  }, [course]);

  // Load on mount and when course.id changes
  useEffect(() => {
    if (course?._id) {
      loadClasses();
    }
  }, [course?._id, loadClasses]);

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
  };

  const toggleSchedule = async (classId: string) => {
    const isCurrentlyExpanded = expandedClass === classId;

    if (isCurrentlyExpanded) {
      setExpandedClass(null);
      return;
    }

    // Expand: ensure we have the latest schedule by fetching class schedule detail
    const cls = availableClasses.find((c) => c.id === classId);
    if (!cls) {
      setExpandedClass(classId);
      return;
    }

    if (!cls.scheduleLoaded) {
      try {
        // Try to determine classroom id from original data
        const classroomId =
          cls.originalData?.id || cls.originalData?._id || classId;
        const res: any = await getClassScheduleDetail(String(classroomId));

        // Normalize response into an array of schedule items
        let schedules: any = res?.data;
        if (schedules && schedules.data) schedules = schedules.data;
        if (!Array.isArray(schedules)) {
          // attempt to find array payload inside object
          schedules = Array.isArray(schedules?.data) ? schedules.data : [];
        }

        // Merge schedules into the class entry (both `schedule` and originalData.schedule_plan)
        setAvailableClasses((prev) =>
          prev.map((item) =>
            item.id === classId
              ? {
                  ...item,
                  schedule: schedules || [],
                  originalData: {
                    ...item.originalData,
                    schedule_plan:
                      schedules || item.originalData?.schedule_plan,
                    schedule: schedules || item.originalData?.schedule,
                  },
                  scheduleLoaded: true,
                }
              : item
          )
        );
      } catch (err) {
        showErrorToast(err, {
          title: "Lỗi tải lịch",
          message: "Không thể tải lịch học của lớp",
        });
      }
    }

    setExpandedClass(classId);
  };

  const handleConfirmSelection = async () => {
    if (!selectedClass) {
      Alert.alert("Thông báo", "Vui lòng chọn lớp học");
      return;
    }

    const selectedClassData = availableClasses.find(
      (cls) => cls.id === selectedClass
    );
    setPendingClass(selectedClassData);
    setConfirmVisible(true);
  };

  const getLevelColor = (level: string) => {
    const levelLower = (level || "").toLowerCase();
    switch (levelLower) {
      case "cơ bản":
      case "basic":
      case "beginner":
        return colors.success;
      case "nâng cao":
      case "intermediate":
      case "advanced":
        return colors.warning;
      case "chuyên nghiệp":
      case "professional":
      case "expert":
        return colors.error;
      default:
        return colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SharedHeader title="Chọn lớp học" />

      {/* Course Info */}
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle}>{course?.title}</Text>
        <Text style={styles.courseDescription}>
          Chọn lớp học phù hợp với lịch trình của bạn
        </Text>
      </View>

      {/* Classes List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              Đang tải danh sách lớp học...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                loadClasses();
              }}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : availableClasses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="school" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Không có lớp học nào khả dụng</Text>
          </View>
        ) : (
          availableClasses.map((classItem, index) => (
            <ClassCardComponent
              key={classItem.id}
              classItem={classItem}
              index={index}
              isSelected={selectedClass === classItem.id}
              isExpanded={expandedClass === classItem.id}
              onSelect={() => handleClassSelect(classItem.id)}
              onToggleSchedule={() => toggleSchedule(classItem.id)}
              getLevelColor={getLevelColor}
            />
          ))
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selectedClass && styles.disabledButton,
          ]}
          disabled={!selectedClass}
          onPress={handleConfirmSelection}
        >
          {false ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>
                Xác nhận và thanh toán
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modern Confirm Modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setConfirmVisible(false)}
          />
          <Animated.View
            entering={FadeInUp.springify()}
            style={styles.modalCard}
          >
            <Text style={styles.modalTitle}>Xác nhận đăng ký</Text>
            <Text style={styles.modalMessage}>
              {`Bạn có chắc chắn muốn đăng ký lớp "${
                pendingClass?.originalData?.name ||
                pendingClass?.name ||
                "Lớp học"
              }"?`}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimary]}
                onPress={() => {
                  setConfirmVisible(false);
                  // Use replace to ensure navigation happens reliably on all stacks
                  setTimeout(() => {
                    (navigation as any).replace("Payment", {
                      course,
                      selectedClass: pendingClass,
                    });
                  }, 50);
                }}
              >
                <Text style={styles.modalPrimaryText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
