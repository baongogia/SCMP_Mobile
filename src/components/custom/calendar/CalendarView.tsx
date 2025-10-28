import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";

export interface CalendarEventItem {
  _id: string;
  date: string | Date;
  slot?: {
    _id?: string;
    title?: string;
    start_time?: number;
    end_time?: number;
    duration?: string;
    start_minute?: number;
    end_minute?: number;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
    tenant_id?: string;
  };
  classroom?: {
    _id?: string;
    name?: string;
    course?: string;
    member?: string[];
  };
  pool?: {
    _id?: string;
    title?: string;
    type?: string;
    dimensions?: string;
    depth?: string;
    capacity?: number;
    maintance_status?: string;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
    tenant_id?: string;
  };
  instructor?: string;
  attendees?: string[];
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  tenant_id?: string;
  [key: string]: any;
}

type ViewMode = "week" | "month";

interface SharedCalendarViewProps {
  title: string;
  fetchRange: (
    startDate: string,
    endDate: string
  ) => Promise<CalendarEventItem[]>;
  onEventPress?: (event: CalendarEventItem) => void;
  renderDetail?: (
    event: CalendarEventItem,
    onClose?: () => void
  ) => React.ReactNode;
  role: "instructor" | "member";
  emptyText?: string;
  eventText?: string;
  detailTitle?: string;
  upcomingCourses?: any[];
  renderUpcomingCourse?: (item: any, onPress: () => void) => React.ReactNode;
  showUpcomingCourses?: boolean;
  onSeeAllUpcomingCourses?: () => void;
}

