import {
  Image,
  StyleSheet,
  Platform,
  TouchableOpacity,
  View,
  Text,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
} from "react-native";
import { useState, memo } from "react";
import { BlurView } from "@react-native-community/blur";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ParallaxScrollView from "@/src/components/layout/ParallaxScrollView";
import { ThemedText } from "@/src/components/base/ThemedText";
import { ThemedView } from "@/src/components/base/ThemedView";
import { colors } from "@/src/constants/colors";
import { dimensions } from "@/src/constants/dimensions";
// Import all popup components
import {
  SchedulePopup,
  CourseInfoPopup,
  FeedbackFacilitiesPopup,
  AttendanceReportPopup,
  PaymentHistoryPopup,
  PersonalInfoPopup,
  RegulationsPopup,
  FeedbackPopup,
} from "@/src/components/modals/member";

const { width } = Dimensions.get("window");

// Beautiful glassmorphism card with blur effect
const GlassCard = memo(
  ({ children, style }: { children: React.ReactNode; style: any }) => {
    return (
      <View style={[style, styles.glassCard]}>
        <BlurView
          style={styles.blurBackground}
          blurType="light"
          blurAmount={15}
          reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.9)"
        />
        <View style={styles.glassOverlay}>{children}</View>
      </View>
    );
  }
);

export default function HomeScreen() {
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const navigation = useNavigation();

  const handleMenuPress = (menuName: string) => {
    setActivePopup(menuName);
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  // Menu items data with original member colors and functionality
  const menuItems = [
    {
      id: "schedule",
      title: "Thời khóa biểu",
      subtitle: "Lịch học",
      icon: "time-outline",
      color: "#FF9800",
    },
    {
      id: "course_info",
      title: "Thông tin các khóa học",
      subtitle: "Chi tiết khóa học",
      icon: "school-outline",
      color: "#9C27B0",
    },
    {
      id: "feedback_facilities",
      title: "Ý kiến về cơ sở vật chất",
      subtitle: "Góp ý cơ sở",
      icon: "business-outline",
      color: "#F44336",
    },
    {
      id: "other_feedback",
      title: "Ý kiến khác",
      subtitle: "Góp ý chung",
      icon: "chatbubble-outline",
      color: "#607D8B",
    },
    {
      id: "attendance_report",
      title: "Báo cáo điểm danh",
      subtitle: "Thống kê",
      icon: "stats-chart-outline",
      color: "#795548",
    },
    {
      id: "payment_history",
      title: "Lịch sử giao dịch",
      subtitle: "Thanh toán",
      icon: "people-outline",
      color: "#009688",
    },
    {
      id: "personal_info",
      title: "Thông tin cá nhân",
      subtitle: "Hồ sơ",
      icon: "person-outline",
      color: "#3F51B5",
    },
    {
      id: "regulations",
      title: "Các quy định",
      subtitle: "Nội quy",
      icon: "library-outline",
      color: "#E91E63",
    },
  ];

  // Get popup title based on activePopup - original member logic
  const getPopupTitle = () => {
    const item = menuItems.find((item) => item.id === activePopup);
    return item ? item.title : "";
  };

  // Popup content based on activePopup - now using component imports
  const renderPopupContent = () => {
    switch (activePopup) {
      case "schedule":
        return <SchedulePopup />;
      case "course_info":
        return <CourseInfoPopup />;
      case "feedback_facilities":
        return <FeedbackFacilitiesPopup />;
      case "other_feedback":
        return <FeedbackPopup />;
      case "attendance_report":
        return <AttendanceReportPopup />;
      case "payment_history":
        return <PaymentHistoryPopup />;
      case "personal_info":
        return <PersonalInfoPopup />;
      case "regulations":
        return <RegulationsPopup />;
      default:
        return null;
    }
  };

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number = 24) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <View style={styles.container}>
      {/* Beautiful Glass Background */}
      <View style={styles.backgroundContainer}>
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <View style={styles.gradientOverlay} />
        <View style={styles.overlay} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            // @ts-expect-error: openDrawer is available on DrawerNavigationProp
            navigation.openDrawer();
          }}
        >
          <Ionicons name="menu" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>SWIM COURSE</Text>
          <Text style={styles.headerSubtitle}>Member Portal</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handleMenuPress("notifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.white}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => handleMenuPress("personal_info")}
          >
            <Image
              source={require("@/assets/images/default-avatar.jpg")}
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
      >
        <View style={styles.contentContainer}>
          <Text style={styles.mainTitle}>Danh mục chức năng</Text>

          <View style={styles.gridContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleMenuPress(item.id)}
                activeOpacity={0.8}
              >
                <GlassCard style={styles.blurContainer}>
                  <View style={styles.cardContent}>
                    <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                      <Ionicons
                        name={item.icon as any}
                        size={28}
                        color="white"
                      />
                    </View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Full Screen Popup */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={activePopup !== null}
        onRequestClose={closePopup}
      >
        <SafeAreaView style={styles.fullScreenPopup}>
          <StatusBar barStyle="light-content" />
          <View style={styles.popupHeader}>
            <TouchableOpacity style={styles.backButton} onPress={closePopup}>
              <Text style={styles.backButtonText}>Quay lại</Text>
            </TouchableOpacity>
            <Text style={styles.popupHeaderTitle}>{getPopupTitle()}</Text>
          </View>

          <View style={styles.popupContent}>{renderPopupContent()}</View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: "rgba(0, 119, 190, 0.15)",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuButton: {
    marginRight: 16,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabButton: {
    marginLeft: 12,
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
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  fullScreenPopup: {
    flex: 1,
    backgroundColor: "#fff",
  },
  popupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    height: 56,
  },
  backButton: {
    position: "absolute",
    left: 16,
    zIndex: 10,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  popupHeaderTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
    paddingHorizontal: 50,
  },
  popupContent: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "flex-start",
  },
});
