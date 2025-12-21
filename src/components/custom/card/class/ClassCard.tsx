import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
  withSpring,
  FadeInDown,
  Layout,
  FadeInUp,
} from "react-native-reanimated";

import { colors } from "../../../../constants/colors";
import { styles } from "../../../../screens/member/course/class_selection/style";
import { format } from "../../../../utils/format";

// Component for individual class card
type ClassCardProps = {
  classItem: any;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleSchedule: () => void;
  onShowDetails?: () => void;
  getLevelColor: (level: string) => string;
  isEnrolled?: boolean;
};

export default function ClassCardComponent(props: ClassCardProps) {
  const {
    classItem,
    index,
    isSelected,
    isExpanded,
    onSelect,
    onToggleSchedule,
    onShowDetails,
    isEnrolled = false,
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
      height: animatedHeight.value + 0,
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

  // Helpers: compute weekday from ISO date and format time ranges
  const dayFromDate = (dateStr?: string) => {
    try {
      if (!dateStr) return null;
      return format.date(new Date(dateStr), "short");
    } catch {
      return null;
    }
  };

  const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

  const timeRangeFrom = (planOrSession: any) => {
    try {
      const slot = planOrSession.slot || planOrSession.time_slot || null;
      if (slot) {
        const sH = slot.start_time;
        const eH = slot.end_time;
        const sM =
          slot.start_minute !== undefined && slot.start_minute !== null
            ? slot.start_minute
            : 0;
        const eM =
          slot.end_minute !== undefined && slot.end_minute !== null
            ? slot.end_minute
            : 0;
        if (
          (typeof sH === "number" || typeof sH === "string") &&
          (typeof eH === "number" || typeof eH === "string")
        ) {
          return `${pad2(Number(sH))}:${pad2(Number(sM))} - ${pad2(
            Number(eH)
          )}:${pad2(Number(eM))}`;
        }
        if (
          slot.start_time &&
          slot.end_time &&
          typeof slot.start_time === "string"
        ) {
          return `${slot.start_time} - ${slot.end_time}`;
        }
      }
      if (planOrSession.start_time && planOrSession.end_time) {
        const st =
          typeof planOrSession.start_time === "number"
            ? `${pad2(planOrSession.start_time)}:00`
            : planOrSession.start_time;
        const et =
          typeof planOrSession.end_time === "number"
            ? `${pad2(planOrSession.end_time)}:00`
            : planOrSession.end_time;
        return `${st} - ${et}`;
      }
      if (planOrSession.time && typeof planOrSession.time === "string") {
        return planOrSession.time;
      }
      if (
        planOrSession.slot &&
        (planOrSession.slot.title || planOrSession.slot.duration)
      ) {
        return `${planOrSession.slot.title || "Slot"} - ${
          planOrSession.slot.duration || ""
        }`.trim();
      }
      return null;
    } catch {
      return null;
    }
  };

  return (
    <>
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        layout={Layout.springify()}
        style={[
          styles.classCard,
          isSelected && styles.selectedClassCard,
          isEnrolled && { opacity: 0.7, backgroundColor: "#f3f4f6" },
        ]}
      >
        {isSelected && <View style={styles.leftAccent} />}

        {/* Selection Radio Button - Disabled if Enrolled */}
        {!isEnrolled && (
          <TouchableOpacity style={styles.radioContainer} onPress={onSelect}>
            <View
              style={[styles.radioButton, isSelected && styles.radioSelected]}
            >
              {isSelected && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        )}
        {isEnrolled && (
          <View style={styles.radioContainer}>
            <View
              style={[
                styles.radioButton,
                { borderColor: "#ccc", backgroundColor: "#e5e7eb" },
              ]}
            />
          </View>
        )}

        {/* Class Header */}
        <View style={styles.classHeader}>
          <TouchableOpacity
            style={styles.classContent}
            onPress={isEnrolled ? undefined : onSelect}
            activeOpacity={isEnrolled ? 1 : 0.7}
          >
            <View style={styles.classInfo}>
              <View style={styles.titleRow}>
                <Ionicons
                  name="school"
                  size={18}
                  color={isEnrolled ? colors.textSecondary : colors.primary}
                />
                <Text
                  style={[
                    styles.className,
                    isEnrolled && { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {classItem.originalData?.name || classItem.name || "Lớp học"}
                </Text>
              </View>

              <View style={styles.instructorRow}>
                <Ionicons
                  name="person"
                  size={16}
                  color={isEnrolled ? colors.textSecondary : colors.primary}
                />
                <Text style={styles.instructorText}>
                  {classItem.originalData?.instructor?.username ||
                    "Huấn luyện viên"}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Ionicons
                    name="people"
                    size={12}
                    color={isEnrolled ? colors.textSecondary : colors.primary}
                  />
                  <Text style={styles.metaPillText}>
                    {classItem.originalData?.current_students ||
                      classItem.currentStudents ||
                      0}
                    /
                    {classItem.originalData?.max_students ||
                      classItem.maxStudents ||
                      8}
                  </Text>
                </View>
                <View style={styles.metaPill}>
                  <Ionicons
                    name="location"
                    size={12}
                    color={isEnrolled ? colors.textSecondary : colors.primary}
                  />
                  <Text style={styles.metaPillText} numberOfLines={1}>
                    {classItem.originalData?.pool?.title ||
                      classItem.originalData?.pool?.name ||
                      classItem.originalData?.pool_name ||
                      classItem.pool ||
                      "Bể bơi"}
                  </Text>
                </View>

                {isEnrolled && (
                  <View
                    style={[
                      styles.metaPill,
                      { backgroundColor: "#EBFBEE", borderColor: "#2F9E44" },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={12}
                      color="#2F9E44"
                    />
                    <Text style={[styles.metaPillText, { color: "#2F9E44" }]}>
                      Đã đăng ký
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scheduleToggle}
            onPress={onToggleSchedule}
          >
            <Animated.View style={animatedChevronStyle}>
              <Ionicons
                name="chevron-down"
                size={20}
                color={isEnrolled ? colors.textSecondary : colors.primary}
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
          <View style={styles.scheduleHeaderRow}>
            <Text style={styles.scheduleTitle}>Lịch học</Text>
            <TouchableOpacity
              onPress={() => onShowDetails && onShowDetails()}
              style={styles.detailsButton}
            >
              <Text style={styles.detailsButtonText}>Xem chi tiết</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.scheduleInfo}>
            <View style={styles.scheduleItem}>
              <Ionicons
                name="calendar"
                size={16}
                color={isEnrolled ? colors.textSecondary : colors.primary}
              />
              <Text style={styles.scheduleText}>
                {format.date(
                  classItem.originalData?.start_date ||
                    classItem.startDate ||
                    "2024-10-21",
                  "short"
                )}{" "}
                -{" "}
                {format.date(
                  classItem.originalData?.end_date ||
                    classItem.endDate ||
                    "2024-11-15",
                  "short"
                )}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Ionicons
                name="time"
                size={16}
                color={isEnrolled ? colors.textSecondary : colors.primary}
              />
              <Text style={styles.scheduleText}>
                Thời lượng: {classItem.duration || "4 tuần"}
              </Text>
            </View>
          </View>
          <View style={styles.weeklySchedule}>
            {classItem.originalData?.schedule_plan &&
            classItem.originalData.schedule_plan.length > 0 ? (
              classItem.originalData.schedule_plan.map(
                (plan: any, planIndex: number) => {
                  const day =
                    dayFromDate(plan.date) || plan.days_of_week?.[0] || "-";
                  const timeRange = timeRangeFrom(plan);
                  return (
                    <View key={planIndex} style={styles.sessionChip}>
                      <Text style={styles.sessionDay}>{day}</Text>
                      <Text style={styles.sessionTime}>{timeRange}</Text>
                    </View>
                  );
                }
              )
            ) : classItem.schedule && classItem.schedule.length > 0 ? (
              classItem.schedule.map((session: any, sessionIndex: number) => {
                const day = dayFromDate(session.date) || session.day || "-";
                const timeRange = timeRangeFrom(session);
                return (
                  <View key={sessionIndex} style={styles.sessionChip}>
                    <Text style={styles.sessionDay}>{day}</Text>
                    <Text style={styles.sessionTime}>{timeRange}</Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.sessionChip}>
                <Text style={styles.sessionDay}>Lịch học</Text>
                <Text style={styles.sessionTime}>Sẽ được thông báo</Text>
              </View>
            )}
          </View>
        </View>

        {/* Animated Schedule Container */}
        <Animated.View
          style={[styles.scheduleContainer, animatedScheduleStyle]}
        >
          <View style={styles.scheduleContent}>
            <View style={styles.scheduleHeaderRow}>
              <Text style={styles.scheduleTitle}>Lịch học</Text>
              <TouchableOpacity
                onPress={() => onShowDetails && onShowDetails()}
                style={styles.detailsButton}
              >
                <Text style={styles.detailsButtonText}>Xem chi tiết</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.scheduleInfo}>
              <View style={styles.scheduleItem}>
                <Ionicons
                  name="calendar"
                  size={16}
                  color={isEnrolled ? colors.textSecondary : colors.primary}
                />
                <Text style={styles.scheduleText}>
                  {format.date(
                    classItem.originalData?.start_date ||
                      classItem.startDate ||
                      "2024-10-21",
                    "short"
                  )}{" "}
                  -{" "}
                  {format.date(
                    classItem.originalData?.end_date ||
                      classItem.endDate ||
                      "2024-11-15",
                    "short"
                  )}
                </Text>
              </View>
              <View style={styles.scheduleItem}>
                <Ionicons
                  name="time"
                  size={16}
                  color={isEnrolled ? colors.textSecondary : colors.primary}
                />
                <Text style={styles.scheduleText}>
                  Thời lượng: {classItem.duration || "4 tuần"}
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weeklySchedule}
            >
              {classItem.originalData?.schedule_plan &&
              classItem.originalData.schedule_plan.length > 0 ? (
                classItem.originalData.schedule_plan.map(
                  (plan: any, planIndex: number) => {
                    const day =
                      dayFromDate(plan.date) || plan.days_of_week?.[0] || "-";
                    const timeRange = timeRangeFrom(plan);
                    return (
                      <Animated.View
                        key={planIndex}
                        entering={FadeInUp.delay(planIndex * 50)}
                        style={styles.sessionChip}
                      >
                        <Text style={styles.sessionDay}>{day}</Text>
                        <Text style={styles.sessionTime}>{timeRange}</Text>
                      </Animated.View>
                    );
                  }
                )
              ) : classItem.schedule && classItem.schedule.length > 0 ? (
                classItem.schedule.map((session: any, sessionIndex: number) => {
                  const day = dayFromDate(session.date) || session.day || "-";
                  const timeRange = timeRangeFrom(session);
                  return (
                    <Animated.View
                      key={sessionIndex}
                      entering={FadeInUp.delay(sessionIndex * 50)}
                      style={styles.sessionChip}
                    >
                      <Text style={styles.sessionDay}>{day}</Text>
                      <Text style={styles.sessionTime}>{timeRange}</Text>
                    </Animated.View>
                  );
                })
              ) : (
                <Animated.View entering={FadeInUp} style={styles.sessionChip}>
                  <Text style={styles.sessionDay}>Lịch học</Text>
                  <Text style={styles.sessionTime}>Sẽ được thông báo</Text>
                </Animated.View>
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </Animated.View>
    </>
  );
}
