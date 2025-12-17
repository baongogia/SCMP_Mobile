import React, { useState, useEffect, useMemo, useCallback } from "react";
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

const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function AttendanceEvaluationScreen() {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeekAnchor, setCurrentWeekAnchor] = useState(new Date());
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const weekDates = useMemo(() => {
    const startOfWeek = new Date(currentWeekAnchor);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + idx);
      return d;
    });
  }, [currentWeekAnchor]);

  useEffect(() => {
    if (weekDates.length === 0) return;
    const isSelectedInWeek = weekDates.some(
      (date) => date.toDateString() === selectedDate.toDateString()
    );
    if (!isSelectedInWeek) {
      setSelectedDate(weekDates[0]);
    }
  }, [weekDates, selectedDate]);

  const fetchSchedules = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) setLoading(true);
        const dateKey = selectedDate.toISOString().split("T")[0];
        const res = await getInstructorSchedules(dateKey, dateKey);
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
    },
    [selectedDate]
  );

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

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

  const displayDate = selectedDate;
  const weekRangeLabel = useMemo(() => {
    if (weekDates.length === 0) return "";
    const start = weekDates[0];
    const end = weekDates[6];

    const formatDateCustom = (d: Date) => {
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        return `${day}/${month}`;
    };

    return `${formatDateCustom(start)} - ${formatDateCustom(end)}`;
  }, [weekDates]);

  const changeWeek = (direction: "prev" | "next") => {
    setCurrentWeekAnchor((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + (direction === "next" ? 7 : -7));
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <SharedHeader
        title="Điểm danh & Đánh giá"
        showBackButton
        onBackPress={() => navigation.goBack()}
        // bottomCurveColor="#ffffff"
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
          <View style={styles.weekNavRow}>
            <TouchableOpacity
              style={styles.weekNavButton}
              onPress={() => changeWeek("prev")}
            >
              <Ionicons name="chevron-back" size={18} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.weekInfo}>
              <Text style={styles.weekInfoLabel}>Tuần</Text>
              <Text style={styles.weekRangeText}>{weekRangeLabel}</Text>
            </View>
            <TouchableOpacity
              style={styles.weekNavButton}
              onPress={() => changeWeek("next")}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.weekDaysRow}>
            {weekDates.map((date, idx) => {
              const isSelected =
                date.toDateString() === selectedDate.toDateString();
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={styles.weekDayItem}
                  onPress={() => setSelectedDate(date)}
                >
                  <View
                    style={[
                      styles.weekDayPill,
                      isSelected && styles.weekDayPillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.weekDayLabel,
                        isSelected && styles.weekDayLabelSelected,
                      ]}
                    >
                      {dayNames[idx]}
                    </Text>
                    <Text
                      style={[
                        styles.weekDayNumber,
                        isSelected && styles.weekDayNumberSelected,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
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

                  <View style={styles.infoPillsRow}>
                    <View style={[styles.infoPill, styles.timePill]}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={colors.white}
                      />
                      <Text style={[styles.infoPillText, styles.timePillText]}>
                        {endTime ? `${startTime} • ${endTime}` : startTime}
                      </Text>
                    </View>
                    <Text style={styles.dotSeparator}>•</Text>
                    <View style={[styles.infoPill, styles.poolPill]}>
                      <Ionicons
                        name="water-outline"
                        size={14}
                        color={colors.white}
                      />
                      <Text style={[styles.infoPillText, styles.poolPillText]}>
                        {getPoolName(schedule.pool)}
                      </Text>
                    </View>
                    {attendance && (
                      <>
                        <Text style={styles.dotSeparator}>•</Text>
                        <View
                          style={[
                            styles.infoPill,
                            styles.attendancePill,
                            attendance.present === attendance.total
                              ? styles.attendancePillComplete
                              : styles.attendancePillPending,
                          ]}
                        >
                          <Ionicons
                            name={
                              attendance.present === attendance.total
                                ? "checkmark-done"
                                : "people-outline"
                            }
                            size={14}
                            color={
                              attendance.present === attendance.total
                                ? colors.success
                                : colors.warning
                            }
                          />
                          <Text
                            style={[
                              styles.infoPillText,
                              styles.attendancePillText,
                              attendance.present === attendance.total &&
                                styles.attendancePillTextComplete,
                            ]}
                          >
                            {attendance.present}/{attendance.total} HV
                          </Text>
                        </View>
                      </>
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
    backgroundColor: colors.mainBackground,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  weekNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  weekNavButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  weekInfo: {
    alignItems: "center",
  },
  weekInfoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  weekRangeText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  weekDaysRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  weekDayItem: {
    flex: 1,
    alignItems: "center",
  },
  weekDayPill: {
    width: 44,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.lightPrimary + "20",
  },
  weekDayPillSelected: {
    backgroundColor: colors.primary,
    shadowColor: colors.black,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  weekDayLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  weekDayLabelSelected: {
    color: colors.white,
  },
  weekDayNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  weekDayNumberSelected: {
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
  infoPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  timePill: {
    backgroundColor: colors.primary,
  },
  poolPill: {
    backgroundColor: colors.primary,
  },
  infoPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  timePillText: {
    color: colors.white,
  },
  poolPillText: {
    color: colors.white,
  },
  dotSeparator: {
    color: colors.textSecondary,
    fontSize: 18,
    marginTop: -4,
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  attendancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  attendancePillComplete: {
    borderColor: colors.success,
    backgroundColor: colors.success + "15",
  },
  attendancePillPending: {
    borderColor: colors.warning,
    backgroundColor: colors.warning + "18",
  },
  attendancePillText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.warning,
  },
  attendancePillTextComplete: {
    color: colors.success,
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
