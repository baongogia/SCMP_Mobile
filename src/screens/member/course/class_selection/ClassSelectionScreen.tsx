import React, { useState, useMemo } from "react";
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

// Mock data for classes
const mockClasses = [
  {
    id: "1",
    name: "Lớp Bơi Cơ Bản A1",
    instructor: "Huấn luyện viên Minh",
    level: "Cơ bản",
    maxStudents: 8,
    currentStudents: 5,
    schedule: [
      { day: "Thứ 2", time: "08:00 - 09:00", date: "2024-10-21" },
      { day: "Thứ 4", time: "08:00 - 09:00", date: "2024-10-23" },
      { day: "Thứ 6", time: "08:00 - 09:00", date: "2024-10-25" },
    ],
    pool: "Bể bơi A",
    duration: "4 tuần",
    startDate: "2024-10-21",
    endDate: "2024-11-15",
  },
  {
    id: "2",
    name: "Lớp Bơi Cơ Bản A2",
    instructor: "Huấn luyện viên Hương",
    level: "Cơ bản",
    maxStudents: 8,
    currentStudents: 3,
    schedule: [
      { day: "Thứ 3", time: "09:00 - 10:00", date: "2024-10-22" },
      { day: "Thứ 5", time: "09:00 - 10:00", date: "2024-10-24" },
      { day: "Thứ 7", time: "09:00 - 10:00", date: "2024-10-26" },
    ],
    pool: "Bể bơi A",
    duration: "4 tuần",
    startDate: "2024-10-22",
    endDate: "2024-11-16",
  },
  {
    id: "3",
    name: "Lớp Bơi Nâng Cao B1",
    instructor: "Huấn luyện viên Đức",
    level: "Nâng cao",
    maxStudents: 6,
    currentStudents: 4,
    schedule: [
      { day: "Thứ 2", time: "18:00 - 19:00", date: "2024-10-21" },
      { day: "Thứ 4", time: "18:00 - 19:00", date: "2024-10-23" },
      { day: "Thứ 6", time: "18:00 - 19:00", date: "2024-10-25" },
    ],
    pool: "Bể bơi B",
    duration: "6 tuần",
    startDate: "2024-10-21",
    endDate: "2024-12-02",
  },
  {
    id: "4",
    name: "Lớp Bơi Chuyên Nghiệp C1",
    instructor: "Huấn luyện viên Thành",
    level: "Chuyên nghiệp",
    maxStudents: 4,
    currentStudents: 2,
    schedule: [
      { day: "Thứ 3", time: "19:00 - 20:30", date: "2024-10-22" },
      { day: "Thứ 5", time: "19:00 - 20:30", date: "2024-10-24" },
    ],
    pool: "Bể bơi C",
    duration: "8 tuần",
    startDate: "2024-10-22",
    endDate: "2024-12-17",
  },
];

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
  }, [isExpanded]);

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
              {classItem.name}
            </Text>
            <Text
              style={[styles.instructor, isSelected && styles.selectedSubText]}
            >
              {classItem.instructor}
            </Text>

            <View style={styles.classDetails}>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: getLevelColor(classItem.level) },
                ]}
              >
                <Text style={styles.levelText}>{classItem.level}</Text>
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
                  {classItem.currentStudents}/{classItem.maxStudents}
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
                  {classItem.pool}
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
              {classItem.startDate} - {classItem.endDate}
            </Text>
          </View>
          <View style={styles.scheduleItem}>
            <Ionicons name="time" size={16} color={colors.primary} />
            <Text style={styles.scheduleText}>
              Thời lượng: {classItem.duration}
            </Text>
          </View>
        </View>
        <View style={styles.weeklySchedule}>
          {classItem.schedule.map((session: any, sessionIndex: number) => (
            <View key={sessionIndex} style={styles.sessionChip}>
              <Text style={styles.sessionDay}>{session.day}</Text>
              <Text style={styles.sessionTime}>{session.time}</Text>
            </View>
          ))}
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
                {classItem.startDate} - {classItem.endDate}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Ionicons name="time" size={16} color={colors.primary} />
              <Text style={styles.scheduleText}>
                Thời lượng: {classItem.duration}
              </Text>
            </View>
          </View>
          <View style={styles.weeklySchedule}>
            {classItem.schedule.map((session: any, sessionIndex: number) => (
              <Animated.View
                key={sessionIndex}
                entering={FadeInUp.delay(sessionIndex * 50)}
                style={styles.sessionChip}
              >
                <Text style={styles.sessionDay}>{session.day}</Text>
                <Text style={styles.sessionTime}>{session.time}</Text>
              </Animated.View>
            ))}
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

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingClass, setPendingClass] = useState<any | null>(null);

  // Filter classes based on course level (mock logic)
  const availableClasses = useMemo(() => {
    return mockClasses.filter((cls) => cls.currentStudents < cls.maxStudents);
  }, []);

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
    switch (level) {
      case "Cơ bản":
        return colors.success;
      case "Nâng cao":
        return colors.warning;
      case "Chuyên nghiệp":
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
        {availableClasses.map((classItem, index) => (
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
        ))}
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
              {`Bạn có chắc chắn muốn đăng ký lớp "${pendingClass?.name}"?`}
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
    backgroundColor: "#EEF2FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9999,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  sessionDay: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  sessionTime: {
    fontSize: 12,
    fontWeight: "700",
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
});
