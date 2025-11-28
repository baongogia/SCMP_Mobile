import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../calendar/style";
import { colors } from "@/src/constants/colors";
import type { CalendarEventItem } from "../../calendar/CalendarView";

type AttendanceStatus = {
  status: "not_started" | "ongoing" | "attended" | "not_attended" | string;
  color: string;
  icon: string;
  borderColor?: string;
};

interface EventCardProps {
  item: CalendarEventItem;
  role: "instructor" | "member";
  onPress?: () => void;
  getAttendanceStatus: (event: CalendarEventItem) => AttendanceStatus;
  finalEventText: string;
}

export default function EventCard({
  item,
  role,
  onPress,
  getAttendanceStatus,
  finalEventText,
}: EventCardProps) {
  const attendanceStatus = getAttendanceStatus(item);

  return (
    <TouchableOpacity style={styles.courseCard} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <View style={styles.courseHeader}>
          <View style={styles.courseIcon}>
            <Ionicons name="school" size={20} color={colors.primary} />
          </View>
          <View style={styles.courseInfo}>
            <Text style={styles.sessionCourseName} numberOfLines={1}>
              {item.classroom?.name || item.slot?.title || finalEventText}
            </Text>
            <Text style={styles.sessionCourseInstructor} numberOfLines={1}>
              {typeof item.classroom?.course === "object"
                ? (item.classroom?.course as any)?.title ||
                  (role === "instructor" ? "Khóa học" : "Khóa học")
                : (item.classroom?.course as unknown as string) ||
                  (role === "instructor" ? "Khóa học" : "Khóa học")}
            </Text>
          </View>
          <View style={styles.courseDate}>
            <Text style={styles.courseDateText}>
              {new Date(item.date as any).toLocaleDateString("vi-VN")}
            </Text>
          </View>
        </View>

        <View style={styles.courseDetails}>
          <View style={styles.courseDetailItem}>
            <Ionicons name="bookmark" size={14} color={colors.grayc} />
            <Text style={styles.courseDetailText} numberOfLines={1}>
              {item.slot?.title || "Slot"}
            </Text>
          </View>
          <View style={styles.courseDetailItem}>
            <Ionicons name="time" size={14} color={colors.grayc} />
            <Text style={styles.courseDetailText}>{`${String(
              item.slot?.start_time ?? 0
            ).padStart(2, "0")}:${String(item.slot?.start_minute ?? 0).padStart(
              2,
              "0"
            )}`}</Text>
          </View>
          {item.pool?.title && (
            <View style={styles.courseDetailItem}>
              <Ionicons name="water" size={14} color={colors.grayc} />
              <Text style={styles.courseDetailText} numberOfLines={1}>
                {item.pool.title}
              </Text>
            </View>
          )}
        </View>
      </View>

      {role !== "instructor" && (
        <View
          style={[
            styles.attendanceBadge,
            {
              backgroundColor: colors.mainBackground,
            },
          ]}
        >
          {attendanceStatus.status === "not_started" ? (
            <View
              style={{
                backgroundColor: colors.mainBackground,
                borderRadius: 14,
                width: 28,
                height: 28,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={attendanceStatus.icon as any}
                size={20}
                color={
                  attendanceStatus.status === "not_started"
                    ? colors.gray[600]
                    : attendanceStatus.color
                }
              />
            </View>
          ) : (
            <Ionicons
              name={attendanceStatus.icon as any}
              size={23}
              color={attendanceStatus.color}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
