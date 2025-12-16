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
import { ClassItem } from "@/src/types/schedule";
import { showErrorToast } from "@/src/utils/errorHandler";

// Minimal duplicate of styles/imports for speed, ideally shared but file structure suggests keeping it simple first
// Using "Analytical" Focus

export function ClassEvaluationScreen() {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeekAnchor, setCurrentWeekAnchor] = useState(new Date());
  const [classes, setClasses] = useState<ClassItem[]>([]);
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
      // Fetch schedules for the selected date
      // We import getInstructorSchedules dynamically if needed or assume it's imported
      const { getInstructorSchedules } = require("@/src/services/learning_process/schedules/scheduleServices");

      const response = await getInstructorSchedules(dateKey, dateKey, controller.signal);

      const items: any[] = response?.data?.data || [];

      // Extract unique classes from schedules
      const uniqueClassesMap = new Map<string, ClassItem>();
      items.forEach((sch: any) => {
          if (sch.classroom) {
              const cls = sch.classroom;
              // Ensure it has _id
              const clsId = typeof cls === 'object' ? cls._id : cls;
              if (clsId && typeof cls === 'object' && !uniqueClassesMap.has(clsId)) {
                  // Normalize to ClassItem structure as best as possible
                  uniqueClassesMap.set(clsId, cls as ClassItem);
              }
          }
      });

      setClasses(Array.from(uniqueClassesMap.values()));

    } catch (error: any) {
      if (error.name !== 'AbortError') {
          showErrorToast(error, {
            title: "Lỗi tải lịch",
            message: "Không thể tải danh sách lớp học",
          });
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

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

  const renderClassItem = ({ item }: { item: ClassItem }) => {
    if (!scaleAnims.has(item._id)) {
      scaleAnims.set(item._id, new Animated.Value(1));
    }
    const scaleAnim = scaleAnims.get(item._id)!;

    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          marginBottom: 12,
        }}
      >
        <ClassStatsCard
            item={item}
            variant="analytical"
            onPress={() => {
                // Navigate to Evaluation Details
                 const courseId = typeof item.course === "object" && item.course !== null ? item.course._id : item.course;
                (navigation as any).navigate("Note", {
                    class_id: item._id,
                    course_id: courseId,
                    class_name: item.name,
                    course_title: typeof item.course === "object" ? item.course.title : "Khóa học",
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

        <Text style={styles.listTitle}>Theo dõi chất lượng & Phản hồi:</Text>
        {loading ? (
             <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
            <FlatList
            data={classes}
            renderItem={renderClassItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={{color: colors.textSecondary}}>Không có lớp học nào trong ngày này.</Text>
                </View>
            }
            />
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
});
