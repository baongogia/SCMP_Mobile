import {
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { useUserInfo } from "@/src/hooks";
import { NewsSection } from "@/src/components/layout/news";
import { TodayScheduleSection } from "@/src/components/layout/schedule";
import { getInstructorNews } from "@/src/services/information/news/newServices";
import { getInstructorSchedules } from "@/src/services/learning_process/schedules/scheduleServices";
import { NewsItem } from "@/src/types/news";
import { ScheduleItem } from "@/src/types/schedule";
import { eventBus } from "@/src/utils/eventBus";
import { WelcomeSection } from "@/src/components/layout/welcome/WelcomeSection";
import { showErrorToast } from "@/src/utils/errorHandler";
import { styles } from "./style";
import TabTransitionView from "@/src/components/custom/tab-transition/TabTransitionView";

export default function HomeScreen() {
  // const BG_URI = "";
  const navigation = useNavigation();
  const { userInfo, loadUserInfo } = useUserInfo();

  // console.log("Header - userInfo:", userInfo?.username, "avatarUri:", avatarUri);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalStudents: 0,
    totalHours: 0,
    activeClasses: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadUserInfo();
    loadNews();
    loadStats();
    const unsubscribe = (navigation as any).addListener("focus", () => {
      loadUserInfo();
      loadStats();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for navigate:chat events from GlobalToast
  useEffect(() => {
    const offNavigateChat = eventBus.on("navigate:chat", (data: any) => {
      (navigation as any).navigate("Message");
    });

    return () => {
      offNavigateChat();
    };
  }, [navigation]);

  const loadNews = async () => {
    try {
      setNewsLoading(true);
      const response = await getInstructorNews();
      if (response.data && response.data.data) {
        setNews(response.data.data);
      }
    } catch (error: any) {
      console.error("❌ [HomeScreen] Failed to load news:", error);
      if (error?.response) {
        console.error("   Status:", error.response.status);
        console.error("   Data:", JSON.stringify(error.response.data, null, 2));
      }
      showErrorToast(error, {
        title: "Lỗi tải tin tức",
        message: "Không thể tải tin tức",
      });
    } finally {
      setNewsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const today = new Date();
      // Get first and last day of current month
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const startDate = firstDay.toISOString().split("T")[0];
      const endDate = lastDay.toISOString().split("T")[0];

      const res = await getInstructorSchedules(startDate, endDate);
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

      // Count unique students from all classrooms
      const studentSet = new Set<string>();
      monthSchedules.forEach((schedule) => {
        if (
          schedule.classroom?.member &&
          Array.isArray(schedule.classroom.member)
        ) {
          schedule.classroom.member.forEach((memberId: string) => {
            studentSet.add(memberId);
          });
        }
      });
      const totalStudents = studentSet.size;

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
        totalStudents,
        totalHours: 0, // Remove hours stat
        activeClasses,
      });
    } catch {
      // Silently fail for stats
      setStats({
        totalSessions: 0,
        totalStudents: 0,
        totalHours: 0,
        activeClasses: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // greeting handled in shared WelcomeSection

  // Quick action items
  const quickActions = [
    {
      id: "schedule",
      title: "Lịch dạy",
      subtitle: "Xem lịch dạy",
      icon: "calendar-outline",
      color: "#4ECDC4",
      onPress: () => (navigation as any).navigate("Schedule"),
    },
    {
      id: "classes",
      title: "Lớp học",
      subtitle: "Quản lý lớp",
      icon: "school-outline",
      color: "#45B7D1",
      onPress: () => (navigation as any).navigate("ClassManagement"),
    },
    {
      id: "evaluation",
      title: "Đánh giá",
      subtitle: "Điểm danh & Đánh giá",
      icon: "checkmark-circle-outline",
      color: "#96CEB4",
      onPress: () => (navigation as any).navigate("AttendanceEvaluation"),
    },
    {
      id: "request",
      title: "Gửi đơn",
      subtitle: "Đơn từ",
      icon: "document-text-outline",
      color: "#FFEAA7",
      onPress: () => (navigation as any).navigate("Request"),
    },
  ];

  const handleNewsPress = (newsItem: NewsItem) => {
    (navigation as any).navigate("NewsDetail", { news: newsItem });
  };

  const handleViewAllNews = () => {
    (navigation as any).navigate("News");
  };

  return (
    <TabTransitionView style={styles.container}>
      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === "ios" ? 0 : 0 },
        ]}
        showsVerticalScrollIndicator={false}
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
            role="instructor"
            onPress={() => (navigation as any).navigate("Schedule")}
          />

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
                <View style={styles.statIconContainer}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                </View>
                <Text style={styles.statNumber}>
                  {statsLoading ? "-" : stats.totalSessions}
                </Text>
                <Text style={styles.statLabel}>Buổi dạy</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="people" size={20} color={colors.primary} />
                </View>
                <Text style={styles.statNumber}>
                  {statsLoading ? "-" : stats.totalStudents}
                </Text>
                <Text style={styles.statLabel}>Học viên</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="school" size={20} color={colors.primary} />
                </View>
                <Text style={styles.statNumber}>
                  {statsLoading ? "-" : stats.activeClasses}
                </Text>
                <Text style={styles.statLabel}>Lớp đang dạy</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </TabTransitionView>
  );
}
