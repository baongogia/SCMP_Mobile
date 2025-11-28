import React, { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { colors } from "@/src/constants/colors";
import { getAllMemberSchedules } from "@/src/services/learning_process/schedules/scheduleServices";
import { showErrorToast } from "@/src/utils/errorHandler";
import { styles } from "./style";
import { MemberScheduleDetail } from "@/src/components/modal/schedule_detail/MemberScheduleDetail";
import CalendarView, {
  CalendarEventItem,
} from "@/src/components/custom/calendar/CalendarView";
import EventCard from "@/src/components/custom/card/schedule_card/EventCard";

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
        .map((item) => {
          // Chuẩn hóa giờ/phút giống logic ở fetchRange để CalendarView tính đúng trạng thái
          const startMinRaw = item?.slot?.start_minute;
          let start_time = item?.slot?.start_time;
          let start_minute = item?.slot?.start_minute;
          if (
            typeof startMinRaw === "number" &&
            startMinRaw > 59 &&
            (start_time == null || start_time === 0)
          ) {
            start_time = Math.floor(startMinRaw / 60);
            start_minute = startMinRaw % 60;
          }

          const endMinRaw = item?.slot?.end_minute;
          let end_time = item?.slot?.end_time;
          let end_minute = item?.slot?.end_minute;
          if (
            typeof endMinRaw === "number" &&
            endMinRaw > 59 &&
            (end_time == null || end_time === 0)
          ) {
            end_time = Math.floor(endMinRaw / 60);
            end_minute = endMinRaw % 60;
          }

          return {
            id: item._id,
            name: item.classroom.course,
            instructor: item.instructor || "Huấn luyện viên",
            date: item.date,
            slot: {
              ...item.slot,
              start_time,
              start_minute,
              end_time,
              end_minute,
            },
            pool: item.pool,
            classroom: item.classroom,
            // giữ lại toàn bộ để khi mở chi tiết còn đủ dữ liệu
            ...item,
          };
        })
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

    // Kiểm tra chưa học (icon trắng trên nền xám) - chưa đến thời gian học
    if (now < startDateTime) {
      return {
        status: "not_started",
        color: colors.white,
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
    return (
      <EventCard
        item={item as CalendarEventItem}
        role="member"
        onPress={onPress}
        getAttendanceStatus={getAttendanceStatus}
        finalEventText={item.classroom?.name || "Lớp học"}
      />
    );
  };
  // Fetch range for CalendarView
  const fetchRange = async (start: string, end: string) => {
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
    } catch {
      return [];
    }
  };
  // Render detail for CalendarView
  const renderDetail = (
    event: CalendarEventItem,
    onClose?: () => void,
    disableScroll?: boolean
  ) => {
    return <MemberScheduleDetail event={event} disableScroll={disableScroll} />;
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
        <CalendarView
          title="Lịch học"
          role="member"
          renderDetail={renderDetail}
          upcomingCourses={upcomingCourses}
          renderUpcomingCourse={renderUpcomingCourse}
          showUpcomingCourses={true}
          fetchRange={fetchRange}
        />
      </ScrollView>
    </View>
  );
}
