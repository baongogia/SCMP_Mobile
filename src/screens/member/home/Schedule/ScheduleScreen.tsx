import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { getAllMemberSchedules } from "@/src/services/learning_process/schedules/scheduleServices";
import { ScheduleItem } from "@/src/types/schedule";

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const inFlightRef = React.useRef(false);
  const lastRangeRef = React.useRef<string | null>(null);

  // Generate week dates
  const getWeekDates = useCallback((date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  }, []);

  const weekDates = useMemo(
    () => getWeekDates(currentWeek),
    [currentWeek, getWeekDates]
  );

  // Load schedules for a given base date's week
  const loadSchedulesForWeek = useCallback(
    async (baseDate: Date) => {
      try {
        if (inFlightRef.current) return; // prevent concurrent fetches
        setLoading(true);
        const currentWeekDates = getWeekDates(baseDate);
        const startDate = currentWeekDates[0].toISOString().split("T")[0];
        const endDate = currentWeekDates[6].toISOString().split("T")[0];

        // skip if already fetched this range
        const rangeKey = `${startDate}_${endDate}`;
        if (lastRangeRef.current === rangeKey) {
          setLoading(false);
          return;
        }
        lastRangeRef.current = rangeKey;

        // cancel previous request if any
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        let attempt = 0;
        let response: any;
        const maxRetries = 2;
        const baseDelayMs = 400;

        // simple retry with backoff on 429
        inFlightRef.current = true;
        while (true) {
          try {
            response = await getAllMemberSchedules(
              startDate,
              endDate,
              controller.signal
            );
            break;
          } catch (err: any) {
            const status = err?.response?.status;
            if (status === 429 && attempt < maxRetries) {
              const wait = baseDelayMs * Math.pow(2, attempt);
              await new Promise((r) => setTimeout(r, wait));
              attempt += 1;
              continue;
            }
            throw err;
          }
        }
        if (response.data && response.data.data) {
          setSchedules(response.data.data);
        }
      } catch (error) {
        console.error("Error loading schedules:", error);
      } finally {
        setLoading(false);
        inFlightRef.current = false;
      }
    },
    [getWeekDates]
  );

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedulesForWeek(currentWeek);
    setRefreshing(false);
  };

  // initial load only
  useEffect(() => {
    loadSchedulesForWeek(currentWeek);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cleanup: abort pending request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Navigate week
  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(newWeek);
    loadSchedulesForWeek(newWeek);
  };

  // Format time
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  // Create a YYYY-MM-DD key in LOCAL time for consistent comparisons
  const toLocalDateKey = (input: Date | string) => {
    const d = typeof input === "string" ? new Date(input) : input;
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Get schedules for specific date
  const getSchedulesForDate = (date: Date) => {
    const dateKey = toLocalDateKey(date);
    return schedules.filter(
      (schedule) => toLocalDateKey(schedule.date) === dateKey
    );
  };

  const getFullDayName = (date: Date) => {
    const names = [
      "Chủ nhật",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
    ];
    return names[date.getDay()];
  };

  // Render one day section with its schedules
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
              <Text style={styles.dayTitle}>{getFullDayName(date)}</Text>
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
            <View
              key={it._id}
              style={[styles.sessionRow, idx > 0 && styles.sessionRowDivider]}
            >
              <View style={styles.timePill}>
                <Text style={styles.timePillText}>
                  {formatTime(it.slot.start_minute)}
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
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText}>Đăng ký</Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  // Render day header
  const renderDayHeader = () => {
    const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

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
                {dayNames[index]}
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

  // (unused) single item renderer removed after switching to week view

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
          <Text style={styles.headerTitle}>Thời khóa biểu</Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Week Navigation */}
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
          <Text style={styles.weekRange}>
            {weekDates[0].getDate()} - {weekDates[6].getDate()}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.navButton}
          disabled={loading}
          onPress={() => navigateWeek("next")}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      {renderDayHeader()}

      {/* Weekly Schedule Content */}
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
  weekInfo: {
    alignItems: "center",
  },
  monthYear: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  weekRange: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    marginTop: 2,
  },
  dayHeaderContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
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
  selectedDayHeader: {
    backgroundColor: colors.primary,
  },
  todayDayHeader: {
    backgroundColor: "rgba(0, 119, 190, 0.1)",
  },
  dayName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    opacity: 0.7,
    marginBottom: 4,
  },
  selectedDayName: {
    color: colors.white,
    opacity: 1,
  },
  todayDayName: {
    color: colors.primary,
    opacity: 1,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  selectedDayNumber: {
    color: colors.white,
  },
  todayDayNumber: {
    color: colors.primary,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    position: "absolute",
    bottom: 4,
  },
  selectedDayDot: {
    backgroundColor: colors.white,
  },
  scheduleContainer: {
    flex: 1,
  },
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
  scheduleList: {
    padding: 16,
    paddingBottom: 100,
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
  dayHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 119, 190, 0.1)",
  },
  dateBubbleToday: {
    backgroundColor: colors.primary,
  },
  dateBubbleDay: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  dateBubbleDayToday: {
    color: colors.white,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  daySubtitle: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
    marginTop: 2,
  },
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
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(0, 119, 190, 0.08)",
  },
  dayBadgeToday: {
    backgroundColor: colors.primary,
  },
  dayBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.2,
  },
  dayBadgeTextToday: {
    color: colors.white,
  },
  daySectionDate: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.65,
    fontWeight: "600",
  },
  dayEmptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dayEmptyText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
  },
  compactEmptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  compactEmptyText: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.6,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
  },
  sessionRowDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  timePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    borderRadius: 8,
    marginRight: 12,
  },
  timePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  sessionContent: {
    flex: 1,
  },
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
  sessionMetaText: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.75,
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
  scheduleCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  timeContainer: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  timeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 2,
  },
  durationText: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
  },
  scheduleContent: {
    padding: 16,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  slotTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  scheduleDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.6,
    textAlign: "center",
    lineHeight: 24,
  },
});
