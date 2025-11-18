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
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { styles } from "./style";
import EventCard from "../card/schedule_card/EventCard";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  instructor?: {
    _id?: string;
    username?: string;
    name?: string;
    email?: string;
    phone?: string;
    featured_image?: string;
  };
  attendees?: string[];
  is_attended?: boolean | null;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  tenant_id?: string;
  [key: string]: any;
}

type ViewMode = "week" | "month";

interface CalendarViewProps {
  title: string;
  fetchRange: (
    startDate: string,
    endDate: string
  ) => Promise<CalendarEventItem[]>;
  onEventPress?: (event: CalendarEventItem) => void;
  renderDetail?: (
    event: CalendarEventItem,
    onClose?: () => void,
    disableScroll?: boolean,
    onNavigate?: () => void
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

export default function CalendarView({
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
}: CalendarViewProps) {
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
  const [selectedDateEvents, setSelectedDateEvents] = useState<
    CalendarEventItem[]
  >([]);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const toggleAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const modalTranslateY = useRef(new Animated.Value(0)).current;
  const modalStartY = useRef(0);
  const isClosingRef = useRef(false);

  // Enable LayoutAnimation for Android
  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);
  const [weekHeaderHeight, setWeekHeaderHeight] = useState(0);
  const [monthHeaderHeight, setMonthHeaderHeight] = useState(0);
  const headerSectionHeight = useMemo(() => {
    if (weekHeaderHeight > 0 && monthHeaderHeight > 0) {
      return toggleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [weekHeaderHeight, monthHeaderHeight],
      });
    }
    if (weekHeaderHeight > 0) return weekHeaderHeight;
    if (monthHeaderHeight > 0) return monthHeaderHeight;
    return undefined;
  }, [toggleAnim, weekHeaderHeight, monthHeaderHeight]);

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: viewMode === "week" ? 0 : 1,
      duration: 420,
      easing: Easing.bezier(0.22, 0.61, 0.36, 1),
      useNativeDriver: false, // height animation requires JS driver
    }).start();
  }, [viewMode, toggleAnim]);

  // Smooth open animation for modal content
  useEffect(() => {
    if (detailVisible && !isClosingRef.current) {
      isClosingRef.current = false;
      modalTranslateY.setValue(600);
      Animated.spring(modalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 110,
        friction: 16,
      }).start();
    }
  }, [detailVisible, modalTranslateY]);

  const closeModalAnimated = useCallback(() => {
    if (isClosingRef.current) return; // Prevent multiple calls
    isClosingRef.current = true;

    Animated.timing(modalTranslateY, {
      toValue: 800,
      duration: 250,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setDetailVisible(false);
      setSelectedEvent(null);
      setSelectedDateEvents([]);
      setExpandedEventId(null);
      // Không reset về 0 ở đây để tránh chớp; lần mở tiếp theo sẽ set từ 600 -> 0
      isClosingRef.current = false;
    });
  }, [modalTranslateY]);

  // PanResponder for swipe down to close modal
  const modalPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to vertical swipes
        return (
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
          Math.abs(gestureState.dy) > 10
        );
      },
      onPanResponderGrant: (evt) => {
        modalStartY.current = evt.nativeEvent.pageY;
        modalTranslateY.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow downward swipes
        if (gestureState.dy > 0) {
          modalTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // If swiped down more than 100px, close modal
        if (gestureState.dy > 100) {
          closeModalAnimated();
        } else {
          // Spring back to original position
          Animated.spring(modalTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  const smoothSetViewMode = useCallback(
    (next: ViewMode) => {
      if (next === viewMode) return;
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setViewMode(next);
    },
    [viewMode]
  );

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

  // Helper function để xác định trạng thái điểm danh
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
            <EventCard
              key={it._id}
              item={it}
              role={role}
              finalEventText={finalEventText}
              getAttendanceStatus={getAttendanceStatus}
              onPress={() => {
                if (onEventPress) {
                  onEventPress(it);
                } else {
                  setSelectedEvent(it);
                  setSelectedDateEvents([]);
                  setDetailVisible(true);
                }
              }}
            />
          ))
        )}
      </View>
    );
  };

  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  // Tính toán paddingBottom động dựa trên số lượng events trong tháng
  const monthPaddingBottom = useMemo(() => {
    if (viewMode === "week") return 40;

    // Đếm số ngày có events trong tháng hiện tại
    const monthStart = new Date(
      currentAnchor.getFullYear(),
      currentAnchor.getMonth(),
      1
    );
    const monthEnd = new Date(
      currentAnchor.getFullYear(),
      currentAnchor.getMonth() + 1,
      0
    );

    const daysWithEvents = new Set<string>();
    data.forEach((event) => {
      const eventDate = new Date(event.date);
      if (eventDate >= monthStart && eventDate <= monthEnd) {
        daysWithEvents.add(toLocalDateKey(eventDate));
      }
    });

    const daysCount = daysWithEvents.size;
    const totalEvents = data.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate >= monthStart && eventDate <= monthEnd;
    }).length;

    // Nếu không có events, dùng padding tối thiểu
    if (daysCount === 0 || totalEvents === 0) {
      return 45;
    }
    // Nếu có rất ít events (1-2), dùng padding nhỏ
    if (totalEvents <= 2) {
      return 55;
    }
    // Nếu có ít events (3-10), dùng padding trung bình
    if (totalEvents <= 10) {
      return 75;
    }
    // Nếu có nhiều events (11-20), dùng padding lớn
    if (totalEvents <= 20) {
      return 110;
    }
    // Nếu có rất nhiều events, dùng padding rất lớn
    return 130;
  }, [viewMode, currentAnchor, data, toLocalDateKey]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.mainBackground }}>
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top + 8,
            paddingBottom: monthPaddingBottom,
          },
        ]}
      >
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigate("prev")}
          >
            <Ionicons name="chevron-back" size={22} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.weekInfo}>
            <Text style={styles.monthYear}>
              Tháng {currentAnchor.getMonth() + 1},{" "}
              {currentAnchor.getFullYear()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigate("next")}
          >
            <Ionicons name="chevron-forward" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        <Animated.View style={{ height: headerSectionHeight }}>
          {/* Week header content */}
          <Animated.View
            onLayout={(e) => {
              const h = e?.nativeEvent?.layout?.height;
              if (typeof h === "number" && h > 0) {
                setWeekHeaderHeight((prev) => (prev > 0 ? prev : h));
              }
            }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              opacity: toggleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
              transform: [
                {
                  translateY: toggleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 8],
                  }),
                },
              ],
            }}
            pointerEvents={viewMode === "week" ? "auto" : "none"}
          >
            <View style={styles.weekStripContainer}>
              {weekDates.map((d, idx) => {
                const isSelected =
                  d.toDateString() === selectedDate.toDateString();
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
            <TouchableOpacity
              style={styles.arrowToggle}
              activeOpacity={0.8}
              onPress={() => smoothSetViewMode("month")}
            >
              <Ionicons name="chevron-down" size={18} color={colors.white} />
            </TouchableOpacity>
          </Animated.View>

          {/* Month header content */}
          <Animated.View
            onLayout={(e) => {
              const h = e?.nativeEvent?.layout?.height;
              if (typeof h === "number" && h > 0) {
                setMonthHeaderHeight((prev) => (prev > 0 ? prev : h));
              }
            }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              opacity: toggleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              transform: [
                {
                  translateY: toggleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                  }),
                },
              ],
            }}
            pointerEvents={viewMode === "month" ? "auto" : "none"}
          >
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
                const isToday =
                  date.toDateString() === new Date().toDateString();
                const daySchedules = getSchedulesForDate(date);
                return (
                  <TouchableOpacity
                    key={toLocalDateKey(date)}
                    style={styles.monthCell}
                    onPress={() => {
                      setSelectedDate(date);
                      setExpandedEventId(null); // Reset expanded when changing date
                      if (daySchedules.length >= 2) {
                        setSelectedDateEvents(daySchedules);
                        setSelectedEvent(null);
                        setDetailVisible(true);
                      } else if (daySchedules.length === 1) {
                        setSelectedEvent(daySchedules[0]);
                        setSelectedDateEvents([]);
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
                      {/* {daySchedules.length > 0 && (
                        <View style={styles.teachingDot} />
                      )} */}
                    </View>
                    <View
                      style={{
                        marginTop: 4,
                        width: "100%",
                        paddingHorizontal: 2,
                      }}
                    >
                      {daySchedules.slice(0, 1).map((it) => (
                        <TouchableOpacity
                          key={it._id}
                          style={styles.monthEventPill}
                          activeOpacity={0.7}
                          onPress={() => {
                            if (onEventPress) {
                              onEventPress(it);
                            } else {
                              const dayEvents = getSchedulesForDate(
                                new Date(it.date)
                              );
                              if (dayEvents.length >= 2) {
                                setSelectedDateEvents(dayEvents);
                                setSelectedEvent(null);
                              } else {
                                setSelectedEvent(it);
                                setSelectedDateEvents([]);
                              }
                              setDetailVisible(true);
                            }
                          }}
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
            <View
              style={{
                paddingTop:
                  monthPaddingBottom <= 45
                    ? 4
                    : monthPaddingBottom <= 55
                    ? 6
                    : monthPaddingBottom <= 75
                    ? 10
                    : monthPaddingBottom <= 110
                    ? 18
                    : 26,
                paddingBottom: 12,
              }}
            >
              <TouchableOpacity
                style={styles.arrowToggle}
                activeOpacity={0.8}
                onPress={() => smoothSetViewMode("week")}
              >
                <Ionicons name="chevron-up" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.contentContainer}>
        {viewMode === "month" ? (
          <View>
            {/* Upcoming Courses Section for Month View */}
            {showUpcomingCourses && upcomingCourses.length > 0 && (
              <View style={styles.upcomingCoursesSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name="school" size={24} color={colors.primary} />
                    <Text style={styles.sectionTitle}>
                      {role === "instructor"
                        ? "Lịch dạy sắp tới"
                        : "Khóa học sắp tới"}
                    </Text>
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
                        <EventCard
                          item={course as unknown as CalendarEventItem}
                          role={role}
                          finalEventText={finalEventText}
                          getAttendanceStatus={getAttendanceStatus}
                          onPress={handlePress}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <View style={{ flex: 1, position: "relative" }}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Đang tải lịch...</Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
                contentContainerStyle={{
                  padding: 12,
                  paddingTop: 0,
                  paddingBottom: 100,
                }}
              >
                {viewMode === "week"
                  ? (() => {
                      const items = getSchedulesForDate(selectedDate);
                      const isToday =
                        toLocalDateKey(selectedDate) ===
                        toLocalDateKey(new Date());
                      const headerTitle = isToday
                        ? role === "instructor"
                          ? "Lịch dạy hôm nay"
                          : "Lịch học hôm nay"
                        : selectedDate.toLocaleDateString("vi-VN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          });

                      if (items.length === 0) {
                        return (
                          <>
                            <View style={styles.weekSelectedHeader}>
                              <Text style={styles.weekSelectedTitle}>
                                {headerTitle}
                              </Text>
                            </View>
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
                          </>
                        );
                      }
                      return [
                        <View style={styles.weekSelectedHeader} key="wk-hdr">
                          <Text style={styles.weekSelectedTitle}>
                            {headerTitle}
                          </Text>
                        </View>,
                        ...items.map((it) => (
                          <EventCard
                            key={`${toLocalDateKey(selectedDate)}-${it._id}`}
                            item={it}
                            role={role}
                            finalEventText={finalEventText}
                            getAttendanceStatus={getAttendanceStatus}
                            onPress={() => {
                              if (onEventPress) {
                                onEventPress(it);
                              } else {
                                setSelectedEvent(it);
                                setSelectedDateEvents([]);
                                setDetailVisible(true);
                              }
                            }}
                          />
                        )),
                      ];
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
      </View>

      {/* Modal for single event */}
      <Modal
        visible={
          detailVisible &&
          selectedEvent !== null &&
          selectedDateEvents.length < 2
        }
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
          >
            <TouchableOpacity
              style={styles.modalSwipeHandle}
              activeOpacity={0.8}
              onPress={closeModalAnimated}
            >
              <View style={styles.modalSwipeHandleBar} />
            </TouchableOpacity>
            {selectedEvent && (
              <ScrollView
                showsVerticalScrollIndicator={true}
                bounces={true}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
                style={{ flex: 1 }}
              >
                {renderDetail ? (
                  renderDetail(
                    selectedEvent,
                    () => setDetailVisible(false),
                    false,
                    () => setDetailVisible(false)
                  )
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
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Modal for multiple events (accordion) */}
      <Modal
        visible={detailVisible && selectedDateEvents.length >= 2}
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
              styles.modalContentn,
              {
                transform: [{ translateY: modalTranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.modalSwipeHandle}
              activeOpacity={0.8}
              onPress={closeModalAnimated}
            >
              <View style={styles.modalSwipeHandleBar} />
            </TouchableOpacity>
            <ScrollView
              showsVerticalScrollIndicator={true}
              bounces={true}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              contentContainerStyle={{
                paddingBottom: 40,
                flexGrow: 1,
                marginTop: 12,
              }}
              style={{ flex: 1 }}
            >
              {selectedDateEvents.map((it, index) => {
                const isExpanded = expandedEventId === it._id;
                const formatTime = (hour: number, minute: number) => {
                  return `${String(hour).padStart(2, "0")}:${String(
                    minute
                  ).padStart(2, "0")}`;
                };

                return (
                  <View key={it._id} style={styles.accordionContainer}>
                    <TouchableOpacity
                      style={[
                        styles.accordionHeader,
                        isExpanded && styles.accordionHeaderExpanded,
                      ]}
                      onPress={() => {
                        LayoutAnimation.configureNext(
                          LayoutAnimation.Presets.easeInEaseOut
                        );
                        if (isExpanded) {
                          setExpandedEventId(null);
                        } else {
                          setExpandedEventId(it._id);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.accordionHeaderLeft}>
                        <View style={styles.accordionSlotBadge}>
                          <Text style={styles.accordionSlotNumber}>
                            {index + 1}
                          </Text>
                        </View>
                        <View style={styles.accordionHeaderContent}>
                          <View style={styles.accordionIconWrapper}>
                            <Ionicons
                              name="school"
                              size={22}
                              color={colors.primary}
                            />
                          </View>
                          <View style={styles.accordionInfo}>
                            <Text
                              style={styles.accordionTitle}
                              numberOfLines={1}
                            >
                              {it.classroom?.name ||
                                it.slot?.title ||
                                finalEventText}
                            </Text>
                            <View style={styles.accordionTimeRow}>
                              <Ionicons
                                name="time-outline"
                                size={14}
                                color={colors.gray[600]}
                              />
                              <Text style={styles.accordionTime}>
                                {formatTime(
                                  it.slot?.start_time || 0,
                                  it.slot?.start_minute || 0
                                )}{" "}
                                -{" "}
                                {formatTime(
                                  it.slot?.end_time || 0,
                                  it.slot?.end_minute || 0
                                )}
                              </Text>
                              {it.slot?.title && (
                                <>
                                  <Text style={styles.accordionTimeSeparator}>
                                    •
                                  </Text>
                                  <Text
                                    style={styles.accordionSlotInfo}
                                    numberOfLines={1}
                                  >
                                    {it.slot.title}
                                  </Text>
                                </>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                      <View style={styles.accordionChevron}>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={22}
                          color={colors.primary}
                        />
                      </View>
                    </TouchableOpacity>
                    {isExpanded && renderDetail && (
                      <View style={styles.accordionContent}>
                        {renderDetail(
                          it,
                          () => setExpandedEventId(null),
                          true,
                          () => {
                            setExpandedEventId(null);
                            closeModalAnimated();
                          }
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
