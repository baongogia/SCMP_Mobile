import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SharedHeader } from "@/src/components/custom";
import { colors } from "@/src/constants/colors";
import { getAllMemberSchedules } from "@/src/services/learning_process/schedules/scheduleServices";
import { showErrorToast } from "@/src/utils/errorHandler";
import { CalendarEventItem } from "@/src/components/custom/calendar/CalendarView";
import { MemberScheduleDetail } from "@/src/components/modal/schedule_detail/MemberScheduleDetail";
import EventCard from "@/src/components/custom/card/schedule_card/EventCard";
import { styles } from "./style";

export default function AttendanceReportScreen() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [schedules, setSchedules] = useState<CalendarEventItem[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(
    null
  );
  const modalTranslateY = React.useRef(new Animated.Value(0)).current;
  const isClosingRef = React.useRef(false);

  // Helper function để xác định trạng thái điểm danh (reused from ScheduleScreen)
  const getAttendanceStatus = useCallback((event: CalendarEventItem) => {
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
  }, []);

  // Fetch attendance data for selected month
  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth();

      // Get first and last day of the month
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const res = await getAllMemberSchedules(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );
      const items: any[] = res?.data?.data || [];

      // Normalize time fields for CalendarView
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
        } as CalendarEventItem;
      });

      setSchedules(normalized);
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải báo cáo",
        message: "Không thể tải dữ liệu điểm danh",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = schedules.length;
    let attended = 0;
    let notAttended = 0;
    let ongoing = 0;
    let notStarted = 0;

    schedules.forEach((event) => {
      const status = getAttendanceStatus(event);
      if (status.status === "attended") attended++;
      else if (status.status === "not_attended") notAttended++;
      else if (status.status === "ongoing") ongoing++;
      else if (status.status === "not_started") notStarted++;
    });

    return { total, attended, notAttended, ongoing, notStarted };
  }, [schedules, getAttendanceStatus]);

  // Group schedules by date
  const groupedSchedules = useMemo(() => {
    const grouped: { [key: string]: CalendarEventItem[] } = {};
    schedules.forEach((schedule) => {
      const scheduleDate = new Date(schedule.date);
      const dateKey = scheduleDate.toISOString().split("T")[0]; // Use ISO format for grouping
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(schedule);
    });

    // Sort each group by start time
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => {
        const timeA =
          (a.slot?.start_time || 0) * 60 + (a.slot?.start_minute || 0);
        const timeB =
          (b.slot?.start_time || 0) * 60 + (b.slot?.start_minute || 0);
        return timeA - timeB;
      });
    });

    // Sort dates
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    return sortedKeys.map((key) => {
      const dateObj = new Date(key);
      return {
        date: dateObj.toLocaleDateString("vi-VN"),
        dateObj,
        schedules: grouped[key],
      };
    });
  }, [schedules]);

  // Month navigation
  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(selectedMonth);
    if (direction === "next") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedMonth(newDate);
  };

  // Format month/year display
  const monthYearText = useMemo(() => {
    return selectedMonth.toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });
  }, [selectedMonth]);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendanceData();
    setRefreshing(false);
  };

  // Modal animations
  useEffect(() => {
    if (detailVisible && selectedEvent && !isClosingRef.current) {
      isClosingRef.current = false;
      modalTranslateY.setValue(600);
      Animated.spring(modalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 110,
        friction: 16,
      }).start();
    } else if (!detailVisible) {
      // Reset animation when modal closes
      modalTranslateY.setValue(600);
    }
  }, [detailVisible, selectedEvent, modalTranslateY]);

  const closeModalAnimated = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.timing(modalTranslateY, {
      toValue: 800,
      duration: 250,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setDetailVisible(false);
      setSelectedEvent(null);
      isClosingRef.current = false;
    });
  }, [modalTranslateY]);

  const handleEventPress = useCallback((schedule: CalendarEventItem) => {
    setSelectedEvent(schedule);
    setDetailVisible(true);
  }, []);

  // Render statistics card
  const renderStatCard = (
    title: string,
    value: number,
    icon: string,
    color: string,
    bgColor: string
  ) => (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color={colors.white} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <SharedHeader title="Báo cáo điểm danh" />
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={styles.monthNavButton}
            onPress={() => navigateMonth("prev")}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.monthDisplay}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={styles.monthText}>{monthYearText}</Text>
          </View>
          <TouchableOpacity
            style={styles.monthNavButton}
            onPress={() => navigateMonth("next")}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            {renderStatCard(
              "Tổng buổi học",
              statistics.total,
              "school",
              colors.primary,
              "rgba(0, 62, 159, 0.1)"
            )}
            {renderStatCard(
              "Đã điểm danh",
              statistics.attended,
              "checkmark-circle",
              colors.success,
              "rgba(16, 185, 129, 0.1)"
            )}
          </View>
          <View style={styles.statsRow}>
            {renderStatCard(
              "Vắng mặt",
              statistics.notAttended,
              "close-circle",
              colors.error,
              "rgba(239, 68, 68, 0.1)"
            )}
            {renderStatCard(
              "Đang học",
              statistics.ongoing,
              "radio-button-on",
              "#FFB800",
              "rgba(255, 184, 0, 0.1)"
            )}
          </View>
          {statistics.notStarted > 0 && (
            <View style={styles.statsRow}>
              {renderStatCard(
                "Chưa bắt đầu",
                statistics.notStarted,
                "time-outline",
                colors.gray[600],
                "rgba(107, 114, 128, 0.1)"
              )}
            </View>
          )}
        </View>

        {/* Sessions List */}
        {loading && schedules.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : groupedSchedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color={colors.gray[400]}
            />
            <Text style={styles.emptyText}>
              Không có buổi học trong tháng này
            </Text>
          </View>
        ) : (
          <View style={styles.sessionsContainer}>
            {groupedSchedules.map((group, groupIndex) => (
              <View key={groupIndex} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <View style={styles.dateHeaderLeft}>
                    <View style={styles.dateBubble}>
                      <Text style={styles.dateBubbleDay}>
                        {group.dateObj.getDate()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.dateTitle}>
                        {group.dateObj.toLocaleDateString("vi-VN", {
                          weekday: "long",
                        })}
                      </Text>
                      <Text style={styles.dateSubtitle}>{group.date}</Text>
                    </View>
                  </View>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeText}>
                      {group.schedules.length} buổi
                    </Text>
                  </View>
                </View>
                {group.schedules.map((schedule) => (
                  <EventCard
                    key={schedule._id}
                    item={schedule}
                    role="member"
                    getAttendanceStatus={getAttendanceStatus}
                    finalEventText="Buổi học"
                    onPress={() => handleEventPress(schedule)}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={detailVisible && selectedEvent !== null}
        animationType="none"
        transparent
        onRequestClose={closeModalAnimated}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeModalAnimated}
          />
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: modalTranslateY }],
              },
            ]}
            pointerEvents="box-none"
          >
            {selectedEvent && (
              <View style={{ flex: 1 }} pointerEvents="auto">
                <ScrollView
                  showsVerticalScrollIndicator={true}
                  bounces={true}
                  scrollEnabled={true}
                  nestedScrollEnabled={true}
                  contentContainerStyle={{
                    paddingBottom: 40,
                    flexGrow: 1,
                  }}
                  style={{ flex: 1 }}
                >
                  <TouchableOpacity
                    style={styles.modalSwipeHandle}
                    activeOpacity={0.8}
                    onPress={closeModalAnimated}
                  >
                    <View style={styles.modalSwipeHandleBar} />
                  </TouchableOpacity>
                  <MemberScheduleDetail
                    event={selectedEvent}
                    disableScroll={false}
                  />
                </ScrollView>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
