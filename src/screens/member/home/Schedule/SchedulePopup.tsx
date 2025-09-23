import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { courseService } from "@/src/services";

const { width } = Dimensions.get("window");

export function SchedulePopup() {
  const [monthScheduleData, setMonthScheduleData] = useState<any[]>([]);
  const [selectedDateSchedule, setSelectedDateSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDetail, setShowDetail] = useState(false);

  // Load full month data khi thay đổi tháng
  useEffect(() => {
    fetchMonthSchedule(currentMonth);
  }, [currentMonth]);

  const fetchMonthSchedule = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem("loginToken");
      const tenant = await AsyncStorage.getItem("tenant");
      if (!token || !tenant) throw new Error("Missing token or tenant");

      // Lấy ngày đầu và cuối tháng
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const gte = firstDay.toISOString();
      const lt = lastDay.toISOString();

      const response = await courseService.getMemberSchedule(
        JSON.parse(tenant).value,
        { gte, lt }
      );
      setMonthScheduleData(response?.data || []);
    } catch (err) {
      setError("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // Check ngày có lịch học không
  const hasSchedule = (date: Date) => {
    if (!monthScheduleData || !Array.isArray(monthScheduleData)) {
      return false;
    }
    return monthScheduleData.some((schedule) => {
      const scheduleDate = new Date(schedule.date || schedule.createdAt);
      return scheduleDate.toDateString() === date.toDateString();
    });
  };

  // Lọc lịch cho ngày được chọn
  const getScheduleForDate = (date: Date) => {
    if (!monthScheduleData || !Array.isArray(monthScheduleData)) {
      return [];
    }
    return monthScheduleData.filter((schedule) => {
      const scheduleDate = new Date(schedule.date || schedule.createdAt);
      return scheduleDate.toDateString() === date.toDateString();
    });
  };

  // Tạo dữ liệu calendar
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentMonth]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const schedules = getScheduleForDate(date);
    setSelectedDateSchedule(schedules);
    setShowDetail(true);
  };

  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowButton}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthYear}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.arrowButton}>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day Names */}
      <View style={styles.dayNamesRow}>
        {dayNames.map((day, index) => (
          <Text key={index} style={styles.dayName}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarData.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCell,
              isToday(date) && styles.today,
              isSelected(date) && styles.selected,
              !isCurrentMonth(date) && styles.otherMonth,
            ]}
            onPress={() => handleDateSelect(date)}
          >
            <Text
              style={[
                styles.dayText,
                isToday(date) && styles.todayText,
                isSelected(date) && styles.selectedText,
                !isCurrentMonth(date) && styles.otherMonthText,
              ]}
            >
              {date.getDate()}
            </Text>
            {/* Chấm đỏ cho ngày có lịch học */}
            {hasSchedule(date) && isCurrentMonth(date) && (
              <View style={styles.scheduleDot} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading indicator cho tháng */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007BFF" />
          <Text style={styles.loadingText}>Đang tải lịch tháng...</Text>
        </View>
      )}

      {/* Schedule Detail Modal */}
      <Modal
        visible={showDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Lịch ngày {selectedDate.toLocaleDateString("vi-VN")}
              </Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <ScrollView style={styles.scheduleList}>
              {selectedDateSchedule.length === 0 ? (
                <Text style={styles.empty}>Không có lịch học</Text>
              ) : (
                selectedDateSchedule.map((item, idx) => (
                  <View key={item._id || idx} style={styles.scheduleItem}>
                    <Text style={styles.itemTitle}>
                      {item.classroom?.[0]?.name ||
                        item.classroom?.name ||
                        "Lớp học"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      Khoá: {item.classroom?.course?.title || "-"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      Giảng viên: {item.classroom?.instructor?.username || "-"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      Hồ bơi: {item.pool?.title || "-"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      Slot: {item.slot?.[0]?.title || item.slot?.title || "-"}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  arrowButton: {
    padding: 10,
  },
  arrow: {
    fontSize: 24,
    color: "#007BFF",
  },
  monthYear: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  dayNamesRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  dayName: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: (width - 32) / 7,
    height: (width - 32) / 7,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    position: "relative",
  },
  dayText: {
    fontSize: 16,
    color: "#333",
  },
  today: {
    backgroundColor: "#E3F2FD",
  },
  todayText: {
    fontWeight: "bold",
    color: "#007BFF",
  },
  selected: {
    backgroundColor: "#007BFF",
  },
  selectedText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  otherMonth: {
    opacity: 0.3,
  },
  otherMonthText: {
    color: "#999",
  },
  // Chấm đỏ indicator
  scheduleDot: {
    position: "absolute",
    bottom: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF4444",
  },
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loadingText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 12,
  },
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    fontSize: 24,
    color: "#666",
  },
  scheduleList: {
    maxHeight: 400,
  },
  scheduleItem: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  itemDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  error: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  empty: {
    color: "#888",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
});
