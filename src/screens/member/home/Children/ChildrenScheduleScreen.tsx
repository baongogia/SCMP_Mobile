import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { getChildrenSchedule } from "@/src/services/information/children/childenServices";
import CustomToast from "@/src/components/custom/toast/CustomToast";
import { ScheduleItem } from "@/src/types/schedule";
import SharedCalendarView, {
  CalendarEventItem,
} from "@/src/components/custom/calendar/CalendarView";
import { showErrorToast } from "@/src/utils/errorHandler";
import { SharedHeader } from "@/src/components/custom/header/SharedHeader";

interface ChildrenScheduleScreenProps {
  route: {
    params: {
      childId: string;
      childName: string;
    };
  };
  navigation: any;
}

export default function ChildrenScheduleScreen({
  route,
  navigation,
}: ChildrenScheduleScreenProps) {
  const { childId, childName } = route.params;
  const [upcomingCourses, setUpcomingCourses] = useState<any[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Adapter to fetch data for SharedCalendarView
  const fetchRange = useCallback(
    async (start: string, end: string): Promise<CalendarEventItem[]> => {
      try {
        const response = await getChildrenSchedule(childId, start, end);
        const items: ScheduleItem[] = response?.data?.data || [];
        return items.map((it: any) => {
          // Normalize minutes->hour/minute when necessary
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
          } as unknown as CalendarEventItem;
        });
      } catch (error) {
        showErrorToast(error, {
          title: "Lỗi tải lịch học",
          message: "Không thể tải lịch học của trẻ",
        });
        setToast({ message: "Không thể tải lịch học", type: "error" });
        return [];
      }
    },
    [childId]
  );

  // Custom detail content rendered inside SharedCalendarView modal
  const renderDetail = (event: CalendarEventItem, onClose?: () => void) => {
    const selectedSchedule = event as unknown as ScheduleItem;
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.detailSection}>
          <View style={styles.detailHeaderRow}>
            <View style={styles.timePillLarge}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.timePillLargeText}>
                {(selectedSchedule.slot?.start_time || 0) as any}h
                {String(selectedSchedule.slot?.start_minute || 0).padStart(
                  2,
                  "0"
                )}{" "}
                -{(selectedSchedule.slot?.end_time || 0) as any}h
                {String(selectedSchedule.slot?.end_minute || 0).padStart(
                  2,
                  "0"
                )}
              </Text>
            </View>
          </View>
          <Text style={styles.itemTitle}>
            {selectedSchedule.classroom?.name || "Lớp học"}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="book-outline" size={18} color={colors.primary} />
            <Text style={styles.cardHeaderText}>Khóa học</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tên khóa</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {(selectedSchedule as any)?.classroom?.course?.title || "-"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số buổi</Text>
            <Text style={styles.infoValue}>
              {(selectedSchedule as any)?.classroom?.course?.session_number ??
                "-"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thời lượng buổi</Text>
            <Text style={styles.infoValue}>
              {selectedSchedule.slot?.duration || "-"}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="water-outline" size={18} color={colors.primary} />
            <Text style={styles.cardHeaderText}>Hồ bơi</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tên</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {selectedSchedule.pool?.title || "-"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Loại</Text>
            <Text style={styles.infoValue}>
              {selectedSchedule.pool?.type || "-"}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Fetch upcoming courses for the child (next month range)
  const fetchUpcomingCourses = useCallback(async () => {
    try {
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const res = await getChildrenSchedule(
        childId,
        today.toISOString().split("T")[0],
        nextMonth.toISOString().split("T")[0]
      );
      const items: any[] = res?.data?.data || [];
      const courses = items
        .filter((it) => it?.slot)
        .map((it) => ({
          id: it._id,
          date: it.date,
          slot: it.slot,
          pool: it.pool,
          classroom: it.classroom,
          instructor: it.instructor,
        }))
        .slice(0, 5);
      setUpcomingCourses(courses);
    } catch {
      // silent fail
    }
  }, [childId]);

  useEffect(() => {
    fetchUpcomingCourses();
  }, [fetchUpcomingCourses]);

  // Compact upcoming course item
  const renderUpcomingCourse = (item: any, onPress?: () => void) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "#f8f9fa",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
        flexDirection: "column",
      }}
      activeOpacity={0.85}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(0,119,190,0.1)",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="book" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontWeight: "700", fontSize: 16, color: colors.text }}
            numberOfLines={1}
          >
            {item.slot?.title || "Buổi học"}
          </Text>
          <Text style={{ color: colors.text, opacity: 0.7 }} numberOfLines={1}>
            {item.pool?.title || "Bể bơi chưa xác định"}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "rgba(0,119,190,0.1)",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: "700" }}>
            {new Date(item.date).toLocaleDateString("vi-VN")}
          </Text>
        </View>
      </View>
      <View
        style={{ flexDirection: "row", marginTop: 10, alignItems: "center" }}
      >
        <Ionicons name="time" size={14} color={colors.grayc} />
        <Text style={{ marginLeft: 6, color: colors.text, opacity: 0.8 }}>
          {item.slot?.start_time
            ? `${String(item.slot.start_time).padStart(2, "0")}:${String(
                item.slot.start_minute || 0
              ).padStart(2, "0")}`
            : "Chưa xác định"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <SharedHeader
        title={`Lịch của ${childName}`}
        bottomCurveColor={colors.white}
      />

      {/* Calendar */}
      <SharedCalendarView
        title={`Lịch của ${childName}`}
        role="member"
        fetchRange={fetchRange}
        renderDetail={renderDetail}
        emptyText="Không có buổi học"
        upcomingCourses={upcomingCourses}
        renderUpcomingCourse={renderUpcomingCourse}
      />

      {toast && (
        <CustomToast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
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
  // Detail styles (reused inside modal of SharedCalendarView)
  detailSection: {
    marginBottom: 12,
  },
  detailHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  timePillLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    borderRadius: 10,
  },
  timePillLargeText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
});
