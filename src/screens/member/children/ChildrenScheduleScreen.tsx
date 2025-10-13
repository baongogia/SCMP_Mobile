import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { getChildrenSchedule } from "@/src/services/information/children/childenServices";
import CustomToast from "@/src/components/custom/CustomToast";
import { ScheduleItem } from "@/src/types/schedule";

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
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(
    null
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Generate week dates
  const getWeekDates = useCallback((date: Date) => {
    const week: Date[] = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday first
    startOfWeek.setDate(diff);
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      week.push(d);
    }
    return week;
  }, []);

  const weekDates = useMemo(
    () => getWeekDates(currentWeek),
    [currentWeek, getWeekDates]
  );

  // Month helpers
  // Helper kept for reference if needed later
  // const getMonthDateRange = useCallback((date: Date) => {
  //   const start = new Date(date.getFullYear(), date.getMonth(), 1);
  //   const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  //   return { start, end };
  // }, []);

  // Build contiguous dates of a month (kept here if needed later)
  // const getMonthDates = useCallback(
  //   (date: Date) => {
  //     const { start, end } = getMonthDateRange(date);
  //     const arr: Date[] = [];
  //     const cursor = new Date(start);
  //     while (cursor <= end) {
  //       arr.push(new Date(cursor));
  //       cursor.setDate(cursor.getDate() + 1);
  //     }
  //     return arr;
  //   },
  //   [getMonthDateRange]
  // );

  // Keep if needed for future features; not used in month grid rendering
  // const monthDates = useMemo(
  //   () => getMonthDates(currentWeek),
  //   [currentWeek, getMonthDates]
  // );

  // Build month grid (with padding to full weeks, Monday-first)
  const monthGrid = useMemo(() => {
    const firstOfMonth = new Date(
      currentWeek.getFullYear(),
      currentWeek.getMonth(),
      1
    );
    const lastOfMonth = new Date(
      currentWeek.getFullYear(),
      currentWeek.getMonth() + 1,
      0
    );
    const leading = (firstOfMonth.getDay() + 6) % 7; // 0..6, Monday=0
    const daysInMonth = lastOfMonth.getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(
        new Date(currentWeek.getFullYear(), currentWeek.getMonth(), d)
      );
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [currentWeek]);

  // Load schedules for current range
  const loadSchedulesForRange = useCallback(async () => {
    try {
      setLoading(true);
      const rangeStart =
        viewMode === "week"
          ? weekDates[0]
          : new Date(currentWeek.getFullYear(), currentWeek.getMonth(), 1);
      const rangeEnd =
        viewMode === "week"
          ? weekDates[6]
          : new Date(currentWeek.getFullYear(), currentWeek.getMonth() + 1, 0);
      const startDate = rangeStart.toISOString().split("T")[0];
      const endDate = rangeEnd.toISOString().split("T")[0];
      const response = await getChildrenSchedule(childId, startDate, endDate);
      if (response?.data?.data) {
        setSchedules(response.data.data);
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
      setToast({ message: "Không thể tải lịch học", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [childId, currentWeek, viewMode, weekDates]);

  useEffect(() => {
    loadSchedulesForRange();
  }, [loadSchedulesForRange]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedulesForRange();
    setRefreshing(false);
  };

  const toLocalDateKey = (input: Date | string) => {
    const d = typeof input === "string" ? new Date(input) : input;
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatTimeHM = (
    hour: number | undefined,
    minute: number | undefined
  ) => {
    const h = (hour ?? 0).toString().padStart(2, "0");
    const m = (minute ?? 0).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const getSchedulesForDate = (date: Date) => {
    const dateKey = toLocalDateKey(date);
    return schedules.filter(
      (schedule) => toLocalDateKey(schedule.date) === dateKey
    );
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(currentWeek);
    if (viewMode === "week") {
      newWeek.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newWeek.setMonth(
        currentWeek.getMonth() + (direction === "next" ? 1 : -1)
      );
    }
    setCurrentWeek(newWeek);
  };

  // removed duplicate effect for currentWeek; already covered by loadSchedulesForRange deps

  // Extract instructor info regardless of API shape
  const getInstructorInfo = (schedule: any) => {
    const i =
      schedule?.instructor ||
      schedule?.instructor_detail ||
      schedule?.instructorInfo ||
      schedule?.instructor_user ||
      schedule?.classroom?.instructor; // might be string id

    if (!i) {
      return { name: "-", email: "-" };
    }
    if (typeof i === "string") {
      return { name: i, email: "-" };
    }
    return {
      name: i?.username || i?.name || i?.full_name || "-",
      email: i?.email || "-",
    };
  };

  const renderDaySection = (date: Date) => {
    const items = getSchedulesForDate(date);
    const isToday = toLocalDateKey(date) === toLocalDateKey(new Date());
    return (
      <View key={toLocalDateKey(date)} style={styles.daySection}>
        <View style={styles.daySectionHeader}>
          <View style={styles.dayHeaderLeft}>
            <View
              style={[styles.dateBubble, isToday && styles.dateBubbleToday]}
            >
              <Text
                style={[
                  styles.dateBubbleDay,
                  isToday && styles.dateBubbleDayToday,
                ]}
              >
                {date.getDate()}
              </Text>
            </View>
            <View>
              <Text style={styles.dayTitle}>
                {date.toLocaleDateString("vi-VN", { weekday: "long" })}
              </Text>
              <Text style={styles.daySubtitle}>
                {date.getMonth() + 1}/{date.getFullYear()}
              </Text>
            </View>
          </View>
          {isToday && (
            <View style={styles.todayChip}>
              <Ionicons name="sunny-outline" size={14} color={colors.white} />
              <Text style={styles.todayChipText}>Hôm nay</Text>
            </View>
          )}
        </View>

        {items.length === 0 ? (
          <View style={styles.compactEmptyRow}>
            <Ionicons name="ellipse-outline" size={14} color={colors.text} />
            <Text style={styles.compactEmptyText}>Không có buổi học</Text>
          </View>
        ) : (
          items.map((it, idx) => (
            <TouchableOpacity
              key={it._id}
              style={[styles.sessionRow, idx > 0 && styles.sessionRowDivider]}
              onPress={() => {
                setSelectedSchedule(it);
                setDetailVisible(true);
              }}
            >
              <View style={styles.timePill}>
                <Text style={styles.timePillText}>
                  {formatTimeHM(it.slot.start_time, it.slot.start_minute)}
                </Text>
              </View>
              <View style={styles.sessionContent}>
                <Text style={styles.sessionTitle} numberOfLines={1}>
                  {it.slot.title}
                </Text>
                <View style={styles.sessionMetaRow}>
                  <Ionicons
                    name="people-outline"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={styles.sessionMetaText} numberOfLines={1}>
                    {it.classroom.name}
                  </Text>
                </View>
                <View style={styles.sessionMetaRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={styles.sessionMetaText} numberOfLines={1}>
                    {it.pool.title}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  const renderDayHeader = () => {
    const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    if (viewMode === "month") {
      return (
        <View>
          <View style={styles.monthNamesRow}>
            {dayNames.map((n) => (
              <Text key={n} style={styles.monthNameItem}>
                {n}
              </Text>
            ))}
          </View>
          <View style={styles.monthGrid}>
            {monthGrid.map((date, idx) => {
              if (!date) {
                return <View key={`pad-${idx}`} style={styles.monthCell} />;
              }
              const isSelected =
                date.toDateString() === selectedDate.toDateString();
              const isToday = date.toDateString() === new Date().toDateString();
              const daySchedules = getSchedulesForDate(date);
              return (
                <TouchableOpacity
                  key={toLocalDateKey(date)}
                  style={styles.monthCell}
                  onPress={() => {
                    setSelectedDate(date);
                    if (daySchedules.length === 1) {
                      setSelectedSchedule(daySchedules[0] as any);
                      setDetailVisible(true);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.monthDayCircle,
                      isSelected && styles.selectedDayHeader,
                      isToday && styles.todayDayHeader,
                    ]}
                  >
                    <Text
                      style={[
                        styles.monthDayText,
                        isSelected && styles.selectedDayName,
                        isToday && styles.todayDayName,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                  {/* Month mode: remove corner dot indicator */}
                  {/* Render compact schedule titles under date */}
                  <View
                    style={{
                      marginTop: 6,
                      width: "100%",
                      paddingHorizontal: 4,
                    }}
                  >
                    {daySchedules.slice(0, 3).map((it) => (
                      <TouchableOpacity
                        key={it._id}
                        style={styles.monthEventPill}
                        onPress={() => {
                          setSelectedSchedule(it as any);
                          setDetailVisible(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.monthEventText} numberOfLines={1}>
                          {`${String(it.slot?.start_time ?? 0).padStart(
                            2,
                            "0"
                          )}:${String(it.slot?.start_minute ?? 0).padStart(
                            2,
                            "0"
                          )}  ${
                            it.slot?.title || it.classroom?.name || "Buổi học"
                          }`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {daySchedules.length > 3 ? (
                      <Text style={styles.moreLabel}>
                        +{daySchedules.length - 3} nữa
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }
    return (
      <View style={styles.dayHeaderContainer}>
        {weekDates.map((date, index) => {
          const isSelected =
            date.toDateString() === selectedDate.toDateString();
          const isToday = date.toDateString() === new Date().toDateString();
          const daySchedules = getSchedulesForDate(date);
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayHeader,
                isSelected && styles.selectedDayHeader,
                isToday && styles.todayDayHeader,
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text
                style={[
                  styles.dayName,
                  isSelected && styles.selectedDayName,
                  isToday && styles.todayDayName,
                ]}
              >
                {dayNames[(date.getDay() + 6) % 7]}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  isSelected && styles.selectedDayNumber,
                  isToday && styles.todayDayNumber,
                ]}
              >
                {date.getDate()}
              </Text>
              {daySchedules.length > 0 && (
                <View
                  style={[styles.dayDot, isSelected && styles.selectedDayDot]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Lịch của {childName}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Navigation & View Toggle */}
      <View style={styles.weekNavigation}>
        <TouchableOpacity
          style={styles.navButton}
          disabled={loading}
          onPress={() => navigateWeek("prev")}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.weekInfo}>
          <Text style={styles.monthYear}>
            Tháng {currentWeek.getMonth() + 1}, {currentWeek.getFullYear()}
          </Text>
          {viewMode === "week" ? (
            <Text style={styles.weekRange}>
              {weekDates[0].getDate()} - {weekDates[6].getDate()}
            </Text>
          ) : (
            <Text style={styles.weekRange}>Toàn bộ tháng</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.navButton}
          disabled={loading}
          onPress={() => navigateWeek("next")}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === "week" && styles.toggleBtnActive,
          ]}
          onPress={() => setViewMode("week")}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === "week" && styles.toggleTextActive,
            ]}
          >
            Tuần
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === "month" && styles.toggleBtnActive,
          ]}
          onPress={() => setViewMode("month")}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === "month" && styles.toggleTextActive,
            ]}
          >
            Tháng
          </Text>
        </TouchableOpacity>
      </View>

      {/* Day Headers / Grids */}
      {renderDayHeader()}

      {/* Content: show list only in week mode */}
      {viewMode === "week" ? (
        <View style={styles.scheduleContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Đang tải lịch học...</Text>
            </View>
          ) : (
            <FlatList
              data={weekDates}
              keyExtractor={(d) => toLocalDateKey(d)}
              renderItem={({ item }) => renderDaySection(item)}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              contentContainerStyle={styles.scheduleList}
            />
          )}
        </View>
      ) : null}

      {toast && (
        <CustomToast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết lịch học</Text>
              <TouchableOpacity onPress={() => setDetailVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedSchedule ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <View style={styles.detailHeaderRow}>
                    <View style={styles.timePillLarge}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.timePillLargeText}>
                        {selectedSchedule.slot?.start_time || 0}h
                        {String(
                          selectedSchedule.slot?.start_minute || 0
                        ).padStart(2, "0")}{" "}
                        - {selectedSchedule.slot?.end_time || 0}h
                        {String(
                          selectedSchedule.slot?.end_minute || 0
                        ).padStart(2, "0")}
                      </Text>
                    </View>
                    <View style={styles.statusChip}>
                      <Text style={styles.statusChipText}>Đăng ký</Text>
                    </View>
                  </View>
                  <Text style={styles.itemTitle}>
                    {selectedSchedule.classroom?.name || "Lớp học"}
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.cardHeaderRow}>
                    <Ionicons
                      name="book-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.cardHeaderText}>Khóa học</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tên khóa</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {(selectedSchedule as any)?.classroom?.course?.title ||
                        "-"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Số buổi</Text>
                    <Text style={styles.infoValue}>
                      {(selectedSchedule as any)?.classroom?.course
                        ?.session_number ?? "-"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Thời lượng buổi</Text>
                    <Text style={styles.infoValue}>
                      {selectedSchedule.slot?.duration || "-"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Thời lượng khóa</Text>
                    <Text style={styles.infoValue}>
                      {(selectedSchedule as any)?.classroom?.course
                        ?.session_number_duration || "-"}
                    </Text>
                  </View>
                  {(
                    (selectedSchedule as any)?.classroom?.course?.description ||
                    ""
                  ).length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.infoLabel}>Mô tả</Text>
                      <Text style={{ color: colors.text, marginTop: 4 }}>
                        {
                          (selectedSchedule as any)?.classroom?.course
                            ?.description
                        }
                      </Text>
                    </View>
                  )}
                  {!!(selectedSchedule as any)?.classroom?.course?.detail
                    ?.length && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.infoLabel}>Chi tiết</Text>
                      {(
                        (selectedSchedule as any)?.classroom?.course?.detail ||
                        []
                      ).map((d: any, idx: number) => (
                        <Text
                          key={idx}
                          style={{ color: colors.text, marginTop: 4 }}
                        >
                          • {d?.title || "-"}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.cardHeaderRow}>
                    <Ionicons
                      name="water-outline"
                      size={18}
                      color={colors.primary}
                    />
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
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Kích thước</Text>
                    <Text style={styles.infoValue}>
                      {selectedSchedule.pool?.dimensions || "-"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Độ sâu</Text>
                    <Text style={styles.infoValue}>
                      {selectedSchedule.pool?.depth || "-"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Sức chứa</Text>
                    <Text style={styles.infoValue}>
                      {typeof selectedSchedule.pool?.capacity === "number"
                        ? selectedSchedule.pool?.capacity
                        : selectedSchedule.pool?.capacity || "-"}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.cardHeaderRow}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.cardHeaderText}>Giảng viên</Text>
                  </View>
                  {(() => {
                    const info = getInstructorInfo(selectedSchedule as any);
                    return (
                      <>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Tên</Text>
                          <Text style={styles.infoValue} numberOfLines={1}>
                            {info.name}
                          </Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Email</Text>
                          <Text style={styles.infoValue} numberOfLines={1}>
                            {info.email}
                          </Text>
                        </View>
                      </>
                    );
                  })()}
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  weekNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
  },
  weekInfo: { alignItems: "center" },
  monthYear: { fontSize: 18, fontWeight: "bold", color: colors.text },
  weekRange: { fontSize: 14, color: colors.text, opacity: 0.7, marginTop: 2 },
  dayHeaderContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  monthNamesRow: {
    flexDirection: "row",
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  monthNameItem: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    opacity: 0.7,
    marginBottom: 8,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  monthCell: {
    width: `${100 / 7}%`,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "stretch",
    marginVertical: 4,
    minHeight: 120,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  monthDayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    alignSelf: "flex-start",
  },
  monthDayText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  monthEventPill: {
    backgroundColor: "#eef6fb",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 4,
  },
  monthEventText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "700",
  },
  moreLabel: {
    marginTop: 4,
    fontSize: 10,
    color: colors.grayc,
    fontWeight: "700",
  },
  dayHeader: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginHorizontal: 2,
    position: "relative",
  },
  selectedDayHeader: { backgroundColor: colors.primary },
  todayDayHeader: { backgroundColor: "rgba(0, 119, 190, 0.1)" },
  dayName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    opacity: 0.7,
    marginBottom: 4,
  },
  selectedDayName: { color: colors.white, opacity: 1 },
  todayDayName: { color: colors.primary, opacity: 1 },
  dayNumber: { fontSize: 16, fontWeight: "bold", color: colors.text },
  selectedDayNumber: { color: colors.white },
  todayDayNumber: { color: colors.primary },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    position: "absolute",
    bottom: 4,
  },
  selectedDayDot: { backgroundColor: colors.white },
  scheduleContainer: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  scheduleList: { padding: 16, paddingBottom: 100 },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#eef6fb",
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    color: colors.primary,
    fontWeight: "700",
  },
  toggleTextActive: {
    color: colors.white,
  },
  daySection: {
    marginBottom: 18,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  daySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    backgroundColor: "#fdfefe",
  },
  dayHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  dateBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 119, 190, 0.1)",
  },
  dateBubbleToday: { backgroundColor: colors.primary },
  dateBubbleDay: { fontSize: 16, fontWeight: "800", color: colors.primary },
  dateBubbleDayToday: { color: colors.white },
  dayTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  daySubtitle: { fontSize: 12, color: colors.text, opacity: 0.6, marginTop: 2 },
  todayChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  todayChipText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  compactEmptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  compactEmptyText: { fontSize: 13, color: colors.text, opacity: 0.6 },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
  },
  sessionRowDivider: { borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)" },
  timePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    borderRadius: 8,
    marginRight: 12,
  },
  timePillText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  sessionContent: { flex: 1 },
  sessionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  sessionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  sessionMetaText: { fontSize: 12, color: colors.text, opacity: 0.75 },

  // Modal styles (reuse from popup)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  closeButton: { fontSize: 24, color: "#666" },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
  },
  itemDetail: { fontSize: 14, color: "#666", marginBottom: 4 },
  // Detail modal enhanced styles
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
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#E6F5EC",
    borderRadius: 999,
    marginLeft: 10,
  },
  statusChipText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "700",
    letterSpacing: 0.2,
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
