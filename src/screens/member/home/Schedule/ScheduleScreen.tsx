import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { getAllMemberSchedules } from "@/src/services/learning_process/schedules/scheduleServices";
import SharedCalendarView, {
  CalendarEventItem,
} from "@/src/components/custom/calendar/CalendarView";

// Component để render chi tiết lịch học cho member
const renderMemberScheduleDetail = (event: CalendarEventItem) => {
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

  return (
    <ScrollView
      style={styles.detailContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header với thông tin chính */}
      <View style={styles.detailHeader}>
        <View style={styles.detailHeaderContent}>
          <View style={styles.detailHeaderIcon}>
            <Ionicons name="school" size={24} color={colors.white} />
          </View>
          <View style={styles.detailHeaderText}>
            <Text style={styles.detailHeaderTitle}>
              {event.slot?.title || event.classroom?.name || "Buổi học"}
            </Text>
            <Text style={styles.detailHeaderSubtitle}>
              {formatDate(event.date.toString())}
            </Text>
          </View>
        </View>
        <View style={styles.detailTimeBadge}>
          <Ionicons name="time" size={16} color={colors.primary} />
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
                <Ionicons name="bookmark" size={20} color={colors.primary} />
              </View>
              <Text style={styles.detailCardTitle}>Thông tin buổi học</Text>
            </View>
            <View style={styles.detailCardContent}>
              <View style={styles.detailInfoItem}>
                <Text style={styles.detailInfoLabel}>Tên buổi học</Text>
                <Text style={styles.detailInfoValue}>
                  {event.slot.title || "Không có tên"}
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
                <Ionicons name="school" size={20} color={colors.primary} />
              </View>
              <Text style={styles.detailCardTitle}>Thông tin lớp học</Text>
            </View>
            <View style={styles.detailCardContent}>
              <View style={styles.detailInfoItem}>
                <Text style={styles.detailInfoLabel}>Tên lớp</Text>
                <Text style={styles.detailInfoValue}>
                  {event.classroom.name || "Không có tên"}
                </Text>
              </View>
              {event.classroom.course && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Khóa học</Text>
                  <Text style={styles.detailInfoValue}>
                    {event.classroom.course}
                  </Text>
                </View>
              )}
              {event.classroom.member && event.classroom.member.length > 0 && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Số học viên</Text>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue}>
                      {event.classroom.member.length}
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

        {/* Thông tin bể bơi */}
        {event.pool && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIcon}>
                <Ionicons name="water" size={20} color={colors.primary} />
              </View>
              <Text style={styles.detailCardTitle}>Thông tin bể bơi</Text>
            </View>
            <View style={styles.detailCardContent}>
              <View style={styles.detailInfoItem}>
                <Text style={styles.detailInfoLabel}>Tên bể</Text>
                <Text style={styles.detailInfoValue}>
                  {event.pool.title || "Không có tên"}
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
                  color={colors.primary}
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
                      {event.instructor}
                    </Text>
                    <View style={styles.detailInfoBadge}>
                      <Ionicons
                        name="person"
                        size={12}
                        color={colors.primary}
                      />
                    </View>
                  </View>
                </View>
              )}
              {event.attendees && event.attendees.length > 0 && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Số người tham gia</Text>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue}>
                      {event.attendees.length}
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
};

export function ScheduleScreen() {
  const navigation = useNavigation();
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
        }))
        .slice(0, 5);

      setUpcomingCourses(courses);
    } catch (error) {
      console.error("Error fetching upcoming courses:", error);
    }
  };

  useEffect(() => {
    fetchUpcomingCourses();
  }, []);

  // Component hiển thị khóa học sắp tới
  const renderUpcomingCourse = (item: any, onPress?: () => void) => (
    <TouchableOpacity style={styles.courseCard} onPress={onPress}>
      <View style={styles.courseHeader}>
        <View style={styles.courseIcon}>
          <Ionicons name="book" size={20} color={colors.primary} />
        </View>
        <View style={styles.courseInfo}>
          <Text style={styles.courseName} numberOfLines={1}>
            {item.slot?.title || "Buổi học"}
          </Text>
          <Text style={styles.courseInstructor}>
            {item.pool?.title || "Bể bơi chưa xác định"}
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
          <Ionicons name="time" size={14} color={colors.grayc} />
          <Text style={styles.courseDetailText}>
            {item.slot?.start_time
              ? `${String(item.slot.start_time).padStart(2, "0")}:${String(
                  item.slot.start_minute || 0
                ).padStart(2, "0")}`
              : "Chưa xác định"}
          </Text>
        </View>
        {item.instructor && (
          <View style={styles.courseDetailItem}>
            <Ionicons name="person" size={14} color={colors.grayc} />
            <Text style={styles.courseDetailText}>{item.instructor}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={28} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Lịch học</Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
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
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  // Styles cho component renderDetail hiện đại
  detailContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  detailHeader: {
    backgroundColor: colors.primary,
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  detailHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  detailHeaderText: {
    flex: 1,
  },
  detailHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 4,
  },
  detailHeaderSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  detailTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  detailTimeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: 6,
  },
  detailContent: {
    padding: 16,
    paddingTop: 24,
  },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  detailCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  detailCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  detailCardContent: {
    padding: 16,
  },
  detailInfoItem: {
    marginBottom: 16,
  },
  detailInfoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    opacity: 0.7,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailInfoValue: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
    lineHeight: 20,
  },
  detailInfoValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailInfoBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailInfoBadgeType: {
    backgroundColor: colors.primary,
  },
  detailInfoBadgeMaintenance: {
    backgroundColor: "#FF6B35",
  },
  // Styles cho phần khóa học sắp tới
  scrollContainer: {
    flex: 1,
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
