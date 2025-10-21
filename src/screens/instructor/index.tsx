import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { useUserInfo } from "@/src/hooks";
import { NewsSection } from "@/src/components/layout/news";
// import { LinearGradient } from "expo-linear-gradient";
import { getInstructorNews } from "@/src/services/information/news/newServices";
import { NewsItem } from "@/src/types/news";
import { eventBus } from "@/src/utils/eventBus";
import { WelcomeSection } from "@/src/components/layout/welcome/WelcomeSection";
import TabTransitionView from "@/src/components/custom/bottom-tab/TabTransitionView";
import { showErrorToast } from "@/src/utils/errorHandler";
const { width } = Dimensions.get("window");

export default function HomeScreen() {
  // const BG_URI = "";
  const navigation = useNavigation();
  const { userInfo, loadUserInfo } = useUserInfo();

  // console.log("Header - userInfo:", userInfo?.username, "avatarUri:", avatarUri);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    loadUserInfo();
    loadNews();
    const unsubscribe = (navigation as any).addListener("focus", loadUserInfo);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for navigate:chat events from GlobalToast
  useEffect(() => {
    const offNavigateChat = eventBus.on("navigate:chat", (data: any) => {
      console.log(
        "[Instructor Home] Received navigate:chat event, navigating to Chat screen"
      );
      // GlobalToast đã navigate trực tiếp, chỉ cần navigate đến Chat screen
      (navigation as any).navigate("Chat");
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
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải tin tức",
        message: "Không thể tải tin tức",
      });
    } finally {
      setNewsLoading(false);
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
      onPress: () => (navigation as any).navigate("CourseInfo"),
    },
    {
      id: "request",
      title: "Gửi đơn",
      subtitle: "Đơn từ",
      icon: "document-text-outline",
      color: "#96CEB4",
      onPress: () => (navigation as any).navigate("Request"),
    },
    {
      id: "feedback",
      title: "Phản hồi",
      subtitle: "Góp ý học viên",
      icon: "chatbubble-outline",
      color: "#FFEAA7",
      onPress: () => (navigation as any).navigate("StudentFeedback"),
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
          temperatureC={29}
          weatherDesc="Nắng nhẹ"
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
            <Text style={styles.sectionTitle}>Thống kê hôm nay</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                </View>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Buổi dạy</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="people" size={20} color={colors.primary} />
                </View>
                <Text style={styles.statNumber}>24</Text>
                <Text style={styles.statLabel}>Học viên</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="time" size={20} color={colors.primary} />
                </View>
                <Text style={styles.statNumber}>4.5h</Text>
                <Text style={styles.statLabel}>Giờ dạy</Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
            <View style={styles.activityCard}>
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Hoàn thành buổi dạy</Text>
                  <Text style={styles.activitySubtitle}>
                    Bơi cơ bản - 14:00
                  </Text>
                </View>
                <Text style={styles.activityTime}>2h trước</Text>
              </View>
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="person-add" size={20} color="#2196F3" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Học viên mới</Text>
                  <Text style={styles.activitySubtitle}>
                    Nguyễn Văn A đăng ký
                  </Text>
                </View>
                <Text style={styles.activityTime}>5h trước</Text>
              </View>
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="star" size={20} color="#FF9800" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Đánh giá mới</Text>
                  <Text style={styles.activitySubtitle}>5 sao từ học viên</Text>
                </View>
                <Text style={styles.activityTime}>1 ngày trước</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </TabTransitionView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  pageBody: {
    backgroundColor: colors.mainBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 36,
    marginTop: -28,
    paddingTop: 20,
    zIndex: 2,
  },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    opacity: 0.8,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
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
  greetingContainerLeft: { flex: 1 },
  greetingTextLight: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E3F2FD",
    opacity: 0.95,
    marginBottom: 6,
  },

  weatherChipLight: {
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
    alignSelf: "flex-start",
  },
  weatherTextLight: {
    marginLeft: 6,
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  dotLight: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginHorizontal: 6,
    opacity: 0.5,
  },
  rightTimeBox: {
    width: 140,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  timeBackdrop: {
    position: "absolute",
    right: -6,
    top: -6,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  timeTextHero: { color: colors.white, fontSize: 26, fontWeight: "800" },
  dateTextHero: { color: "#EAF6FF", fontSize: 12, marginBottom: 4 },
  quickActionsSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 18,
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
  actionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 0,
  },
  actionTitleCompact: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    lineHeight: 14,
  },
  actionTitleBelow: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.titleColor,
  },
  contentContainer: {
    padding: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: 30,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  glassCard: {
    width: (width - 56) / 2,
    height: 140,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  blurBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  glassOverlay: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    zIndex: 1,
  },
  blurContainer: {
    width: (width - 56) / 2,
    height: 140,
    borderRadius: 20,
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 4,
    lineHeight: 18,
    textShadowColor: "rgba(255, 255, 255, 1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.text,
    textAlign: "center",
    opacity: 1,
    fontWeight: "500",
    textShadowColor: "rgba(255, 255, 255, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    borderRadius: 16,
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    textAlign: "center",
  },
  activitySection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  activityCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  activityTime: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
  },
});
