import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { ClassStatsCard, SharedHeader } from "@/src/components/custom";
import {
  getInstructorClasses,
  getInstructorClassDetail,
} from "@/src/services/learning_process/class/classService";
import { getNotes } from "@/src/services/learning_process/note/noteServices";
import { ClassItem } from "@/src/types/schedule";
import { showErrorToast } from "@/src/utils/errorHandler";
import { PieChart } from "react-native-gifted-charts";

const { width } = Dimensions.get("window");

export function ClassEvaluationScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  // statsMap tracks progress: { evaluated, total (sessions), evaluatedStudents, totalStudents, latestScheduleId }
  const [statsMap, setStatsMap] = useState<
    Record<
      string,
      {
        evaluated: number;
        total: number;
        evaluatedStudents: number;
        totalStudents: number;
        latestScheduleId?: string;
      }
    >
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const loadClassesAndStats = useCallback(async (showLoading = true) => {
    try {
      if (showLoading && classes.length === 0) {
        setLoading(true);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // 1. Fetch Classes
      const response = await getInstructorClasses();
      const classList: ClassItem[] = response?.data?.data?.data || [];
      setClasses(classList);

      // 2. Fetch Stats for each class
      const newStats: Record<
        string,
        {
          evaluated: number;
          total: number;
          evaluatedStudents: number;
          totalStudents: number;
          latestScheduleId?: string;
        }
      > = {};

      await Promise.all(
        classList.map(async (cls) => {
          try {
            if (!cls._id || !(cls.course as any)?._id) {
              newStats[cls._id] = {
                evaluated: 0,
                total: 1,
                evaluatedStudents: 0,
                totalStudents: 0,
              };
              return;
            }

            // Fetch detailed class to get full member list
            let fullClass = cls;
            try {
              const detailRes = await getInstructorClassDetail(cls._id);
              if (
                detailRes.data?.data &&
                Array.isArray(detailRes.data.data) &&
                detailRes.data.data.length > 0
              ) {
                fullClass = detailRes.data.data[0];
              }
            } catch (err) {
              console.warn(`Failed to fetch details for class ${cls._id}`, err);
            }

            const courseId = (fullClass.course as any)._id;
            const notesRes = await getNotes(fullClass._id, courseId);
            const notesData = notesRes.data?.data || [];

            let realNotes: any[] = [];
            let realSchedules: any[] = [];

            if (Array.isArray(notesData) && notesData.length > 0) {
              const triplet = notesData[0];
              if (Array.isArray(triplet)) {
                if (Array.isArray(triplet[0])) realNotes = triplet[0];
                if (Array.isArray(triplet[2])) realSchedules = triplet[2];
              }
            } else if (typeof notesData === "object" && notesData !== null) {
              if (Array.isArray((notesData as any).notes))
                realNotes = (notesData as any).notes;
              if (Array.isArray((notesData as any).schedules))
                realSchedules = (notesData as any).schedules;
            }

            // Metric 1: Session-based progress
            const totalSessions =
              realSchedules.length ||
              (fullClass.course as any)?.session_number ||
              0;
            const evaluatedSessionIds = new Set();
            realNotes.forEach((n: any) => {
              if (n.schedule?._id || n.schedule) {
                const sId =
                  typeof n.schedule === "string" ? n.schedule : n.schedule._id;
                if (sId) evaluatedSessionIds.add(sId);
              }
            });
            const evaluatedSessionsCount = evaluatedSessionIds.size;

            // Metric 2: Student-based stats
            const totalMembers = fullClass.member?.length || 0;
            const evaluatedStudentIds = new Set();
            realNotes.forEach((n: any) => {
              if (n.member?._id || n.member) {
                const mId =
                  typeof n.member === "string" ? n.member : n.member._id;
                if (mId) evaluatedStudentIds.add(mId);
              }
            });
            const evaluatedStudentsCount = evaluatedStudentIds.size;

            // Find latest schedule for navigation
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let latestSchedule: any = null;
            let minDiff = Infinity;

            if (realSchedules.length > 0) {
              realSchedules.forEach((s) => {
                if (!s.date) return;
                const d = new Date(s.date);
                d.setHours(0, 0, 0, 0);
                const diff = Math.abs(d.getTime() - today.getTime());
                if (diff < minDiff) {
                  minDiff = diff;
                  latestSchedule = s;
                }
              });
            }

            newStats[fullClass._id] = {
              evaluated: evaluatedSessionsCount, // Buổi
              total: totalSessions, // Tổng buổi
              evaluatedStudents: evaluatedStudentsCount,
              totalStudents: totalMembers,
              latestScheduleId: latestSchedule?._id,
            };
          } catch (e) {
            console.log("Error fetching stats for class", cls.name, e);
            newStats[cls._id] = {
              evaluated: 0,
              total: 0,
              evaluatedStudents: 0,
              totalStudents: 0,
            };
          }
        })
      );

      setStatsMap(newStats);
    } catch (error: any) {
      if (error.name !== "AbortError") {
        showErrorToast(error, {
          title: "Lỗi tải dữ liệu",
          message: "Không thể tải danh sách lớp học",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClassesAndStats();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadClassesAndStats(false);
    }, [loadClassesAndStats])
  );

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const renderClassItem = ({ item }: { item: ClassItem }) => {
    const stats = statsMap[item._id] || { evaluated: 0, total: 0 };

    return (
      <ClassStatsCard
        item={item}
        variant="analytical"
        stats={stats}
        hideBadge={true}
        onPress={() => {
          const courseId = (item.course as any)?._id;
          (navigation as any).navigate("Note", {
            class_id: item._id,
            course_id: courseId,
            class_name: item.name,
            course_title: (item.course as any)?.title || "Khóa học",
            schedule_id: stats.latestScheduleId,
          });
        }}
        style={{ marginBottom: 12 }}
      />
    );
  };

  const renderBottomStats = () => {
    if (loading || classes.length === 0) return null;

    const totalClasses = classes.length;
    const totalEvalSessions = Object.values(statsMap).reduce(
      (acc, curr) => acc + curr.evaluated,
      0
    );
    const totalPossSessions = Object.values(statsMap).reduce(
      (acc, curr) => acc + curr.total,
      0
    );
    const totalEvalStudents = Object.values(statsMap).reduce(
      (acc, curr) => acc + curr.evaluatedStudents,
      0
    );
    const totalAllStudents = Math.max(
      totalEvalStudents,
      Object.values(statsMap).reduce((acc, curr) => acc + curr.totalStudents, 0)
    );

    const remainingSessions = Math.max(
      0,
      totalPossSessions - totalEvalSessions
    );
    const avgRate =
      totalPossSessions > 0
        ? ((totalEvalSessions / totalPossSessions) * 100).toFixed(1)
        : "0";

    const pieData = [
      {
        value: totalEvalSessions,
        color: colors.primary,
        focused: true,
        text: totalEvalSessions.toString(),
      },
      {
        value: remainingSessions,
        color: colors.gray[200],
        text: remainingSessions.toString(),
      },
    ];

    const finalPieData =
      totalPossSessions === 0
        ? [{ value: 1, color: colors.gray[200] }]
        : pieData;

    return (
      <View
        style={[
          styles.bottomStatsContainer,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <View
              style={[
                styles.statIconBadge,
                { backgroundColor: colors.lightPrimary },
              ]}
            >
              <Ionicons
                name="school-outline"
                size={18}
                color={colors.primary}
              />
            </View>
            <View>
              <Text style={styles.statValue}>{totalClasses}</Text>
              <Text style={styles.statLabel}>Lớp</Text>
            </View>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.statBlock}>
            <View
              style={[
                styles.statIconBadge,
                { backgroundColor: colors.warning + "20" },
              ]}
            >
              <Ionicons
                name="people-outline"
                size={18}
                color={colors.warning}
              />
            </View>
            <View>
              <Text style={styles.statValue}>{totalAllStudents}</Text>
              <Text style={styles.statLabel}>Học viên</Text>
            </View>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.statBlock}>
            <View
              style={[
                styles.statIconBadge,
                { backgroundColor: colors.success + "20" },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.success}
              />
            </View>
            <View>
              <Text style={styles.statValue}>{avgRate}%</Text>
              <Text style={styles.statLabel}>Số buổi</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartSeparator} />

        <View style={styles.chartContainer}>
          <View style={styles.chartInfoSide}>
            <Text style={styles.chartTitle}>Tổng quan theo buổi học</Text>
            <Text style={styles.chartSubtitle}>
              Tỉ lệ buổi học đã có đánh giá / tổng số buổi
            </Text>

            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <Text style={styles.legendText}>
                  Đã đánh giá ({totalEvalSessions} buổi)
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: colors.gray[200] },
                  ]}
                />
                <Text style={styles.legendText}>
                  Chưa đánh giá ({remainingSessions} buổi)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.donutWrapper}>
            <PieChart
              data={finalPieData}
              donut
              innerRadius={36}
              radius={50}
              innerCircleColor={colors.white}
              centerLabelComponent={() => (
                <View
                  style={{ justifyContent: "center", alignItems: "center" }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.primary,
                      fontWeight: "bold",
                    }}
                  >
                    {avgRate}%
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <SharedHeader
        title="Đánh giá học viên"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Danh sách lớp học:</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          ) : (
            <FlatList
              data={classes}
              renderItem={renderClassItem}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptySubtitle}>
                    Không có lớp học nào.
                  </Text>
                </View>
              }
            />
          )}
        </View>

        {renderBottomStats()}
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
    flexDirection: "column",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: colors.text,
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bottomStatsContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 20,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 6,
    alignItems: "center",
  },
  statBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
    marginTop: 1,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLight,
  },
  chartSeparator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 14,
    marginHorizontal: 16,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  chartInfoSide: {
    flex: 1,
    justifyContent: "center",
  },
  donutWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  chartSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  legendContainer: {
    gap: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "500",
  },
});
