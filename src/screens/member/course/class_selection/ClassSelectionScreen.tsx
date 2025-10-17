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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  Layout,
  FadeInDown,
  FadeInUp,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../../../constants/colors";
import { getClassByCourseId } from "../../../../services/learning_process/course/courseService";

interface ClassSelectionProps {
  course: any;
}

// Component for individual class card
type ClassCardProps = {
  classItem: any;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleSchedule: () => void;
  getLevelColor: (level: string) => string;
};

function ClassCardComponent(props: ClassCardProps) {
  const {
    classItem,
    index,
    isSelected,
    isExpanded,
    onSelect,
    onToggleSchedule,
    getLevelColor,
  } = props;
  // Shared values for buttery-smooth native animations
  const contentHeight = useSharedValue(0);
  const animatedHeight = useSharedValue(0);

  React.useEffect(() => {
    const target = isExpanded ? contentHeight.value : 0;
    animatedHeight.value = withTiming(target, {
      duration: 220,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
    });
  }, [isExpanded, animatedHeight, contentHeight]);

  const animatedScheduleStyle = useAnimatedStyle(() => {
    return {
      // add extra buffer to avoid clipping bottom rounded corners
      height: animatedHeight.value + 28,
      opacity: interpolate(
        animatedHeight.value,
        [0, 8],
        [0, 1],
        Extrapolate.CLAMP
      ),
    };
  });

  const animatedChevronStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withSpring(isExpanded ? "180deg" : "0deg", {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
    };
  });

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      layout={Layout.springify()}
      style={styles.classCard}
    >
      {/* Selection Radio Button */}
      <TouchableOpacity style={styles.radioContainer} onPress={onSelect}>
        <View style={[styles.radioButton, isSelected && styles.radioSelected]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>

      {/* Class Header */}
      <View
        style={[styles.classHeader, isSelected && styles.selectedClassHeader]}
      >
        <LinearGradient
          colors={
            isSelected
              ? [colors.primary, colors.primary + "E6"]
              : ["transparent", "transparent"]
          }
          style={StyleSheet.absoluteFillObject}
        />

        <TouchableOpacity style={styles.classContent} onPress={onSelect}>
          <View style={styles.classInfo}>
            <Text style={[styles.className, isSelected && styles.selectedText]}>
              Lớp: {classItem.originalData?.name || classItem.name || "Lớp học"}
            </Text>
            <Text
              style={[styles.instructor, isSelected && styles.selectedSubText]}
            >
              Huấn luyện viên:{" "}
              {classItem.originalData?.instructor?.username ||
                classItem.originalData?.instructor?.name ||
                classItem.instructor ||
                "Huấn luyện viên"}
            </Text>

            <View style={styles.classDetails}>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: getLevelColor(classItem.level) },
                ]}
              >
                <Text style={styles.levelText}>
                  {classItem.level || "Cơ bản"}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Ionicons
                  name="people"
                  size={14}
                  color={isSelected ? colors.white : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.detailText,
                    isSelected && styles.selectedSubText,
                  ]}
                >
                  {classItem.originalData?.current_students ||
                    classItem.currentStudents ||
                    0}
                  /
                  {classItem.originalData?.max_students ||
                    classItem.maxStudents ||
                    8}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Ionicons
                  name="location"
                  size={14}
                  color={isSelected ? colors.white : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.detailText,
                    isSelected && styles.selectedSubText,
                  ]}
                >
                  {classItem.originalData?.pool?.name ||
                    classItem.originalData?.pool_name ||
                    classItem.pool ||
                    "Bể bơi"}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Schedule Toggle Button */}
        <TouchableOpacity
          style={styles.scheduleToggle}
          onPress={onToggleSchedule}
        >
          <Animated.View style={animatedChevronStyle}>
            <Ionicons
              name="chevron-down"
              size={20}
              color={isSelected ? colors.white : colors.primary}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Measurer (off-screen) to get full content height */}
      <View
        style={styles.measureWrapper}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h && h !== contentHeight.value) {
            contentHeight.value = h;
          }
        }}
        pointerEvents="none"
      >
        <Text style={styles.scheduleTitle}>Lịch học</Text>
        <View style={styles.scheduleInfo}>
          <View style={styles.scheduleItem}>
            <Ionicons name="calendar" size={16} color={colors.primary} />
            <Text style={styles.scheduleText}>
              {classItem.originalData?.start_date ||
                classItem.startDate ||
                "2024-10-21"}{" "}
              -{" "}
              {classItem.originalData?.end_date ||
                classItem.endDate ||
                "2024-11-15"}
            </Text>
          </View>
          <View style={styles.scheduleItem}>
            <Ionicons name="time" size={16} color={colors.primary} />
            <Text style={styles.scheduleText}>
              Thời lượng: {classItem.duration || "4 tuần"}
            </Text>
          </View>
        </View>
        <View style={styles.weeklySchedule}>
          {classItem.originalData?.schedule_plan &&
          classItem.originalData.schedule_plan.length > 0 ? (
            classItem.originalData.schedule_plan.map(
              (plan: any, planIndex: number) => (
                <View key={planIndex} style={styles.sessionChip}>
                  <Text style={styles.sessionDay}>
                    {plan.days_of_week?.[0] || "Thứ"}
                  </Text>
                  <Text style={styles.sessionTime}>
                    {plan.slot?.title || "Slot"} -{" "}
                    {plan.slot?.duration || "45 phút"}
                  </Text>
                </View>
              )
            )
          ) : classItem.schedule && classItem.schedule.length > 0 ? (
            classItem.schedule.map((session: any, sessionIndex: number) => (
              <View key={sessionIndex} style={styles.sessionChip}>
                <Text style={styles.sessionDay}>
                  {session.day ||
                    session.day_of_week ||
                    session.weekday ||
                    "Thứ"}
                </Text>
                <Text style={styles.sessionTime}>
                  {session.time ||
                    session.start_time ||
                    session.time_slot ||
                    "08:00 - 09:00"}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.sessionChip}>
              <Text style={styles.sessionDay}>Lịch học</Text>
              <Text style={styles.sessionTime}>Sẽ được thông báo</Text>
            </View>
          )}
        </View>
      </View>

      {/* Animated Schedule Container */}
      <Animated.View style={[styles.scheduleContainer, animatedScheduleStyle]}>
        <View style={styles.scheduleContent}>
          <Text style={styles.scheduleTitle}>Lịch học</Text>
          <View style={styles.scheduleInfo}>
            <View style={styles.scheduleItem}>
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <Text style={styles.scheduleText}>
                {classItem.originalData?.start_date ||
                  classItem.startDate ||
                  "2024-10-21"}{" "}
                -{" "}
                {classItem.originalData?.end_date ||
                  classItem.endDate ||
                  "2024-11-15"}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Ionicons name="time" size={16} color={colors.primary} />
              <Text style={styles.scheduleText}>
                Thời lượng: {classItem.duration || "4 tuần"}
              </Text>
            </View>
          </View>
          <View style={styles.weeklySchedule}>
            {classItem.originalData?.schedule_plan &&
            classItem.originalData.schedule_plan.length > 0 ? (
              classItem.originalData.schedule_plan.map(
                (plan: any, planIndex: number) => (
                  <Animated.View
                    key={planIndex}
                    entering={FadeInUp.delay(planIndex * 50)}
                    style={styles.sessionChip}
                  >
                    <Text style={styles.sessionDay}>
                      {plan.days_of_week?.[0] || "Thứ"}
                    </Text>
                    <Text style={styles.sessionTime}>
                      {plan.slot?.title || "Slot"} -{" "}
                      {plan.slot?.duration || "45 phút"}
                    </Text>
                  </Animated.View>
                )
              )
            ) : classItem.schedule && classItem.schedule.length > 0 ? (
              classItem.schedule.map((session: any, sessionIndex: number) => (
                <Animated.View
                  key={sessionIndex}
                  entering={FadeInUp.delay(sessionIndex * 50)}
                  style={styles.sessionChip}
                >
                  <Text style={styles.sessionDay}>
                    {session.day ||
                      session.day_of_week ||
                      session.weekday ||
                      "Thứ"}
                  </Text>
                  <Text style={styles.sessionTime}>
                    {session.time ||
                      session.start_time ||
                      session.time_slot ||
                      "08:00 - 09:00"}
                  </Text>
                </Animated.View>
              ))
            ) : (
              <Animated.View entering={FadeInUp} style={styles.sessionChip}>
                <Text style={styles.sessionDay}>Lịch học</Text>
                <Text style={styles.sessionTime}>Sẽ được thông báo</Text>
              </Animated.View>
            )}
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const ClassCard = React.memo(ClassCardComponent);

export default function ClassSelectionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { course } = route.params as ClassSelectionProps;

  console.log("🎯 ClassSelectionScreen mounted");
  console.log("🎯 route.params:", route.params);
  console.log("🎯 course from params:", course);

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

      console.log(
        "📚 Classes API response:",
        JSON.stringify(response.data, null, 2)
      );

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
        console.log("✅ Classes loaded successfully:", classesData);

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
              classItem.current_students || classItem.currentStudents || 0,
            schedule: classItem.schedule || classItem.sessions || [],
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
        console.log(
          "🔄 Mapped classes:",
          JSON.stringify(mappedClasses, null, 2)
        );
      } else {
        console.log("⚠️ No classes data found in response");
        setAvailableClasses([]);
      }
    } catch (error) {
      console.error("❌ Error loading classes:", error);
      setError("Không thể tải danh sách lớp học");
      setAvailableClasses([]);
    } finally {
      setLoading(false);
    }
  }, [course]);

  // Load on mount and when course.id changes
  useEffect(() => {
    console.log("🚀 useEffect triggered, course:", course);
    console.log("🚀 course?._id:", course?._id);
    if (course?._id) {
      console.log("🚀 Calling loadClasses...");
      loadClasses();
    } else {
      console.log("❌ No course._id, not calling loadClasses");
    }
  }, [course?._id, loadClasses]);

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
  };

  const toggleSchedule = (classId: string) => {
    const isCurrentlyExpanded = expandedClass === classId;

    if (isCurrentlyExpanded) {
      setExpandedClass(null);
    } else {
      setExpandedClass(classId);
    }
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn lớp học</Text>
        <View style={styles.placeholder} />
      </View>

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
            <ClassCard
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  placeholder: {
    width: 36,
  },
  courseInfo: {
    padding: 20,
    backgroundColor: colors.white,
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  classCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
  },
  radioContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  classHeader: {
    position: "relative",
    overflow: "hidden",
  },
  selectedClassHeader: {
    // Gradient will be applied via LinearGradient
  },
  classContent: {
    flexDirection: "row",
    padding: 20,
    paddingRight: 60, // Space for radio button
    alignItems: "center",
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
    lineHeight: 24,
  },
  selectedText: {
    color: colors.white,
  },
  instructor: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 12,
    fontWeight: "500",
  },
  selectedSubText: {
    color: colors.white,
    opacity: 0.9,
  },
  classDetails: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  levelText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  scheduleToggle: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleContainer: {
    overflow: "hidden",
  },
  measureWrapper: {
    position: "absolute",
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  scheduleContent: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  scheduleInfo: {
    marginBottom: 1,
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  scheduleText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  weeklySchedule: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sessionChip: {
    backgroundColor: "#F8FAFC",
    padding: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sessionDay: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  sessionTime: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
  },
  bottomAction: {
    padding: 20,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: "#94A3B8",
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  modalCancel: {
    backgroundColor: "#EEF2F7",
  },
  modalPrimary: {
    backgroundColor: colors.primary,
  },
  modalCancelText: {
    color: colors.text,
    fontWeight: "700",
  },
  modalPrimaryText: {
    color: colors.white,
    fontWeight: "700",
  },
  // Loading, Error, and Empty states
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.error,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
