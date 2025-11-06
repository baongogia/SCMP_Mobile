import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { getAllMemberSchedules } from "@/src/services/learning_process/schedules/scheduleServices";
import SharedCalendarView, {
  CalendarEventItem,
} from "@/src/components/custom/calendar/CalendarView";
import { showErrorToast } from "@/src/utils/errorHandler";

// Component để render chi tiết lịch học cho member
const renderMemberScheduleDetail = (
  event: CalendarEventItem,
  onClose?: () => void,
  disableScroll?: boolean
) => {
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

  // Helper function để xác định trạng thái điểm danh
  const getAttendanceStatus = (event: CalendarEventItem) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const startTime = event.slot?.start_time || 0;
    const startMinute = event.slot?.start_minute || 0;
    const endTime = event.slot?.end_time || 0;
    const endMinute = event.slot?.end_minute || 0;

    // Tạo Date objects cho start và end time
    const startDateTime = new Date(eventDate);
    startDateTime.setHours(startTime, startMinute, 0, 0);

    const endDateTime = new Date(eventDate);
    endDateTime.setHours(endTime, endMinute, 0, 0);

    // Kiểm tra chưa học (trắng) - chưa đến thời gian học
    if (now < startDateTime) {
      return {
        status: "not_started",
        color: "#FFFFFF",
        icon: "time-outline",
        borderColor: "#E5E7EB",
      };
    }

    // Kiểm tra đang học (vàng) - đang trong thời gian học
    if (now >= startDateTime && now <= endDateTime) {
      return { status: "ongoing", color: "#FFB800", icon: "radio-button-on" };
    }

    // Đã qua thời gian học - kiểm tra trạng thái điểm danh
    // Kiểm tra đã điểm danh (xanh lá) - is_attended === true
    if (event.is_attended === true) {
      return { status: "attended", color: "#10B981", icon: "checkmark-circle" };
    }

    // Chưa điểm danh (đỏ) - is_attended === false hoặc null
    return { status: "not_attended", color: "#EF4444", icon: "close-circle" };
  };

  const content = (
    <>
      {!disableScroll && (
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
                  : "Buổi học"}
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
              {formatTime(
                event.slot?.end_time || 0,
                event.slot?.end_minute || 0
              )}
            </Text>
          </View>
        </View>
      )}

      {/* Thông tin chi tiết */}
      <View style={styles.detailContent}>
        {/* Thông tin slot */}
        {event.slot && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIconWrapper}>
                <View style={styles.detailCardIcon}>
                  <Ionicons name="bookmark" size={20} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.detailCardTitle}>Thông tin buổi học</Text>
            </View>
            <View style={styles.detailCardDivider} />
            <View style={styles.detailCardContent}>
              <View style={styles.detailInfoItem}>
                <View style={styles.detailInfoLabelRow}>
                  <Ionicons
                    name="document-text"
                    size={12}
                    color={colors.grayc}
                  />
                  <Text style={styles.detailInfoLabel}>Tên buổi học</Text>
                </View>
                <Text style={styles.detailInfoValue} numberOfLines={1}>
                  {event.slot.title || "Không có tên"}
                </Text>
              </View>
              {event.slot.duration && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="hourglass" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>Thời lượng</Text>
                  </View>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue}>
                      {event.slot.duration}
                    </Text>
                    <View style={styles.detailInfoBadge}>
                      <Ionicons name="time" size={10} color={colors.primary} />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Thông tin lớp học */}
        {event.classroom && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIconWrapper}>
                <View style={styles.detailCardIcon}>
                  <Ionicons name="school" size={20} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.detailCardTitle}>Thông tin lớp học</Text>
            </View>
            <View style={styles.detailCardDivider} />
            <View style={styles.detailCardContent}>
              <View style={styles.detailInfoItem}>
                <View style={styles.detailInfoLabelRow}>
                  <Ionicons name="library" size={12} color={colors.grayc} />
                  <Text style={styles.detailInfoLabel}>Tên lớp</Text>
                </View>
                <Text style={styles.detailInfoValue} numberOfLines={1}>
                  {event.classroom.name || "Không có tên"}
                </Text>
              </View>
              {event.classroom.course && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="book" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>Khóa học</Text>
                  </View>
                  <Text style={styles.detailInfoValue} numberOfLines={1}>
                    {typeof event.classroom.course === "object"
                      ? (event.classroom.course as any)?.title ||
                        (event.classroom.course as any)?.name ||
                        JSON.stringify(event.classroom.course)
                      : (event.classroom.course as unknown as string)}
                  </Text>
                </View>
              )}
              {event.classroom.member && event.classroom.member.length > 0 && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="people" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>Số học viên</Text>
                  </View>
                  <View style={styles.detailInfoValueContainer}>
                    <View style={styles.detailInfoValueBadge}>
                      <Text style={styles.detailInfoValueNumber}>
                        {event.classroom.member.length}
                      </Text>
                      <Text style={styles.detailInfoValueUnit}>học viên</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Thông tin bể bơi */}
        {event.pool && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIconWrapper}>
                <View style={styles.detailCardIcon}>
                  <Ionicons name="water" size={20} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.detailCardTitle}>Thông tin bể bơi</Text>
            </View>
            <View style={styles.detailCardDivider} />
            <View style={styles.detailCardContent}>
              <View style={styles.detailInfoItem}>
                <View style={styles.detailInfoLabelRow}>
                  <Ionicons name="location" size={12} color={colors.grayc} />
                  <Text style={styles.detailInfoLabel}>Tên bể</Text>
                </View>
                <Text style={styles.detailInfoValue} numberOfLines={1}>
                  {event.pool.title || "Không có tên"}
                </Text>
              </View>
              {event.pool.type && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="layers" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>Loại bể</Text>
                  </View>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue} numberOfLines={1}>
                      {typeof event.pool.type === "object"
                        ? (event.pool.type as any)?.title ||
                          (event.pool.type as any)?.name ||
                          JSON.stringify(event.pool.type)
                        : (event.pool.type as unknown as string)}
                    </Text>
                    <View
                      style={[
                        styles.detailInfoBadge,
                        styles.detailInfoBadgeType,
                      ]}
                    >
                      <Ionicons name="layers" size={10} color={colors.white} />
                    </View>
                  </View>
                </View>
              )}
              {event.pool.dimensions && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="resize" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>Kích thước</Text>
                  </View>
                  <Text style={styles.detailInfoValue} numberOfLines={1}>
                    {event.pool.dimensions}
                  </Text>
                </View>
              )}
              {event.pool.depth && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons
                      name="arrow-down"
                      size={12}
                      color={colors.grayc}
                    />
                    <Text style={styles.detailInfoLabel}>Độ sâu</Text>
                  </View>
                  <Text style={styles.detailInfoValue} numberOfLines={1}>
                    {event.pool.depth}
                  </Text>
                </View>
              )}
              {event.pool.capacity && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="people" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>Sức chứa</Text>
                  </View>
                  <View style={styles.detailInfoValueContainer}>
                    <View style={styles.detailInfoValueBadge}>
                      <Text style={styles.detailInfoValueNumber}>
                        {event.pool.capacity}
                      </Text>
                      <Text style={styles.detailInfoValueUnit}>người</Text>
                    </View>
                  </View>
                </View>
              )}
              {event.pool.maintance_status && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="construct" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>
                      Tình trạng bảo trì
                    </Text>
                  </View>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue} numberOfLines={1}>
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
                        size={10}
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
          event.created_at ||
          event.is_attended !== undefined) && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIconWrapper}>
                <View style={styles.detailCardIcon}>
                  <Ionicons
                    name="information-circle"
                    size={22}
                    color={colors.primary}
                  />
                </View>
              </View>
              <Text style={styles.detailCardTitle}>Thông tin khác</Text>
            </View>
            <View style={styles.detailCardDivider} />
            <View style={styles.detailCardContent}>
              {(() => {
                const attendanceStatus = getAttendanceStatus(event);
                if (attendanceStatus) {
                  let statusText = "";
                  if (attendanceStatus.status === "not_started") {
                    statusText = "Chưa học";
                  } else if (attendanceStatus.status === "ongoing") {
                    statusText = "Đang học";
                  } else if (attendanceStatus.status === "attended") {
                    statusText = "Đã điểm danh";
                  } else {
                    statusText = "Chưa điểm danh";
                  }

                  return (
                    <View style={styles.detailInfoItem}>
                      <View style={styles.detailInfoLabelRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={12}
                          color={colors.grayc}
                        />
                        <Text style={styles.detailInfoLabel}>
                          Trạng thái điểm danh
                        </Text>
                      </View>
                      <View style={styles.detailInfoValueContainer}>
                        <View
                          style={[
                            styles.detailAttendanceBadge,
                            {
                              backgroundColor: attendanceStatus.color,
                              borderWidth:
                                attendanceStatus.status === "not_started"
                                  ? 1.5
                                  : 0,
                              borderColor:
                                attendanceStatus.borderColor || "transparent",
                            },
                          ]}
                        >
                          <Ionicons
                            name={attendanceStatus.icon as any}
                            size={14}
                            color={
                              attendanceStatus.status === "not_started"
                                ? colors.gray[600]
                                : colors.white
                            }
                          />
                          <Text
                            style={[
                              styles.detailAttendanceText,
                              {
                                color:
                                  attendanceStatus.status === "not_started"
                                    ? colors.gray[600]
                                    : colors.white,
                              },
                            ]}
                          >
                            {statusText}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                }
                return null;
              })()}
              {event.instructor && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="person" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>Huấn luyện viên</Text>
                  </View>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue} numberOfLines={1}>
                      {event.instructor}
                    </Text>
                    <View style={styles.detailInfoBadge}>
                      <Ionicons
                        name="person"
                        size={10}
                        color={colors.primary}
                      />
                    </View>
                  </View>
                </View>
              )}
              {event.attendees && event.attendees.length > 0 && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="people" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>
                      Số người tham gia
                    </Text>
                  </View>
                  <View style={styles.detailInfoValueContainer}>
                    <View style={styles.detailInfoValueBadge}>
                      <Text style={styles.detailInfoValueNumber}>
                        {event.attendees.length}
                      </Text>
                      <Text style={styles.detailInfoValueUnit}>người</Text>
                    </View>
                  </View>
                </View>
              )}
              {event.created_at && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color={colors.grayc}
                    />
                    <Text style={styles.detailInfoLabel}>Ngày tạo</Text>
                  </View>
                  <Text style={styles.detailInfoValue} numberOfLines={1}>
                    {new Date(event.created_at).toLocaleDateString("vi-VN")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </>
  );

  if (disableScroll) {
    return <View style={styles.detailContainer}>{content}</View>;
  }

  return (
    <ScrollView
      style={styles.detailContainer}
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
};

export function ScheduleScreen() {
  const [upcomingCourses, setUpcomingCourses] = useState<any[]>([]);

  // Fetch khóa học sắp tới từ API lịch
  const fetchUpcomingCourses = async () => {
    try {
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const res = await getAllMemberSchedules(
        today.toISOString().split("T")[0],
        nextMonth.toISOString().split("T")[0]
      );
      const items: any[] = res?.data?.data || [];

      // Lấy khóa học sắp tới từ dữ liệu lịch
      const courses = items
        .filter((item) => item.classroom?.course)
        .map((item) => ({
          id: item._id,
          name: item.classroom.course,
          instructor: item.instructor || "Huấn luyện viên",
          date: item.date,
          slot: item.slot,
          pool: item.pool, // Include pool data
          classroom: item.classroom, // Include classroom data
        }))
        .slice(0, 5);

      setUpcomingCourses(courses);
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải lịch học",
        message: "Không thể tải lịch học sắp tới",
      });
    }
  };

  useEffect(() => {
    fetchUpcomingCourses();
  }, []);

  // Helper function để xác định trạng thái điểm danh
  const getAttendanceStatus = (event: any) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const startTime = event.slot?.start_time || 0;
    const startMinute = event.slot?.start_minute || 0;
    const endTime = event.slot?.end_time || 0;
    const endMinute = event.slot?.end_minute || 0;

    // Tạo Date objects cho start và end time
    const startDateTime = new Date(eventDate);
    startDateTime.setHours(startTime, startMinute, 0, 0);

    const endDateTime = new Date(eventDate);
    endDateTime.setHours(endTime, endMinute, 0, 0);

    // Kiểm tra chưa học (trắng) - chưa đến thời gian học
    if (now < startDateTime) {
      return {
        status: "not_started",
        color: "#FFFFFF",
        icon: "time-outline",
        borderColor: "#E5E7EB",
      };
    }

    // Kiểm tra đang học (vàng) - đang trong thời gian học
    if (now >= startDateTime && now <= endDateTime) {
      return { status: "ongoing", color: "#FFB800", icon: "radio-button-on" };
    }

    // Đã qua thời gian học - kiểm tra trạng thái điểm danh
    // Kiểm tra đã điểm danh (xanh lá) - is_attended === true
    if (event.is_attended === true) {
      return { status: "attended", color: "#10B981", icon: "checkmark-circle" };
    }

    // Chưa điểm danh (đỏ) - is_attended === false hoặc null
    return { status: "not_attended", color: "#EF4444", icon: "close-circle" };
  };

  // Component hiển thị khóa học sắp tới
  const renderUpcomingCourse = (item: any, onPress?: () => void) => {
    const attendanceStatus = getAttendanceStatus(item);

    return (
      <TouchableOpacity style={styles.courseCard} onPress={onPress}>
        <View style={styles.courseHeader}>
          <View style={styles.courseIcon}>
            <Ionicons name="school" size={20} color={colors.primary} />
          </View>
          <View style={styles.courseInfo}>
            <Text style={styles.courseName} numberOfLines={1}>
              {item.classroom?.name || "Lớp học"}
            </Text>
            <Text style={styles.courseInstructor}>
              {item.classroom?.course?.title || "Khóa học"}
            </Text>
          </View>
          <View style={styles.courseDate}>
            <Text style={styles.courseDateText}>
              {new Date(item.date).toLocaleDateString("vi-VN")}
            </Text>
          </View>
        </View>
        <View style={styles.courseDetails}>
          <View style={styles.courseDetailItem}>
            <Ionicons name="bookmark" size={14} color={colors.grayc} />
            <Text style={styles.courseDetailText}>
              {item.slot?.title || "Slot"}
            </Text>
          </View>
          <View style={styles.courseDetailItem}>
            <Ionicons name="time" size={14} color={colors.grayc} />
            <Text style={styles.courseDetailText}>
              {item.slot?.start_time
                ? `${String(item.slot.start_time).padStart(2, "0")}:${String(
                    item.slot.start_minute || 0
                  ).padStart(2, "0")}`
                : "Chưa xác định"}
            </Text>
          </View>
          <View style={styles.courseDetailItem}>
            <Ionicons name="water" size={14} color={colors.grayc} />
            <Text style={styles.courseDetailText}>
              {item.pool?.title || "Chưa xác định"}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.attendanceBadge,
            {
              backgroundColor: attendanceStatus.color,
              borderWidth: attendanceStatus.status === "not_started" ? 1.5 : 0,
              borderColor: attendanceStatus.borderColor || "transparent",
            },
          ]}
        >
          <Ionicons
            name={attendanceStatus.icon as any}
            size={18}
            color={
              attendanceStatus.status === "not_started"
                ? colors.gray[600]
                : colors.white
            }
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: colors.mainBackground,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar */}
        <SharedCalendarView
          title="Lịch học"
          role="member"
          renderDetail={renderMemberScheduleDetail}
          upcomingCourses={upcomingCourses}
          renderUpcomingCourse={renderUpcomingCourse}
          showUpcomingCourses={true}
          fetchRange={async (start, end) => {
            try {
              const res = await getAllMemberSchedules(start, end);
              const items: any[] = res?.data?.data || [];

              // normalize time fields for CalendarView
              const normalized: CalendarEventItem[] = items.map((it: any) => {
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
                return {
                  ...it,
                  date: it.date,
                  slot: {
                    ...it.slot,
                    start_time,
                    start_minute,
                  },
                } as CalendarEventItem;
              });
              return normalized;
            } catch (error) {
              return [];
            }
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  menuButton: {
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 0.5,
  },
  backButton: {
    padding: 4,
  },
  detailContainer: {
    flex: 1,
  },
  detailHeader: {
    backgroundColor: colors.primary,
    padding: 16,
    paddingBottom: 18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  detailHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  detailTimeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  detailHeaderText: {
    flex: 1,
  },
  noteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  detailHeaderSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "500",
  },
  detailHeaderDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 0,
  },
  detailCloseButton: {
    alignSelf: "center",
    height: 20,
    marginRight: 32,
  },
  detailTimeBadgeIcon: {
    marginRight: 6,
  },
  detailHeaderRightBtn: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  detailContent: {
    padding: 16,
    paddingTop: 18,
  },
  detailCard: {
    backgroundColor: colors.mainBackground,
    marginBottom: 16,
  },
  detailCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
  },
  detailCardDivider: {
    height: 2,
    backgroundColor: colors.primary,
    marginBottom: 12,
    borderRadius: 1,
  },
  detailCardIconWrapper: {
    marginRight: 12,
  },
  detailCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 62, 159, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  detailCardContent: {
    paddingTop: 4,
  },
  detailInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailInfoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginRight: 12,
  },
  detailInfoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.gray[600],
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  detailInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 18,
    letterSpacing: -0.1,
    flexShrink: 1,
    textAlign: "right",
  },
  detailInfoValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  detailInfoValueBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    backgroundColor: "rgba(0, 62, 159, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 62, 159, 0.12)",
  },
  detailInfoValueNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: -0.2,
  },
  detailInfoValueUnit: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.gray[600],
  },
  detailInfoBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 62, 159, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 62, 159, 0.2)",
  },
  detailInfoBadgeType: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  detailInfoBadgeMaintenance: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF4500",
  },
  detailAttendanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  detailAttendanceText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.2,
  },
  // Styles cho phần khóa học sắp tới
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  upcomingCoursesSection: {
    backgroundColor: colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    borderRadius: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  courseCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  attendanceBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  courseInstructor: {
    fontSize: 14,
    color: colors.grayc,
  },
  courseDate: {
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  courseDateText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  courseDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  courseDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  courseDetailText: {
    fontSize: 12,
    color: colors.grayc,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: colors.grayc,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.grayc,
    marginTop: 12,
    textAlign: "center",
  },
});