export default function SharedCalendarView({
  title,
  fetchRange,
  onEventPress,
  renderDetail,
  role,
  emptyText,
  eventText,
  detailTitle,
  upcomingCourses = [],
  renderUpcomingCourse,
  showUpcomingCourses = true,
  onSeeAllUpcomingCourses,
}: SharedCalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentAnchor, setCurrentAnchor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<CalendarEventItem[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(
    null
  );
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const toggleAnim = useRef(new Animated.Value(0)).current;
  const [segmentWidth, setSegmentWidth] = useState(0);

  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: viewMode === "week" ? 0 : 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [viewMode, toggleAnim]);

  // Default texts based on role
  const defaultEmptyText =
    role === "instructor" ? "Không có buổi dạy" : "Không có buổi học";
  const defaultEventText = role === "instructor" ? "Buổi dạy" : "Buổi học";
  const defaultDetailTitle =
    role === "instructor" ? "Chi tiết lịch dạy" : "Chi tiết lịch học";

  const finalEmptyText = emptyText || defaultEmptyText;
  const finalEventText = eventText || defaultEventText;
  const finalDetailTitle = detailTitle || defaultDetailTitle;

  const toLocalDateKey = useCallback((input: Date | string) => {
    const d = typeof input === "string" ? new Date(input) : input;
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const getWeekDates = useCallback((date: Date) => {
    const week: Date[] = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      week.push(d);
    }
    return week;
  }, []);

  const weekDates = useMemo(
    () => getWeekDates(currentAnchor),
    [currentAnchor, getWeekDates]
  );

  const monthGrid = useMemo(() => {
    const first = new Date(
      currentAnchor.getFullYear(),
      currentAnchor.getMonth(),
      1
    );
    const last = new Date(
      currentAnchor.getFullYear(),
      currentAnchor.getMonth() + 1,
      0
    );
    const leading = (first.getDay() + 6) % 7;
    const cells: (Date | null)[] = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let d = 1; d <= last.getDate(); d++)
      cells.push(
        new Date(currentAnchor.getFullYear(), currentAnchor.getMonth(), d)
      );
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [currentAnchor]);

  const loadRange = useCallback(async () => {
    try {
      setLoading(true);
      const start =
        viewMode === "week"
          ? weekDates[0]
          : new Date(currentAnchor.getFullYear(), currentAnchor.getMonth(), 1);
      const end =
        viewMode === "week"
          ? weekDates[6]
          : new Date(
              currentAnchor.getFullYear(),
              currentAnchor.getMonth() + 1,
              0
            );
      const res = await fetchRange(
        start.toISOString().split("T")[0],
        end.toISOString().split("T")[0]
      );
      setData(Array.isArray(res) ? res : []);
    } finally {
      setLoading(false);
    }
  }, [currentAnchor, viewMode, weekDates, fetchRange]);

  useEffect(() => {
    loadRange();
  }, [loadRange]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRange();
    setRefreshing(false);
  };

  const getSchedulesForDate = useCallback(
    (date: Date) => {
      const key = toLocalDateKey(date);
      const dayEvents = data.filter((x) => toLocalDateKey(x.date) === key);

      // Sort by start time (earliest first)
      return dayEvents.sort((a, b) => {
        const timeA =
          (a.slot?.start_time || 0) * 60 + (a.slot?.start_minute || 0);
        const timeB =
          (b.slot?.start_time || 0) * 60 + (b.slot?.start_minute || 0);
        return timeA - timeB;
      });
    },
    [data, toLocalDateKey]
  );

  const navigate = (dir: "prev" | "next") => {
    const d = new Date(currentAnchor);
    if (viewMode === "week")
      d.setDate(currentAnchor.getDate() + (dir === "next" ? 7 : -7));
    else d.setMonth(currentAnchor.getMonth() + (dir === "next" ? 1 : -1));
    setCurrentAnchor(d);
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
            <Text style={styles.compactEmptyText}>{finalEmptyText}</Text>
          </View>
        ) : (
          items.map((it) => (
            <TouchableOpacity
              key={it._id}
              style={styles.sessionRow}
              onPress={() =>
                onEventPress
                  ? onEventPress(it)
                  : (setSelectedEvent(it), setDetailVisible(true))
              }
            >
              <View style={styles.timePill}>
                <Text style={styles.timePillText}>{`${String(
                  it.slot?.start_time ?? 0
                ).padStart(2, "0")}:${String(
                  it.slot?.start_minute ?? 0
                ).padStart(2, "0")}`}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionTitle} numberOfLines={1}>
                  {it.slot?.title || it.classroom?.name || finalEventText}
                </Text>
                <View style={styles.sessionMetaRow}>
                  {it.pool?.title && (
                    <View style={styles.sessionMetaItem}>
                      <Ionicons
                        name="water-outline"
                        size={12}
                        color={colors.primary}
                      />
                      <Text style={styles.sessionMetaText}>
                        {it.pool.title}
                      </Text>
                    </View>
                  )}
                  {it.classroom?.name && it.slot?.title && (
                    <View style={styles.sessionMetaItem}>
                      <Ionicons
                        name="school-outline"
                        size={12}
                        color={colors.primary}
                      />
                      <Text style={styles.sessionMetaText}>
                        {it.classroom.name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.navRow}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigate("prev")}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.weekInfo}>
          <Text style={styles.monthYear}>
            Tháng {currentAnchor.getMonth() + 1}, {currentAnchor.getFullYear()}
          </Text>
          <Text style={styles.weekRange}>
            {viewMode === "week"
              ? `${weekDates[0].getDate()} - ${weekDates[6].getDate()}`
              : "Toàn bộ tháng"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigate("next")}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View
        style={styles.segmentWrapper}
        onLayout={(e) => setSegmentWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.segmentIndicator,
            {
              width: segmentWidth ? (segmentWidth - 6) / 2 : undefined,
              transform: [
                {
                  translateX: toggleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [3, (segmentWidth || 0) / 2 + 0],
                  }),
                },
              ],
            },
          ]}
        />
        <TouchableOpacity
          style={styles.segmentItem}
          activeOpacity={0.8}
          onPress={() => setViewMode("week")}
        >
          <Ionicons
            name="calendar-outline"
            size={15}
            color={viewMode === "week" ? colors.primary : colors.text}
          />
          <Text
            style={[
              styles.segmentText,
              viewMode === "week" && styles.segmentTextActive,
            ]}
          >
            Tuần
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.segmentItem}
          activeOpacity={0.8}
          onPress={() => setViewMode("month")}
        >
          <Ionicons
            name="grid-outline"
            size={15}
            color={viewMode === "month" ? colors.primary : colors.text}
          />
          <Text
            style={[
              styles.segmentText,
              viewMode === "month" && styles.segmentTextActive,
            ]}
          >
            Tháng
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === "week" ? (
        <View style={styles.weekStripContainer}>
          {weekDates.map((d, idx) => {
            const isSelected = d.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity
                key={idx}
                style={styles.weekDayItem}
                onPress={() => setSelectedDate(d)}
              >
                <View
                  style={[
                    styles.weekDayPill,
                    isSelected && styles.weekDayPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekDayName,
                      isSelected && styles.weekDayNameSelected,
                    ]}
                  >
                    {dayNames[idx]}
                  </Text>
                  <Text
                    style={[
                      styles.weekDayNum,
                      isSelected && styles.weekDayNumSelected,
                    ]}
                  >
                    {d.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {viewMode === "month" ? (
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
              if (!date)
                return <View key={`pad-${idx}`} style={styles.monthCell} />;
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
                      setSelectedEvent(daySchedules[0]);
                      setDetailVisible(true);
                    }
                  }}
                >
                  <View style={styles.monthDayContainer}>
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
                    {daySchedules.length > 0 && (
                      <View style={styles.teachingIndicator} />
                    )}
                  </View>
                  <View
                    style={{
                      marginTop: 2,
                      width: "100%",
                      paddingHorizontal: 1,
                    }}
                  >
                    {daySchedules.slice(0, 1).map((it) => (
                      <TouchableOpacity
                        key={it._id}
                        style={styles.monthEventPill}
                        activeOpacity={0.7}
                        onPress={() =>
                          onEventPress
                            ? onEventPress(it)
                            : (setSelectedEvent(it), setDetailVisible(true))
                        }
                      >
                        <Text
                          style={styles.monthEventText}
                          numberOfLines={1}
                        >{`${String(it.slot?.start_time ?? 0).padStart(
                          2,
                          "0"
                        )}:${String(it.slot?.start_minute ?? 0).padStart(
                          2,
                          "0"
                        )}`}</Text>
                      </TouchableOpacity>
                    ))}
                    {daySchedules.length > 1 ? (
                      <Text style={styles.moreLabel}>
                        +{daySchedules.length - 1}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Upcoming Courses Section for Month View */}
          {showUpcomingCourses && upcomingCourses.length > 0 && (
            <View style={styles.upcomingCoursesSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="school" size={24} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Khóa học sắp tới</Text>
                </View>
                <TouchableOpacity
                  style={styles.seeAllButton}
                  onPress={() => {
                    if (onSeeAllUpcomingCourses) onSeeAllUpcomingCourses();
                    else setShowAllUpcoming((prev) => !prev);
                  }}
                >
                  <Text style={styles.seeAllText}>
                    {showAllUpcoming ? "Thu gọn" : "Xem tất cả"}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>

              {(showAllUpcoming
                ? upcomingCourses
                : upcomingCourses.slice(0, 3)
              ).map((course, index) => {
                const handlePress = () => {
                  setSelectedEvent(course);
                  setDetailVisible(true);
                };
                return (
                  <View key={index}>
                    {renderUpcomingCourse ? (
                      renderUpcomingCourse(course, handlePress)
                    ) : (
                      <TouchableOpacity
                        style={styles.courseCard}
                        onPress={handlePress}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.courseName}>
                          {course.name || course.title}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Đang tải lịch...</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
            >
              {viewMode === "week"
                ? (() => {
                    // Get items for the selected date
                    const items = getSchedulesForDate(selectedDate);

                    // If no items for selected date, show empty message
                    if (items.length === 0) {
                      const isToday =
                        toLocalDateKey(selectedDate) ===
                        toLocalDateKey(new Date());
                      return (
                        <View style={styles.emptyDayContainer}>
                          <Text style={styles.emptyDayText}>
                            {isToday
                              ? role === "instructor"
                                ? "Hôm nay không có lịch dạy"
                                : "Hôm nay không có lịch học"
                              : role === "instructor"
                              ? "Không có buổi dạy"
                              : "Không có buổi học"}
                          </Text>
                        </View>
                      );
                    }

                    // Show items for selected date
                    return items.map((it) => (
                      <TouchableOpacity
                        key={`${toLocalDateKey(selectedDate)}-${it._id}`}
                        style={styles.sessionRow}
                        onPress={() =>
                          onEventPress
                            ? onEventPress(it)
                            : (setSelectedEvent(it), setDetailVisible(true))
                        }
                      >
                        <View style={styles.timePill}>
                          <Ionicons
                            name="time"
                            size={16}
                            color={colors.white}
                          />
                          <Text style={styles.timePillText}>{`${String(
                            it.slot?.start_time ?? 0
                          ).padStart(2, "0")}:${String(
                            it.slot?.start_minute ?? 0
                          ).padStart(2, "0")}`}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sessionTitle} numberOfLines={1}>
                            {it.slot?.title ||
                              it.classroom?.name ||
                              finalEventText}
                          </Text>
                          <View style={styles.sessionMetaRow}>
                            {it.pool?.title && (
                              <View style={styles.sessionMetaItem}>
                                <Ionicons
                                  name="water-outline"
                                  size={12}
                                  color={colors.primary}
                                />
                                <Text style={styles.sessionMetaText}>
                                  {it.pool.title}
                                </Text>
                              </View>
                            )}
                            {it.classroom?.name && it.slot?.title && (
                              <View style={styles.sessionMetaItem}>
                                <Ionicons
                                  name="school-outline"
                                  size={12}
                                  color={colors.primary}
                                />
                                <Text style={styles.sessionMetaText}>
                                  {it.classroom.name}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    ));
                  })()
                : weekDates.map((date) => (
                    <View key={toLocalDateKey(date)}>
                      {renderDaySection(date)}
                    </View>
                  ))}
            </ScrollView>
          )}
        </View>
      )}

      <Modal
        visible={detailVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{finalDetailTitle}</Text>
              <TouchableOpacity onPress={() => setDetailVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedEvent ? (
              <ScrollView>
                {renderDetail ? (
                  renderDetail(selectedEvent, () => setDetailVisible(false))
                ) : (
                  <View>
                    <Text style={{ fontWeight: "700", color: colors.text }}>
                      {selectedEvent.slot?.title ||
                        selectedEvent.classroom?.name ||
                        finalEventText}
                    </Text>
                  </View>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  navRow: {
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
  toggleRow: {
    display: "none",
  },
  segmentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    padding: 3,
    marginVertical: 10,
    marginHorizontal: 16,
    backgroundColor: "#f4f7fb",
    borderRadius: 12,
    position: "relative",
  },
  segmentIndicator: {
    position: "absolute",
    left: 0,
    top: 3,
    height: 36,
    backgroundColor: colors.white,
    borderRadius: 9,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
  },
  segmentText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
  segmentTextActive: { color: colors.primary },
  weekStripContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  weekDayItem: { flex: 1, alignItems: "center" },
  weekDayPill: {
    width: 56,
    height: 72,
    borderRadius: 14,
    backgroundColor: "#f2f6f9",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  weekDayPillSelected: { backgroundColor: "rgba(0,119,190,0.12)" },
  weekDayName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    opacity: 0.7,
  },
  weekDayNameSelected: { color: colors.primary, opacity: 1 },
  weekDayNum: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  weekDayNumSelected: { color: colors.primary },
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
    paddingVertical: 6,
    paddingHorizontal: 2,
    alignItems: "stretch",
    marginVertical: 1,
    minHeight: 60,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  monthDayContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  monthDayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  monthDayText: { fontSize: 11, fontWeight: "700", color: colors.text },
  selectedDayHeader: {
    backgroundColor: colors.primary,
    borderRadius: 14,
  },
  todayDayHeader: {
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    borderRadius: 14,
  },
  selectedDayName: { color: colors.white },
  todayDayName: { color: colors.primary },
  monthEventPill: {
    backgroundColor: "#eef6fb",
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginTop: 1,
  },
  monthEventText: { fontSize: 9, color: colors.primary, fontWeight: "700" },
  moreLabel: {
    marginTop: 4,
    fontSize: 10,
    color: colors.grayc,
    fontWeight: "700",
  },
  teachingIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginLeft: 4,
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
  daySection: {
    marginBottom: 18,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
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
  dayTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  daySubtitle: { fontSize: 12, color: colors.text, opacity: 0.6, marginTop: 2 },
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
  emptyDayContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
  },
  emptyDayText: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: "center",
    fontStyle: "italic",
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  timePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
    gap: 4,
  },
  timePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  sessionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    flexWrap: "wrap",
  },
  sessionMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sessionMetaText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    paddingBottom: 0,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "78%",
    marginBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  closeButton: { fontSize: 24, color: "#666" },
  // Upcoming courses styles
  upcomingCoursesSection: {
    backgroundColor: colors.white,
    marginTop: 16,
    marginHorizontal: 0,
    borderRadius: 0,
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
    borderRadius: 0,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  courseName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
});
