import React, { useState, useEffect, useCallback, useRef } from "react";
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
import {
  getInstructorClasses,
  getInstructorClassDetail,
} from "@/src/services/learning_process/class/classService";
import { ClassItem } from "@/src/types/schedule";
import { showErrorToast } from "@/src/utils/errorHandler";
import { styles } from "./style";

// Dashboard Stats Component
const DashboardStats = ({ classes }: { classes: ClassItem[] }) => {
    // Calculate total students across all classes
    const totalStudents = classes.reduce((acc, curr) => {
        return acc + (Array.isArray(curr.member) ? curr.member.length : 0);
    }, 0);

    const totalClasses = classes.length;

    // Calculate total sessions
    const totalSessions = classes.reduce((acc, curr) => {
        const sessions = curr.course?.session_number || 0;
        return acc + sessions;
    }, 0);

    return (
        <View style={localStyles.dashboardContainer}>
            {/* Quick Stats Cards */}
            <View style={localStyles.statsGrid}>
                <View style={localStyles.statCard}>
                     <View style={[localStyles.iconBox, { backgroundColor: colors.lightPrimary }]}>
                        <Ionicons name="school" size={20} color={colors.primary} />
                     </View>
                     <View>
                        <Text style={localStyles.statValue}>{totalClasses}</Text>
                        <Text style={localStyles.statLabel}>Lớp học</Text>
                     </View>
                </View>
                <View style={localStyles.statCard}>
                     <View style={[localStyles.iconBox, { backgroundColor: colors.lightPrimary }]}>
                        <Ionicons name="people" size={20} color={colors.primary} />
                     </View>
                     <View>
                        <Text style={localStyles.statValue}>{totalStudents}</Text>
                        <Text style={localStyles.statLabel}>Học viên</Text>
                     </View>
                </View>
                <View style={localStyles.statCard}>
                     <View style={[localStyles.iconBox, { backgroundColor: colors.lightPrimary }]}>
                        <Ionicons name="layers" size={20} color={colors.primary} />
                     </View>
                     <View>
                        <Text style={localStyles.statValue}>{totalSessions}</Text>
                        <Text style={localStyles.statLabel}>Buổi học</Text>
                     </View>
                </View>
            </View>

            {/* Active Class Stats - Kept as placeholder for future real data or remove if strict */}
        </View>
    );
};

export function ClassManagementScreen() {
  const navigation = useNavigation();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const inFlightRef = React.useRef(false);
  const scaleAnims = useRef<Map<string, Animated.Value>>(new Map()).current;

  // Load classes
  const loadClasses = useCallback(async () => {
    try {
      if (inFlightRef.current) return;
      setLoading(true);

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

      inFlightRef.current = true;
      while (true) {
        try {
          response = await getInstructorClasses();
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

      console.log("Classes response:", response.data);
      let list: ClassItem[] = [];
      if (response.data && response.data.data && response.data.data.data) {
        list = response.data.data.data;
      }

      // Fetch details to ensure members are populated
      if (list.length > 0) {
          const detailedClasses = await Promise.all(list.map(async (cls: ClassItem) => {
              try {
                  const detailRes = await getInstructorClassDetail(cls._id);
                  if (
                    detailRes.data &&
                    detailRes.data.data &&
                    Array.isArray(detailRes.data.data) &&
                    detailRes.data.data.length > 0
                  ) {
                      return detailRes.data.data[0];
                  }
                  return cls;
              } catch (e) {
                  console.warn(`Failed to load details for class ${cls._id}`, e);
                  return cls;
              }
          }));
          setClasses(detailedClasses);
      } else {
          setClasses([]);
      }

    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải lớp học",
        message: "Không thể tải danh sách lớp học",
      });
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadClasses();
    setRefreshing(false);
  };

  const handleClassPress = (item: ClassItem) => {
    (navigation as any).navigate("ClassDetail", { classId: item._id });
  };

  // Initial load
  useEffect(() => {
    loadClasses();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadClasses]);

  const renderClassItem = ({ item }: { item: ClassItem }) => {

    if (!scaleAnims.has(item._id)) {
      scaleAnims.set(item._id, new Animated.Value(1));
    }
    const scaleAnim = scaleAnims.get(item._id)!;

    return (
      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <ClassStatsCard
             item={item}
             variant="operational"
             onPress={() => handleClassPress(item)}
          />
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <SharedHeader title="Thông tin lớp học" />

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải danh sách lớp...</Text>
          </View>
        ) : (
          <FlatList
            data={classes}
            renderItem={renderClassItem}
            keyExtractor={(item) => item._id}
            style={styles.classList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={<DashboardStats classes={classes} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconWrapper}>
                  <Ionicons
                    name="school-outline"
                    size={48}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.emptyTitle}>Chưa có lớp nào</Text>
                <Text style={styles.emptySubtitle}>
                  Khi bạn được phân công lớp, chúng sẽ hiển thị tại đây.
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={onRefresh}
                >
                  <Ionicons name="refresh" size={18} color={colors.white} />
                  <Text style={styles.retryText}>Tải lại</Text>
                </TouchableOpacity>
              </View>
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
    dashboardContainer: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    statLabel: {
        fontSize: 11,
        color: colors.textSecondary,
    },
});
