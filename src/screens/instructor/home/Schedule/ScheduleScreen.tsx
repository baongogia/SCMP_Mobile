import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { colors } from "@/src/constants/colors";
import { getInstructorSchedules } from "@/src/services/learning_process/schedules/scheduleServices";
import CalendarView, {
  CalendarEventItem,
} from "@/src/components/custom/calendar/CalendarView";
import InstructorScheduleDetail from "@/src/components/modal/schedule_detail/InstructorScheduleDetail";
import { showErrorToast } from "@/src/utils/errorHandler";

// Component để render chi tiết lịch dạy cho instructor
const renderInstructorScheduleDetail = (
  event: CalendarEventItem,
  onClose?: () => void,
  disableScroll?: boolean
) => {
  const handleAttendanceUpdate = (memberId: string, isPresent: boolean) => {
    // TODO: Implement attendance update logic
    console.log(
      `Member ${memberId} attendance: ${isPresent ? "present" : "absent"}`
    );
  };

  return (
    <InstructorScheduleDetail
      event={event}
      onAttendanceUpdate={handleAttendanceUpdate}
      onClose={onClose}
      hideHeader={disableScroll === true}
    />
  );
};

export function ScheduleScreen() {
  const [upcomingCourses, setUpcomingCourses] = useState<any[]>([]);

  // Fetch lịch dạy sắp tới từ API lịch
  const fetchUpcomingCourses = async () => {
    try {
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const res = await getInstructorSchedules(
        today.toISOString().split("T")[0],
        nextMonth.toISOString().split("T")[0]
      );
      const items: any[] = res?.data?.data || [];

      // Lấy lịch dạy sắp tới từ dữ liệu lịch
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
        title: "Lỗi tải lịch dạy",
        message: "Không thể tải lịch dạy sắp tới",
      });
    }
  };

  useEffect(() => {
    fetchUpcomingCourses();
  }, []);

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
        <CalendarView
          title="Lịch dạy"
          role="instructor"
          renderDetail={renderInstructorScheduleDetail}
          upcomingCourses={upcomingCourses}
          showUpcomingCourses={true}
          fetchRange={async (start, end) => {
            const res = await getInstructorSchedules(start, end);
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: colors.mainBackground,
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
    position: "relative",
    overflow: "visible",
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
