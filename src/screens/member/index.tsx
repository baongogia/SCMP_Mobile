import {
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  Dimensions,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import {
  getAllCourses,
  getCustomCourses,
} from "@/src/services/learning_process/course/courseService";
import { getAllMemberSchedules } from "@/src/services/learning_process/schedules/scheduleServices";
import { useUserInfo } from "@/src/hooks";
import { NewsSection } from "@/src/components/layout/news";
import { TodayScheduleSection } from "@/src/components/layout/schedule";
import { getMemberNews } from "@/src/services/information/news/newServices";
import { NewsItem } from "@/src/types/news";
import { ScheduleItem } from "@/src/types/schedule";
import { eventBus } from "@/src/utils/eventBus";
import { showErrorToast } from "@/src/utils/errorHandler";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { WelcomeSection } from "@/src/components/layout/welcome/WelcomeSection";
import { CourseCard } from "@/src/components/custom/card/course/CourseCard";
import { styles } from "./style";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

export default function HomeScreen() {
  // const BG_URI = "";
  const navigation = useNavigation();
  const { userInfo } = useUserInfo();
  const [courses, setCourses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "custom">("all"); // kept for legacy if needed, but UI hidden
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    totalSessions: 0,
    attendedSessions: 0,
    activeClasses: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  // Remove static weather info - now using real weather data via WelcomeSection
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);

  const quickActions = [
    {
      id: "schedule",
      title: "Lịch học",
      subtitle: "Xem lịch học",
      icon: "calendar-outline",
      color: "#4ECDC4",
      onPress: () => (navigation as any).navigate("Schedule"),
    },
    {
      id: "progress",
      title: "Tiến trình",
      subtitle: "Thông tin khóa học",
      icon: "school-outline",
      color: "#45B7D1",
      onPress: () => (navigation as any).navigate("CourseInfo"),
    },
    {
      id: "learning_path",
      title: "Điểm danh",
      subtitle: "Theo dõi điểm danh",
      icon: "checkmark-done-outline",
      color: "#96CEB4",
      onPress: () => (navigation as any).navigate("AttendanceReport"),
    },
    {
      id: "consultation",
      title: "Tư vấn",
      subtitle: "Hỏi AI",
      icon: "chatbubbles-outline",
      color: "#FFEAA7",
      onPress: () => (navigation as any).navigate("LearningConsultation"),
    },
  ];

  // Load courses from API
  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await getAllCourses();
      let mergedCourses = [...(response.data?.data || [])];

      if (userInfo?._id) {
        const customRes = await getCustomCourses("custom", userInfo._id);
        if (
          customRes.data &&
          customRes.data.data &&
          customRes.data.data.length > 0
        ) {
          const customList = customRes.data.data.map((c: any) => ({
            ...c,
            isCustom: true,
          }));
          // Prepend custom courses
          mergedCourses = [...customList, ...mergedCourses];

          // Deduplicate by ID
          const seen = new Set();
          mergedCourses = mergedCourses.filter((c) => {
            const key = c._id || c.id;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }
      }
      setCourses(mergedCourses);
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải khóa học",
        message: "Không thể tải danh sách khóa học",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load news from API
  const loadNews = async () => {
    try {
      setNewsLoading(true);
      const response = await getMemberNews();
      if (response.data && response.data.data) {
        setNews(response.data.data);
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải tin tức",
        message: "Không thể tải tin tức",
      });
    } finally {
      setNewsLoading(false);
    }
  };

  // Load statistics from attendance data
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const today = new Date();
      // Get first and last day of current month
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const startDate = firstDay.toISOString().split("T")[0];
      const endDate = lastDay.toISOString().split("T")[0];

      const res = await getAllMemberSchedules(startDate, endDate);
      const items: any[] = res?.data?.data || [];

      // Helper to normalize time
      const normalizeItem = (it: any): ScheduleItem => {
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
        } as ScheduleItem;
      };

      // Filter schedules in current month
      const monthSchedules = items.map(normalizeItem).filter((item) => {
        const itemDate = new Date(item.date);
        return (
          itemDate.getMonth() === today.getMonth() &&
          itemDate.getFullYear() === today.getFullYear()
        );
      });

      // Calculate statistics
      const totalSessions = monthSchedules.length;
      const attendedSessions = monthSchedules.filter(
        (schedule) => (schedule as any).is_attended === true
      ).length;

      // Count unique active classes (classes with schedules this month)
      const classSet = new Set<string>();
      monthSchedules.forEach((schedule) => {
        if (schedule.classroom?._id) {
          classSet.add(schedule.classroom._id);
        }
      });
      const activeClasses = classSet.size;

      setStats({
        totalSessions,
        attendedSessions,
        activeClasses,
      });
    } catch {
      // Silently fail for stats
      setStats({
        totalSessions: 0,
        attendedSessions: 0,
        activeClasses: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCourses(), loadNews(), loadStats()]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (userInfo?._id) {
      loadCourses();
    } else {
      loadCourses();
    }
    loadNews();
    loadStats();
  }, [userInfo?._id]);

  // Listen for navigate:chat events from GlobalToast
  useEffect(() => {
    const offNavigateChat = eventBus.on("navigate:chat", (data: any) => {
      (navigation as any).navigate("Message");
    });

    // Listen for auth:force-refresh events to reload data after token switch
    const offForceRefresh = eventBus.on("auth:force-refresh", () => {
      console.log("🔄 [HomeScreen] Force refresh triggered, reloading data...");
      loadCourses();
      loadNews();
      loadStats();
    });

    return () => {
      offNavigateChat();
      offForceRefresh();
    };
  }, [navigation]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Animated scroll handler
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  // Navigate to course detail
  const navigateToCourseDetail = (course: any) => {
    (navigation as any).navigate("CourseDetail", { course });
  };

  const handleNewsPress = (newsItem: NewsItem) => {
    // Navigate to news detail screen
    (navigation as any).navigate("NewsDetail", { news: newsItem });
  };

  const handleViewAllNews = () => {
    (navigation as any).navigate("News");
  };

  // Render course item for FlatList
  const renderCourseItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <CourseCard
        course={item}
        index={index}
        scrollX={scrollX}
        onPress={() => navigateToCourseDetail(item)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <WelcomeSection
          username={userInfo?.username}
          currentTime={currentTime}
          location="TP.HCM"
          onProfilePress={() => (navigation as any).navigate("ProfileDetail")}
        />

        {/* Page Body Container */}
        <View style={styles.pageBody}>
          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <View key={action.id} style={styles.quickActionItem}>
                  <TouchableOpacity
                    style={styles.quickActionTile}
                    onPress={action.onPress}
                    activeOpacity={0.85}
                  >
                    <View style={styles.quickActionInner}>
                      <Ionicons
                        name={action.icon as any}
                        size={30}
                        color={colors.primaryDark}
                      />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.actionTitleBelow} numberOfLines={1}>
                    {action.title}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Today's Schedule Indicator */}
          <TodayScheduleSection
            role="member"
            onPress={() => (navigation as any).navigate("Schedule")}
          />

          {/* Courses Section */}
          <View style={styles.coursesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Khóa học nổi bật</Text>
              <TouchableOpacity
                onPress={() => (navigation as any).navigate("Courses")}
              >
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Đang tải khóa học...</Text>
              </View>
            ) : courses.length > 0 ? (
              <Animated.FlatList
                ref={flatListRef}
                data={courses}
                renderItem={({ item, index }) => (
                  <CourseCard
                    course={item}
                    index={index}
                    scrollX={scrollX}
                    onPress={() => navigateToCourseDetail(item)}
                    isCustom={item.isCustom}
                  />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + 16}
                decelerationRate="fast"
                contentContainerStyle={styles.coursesContainer}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                keyExtractor={(item) => item._id}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="school-outline"
                  size={60}
                  color={colors.primary}
                />
                <Text style={styles.emptyText}>Không có khóa học nào</Text>
              </View>
            )}
          </View>

          {/* News Section */}
          <NewsSection
            title="Tin tức mới"
            newsData={news}
            loading={newsLoading}
            onRefresh={loadNews}
            onViewAll={handleViewAllNews}
            onNewsPress={handleNewsPress}
            maxItems={3}
            variant="horizontal"
            showViewAll={news.length > 3}
          />
          {/* Statistics Section */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Thống kê tháng này</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="calendar" size={24} color={colors.primary} />
                <Text style={styles.statNumber}>
                  {statsLoading ? "-" : stats.totalSessions}
                </Text>
                <Text style={styles.statLabel}>Buổi học</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.statNumber}>
                  {statsLoading ? "-" : stats.attendedSessions}
                </Text>
                <Text style={styles.statLabel}>Đã học</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="school" size={24} color={colors.primary} />
                <Text style={styles.statNumber}>
                  {statsLoading ? "-" : stats.activeClasses}
                </Text>
                <Text style={styles.statLabel}>Lớp đang học</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
