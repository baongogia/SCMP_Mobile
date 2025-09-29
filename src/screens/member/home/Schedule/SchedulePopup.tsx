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
import { getAllMemberSchedules } from "@/src/services/learning_process/schedules/scheduleServices";
import { ScheduleItem } from "@/src/types/schedule";

const { width } = Dimensions.get("window");

type ViewMode = "calendar" | "list" | "combined";

export function SchedulePopup() {
  const [monthScheduleData, setMonthScheduleData] = useState<ScheduleItem[]>(
    []
  );
  const [selectedDateSchedule, setSelectedDateSchedule] = useState<
    ScheduleItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDetail, setShowDetail] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("combined");

  // Load full month data khi thay đổi tháng
  useEffect(() => {
    fetchMonthSchedule(currentMonth);
  }, [currentMonth]);

  // Update selected date schedule when month data changes
  useEffect(() => {
    if (monthScheduleData.length > 0) {
      const schedules = getScheduleForDate(selectedDate);
      setSelectedDateSchedule(schedules);
    }
  }, [monthScheduleData, selectedDate]);

  const fetchMonthSchedule = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);

      // Lấy ngày đầu và cuối tháng với định dạng 2023-10-01T00:00:00
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Format theo yêu cầu: 2023-10-01T00:00:00
      const startDate = `${firstDay.getFullYear()}-${String(
        firstDay.getMonth() + 1
      ).padStart(2, "0")}-${String(firstDay.getDate()).padStart(
        2,
        "0"
      )}T00:00:00`;
      const endDate = `${lastDay.getFullYear()}-${String(
        lastDay.getMonth() + 1
      ).padStart(2, "0")}-${String(lastDay.getDate()).padStart(
        2,
        "0"
      )}T23:59:59`;

      const response = await getAllMemberSchedules(startDate, endDate);
      setMonthScheduleData(response?.data?.data || []);
    } catch (err) {
      setError("Không thể tải dữ liệu");
      console.error("Error fetching schedule:", err);
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
      const scheduleDate = new Date(schedule.date);
      return scheduleDate.toDateString() === date.toDateString();
    });
  };

  // Lọc lịch cho ngày được chọn
  const getScheduleForDate = (date: Date) => {
    if (!monthScheduleData || !Array.isArray(monthScheduleData)) {
      return [];
    }
    return monthScheduleData.filter((schedule) => {
      const scheduleDate = new Date(schedule.date);
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
    if (viewMode === "calendar") {
      setShowDetail(true);
    }
  };

  // Lấy lịch cho tuần hiện tại (dùng cho list view)
  const getWeekSchedules = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    const weekSchedules = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      const daySchedules = getScheduleForDate(currentDate);
      if (daySchedules.length > 0) {
        weekSchedules.push({
          date: currentDate,
          schedules: daySchedules,
        });
      }
    }
    return weekSchedules;
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

  const renderViewModeSelector = () => (
    <View style={styles.viewModeSelector}>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === "calendar" && styles.viewModeButtonActive,
        ]}
        onPress={() => setViewMode("calendar")}
      >
        <Text
          style={[
            styles.viewModeText,
            viewMode === "calendar" && styles.viewModeTextActive,
          ]}
        >
          Lịch
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === "combined" && styles.viewModeButtonActive,
        ]}
        onPress={() => setViewMode("combined")}
      >
        <Text
          style={[
            styles.viewModeText,
            viewMode === "combined" && styles.viewModeTextActive,
          ]}
        >
          Tổng hợp
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === "list" && styles.viewModeButtonActive,
        ]}
        onPress={() => setViewMode("list")}
      >
        <Text
          style={[
            styles.viewModeText,
            viewMode === "list" && styles.viewModeTextActive,
          ]}
        >
          Danh sách
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCalendarView = () => (
    <>
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
            {hasSchedule(date) && isCurrentMonth(date) && (
              <View style={styles.scheduleDot} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const renderCombinedView = () => (
    <>
      {renderCalendarView()}

      {/* Schedule Details Below Calendar */}
      <View style={styles.scheduleDetailsSection}>
        <Text style={styles.sectionTitle}>
          Lịch ngày {selectedDate.toLocaleDateString("vi-VN")}
        </Text>

        <ScrollView
          style={styles.scheduleDetailsContainer}
          showsVerticalScrollIndicator={false}
        >
          {selectedDateSchedule.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.empty}>Không có lịch học</Text>
            </View>
          ) : (
            selectedDateSchedule.map((item, idx) => (
              <View key={item._id || idx} style={styles.scheduleCard}>
                <View style={styles.scheduleCardHeader}>
                  <Text style={styles.scheduleCardTitle}>
                    {item.classroom?.name || "Lớp học"}
                  </Text>
                  <Text style={styles.scheduleCardTime}>
                    {item.slot?.start_time || 0}h
                    {String(item.slot?.start_minute || 0).padStart(2, "0")} -{" "}
                    {item.slot?.end_time || 0}h
                    {String(item.slot?.end_minute || 0).padStart(2, "0")}
                  </Text>
                </View>
                <View style={styles.scheduleCardContent}>
                  <View style={styles.scheduleCardRow}>
                    <Text style={styles.scheduleCardLabel}>Thời lượng:</Text>
                    <Text style={styles.scheduleCardValue}>
                      {item.slot?.duration || "-"}
                    </Text>
                  </View>
                  <View style={styles.scheduleCardRow}>
                    <Text style={styles.scheduleCardLabel}>Hồ bơi:</Text>
                    <Text style={styles.scheduleCardValue}>
                      {item.pool?.title || "-"}
                    </Text>
                  </View>
                  <View style={styles.scheduleCardRow}>
                    <Text style={styles.scheduleCardLabel}>Loại:</Text>
                    <Text style={styles.scheduleCardValue}>
                      {item.pool?.type || "-"}
                    </Text>
                  </View>
                  <View style={styles.scheduleCardRow}>
                    <Text style={styles.scheduleCardLabel}>Kích thước:</Text>
                    <Text style={styles.scheduleCardValue}>
                      {item.pool?.dimensions || "-"}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </>
  );

  const renderListView = () => {
    const weekSchedules = getWeekSchedules();

    return (
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Lịch học tuần</Text>
          <Text style={styles.listSubtitle}>
            {selectedDate.toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </Text>
        </View>

        {weekSchedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>Không có lịch học trong tuần này</Text>
          </View>
        ) : (
          weekSchedules.map((dayData, dayIdx) => (
            <View key={dayIdx} style={styles.daySection}>
              <Text style={styles.dayHeader}>
                {dayData.date.toLocaleDateString("vi-VN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </Text>

              {dayData.schedules.map((item, idx) => (
                <View key={item._id || idx} style={styles.listScheduleCard}>
                  <View style={styles.listScheduleHeader}>
                    <Text style={styles.listScheduleTitle}>
                      {item.classroom?.name || "Lớp học"}
                    </Text>
                    <Text style={styles.listScheduleTime}>
                      {item.slot?.start_time || 0}h
                      {String(item.slot?.start_minute || 0).padStart(2, "0")} -{" "}
                      {item.slot?.end_time || 0}h
                      {String(item.slot?.end_minute || 0).padStart(2, "0")}
                    </Text>
                  </View>
                  <View style={styles.listScheduleContent}>
                    <Text style={styles.listScheduleDetail}>
                      🏊‍♂️ {item.pool?.title || "-"} • {item.pool?.type || "-"}
                    </Text>
                    <Text style={styles.listScheduleDetail}>
                      ⏱️ {item.slot?.duration || "-"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {renderViewModeSelector()}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007BFF" />
          <Text style={styles.loadingText}>Đang tải lịch...</Text>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {!loading && !error && (
        <>
          {viewMode === "calendar" && renderCalendarView()}
          {viewMode === "combined" && renderCombinedView()}
          {viewMode === "list" && renderListView()}
        </>
      )}

      {/* Schedule Detail Modal (only for calendar view) */}
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

            <ScrollView style={styles.scheduleList}>
              {selectedDateSchedule.length === 0 ? (
                <Text style={styles.empty}>Không có lịch học</Text>
              ) : (
                selectedDateSchedule.map((item, idx) => (
                  <View key={item._id || idx} style={styles.scheduleItem}>
                    <Text style={styles.itemTitle}>
                      {item.classroom?.name || "Lớp học"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      Thời gian: {item.slot?.start_time || 0}h
                      {String(item.slot?.start_minute || 0).padStart(2, "0")} -{" "}
                      {item.slot?.end_time || 0}h
                      {String(item.slot?.end_minute || 0).padStart(2, "0")}
                    </Text>
                    <Text style={styles.itemDetail}>
                      Thời lượng: {item.slot?.duration || "-"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      Hồ bơi: {item.pool?.title || "-"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      Loại hồ: {item.pool?.type || "-"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      Kích thước: {item.pool?.dimensions || "-"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      Độ sâu: {item.pool?.depth || "-"}
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
  // View Mode Selector
  viewModeSelector: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  viewModeButtonActive: {
    backgroundColor: "#007BFF",
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  viewModeTextActive: {
    color: "#FFF",
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
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },

  // Combined View Styles
  scheduleDetailsSection: {
    flex: 1,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  scheduleDetailsContainer: {
    flex: 1,
    maxHeight: 300,
  },
  scheduleCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  scheduleCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  scheduleCardTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007BFF",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scheduleCardContent: {
    padding: 16,
    paddingTop: 12,
  },
  scheduleCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  scheduleCardLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  scheduleCardValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },

  // List View Styles
  listContainer: {
    flex: 1,
  },
  listHeader: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  daySection: {
    marginBottom: 20,
  },
  dayHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    paddingHorizontal: 4,
    textTransform: "capitalize",
  },
  listScheduleCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  listScheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  listScheduleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  listScheduleTime: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007BFF",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listScheduleContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listScheduleDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
});
