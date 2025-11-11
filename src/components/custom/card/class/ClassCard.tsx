import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
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
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../../../constants/colors";
import { styles } from "../../../../screens/member/course/class_selection/style";
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

export default function ClassCardComponent(props: ClassCardProps) {
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
      style={[styles.classCard, isSelected && styles.selectedClassCard]}
    >
      {/* Background Gradient for entire card when selected */}
      {isSelected && (
        <LinearGradient
          colors={[colors.primary, colors.primary + "E6"]}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* Selection Radio Button */}
      <TouchableOpacity style={styles.radioContainer} onPress={onSelect}>
        <View style={[styles.radioButton, isSelected && styles.radioSelected]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>

      {/* Class Header */}
      <View style={styles.classHeader}>
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
          <Text
            style={[styles.scheduleTitle, isSelected && styles.selectedText]}
          >
            Lịch học
          </Text>
          <View style={styles.scheduleInfo}>
            <View style={styles.scheduleItem}>
              <Ionicons
                name="calendar"
                size={16}
                color={isSelected ? colors.white : colors.primary}
              />
              <Text
                style={[
                  styles.scheduleText,
                  isSelected && styles.selectedSubText,
                ]}
              >
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
              <Ionicons
                name="time"
                size={16}
                color={isSelected ? colors.white : colors.primary}
              />
              <Text
                style={[
                  styles.scheduleText,
                  isSelected && styles.selectedSubText,
                ]}
              >
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
                    style={[
                      styles.sessionChip,
                      isSelected && styles.selectedSessionChip,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sessionDay,
                        isSelected && styles.selectedSubText,
                      ]}
                    >
                      {plan.days_of_week?.[0] || "Thứ"}
                    </Text>
                    <Text
                      style={[
                        styles.sessionTime,
                        isSelected && styles.selectedSubText,
                      ]}
                    >
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
                  style={[
                    styles.sessionChip,
                    isSelected && styles.selectedSessionChip,
                  ]}
                >
                  <Text
                    style={[
                      styles.sessionDay,
                      isSelected && styles.selectedSubText,
                    ]}
                  >
                    {session.day ||
                      session.day_of_week ||
                      session.weekday ||
                      "Thứ"}
                  </Text>
                  <Text
                    style={[
                      styles.sessionTime,
                      isSelected && styles.selectedSubText,
                    ]}
                  >
                    {session.time ||
                      session.start_time ||
                      session.time_slot ||
                      "08:00 - 09:00"}
                  </Text>
                </Animated.View>
              ))
            ) : (
              <Animated.View
                entering={FadeInUp}
                style={[
                  styles.sessionChip,
                  isSelected && styles.selectedSessionChip,
                ]}
              >
                <Text
                  style={[
                    styles.sessionDay,
                    isSelected && styles.selectedSubText,
                  ]}
                >
                  Lịch học
                </Text>
                <Text
                  style={[
                    styles.sessionTime,
                    isSelected && styles.selectedSubText,
                  ]}
                >
                  Sẽ được thông báo
                </Text>
              </Animated.View>
            )}
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}
