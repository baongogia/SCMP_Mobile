import {
  Image,
  StyleSheet,
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
import { useState, memo, useEffect, useRef } from "react";
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
  useAnimatedStyle,
  interpolate,
  useAnimatedScrollHandler,
  SharedValue,
} from "react-native-reanimated";
import { WelcomeSection } from "@/src/components/layout/welcome/WelcomeSection";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = 200;

// eslint-disable-next-line react/display-name
const CourseCard = memo(
  ({
    course,
    index,
    scrollX,
    onPress,
  }: {
    course: any;
    index: number;
    scrollX: SharedValue<number>;
    onPress: () => void;
  }) => {
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      (index + 1) * CARD_WIDTH,
    ];

    const animatedStyle = useAnimatedStyle(() => {
      const scale = interpolate(
        scrollX.value,
        inputRange,
        [0.8, 1, 0.8],
        "clamp"
      );

      const opacity = interpolate(
        scrollX.value,
        inputRange,
        [0.6, 1, 0.6],
        "clamp"
      );

      return {
        transform: [{ scale }],
        opacity,
      };
    });

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price);
    };

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <Animated.View style={[styles.courseCard, animatedStyle]}>
          <View style={styles.courseImageContainer}>
            {course.media && course.media[0] ? (
              <Image
                source={{ uri: course.media[0].path }}
                style={styles.courseImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons
                  name="school-outline"
                  size={40}
                  color={colors.primary}
                />
              </View>
            )}
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{formatPrice(course.price)}</Text>
            </View>
          </View>

          <View style={styles.courseContent}>
            {/* Text Content Section */}
            <View style={styles.textContentSection}>
              <Text style={styles.courseTitle} numberOfLines={2}>
                {course.title}
              </Text>
              <Text
                style={styles.courseDescription}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {course.description || "Mô tả khóa học sẽ được cập nhật"}
              </Text>
            </View>

            {/* Info Section */}
            <View style={styles.courseInfo}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.infoText}>
                  {course.session_number_duration}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons
                  name="book-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.infoText}>
                  {course.session_number} buổi
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }
);

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
  const [weatherInfo] = useState<{
    temp: number;
    desc: string;
    location: string;
  }>({ temp: 29, desc: "Nắng nhẹ", location: "TP.HCM" });
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
      id: "courses",
      title: "Khóa học",
      subtitle: "Thông tin khóa học",
      icon: "book-outline",
      color: "#45B7D1",
      onPress: () => (navigation as any).navigate("Courses"),
    },
    {
      id: "attendance",
      title: "Điểm danh",
      subtitle: "Điểm danh",
      icon: "checkmark-circle-outline",
      color: "#96CEB4",
      onPress: () => (navigation as any).navigate("Attendance"),
    },
    {
      id: "children",
      title: "Con của tôi",
      subtitle: "Quản lý con",
      icon: "people-outline",
      color: "#FFEAA7",
      onPress: () => (navigation as any).navigate("Children"),
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
      console.log(
        "[Member Home] Received navigate:chat event, navigating to Chat screen"
      );
      // GlobalToast đã navigate trực tiếp, chỉ cần navigate đến Chat screen
      (navigation as any).navigate("Chat");
    });

    return () => {
      offNavigateChat();
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
          location={weatherInfo.location}
          temperatureC={weatherInfo.temp}
          weatherDesc={weatherInfo.desc}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  pageBody: {
    backgroundColor: colors.mainBackground,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -28,
    paddingTop: 20,
    zIndex: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 26,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: "hidden",
    flexDirection: "row",
  },
  decorationCircleLarge: {
    position: "absolute",
    right: -20,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  decorationCircleSmall: {
    position: "absolute",
    right: 16,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  welcomeLeft: { flex: 1 },
  welcomeRight: {
    width: 130,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  welcomeKicker: {
    fontSize: 14,
    color: "#E3F2FD",
    opacity: 0.95,
    marginBottom: 8,
    fontWeight: "600",
  },
  weatherRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  weatherChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherText: {
    marginLeft: 6,
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginHorizontal: 6,
    opacity: 0.5,
  },
  miniCta: {
    marginLeft: 10,
    backgroundColor: "#005A90",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  miniCtaText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    marginRight: 6,
  },
  timeTextHero: { color: colors.white, fontSize: 26, fontWeight: "800" },
  dateTextHero: { color: "#EAF6FF", fontSize: 12, marginBottom: 4 },
  timeBackdrop: {
    position: "absolute",
    right: -6,
    top: -6,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  quickActionsSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickActionsGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 0,
  },
  quickActionItem: {
    width: (width - 120) / 4,
    alignItems: "center",
  },
  quickActionTile: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  quickActionInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitleBelow: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  coursesSection: {
    paddingVertical: 30,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.titleColor,
  },
  seeAllText: {
    fontSize: 16,
    color: colors.titleColor,
    fontWeight: "500",
  },
  coursesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  courseCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + 140,
    marginRight: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: "hidden",
    elevation: 2,
  },
  courseImageContainer: {
    height: CARD_HEIGHT,
    position: "relative",
  },
  courseImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  priceTag: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  courseContent: {
    padding: 16,
    flex: 1,
    justifyContent: "flex-start",
  },
  textContentSection: {
    flex: 1,
    marginBottom: 16,
    minHeight: 80,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  courseDescription: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: 12,
    flex: 1,
    minHeight: 40,
  },
  courseInfo: {
    flexDirection: "row",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  infoText: {
    fontSize: 12,
    color: colors.text,
    marginLeft: 4,
    opacity: 0.8,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginHorizontal: 6,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginTop: 4,
  },
});
