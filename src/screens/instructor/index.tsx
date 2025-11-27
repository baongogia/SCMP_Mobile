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
import { getInstructorNews } from "@/src/services/information/news/newServices";
import { NewsItem } from "@/src/types/news";
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
      onPress: () => (navigation as any).navigate("ClassManagement"),
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
        </View>
      </ScrollView>
    </TabTransitionView>
  );
}
