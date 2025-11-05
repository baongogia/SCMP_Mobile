import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { CalendarEventItem } from "../../custom/calendar/CalendarView";
import { getInstructorScheduleDetail } from "@/src/services/learning_process/schedules/scheduleServices";
import { takeAttendance } from "@/src/services/learning_process/class/classService";
import { showErrorToast } from "@/src/utils/errorHandler";

interface InstructorScheduleDetailProps {
  event: CalendarEventItem;
  onAttendanceUpdate?: (memberId: string, isPresent: boolean) => void;
  onClose?: () => void;
}

export default function InstructorScheduleDetail({
  event,
  onAttendanceUpdate,
  onClose,
}: InstructorScheduleDetailProps) {
  const navigation = useNavigation();
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);

  // Fetch detailed schedule information when component mounts
  useEffect(() => {
    const fetchScheduleDetail = async () => {
      if (!event._id) return;

      try {
        setLoading(true);
        const response = await getInstructorScheduleDetail(event._id);
        const detailArray = response.data?.data;

        // API returns an array, get the first item
        const detail = Array.isArray(detailArray)
          ? detailArray[0]
          : detailArray;

        if (detail) {
          // Extract students from detail data
          if (
            detail.classroom?.member &&
            Array.isArray(detail.classroom.member)
          ) {
            setStudents(detail.classroom.member);
          }

          // Set initial attendance state from API response
          if (detail.attendees && Array.isArray(detail.attendees)) {
            const initialAttendance: Record<string, boolean> = {};
            detail.attendees.forEach((memberId: string) => {
              initialAttendance[memberId] = true;
            });
            setAttendance(initialAttendance);
          }
        }
      } catch (error) {
        showErrorToast(error, {
          title: "Lỗi tải chi tiết lịch",
          message: "Không thể tải chi tiết lịch học",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleDetail();
  }, [event._id]);

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

  const handleAttendanceToggle = async (memberId: string) => {
    const newAttendance = {
      ...attendance,
      [memberId]: !attendance[memberId],
    };

    try {
      // Get current attendees list
      const currentAttendees = Object.keys(attendance).filter(
        (id) => attendance[id]
      );

      // If marking as present, add to attendees; if absent, remove from attendees
      let newAttendees: string[];
      if (newAttendance[memberId]) {
        // Adding to attendees
        newAttendees = [...currentAttendees, memberId];
      } else {
        // Removing from attendees
        newAttendees = currentAttendees.filter((id) => id !== memberId);
      }

      // Call API to update attendance
      const attendanceData = {
        attendees: newAttendees,
      };

      const response = await takeAttendance(event._id, attendanceData);

      console.log(
        "🔍 Attendance API Response:",
        JSON.stringify(response.data, null, 2)
      );

      // Update local state only after API success
      setAttendance(newAttendance);

      // Show success toast
      Toast.show({
        type: "success",
        text1: "Điểm danh thành công!",
        text2: newAttendance[memberId]
          ? "Học viên đã được đánh dấu có mặt"
          : "Học viên đã được đánh dấu vắng mặt",
        position: "top",
        visibilityTime: 3000,
      });

      if (onAttendanceUpdate) {
        onAttendanceUpdate(memberId, newAttendance[memberId]);
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi cập nhật điểm danh",
        message: "Không thể cập nhật điểm danh",
      });

      // Show error toast
      Toast.show({
        type: "error",
        text1: "Lỗi điểm danh!",
        text2: "Không thể cập nhật trạng thái điểm danh. Vui lòng thử lại.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const getAttendanceStats = () => {
    const totalMembers = students.length || 0;
    const presentCount = Object.values(attendance).filter(Boolean).length;
    return { total: totalMembers, present: presentCount };
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin chi tiết...</Text>
      </View>
    );
  }

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
          <TouchableOpacity
            style={styles.noteButton}
            onPress={() => {
              // Đóng modal trước khi navigate
              if (onClose) {
                onClose();
              }
              (navigation as any).navigate("Note", {
                class_id:
                  typeof event.classroom === "object" &&
                  event.classroom !== null &&
                  "_id" in event.classroom
                    ? (event.classroom as any)._id
                    : event.classroom,
                course_id:
                  typeof event.classroom?.course === "object" &&
                  event.classroom?.course !== null &&
                  "_id" in event.classroom.course
                    ? (event.classroom.course as any)._id
                    : event.classroom?.course,
                class_name:
                  typeof event.classroom?.name === "string"
                    ? event.classroom.name
                    : typeof event.classroom?.name === "object" &&
                      event.classroom?.name
                    ? (event.classroom.name as any)?.name
                    : "Lớp học",
                course_title:
                  typeof event.classroom?.course === "string"
                    ? event.classroom.course
                    : typeof event.classroom?.course === "object" &&
                      event.classroom?.course
                    ? (event.classroom.course as any)?.title ||
                      (event.classroom.course as any)?.name
                    : "Khóa học",
                schedule_id: event._id,
                schedule_title:
                  typeof event.slot?.title === "string"
                    ? event.slot.title
                    : typeof event.slot?.title === "object" && event.slot?.title
                    ? (event.slot.title as any)?.name
                    : "Buổi dạy",
              });
            }}
          >
            <Ionicons
              name="document-text-outline"
              size={24}
              color={colors.white}
            />
          </TouchableOpacity>
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
                      <Ionicons name="people" size={12} color={colors.white} />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Danh sách thành viên và điểm danh */}
        {students && students.length > 0 && (
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
                {students.map((student: any, index: number) => {
                  const memberId = student._id || student;
                  const studentName =
                    student.username || student.name || `Học viên ${index + 1}`;
                  const studentEmail = student.email || "";
                  const avatarUrl = student.featured_image?.[0]?.path;

                  return (
                    <View key={memberId} style={styles.memberItem}>
                      <View style={styles.memberInfo}>
                        <View style={styles.memberAvatarContainer}>
                          {avatarUrl ? (
                            <Image
                              source={{ uri: avatarUrl }}
                              style={styles.memberAvatar}
                            />
                          ) : (
                            <View style={styles.memberAvatarPlaceholder}>
                              <Ionicons
                                name="person"
                                size={20}
                                color={colors.textSecondary}
                              />
                            </View>
                          )}
                        </View>
                        <View style={styles.memberTextInfo}>
                          <Text style={styles.memberName}>{studentName}</Text>
                          {studentEmail && (
                            <Text style={styles.memberId}>{studentEmail}</Text>
                          )}
                        </View>
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
                  );
                })}
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
  noteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
    paddingTop: 12,
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
    elevation: 2,
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
    backgroundColor: colors.primary,
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
    flexDirection: "row",
    alignItems: "center",
  },
  memberAvatarContainer: {
    marginRight: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberTextInfo: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
