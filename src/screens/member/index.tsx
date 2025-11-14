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
import { getAllCourses } from "@/src/services/learning_process/course/courseService";
import { useUserInfo } from "@/src/hooks";
import { NewsSection } from "@/src/components/layout/news";
import { getMemberNews } from "@/src/services/information/news/newServices";
import { NewsItem } from "@/src/types/news";
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
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
      title: "Lộ trình",
      subtitle: "Theo dõi học tập",
      icon: "map-outline",
      color: "#96CEB4",
      onPress: () => (navigation as any).navigate("LearningPath"),
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
      if (response.data && response.data.data) {
        setCourses(response.data.data);
      }
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

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCourses(), loadNews()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadCourses();
    loadNews();
  }, []);

  // Listen for navigate:chat events from GlobalToast
  useEffect(() => {
    const offNavigateChat = eventBus.on("navigate:chat", (data: any) => {
      (navigation as any).navigate("Message");
    });

    // Listen for auth:force-refresh events to reload data after token switch
    const offForceRefresh = eventBus.on("auth:force-refresh", () => {
      console.log("🔄 [HomeScreen] Force refresh triggered, reloading data...");
      onRefresh();
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
                renderItem={renderCourseItem}
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
            variant="vertical"
            showViewAll={news.length > 3}
          />
          {/* Statistics Section */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Thống kê</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="school" size={24} color={colors.primary} />
                <Text style={styles.statNumber}>{courses.length}</Text>
                <Text style={styles.statLabel}>Khóa học</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="people" size={24} color={colors.primary} />
                <Text style={styles.statNumber}>500+</Text>
                <Text style={styles.statLabel}>Học viên</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="trophy" size={24} color={colors.primary} />
                <Text style={styles.statNumber}>95%</Text>
                <Text style={styles.statLabel}>Hài lòng</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
