import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { getInstructorSchedules } from "@/src/services/learning_process/schedules/scheduleServices";
import { showErrorToast } from "@/src/utils/errorHandler";
import { SharedHeader } from "@/src/components/custom";
import { ScheduleItem } from "./types";

export function AttendanceEvaluationScreen() {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState<"today" | "yesterday">(
    "today"
  );
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getDateRange = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (selectedDate === "today") {
      return {
        start: today.toISOString().split("T")[0],
        end: today.toISOString().split("T")[0],
        displayDate: today,
      };
    } else {
      return {
        start: yesterday.toISOString().split("T")[0],
        end: yesterday.toISOString().split("T")[0],
        displayDate: yesterday,
      };
    }
  };

  const fetchSchedules = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const { start, end } = getDateRange();
      const res = await getInstructorSchedules(start, end);
      const items: any[] = res?.data?.data || [];

      // Normalize time fields
      const normalized: ScheduleItem[] = items.map((it: any) => {
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
      });

      setSchedules(normalized);
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải lịch dạy",
        message: "Không thể tải danh sách buổi học",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [selectedDate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedules(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (hour: number, minute: number) => {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )}`;
  };

  const getClassName = (classroom: ScheduleItem["classroom"]) => {
    if (typeof classroom.name === "string") return classroom.name;
    if (typeof classroom.name === "object" && classroom.name?.name)
      return classroom.name.name;
    return "Lớp học";
  };

  const getCourseName = (classroom: ScheduleItem["classroom"]) => {
    if (typeof classroom.course === "string") return classroom.course;
    if (typeof classroom.course === "object" && classroom.course) {
      return (
        (classroom.course as any).title ||
        (classroom.course as any).name ||
        "Khóa học"
      );
    }
    return "Khóa học";
  };

  const getPoolName = (pool?: ScheduleItem["pool"]) => {
    if (!pool) return "Chưa có";
    if (typeof pool === "string") return pool;
    if (typeof pool === "object" && pool.name) return pool.name;
    return "Chưa có";
  };

  const getAttendanceStatus = (schedule: ScheduleItem) => {
    const totalMembers = schedule.classroom?.member?.length || 0;
    const attendees = schedule.attendees?.length || 0;
    if (totalMembers === 0) return null;
    return { total: totalMembers, present: attendees };
  };

  const handleSchedulePress = (schedule: ScheduleItem) => {
    (navigation as any).navigate("AttendanceStudentList", {
      scheduleId: schedule._id,
      schedule: schedule,
    });
  };

  const { displayDate } = getDateRange();

  return (
    <View style={styles.container}>
      <SharedHeader
        title="Điểm danh & Đánh giá"
        showBackButton
        onBackPress={() => navigation.goBack()}
        bottomCurveColor="#ffffff"
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Date Selector */}
        <View style={styles.dateSelectorContainer}>
          <View style={styles.dateSelector}>
            <TouchableOpacity
              style={[
                styles.dateButton,
                selectedDate === "yesterday" && styles.dateButtonActive,
              ]}
              onPress={() => setSelectedDate("yesterday")}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={
                  selectedDate === "yesterday" ? colors.white : colors.primary
                }
              />
              <Text
                style={[
                  styles.dateButtonText,
                  selectedDate === "yesterday" && styles.dateButtonTextActive,
                ]}
              >
                Hôm qua
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dateButton,
                selectedDate === "today" && styles.dateButtonActive,
              ]}
              onPress={() => setSelectedDate("today")}
            >
              <Text
                style={[
                  styles.dateButtonText,
                  selectedDate === "today" && styles.dateButtonTextActive,
                ]}
              >
                Hôm nay
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={selectedDate === "today" ? colors.white : colors.primary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.dateDisplay}>
            <Ionicons name="calendar" size={18} color={colors.primary} />
            <Text style={styles.dateDisplayText}>
              {formatDate(displayDate)}
            </Text>
          </View>
        </View>

        {/* Schedules List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              Đang tải danh sách buổi học...
            </Text>
          </View>
        ) : schedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color={colors.gray[400]}
            />
            <Text style={styles.emptyText}>
              Không có buổi học nào trong ngày này
            </Text>
            <Text style={styles.emptySubtext}>
              Vui lòng chọn ngày khác hoặc kiểm tra lại lịch dạy
            </Text>
          </View>
        ) : (
          <View style={styles.schedulesList}>
            {schedules.map((schedule) => {
              const attendance = getAttendanceStatus(schedule);
              const startTime = formatTime(
                schedule.slot.start_time || 0,
                schedule.slot.start_minute || 0
              );
              const endTime =
                schedule.slot.end_time && schedule.slot.end_minute
                  ? formatTime(schedule.slot.end_time, schedule.slot.end_minute)
                  : null;

              return (
                <TouchableOpacity
                  key={schedule._id}
                  style={styles.scheduleCard}
                  onPress={() => handleSchedulePress(schedule)}
                  activeOpacity={0.8}
                >
                  <View style={styles.scheduleCardHeader}>
                    <View style={styles.scheduleCardIcon}>
                      <Ionicons
                        name="school"
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.scheduleCardInfo}>
                      <Text style={styles.scheduleCardTitle}>
                        {getClassName(schedule.classroom)}
                      </Text>
                      <Text style={styles.scheduleCardSubtitle}>
                        {getCourseName(schedule.classroom)}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.gray[400]}
                    />
                  </View>

                  <View style={styles.scheduleCardDetails}>
                    <View style={styles.scheduleDetailItem}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.scheduleDetailText}>
                        {startTime}
                        {endTime ? ` - ${endTime}` : ""}
                      </Text>
                    </View>
                    <View style={styles.scheduleDetailItem}>
                      <Ionicons
                        name="water-outline"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.scheduleDetailText}>
                        {getPoolName(schedule.pool)}
                      </Text>
                    </View>
                    {attendance && (
                      <View style={styles.scheduleDetailItem}>
                        <Ionicons
                          name="people-outline"
                          size={16}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.scheduleDetailText}>
                          {attendance.present}/{attendance.total} học viên
                        </Text>
                        {attendance.present === attendance.total ? (
                          <View style={styles.attendanceBadgeComplete}>
                            <Ionicons
                              name="checkmark-circle"
                              size={14}
                              color={colors.success}
                            />
                          </View>
                        ) : (
                          <View style={styles.attendanceBadgeIncomplete}>
                            <Text style={styles.attendanceBadgeText}>
                              Chưa đủ
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  dateSelectorContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    gap: 8,
  },
  dateButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  dateButtonTextActive: {
    color: colors.white,
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 8,
  },
  dateDisplayText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  schedulesList: {
    padding: 16,
    gap: 12,
  },
  scheduleCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scheduleCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  scheduleCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lightPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  scheduleCardInfo: {
    flex: 1,
  },
  scheduleCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  scheduleCardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scheduleCardDetails: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  scheduleDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scheduleDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  attendanceBadgeComplete: {
    marginLeft: "auto",
  },
  attendanceBadgeIncomplete: {
    backgroundColor: colors.warning + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: "auto",
  },
  attendanceBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.warning,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
});
