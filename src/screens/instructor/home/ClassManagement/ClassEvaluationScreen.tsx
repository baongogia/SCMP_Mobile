import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
  Animated,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { ClassStatsCard, SharedHeader } from "@/src/components/custom";
import { getInstructorClasses } from "@/src/services/learning_process/class/classService";
import { getInstructorSchedules } from "@/src/services/learning_process/schedules/scheduleServices";
import { getNotes } from "@/src/services/learning_process/note/noteServices";
import { ClassItem, ScheduleItem } from "@/src/types/schedule";
import { showErrorToast } from "@/src/utils/errorHandler";

// Minimal duplicate of styles/imports for speed, ideally shared but file structure suggests keeping it simple first
// Using "Analytical" Focus

export function ClassEvaluationScreen() {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeekAnchor, setCurrentWeekAnchor] = useState(new Date());
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [stats, setStats] = useState<Record<string, { evaluated: number; total: number }>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scaleAnims = useRef<Map<string, Animated.Value>>(new Map()).current;
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

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

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const dateKey = selectedDate.toISOString().split("T")[0];

      const response = await getInstructorSchedules(dateKey, dateKey, controller.signal);
      const items: ScheduleItem[] = response?.data?.data || [];

      setSchedules(items);

      // Async fetch stats for these schedules
      fetchStats(items);

    } catch (error: any) {
      if (error.name !== 'AbortError') {
          showErrorToast(error, {
            title: "Lỗi tải lịch",
            message: "Không thể tải danh sách lịch học",
          });
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const fetchStats = async (items: ScheduleItem[]) => {
      const newStats: Record<string, { evaluated: number; total: number }> = {};

      // Optimization: Cache request per class/course
      const fetchedCourses = new Set<string>();

      for (const item of items) {
          if (!item.classroom) continue;

          const classId = typeof item.classroom === 'object' && '_id' in item.classroom
              ? (item.classroom as any)._id
              : String(item.classroom);

           // Safely access course ID
          const course = (item.classroom as any)?.course;
          const courseId =
                typeof course === "object" && course !== null
                    ? course._id
                    : String(course || "");

          if (!classId || !courseId) continue;

          try {
             // We need to fetch notes for this class/course
             // Ideally we should cache this if multiple schedules share the same class
             // But notes are filtered by schedule_id, so we need the full list anyway.
             const notesResponse = await getNotes(classId, courseId);

             // Process notes to find count for THIS schedule
             const notesData = notesResponse.data?.data || [];

             let processedNotes: any[] = [];

             // Simplified processing logic reused from NoteScreen analysis
             if (Array.isArray(notesData)) {
                  // Flatten if needed or use direct array
                  processedNotes = notesData.flatMap((d: any) => {
                      if (Array.isArray(d) && d.length > 0) return d[0];
                      if (d && d.note) return d;
                      return [];
                  });
             }

             const total = (typeof item.classroom === 'object' && Array.isArray(item.classroom.member))
                ? item.classroom.member.length
                : 0;

             const evaluatedCount = new Set(
                 processedNotes
                    .filter((n: any) => n.schedule?._id === item._id && n.member?._id)
                    .map((n: any) => n.member._id)
             ).size;

             newStats[item._id] = { evaluated: evaluatedCount, total };

          } catch (e) {
              console.log("Error fetching stats for schedule", item._id, e);
              newStats[item._id] = { evaluated: 0, total: 0 };
          }
      }
      setStats(prev => ({...prev, ...newStats}));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedules();
    setRefreshing(false);
  };

  const changeWeek = (direction: "prev" | "next") => {
    setCurrentWeekAnchor((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + (direction === "next" ? 7 : -7));
      return next;
    });
  };

  const handleJumpToToday = () => {
      const today = new Date();
      setSelectedDate(today);
      setCurrentWeekAnchor(today);
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const weekRangeLabel = useMemo(() => {
    if (weekDates.length === 0) return "";
    const start = weekDates[0];
    const end = weekDates[6];
    const formatter = new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
    return `${formatter.format(start)} - ${formatter.format(end)}`;
  }, [weekDates]);

  useEffect(() => {
    loadSchedules();
    return () => {
        if(abortControllerRef.current) abortControllerRef.current.abort();
    }
  }, [loadSchedules]);

  const renderScheduleItem = ({ item }: { item: ScheduleItem }) => {
    if (!scaleAnims.has(item._id)) {
      scaleAnims.set(item._id, new Animated.Value(1));
    }
    const scaleAnim = scaleAnims.get(item._id)!;

    // Fallback if classroom is just an ID string (shouldn't happen with fullpopulate but safe to check)
    if (!item.classroom || typeof item.classroom !== 'object') return null;

    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          marginBottom: 12,
        }}
      >
        <ClassStatsCard
            item={item.classroom as unknown as ClassItem}
            variant="analytical"
            stats={stats[item._id]}
            onPress={() => {
                const courseId = typeof item.classroom === "object" && item.classroom !== null && "course" in item.classroom
                             ? (item.classroom.course as any)._id
                             : "";

                (navigation as any).navigate("Note", {
                    class_id: item.classroom && typeof item.classroom === "object" ? item.classroom._id : item.classroom,
                    course_id: courseId,
                    class_name: item.classroom && typeof item.classroom === "object" ? item.classroom.name : "Lớp học",
                    course_title: "Khóa học", // Placeholder or get from course obj
                    schedule_id: item._id,
                    hideAddButton: true,
                });
            }}
        />
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <SharedHeader title="Đánh giá học viên" showBackButton onBackPress={() => navigation.goBack()}/>
      <View style={styles.content}>

        {/* Date Selector */}
        <View style={styles.dateSelectorContainer}>
           <View style={styles.weekNavRow}>
             <TouchableOpacity style={styles.weekNavButton} onPress={() => changeWeek("prev")}>
               <Ionicons name="chevron-back" size={18} color={colors.primary} />
             </TouchableOpacity>
             <View style={styles.weekInfo}>
               <Text style={styles.weekInfoLabel}>Tuần</Text>
               <Text style={styles.weekRangeText}>{weekRangeLabel}</Text>
             </View>
             <TouchableOpacity style={styles.weekNavButton} onPress={() => changeWeek("next")}>
               <Ionicons name="chevron-forward" size={18} color={colors.primary} />
             </TouchableOpacity>
           </View>
           <View style={styles.weekDaysRow}>
             {weekDates.map((date, idx) => {
               const isSelected = date.toDateString() === selectedDate.toDateString();
               return (
                 <TouchableOpacity
                   key={date.toISOString()}
                   style={styles.weekDayItem}
                   onPress={() => setSelectedDate(date)}
                 >
                   <View style={[styles.weekDayPill, isSelected && styles.weekDayPillSelected]}>
                     <Text style={[styles.weekDayLabel, isSelected && styles.weekDayLabelSelected]}>
                       {dayNames[idx]}
                     </Text>
                     <Text style={[styles.weekDayNumber, isSelected && styles.weekDayNumberSelected]}>
                       {date.getDate()}
                     </Text>
                   </View>
                 </TouchableOpacity>
               );
             })}
           </View>
           <TouchableOpacity
             style={styles.dateDisplay}
             onPress={handleJumpToToday}
             activeOpacity={0.7}
           >
             <Ionicons name="calendar" size={18} color={colors.primary} />
             <Text style={styles.dateDisplayText}>{formatDate(selectedDate)}</Text>
             {selectedDate.toDateString() === new Date().toDateString() && (
                 <View style={{backgroundColor: colors.lightPrimary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8}}>
                     <Text style={{fontSize: 12, color: colors.primary, fontWeight: '600'}}>Hôm nay</Text>
                 </View>
             )}
           </TouchableOpacity>
        </View>

        <Text style={styles.listTitle}>Theo dõi tình trạng đánh giá:</Text>
        {loading ? (
             <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
            <>
             <FlatList
                data={schedules}
                renderItem={renderScheduleItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                style={{flex: 1}}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={{color: colors.textSecondary}}>Không có buổi học nào trong ngày này.</Text>
                    </View>
                }
            />
            {schedules.length > 0 && (
                <View style={styles.summaryFooter}>
                    <View style={styles.summaryRow}>
                        <View>
                            <Text style={styles.summaryTitle}>Tổng quan hôm nay</Text>
                            <Text style={styles.summarySubtitle}>
                                {Object.values(stats).reduce((acc, curr) => acc + curr.evaluated, 0)}/{Object.values(stats).reduce((acc, curr) => acc + curr.total, 0)} học viên đã đánh giá
                            </Text>
                        </View>
                        <View style={styles.summaryCircular}>
                            <Ionicons name="stats-chart" size={20} color={colors.white} />
                        </View>
                    </View>
                     <View style={styles.summaryProgressBg}>
                        <View
                            style={[
                                styles.summaryProgressFill,
                                {
                                    width: `${
                                        Object.values(stats).reduce((acc, curr) => acc + curr.total, 0) > 0
                                        ? (Object.values(stats).reduce((acc, curr) => acc + curr.evaluated, 0) / Object.values(stats).reduce((acc, curr) => acc + curr.total, 0)) * 100
                                        : 0
                                    }%`
                                }
                            ]}
                        />
                    </View>
                </View>
            )}
            </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: colors.text,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  listContent: {
      paddingBottom: 20,
      paddingHorizontal: 20,
  },
  emptyContainer: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 40,
  },
  // Date Selector Styles
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
  summaryFooter: {
      backgroundColor: colors.primary,
      marginHorizontal: 20,
      marginBottom: 10, // Add bottom margin for safe area
      padding: 16,
      borderRadius: 20,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
  },
  summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
  },
  summaryTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.white,
  },
  summarySubtitle: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.white,
      opacity: 0.9,
      marginTop: 2,
  },
  summaryCircular: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
  },
  summaryProgressBg: {
      height: 6,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 3,
      overflow: 'hidden',
  },
  summaryProgressFill: {
      height: '100%',
      backgroundColor: colors.white,
      borderRadius: 3,
  },
});
