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
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { getAllCourses } from "@/src/services/learning_process/course/courseService";
import { useUserInfo } from "@/src/hooks";
import { NewsSection } from "@/src/components/layout/news";
import { getMemberNews } from "@/src/services/information/news/newServices";
import { NewsItem } from "@/src/types/news";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  useAnimatedScrollHandler,
  SharedValue,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = 200;

// Course Card Component with Animation
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
            <Text style={styles.courseTitle} numberOfLines={2}>
              {course.title}
            </Text>
            <Text style={styles.courseDescription} numberOfLines={2}>
              {course.description}
            </Text>

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

            <TouchableOpacity
              style={styles.enrollButton}
              onPress={(e) => {
                e.stopPropagation();
              }}
            >
              <Text style={styles.enrollButtonText}>Đăng ký ngay</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }
);

export default function HomeScreen() {
  const navigation = useNavigation();
  const { userInfo, avatarUri } = useUserInfo();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);

  // Load courses from API
  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await getAllCourses();
      if (response.data && response.data.data) {
        setCourses(response.data.data);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
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
      console.error("Error loading news:", error);
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={28} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>SWIM COURSE</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => (navigation as any).navigate("Chat")}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={24}
              color={colors.white}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => (navigation as any).navigate("QR")}
          >
            <Ionicons name="qr-code-outline" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => (navigation as any).navigate("Notification")}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.white}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => {
              (navigation as any).navigate("Profile");
            }}
          >
            <Image
              source={
                avatarUri
                  ? { uri: avatarUri }
                  : require("@/assets/images/default-avatar.jpg")
              }
              style={styles.profileAvatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Chào mừng {userInfo?.username ? userInfo.username : "bạn"} đến với
          </Text>
          <Text style={styles.welcomeSubtitle}>Khóa học bơi lội</Text>
          <Text style={styles.welcomeDescription}>
            Khám phá các khóa học bơi lội chuyên nghiệp, phù hợp với mọi lứa
            tuổi
          </Text>
        </View>

        {/* Courses Section */}
        <View style={styles.coursesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Khóa học nổi bật</Text>
            <TouchableOpacity>
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
              snapToInterval={CARD_WIDTH + 20}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  menuButton: {
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginLeft: 12,
    padding: 4,
  },
  profileButton: {
    marginLeft: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.white,
    padding: 2,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: "rgba(0, 119, 190, 0.05)",
  },
  welcomeTitle: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.8,
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 10,
  },
  welcomeDescription: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    lineHeight: 24,
  },
  coursesSection: {
    paddingVertical: 30,
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
    color: colors.text,
  },
  seeAllText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
  },
  coursesContainer: {
    paddingLeft: 20,
  },
  courseCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + 120,
    marginRight: 20,
    borderRadius: 16,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    overflow: "hidden",
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
    opacity: 0.7,
    marginBottom: 12,
    lineHeight: 20,
  },
  courseInfo: {
    flexDirection: "row",
    marginBottom: 16,
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
  enrollButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  enrollButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
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
