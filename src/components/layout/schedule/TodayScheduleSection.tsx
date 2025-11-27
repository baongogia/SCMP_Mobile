import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { IMAGES } from "@/src/constants/images";
import { ScheduleItem } from "@/src/types/schedule";
import {
  getInstructorSchedules,
  getAllMemberSchedules,
} from "@/src/services/learning_process/schedules/scheduleServices";

interface TodayScheduleSectionProps {
  onPress?: () => void;
  role?: "instructor" | "member";
}

export const TodayScheduleSection: React.FC<TodayScheduleSectionProps> = ({
  onPress,
  role = "instructor",
}) => {
  const navigation = useNavigation();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUpcoming, setIsUpcoming] = useState(false);

  // Helper function to convert date to local date key (same as CalendarView)
  const toLocalDateKey = useCallback((input: Date | string) => {
    const d = typeof input === "string" ? new Date(input) : input;
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const fetchTodaySchedules = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const todayKey = toLocalDateKey(today);

      // Fetch today's schedules first - use appropriate API based on role
      let res =
        role === "instructor"
          ? await getInstructorSchedules(todayStr, todayStr)
          : await getAllMemberSchedules(todayStr, todayStr);
      let items: any[] = res?.data?.data || [];

      // Normalize time fields helper
      const normalizeItem = (it: any): ScheduleItem => {
        const startMin = it?.slot?.start_minute;
        let start_time = it?.slot?.start_time;
        let start_minute = it?.slot?.start_minute;
        if (
          typeof startMin === "number" &&
          startMin > 59 &&
          start_time == null
        ) {
          start_time = Math.floor(startMin / 60);
          start_minute = startMin % 60;
        }

        const endMinRaw = it?.slot?.end_minute;
        let end_time = it?.slot?.end_time;
        let end_minute = it?.slot?.end_minute;
        if (
          typeof endMinRaw === "number" &&
          endMinRaw > 59 &&
          (end_time == null || end_time === 0)
        ) {
          end_time = Math.floor(endMinRaw / 60);
          end_minute = endMinRaw % 60;
        }

        return {
          ...it,
          date: it.date,
          slot: {
            ...it.slot,
            start_time,
            start_minute,
            end_time,
            end_minute,
          },
        } as ScheduleItem;
      };

      // Filter today's schedules
      let todaySchedules = items.map(normalizeItem).filter((item) => {
        const itemDateKey = toLocalDateKey(item.date);
        return itemDateKey === todayKey;
      });

      // If no schedules today, fetch upcoming schedules (next 7 days)
      if (todaySchedules.length === 0) {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split("T")[0];

        res =
          role === "instructor"
            ? await getInstructorSchedules(todayStr, nextWeekStr)
            : await getAllMemberSchedules(todayStr, nextWeekStr);
        items = res?.data?.data || [];

        const allUpcoming = items.map(normalizeItem);

        // Sort by date and time
        allUpcoming.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateA !== dateB) {
            return dateA - dateB;
          }
          const timeA =
            (a.slot.start_time || 0) * 60 + (a.slot.start_minute || 0);
          const timeB =
            (b.slot.start_time || 0) * 60 + (b.slot.start_minute || 0);
          return timeA - timeB;
        });

        setSchedules(allUpcoming);
        setIsUpcoming(true);
      } else {
        // Sort today's schedules by start time
        todaySchedules.sort((a, b) => {
          const timeA =
            (a.slot.start_time || 0) * 60 + (a.slot.start_minute || 0);
          const timeB =
            (b.slot.start_time || 0) * 60 + (b.slot.start_minute || 0);
          return timeA - timeB;
        });

        setSchedules(todaySchedules);
        setIsUpcoming(false);
      }
    } catch {
      // Silently fail - don't show error for indicator
      setSchedules([]);
      setIsUpcoming(false);
    } finally {
      setLoading(false);
    }
  }, [toLocalDateKey, role]);

  useEffect(() => {
    fetchTodaySchedules();
  }, [fetchTodaySchedules]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTodaySchedules();
    }, [fetchTodaySchedules])
  );

  const formatTime = (hour: number, minute: number): string => {
    const h = hour || 0;
    const m = minute || 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const getNextSchedule = (): ScheduleItem | null => {
    if (schedules.length === 0) return null;

    // If showing upcoming schedules, return the first one
    if (isUpcoming) {
      return schedules[0] || null;
    }

    // If showing today's schedules, find next upcoming one
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const nextSchedule = schedules.find((schedule) => {
      const startTime =
        (schedule.slot.start_time || 0) * 60 +
        (schedule.slot.start_minute || 0);
      return startTime >= currentTime;
    });

    return nextSchedule || schedules[0] || null;
  };

  const getClassName = (schedule: ScheduleItem): string => {
    if (schedule.classroom?.name) {
      return schedule.classroom.name;
    }
    if (typeof schedule.classroom?.course === "object") {
      return (
        (schedule.classroom.course as any)?.title ||
        (schedule.classroom.course as any)?.name ||
        "Khóa học"
      );
    }
    return (schedule.classroom?.course as unknown as string) || "Khóa học";
  };

  const getScheduleStatus = (
    schedule: ScheduleItem
  ): {
    icon: string;
    color: string;
    bgColor: string;
  } => {
    // If showing upcoming schedules, always show "upcoming" status
    if (isUpcoming) {
      return {
        icon: "calendar-outline",
        color: colors.primary,
        bgColor: colors.mainBackground,
      };
    }

    // For today's schedules, check actual status
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime =
      (schedule.slot.start_time || 0) * 60 + (schedule.slot.start_minute || 0);
    const endTime =
      (schedule.slot.end_time || 0) * 60 + (schedule.slot.end_minute || 0);

    if (currentTime < startTime) {
      return {
        icon: "alarm-outline",
        color: colors.primary,
        bgColor: colors.mainBackground,
      };
    }
    if (currentTime >= startTime && currentTime <= endTime) {
      return {
        icon: "play-circle",
        color: colors.success,
        bgColor: "#D1FAE5",
      };
    }
    return {
      icon: "checkmark-circle",
      color: colors.gray[600],
      bgColor: colors.gray[100],
    };
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      (navigation as any).navigate("Schedule");
    }
  };

  const nextSchedule = getNextSchedule();

  // Don't render if loading and no schedules
  if (loading && schedules.length === 0) {
    return null;
  }

  // Don't render if no schedules
  if (schedules.length === 0) {
    return null;
  }

  const nextStartTime = nextSchedule
    ? formatTime(
        nextSchedule.slot.start_time || 0,
        nextSchedule.slot.start_minute || 0
      )
    : null;
  const nextEndTime = nextSchedule
    ? formatTime(
        nextSchedule.slot.end_time || 0,
        nextSchedule.slot.end_minute || 0
      )
    : null;
  const nextClassName = nextSchedule ? getClassName(nextSchedule) : null;
  const scheduleStatus = nextSchedule ? getScheduleStatus(nextSchedule) : null;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { marginBottom: role === "instructor" ? 25 : 0 },
        { marginTop: role === "member" ? 12 : 0 },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <ImageBackground
        source={{ uri: IMAGES.SCHEDULE_BACKGROUND }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        {/* Overlay */}
        <View style={styles.overlay} />

        {/* Status Badge - Absolute positioned */}
        {scheduleStatus && (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: scheduleStatus.bgColor,
              },
            ]}
          >
            <Ionicons
              name={scheduleStatus.icon as any}
              size={16}
              color={scheduleStatus.color}
            />
          </View>
        )}

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={isUpcoming ? "calendar-outline" : "today"}
              size={18}
              color={colors.white}
            />
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            {nextSchedule && nextStartTime && (
              <View style={styles.scheduleInfo}>
                <View style={styles.scheduleRow}>
                  <Ionicons
                    name="school-outline"
                    size={14}
                    color={colors.white}
                    style={styles.infoIcon}
                  />
                  <Text style={styles.className} numberOfLines={1}>
                    {nextClassName}
                  </Text>
                </View>
                {nextSchedule.slot?.title && (
                  <View style={styles.scheduleRow}>
                    <Ionicons
                      name="bookmark-outline"
                      size={12}
                      color="rgba(255, 255, 255, 0.9)"
                      style={styles.infoIcon}
                    />
                    <Text style={styles.slotText} numberOfLines={1}>
                      {nextSchedule.slot.title}
                    </Text>
                  </View>
                )}
                <View style={styles.scheduleRow}>
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color="rgba(255, 255, 255, 0.9)"
                    style={styles.infoIcon}
                  />
                  <Text style={styles.timeText}>
                    {nextStartTime}
                    {nextEndTime && ` - ${nextEndTime}`}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Arrow */}
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.white}
            style={styles.arrow}
          />
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    borderRadius: 14,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
    position: "relative",
  },
  backgroundImage: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  backgroundImageStyle: {
    borderRadius: 14,
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    // "rgba(0, 62, 159, 0.75)",
    borderRadius: 14,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    position: "relative",
    zIndex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  infoContainer: {
    flex: 1,
  },
  scheduleInfo: {
    gap: 4,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },
  infoIcon: {
    marginRight: 6,
  },
  className: {
    fontSize: 15,
    color: colors.white,
    fontWeight: "700",
    flex: 1,
  },
  slotText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
    flex: 1,
  },
  timeText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  arrow: {
    marginLeft: 8,
  },
});
