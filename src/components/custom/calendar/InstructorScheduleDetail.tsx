import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { CalendarEventItem } from "./CalendarView";

interface InstructorScheduleDetailProps {
  event: CalendarEventItem;
  onAttendanceUpdate?: (memberId: string, isPresent: boolean) => void;
}

export default function InstructorScheduleDetail({
  event,
  onAttendanceUpdate,
}: InstructorScheduleDetailProps) {
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  const formatTime = (hour: number, minute: number) => {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleAttendanceToggle = (memberId: string) => {
    const newAttendance = {
      ...attendance,
      [memberId]: !attendance[memberId],
    };
    setAttendance(newAttendance);

    if (onAttendanceUpdate) {
      onAttendanceUpdate(memberId, newAttendance[memberId]);
    }
  };

  const getAttendanceStats = () => {
    const totalMembers = event.classroom?.member?.length || 0;
    const presentCount = Object.values(attendance).filter(Boolean).length;
    return { total: totalMembers, present: presentCount };
  };

  const stats = getAttendanceStats();

  return (
    <ScrollView
      style={styles.detailContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header với thông tin chính */}
      <View style={styles.detailHeader}>
        <View style={styles.detailHeaderContent}>
          <View style={styles.detailHeaderIcon}>
            <Ionicons name="calendar" size={24} color={colors.white} />
          </View>
          <View style={styles.detailHeaderText}>
            <Text style={styles.detailHeaderTitle}>
              {typeof event.slot?.title === "string"
                ? event.slot.title
                : typeof event.slot?.title === "object" &&
                  event.slot?.title &&
                  (event.slot.title as any)?.name
                ? (event.slot.title as any).name
                : typeof event.classroom?.name === "string"
                ? event.classroom.name
                : typeof event.classroom?.name === "object" &&
                  event.classroom?.name &&
                  (event.classroom.name as any)?.name
                ? (event.classroom.name as any).name
                : "Buổi dạy"}
            </Text>
            <Text style={styles.detailHeaderSubtitle}>
              {formatDate(event.date.toString())}
            </Text>
          </View>
        </View>
        <View style={styles.detailTimeBadge}>
          <Ionicons name="time" size={16} color={colors.white} />
          <Text style={styles.detailTimeText}>
            {formatTime(
              event.slot?.start_time || 0,
              event.slot?.start_minute || 0
            )}{" "}
            -{" "}
            {formatTime(event.slot?.end_time || 0, event.slot?.end_minute || 0)}
          </Text>
        </View>
      </View>

      {/* Thông tin chi tiết */}
      <View style={styles.detailContent}>
        {/* Thông tin slot */}
        {event.slot && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIcon}>
                <Ionicons name="bookmark" size={20} color={colors.white} />
              </View>
              <Text style={styles.detailCardTitle}>Thông tin slot</Text>
            </View>
            <View style={styles.detailCardContent}>
              <View style={styles.detailInfoItem}>
                <Text style={styles.detailInfoLabel}>Tên slot</Text>
                <Text style={styles.detailInfoValue}>
                  {typeof event.slot.title === "string"
                    ? event.slot.title
                    : typeof event.slot.title === "object" &&
                      event.slot.title &&
                      (event.slot.title as any)?.name
                    ? (event.slot.title as any).name
                    : "Không có tên"}
                </Text>
              </View>
              {event.slot.duration && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Thời lượng</Text>
                  <Text style={styles.detailInfoValue}>
                    {event.slot.duration}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Thông tin lớp học */}
        {event.classroom && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIcon}>
                <Ionicons name="school" size={20} color={colors.white} />
              </View>
              <Text style={styles.detailCardTitle}>Thông tin lớp học</Text>
            </View>
            <View style={styles.detailCardContent}>
              <View style={styles.detailInfoItem}>
                <Text style={styles.detailInfoLabel}>Tên lớp</Text>
                <Text style={styles.detailInfoValue}>
                  {typeof event.classroom.name === "string"
                    ? event.classroom.name
                    : typeof event.classroom.name === "object" &&
                      event.classroom.name &&
                      (event.classroom.name as any)?.name
                    ? (event.classroom.name as any).name
                    : "Không có tên"}
                </Text>
              </View>
              {event.classroom.course && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Khóa học</Text>
                  <Text style={styles.detailInfoValue}>
                    {typeof event.classroom.course === "string"
                      ? event.classroom.course
                      : typeof event.classroom.course === "object" &&
                        event.classroom.course &&
                        (event.classroom.course as any)?.title
                      ? (event.classroom.course as any).title
                      : typeof event.classroom.course === "object" &&
                        event.classroom.course &&
                        (event.classroom.course as any)?.name
                      ? (event.classroom.course as any).name
                      : "Không có thông tin"}
                  </Text>
                </View>
              )}
              {event.classroom.member && event.classroom.member.length > 0 && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Số học viên</Text>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue}>
                      {Array.isArray(event.classroom.member)
                        ? event.classroom.member.length
                        : 0}
                    </Text>
                    <View style={styles.detailInfoBadge}>
                      <Ionicons
                        name="people"
                        size={12}
                        color={colors.primary}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Danh sách thành viên và điểm danh */}
        {event.classroom?.member && event.classroom.member.length > 0 && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIcon}>
                <Ionicons name="people" size={20} color={colors.white} />
              </View>
              <Text style={styles.detailCardTitle}>Danh sách thành viên</Text>
            </View>
            <View style={styles.detailCardContent}>
              {/* Thống kê điểm danh */}
              <View style={styles.attendanceStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Tổng số</Text>
                  <Text style={styles.statValue}>{stats.total}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Có mặt</Text>
                  <Text style={[styles.statValue, { color: colors.success }]}>
                    {stats.present}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Vắng mặt</Text>
                  <Text style={[styles.statValue, { color: colors.error }]}>
                    {stats.total - stats.present}
                  </Text>
                </View>
              </View>

              {/* Danh sách thành viên */}
              <View style={styles.memberList}>
                {event.classroom.member.map(
                  (memberId: string, index: number) => (
                    <View key={memberId} style={styles.memberItem}>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>
                          Học viên {index + 1}
                        </Text>
                        <Text style={styles.memberId}>
                          ID: {memberId.slice(0, 8)}...
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.attendanceButton,
                          attendance[memberId]
                            ? styles.attendanceButtonPresent
                            : styles.attendanceButtonAbsent,
                        ]}
                        onPress={() => handleAttendanceToggle(memberId)}
                      >
                        <Ionicons
                          name={attendance[memberId] ? "checkmark" : "close"}
                          size={16}
                          color={colors.white}
                        />
                        <Text style={styles.attendanceButtonText}>
                          {attendance[memberId] ? "Có mặt" : "Vắng mặt"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )
                )}
              </View>

              {/* Ghi chú về điểm danh */}
              <View style={styles.attendanceNote}>
                <Ionicons
                  name="information-circle"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.attendanceNoteText}>
                  Nhấn vào nút để đánh dấu có mặt/vắng mặt cho từng học viên
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Thông tin bể bơi */}
        {event.pool && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIcon}>
                <Ionicons name="water" size={20} color={colors.white} />
              </View>
              <Text style={styles.detailCardTitle}>Thông tin bể bơi</Text>
            </View>
            <View style={styles.detailCardContent}>
              <View style={styles.detailInfoItem}>
                <Text style={styles.detailInfoLabel}>Tên bể</Text>
                <Text style={styles.detailInfoValue}>
                  {typeof event.pool.title === "string"
                    ? event.pool.title
                    : typeof event.pool.title === "object" &&
                      event.pool.title &&
                      (event.pool.title as any)?.name
                    ? (event.pool.title as any).name
                    : "Không có tên"}
                </Text>
              </View>
              {event.pool.type && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Loại bể</Text>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue}>
                      {event.pool.type}
                    </Text>
                    <View
                      style={[
                        styles.detailInfoBadge,
                        styles.detailInfoBadgeType,
                      ]}
                    >
                      <Ionicons name="layers" size={12} color={colors.white} />
                    </View>
                  </View>
                </View>
              )}
              {event.pool.dimensions && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Kích thước</Text>
                  <Text style={styles.detailInfoValue}>
                    {event.pool.dimensions}
                  </Text>
                </View>
              )}
              {event.pool.depth && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Độ sâu</Text>
                  <Text style={styles.detailInfoValue}>{event.pool.depth}</Text>
                </View>
              )}
              {event.pool.capacity && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Sức chứa</Text>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue}>
                      {event.pool.capacity} người
                    </Text>
                    <View style={styles.detailInfoBadge}>
                      <Ionicons
                        name="people"
                        size={12}
                        color={colors.primary}
                      />
                    </View>
                  </View>
                </View>
              )}
              {event.pool.maintance_status && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Tình trạng bảo trì</Text>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue}>
                      {event.pool.maintance_status}
                    </Text>
                    <View
                      style={[
                        styles.detailInfoBadge,
                        styles.detailInfoBadgeMaintenance,
                      ]}
                    >
                      <Ionicons
                        name="construct"
                        size={12}
                        color={colors.white}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Thông tin khác */}
        {(event.instructor ||
          (event.attendees && event.attendees.length > 0) ||
          event.created_at) && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIcon}>
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={colors.white}
                />
              </View>
              <Text style={styles.detailCardTitle}>Thông tin khác</Text>
            </View>
            <View style={styles.detailCardContent}>
              {event.instructor && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Huấn luyện viên</Text>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue}>
                      {typeof event.instructor === "string"
                        ? event.instructor
                        : typeof event.instructor === "object" &&
                          event.instructor &&
                          (event.instructor as any)?.name
                        ? (event.instructor as any).name
                        : typeof event.instructor === "object" &&
                          event.instructor &&
                          (event.instructor as any)?.username
                        ? (event.instructor as any).username
                        : "Không có thông tin"}
                    </Text>
                    <View style={styles.detailInfoBadge}>
                      <Ionicons name="person" size={12} color={colors.white} />
                    </View>
                  </View>
                </View>
              )}
              {event.attendees && event.attendees.length > 0 && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Số người tham gia</Text>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue}>
                      {Array.isArray(event.attendees)
                        ? event.attendees.length
                        : 0}
                    </Text>
                    <View style={styles.detailInfoBadge}>
                      <Ionicons name="people" size={12} color={colors.white} />
                    </View>
                  </View>
                </View>
              )}
              {event.created_at && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Ngày tạo</Text>
                  <Text style={styles.detailInfoValue}>
                    {new Date(event.created_at).toLocaleDateString("vi-VN")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  detailContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  detailHeader: {
    backgroundColor: colors.primary,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  detailHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  detailHeaderIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  detailHeaderText: {
    flex: 1,
  },
  detailHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 5,
  },
  detailHeaderSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  detailTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  detailTimeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
  detailContent: {
    padding: 20,
  },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailCardIcon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  detailCardContent: {
    padding: 15,
  },
  detailInfoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailInfoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  detailInfoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  detailInfoValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  detailInfoBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  detailInfoBadgeType: {
    backgroundColor: colors.secondary,
  },
  detailInfoBadgeMaintenance: {
    backgroundColor: colors.warning,
  },
  // Attendance specific styles
  attendanceStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  memberList: {
    gap: 10,
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 2,
  },
  memberId: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  attendanceButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    justifyContent: "center",
  },
  attendanceButtonPresent: {
    backgroundColor: colors.success,
  },
  attendanceButtonAbsent: {
    backgroundColor: colors.error,
  },
  attendanceButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  attendanceNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  attendanceNoteText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
});
