import {
  Image,
  StyleSheet,
  Platform,
  TouchableOpacity,
  View,
  Text,
  Modal,
  StatusBar,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, memo, useEffect } from "react";
import { BlurView } from "@react-native-community/blur";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { createApplication } from "@/src/services/applications/applicationsServices";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserInfo } from "@/src/hooks";
// Import popup components from their new locations
import { SchedulePopup } from "./home/Schedule/SchedulePopup";
import { CourseInfoPopup } from "./home/CourseInfo/CourseInfoPopup";
import { FeedbackFacilitiesPopup } from "./home/FeedbackFacilities/FeedbackFacilitiesPopup";
import { AttendanceReportPopup } from "./home/AttendanceReport/AttendanceReportPopup";
import { StudentFeedbackPopup } from "./home/StudentFeedback/StudentFeedbackPopup";
import { PersonalInfoPopup } from "./home/PersonalInfo/PersonalInfoPopup";
import { RegulationsPopup } from "./home/Regulations/RegulationsPopup";
import { FeedbackPopup } from "./home/Feedback/FeedbackPopup";
import { RequestPopup } from "./home/Request/RequestPopup";
// Import application components from components
import {
  ApplicationTypesModal,
  LeaveRequestForm,
  ScheduleChangeForm,
  GenericApplicationForm,
} from "@/src/components/applications";

const { width } = Dimensions.get("window");

// Beautiful glassmorphism card with blur effect
// eslint-disable-next-line react/display-name
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
  const [showApplicationTypes, setShowApplicationTypes] = useState(false);
  const [showLeaveRequestForm, setShowLeaveRequestForm] = useState(false);
  const [showScheduleChangeForm, setShowScheduleChangeForm] = useState(false);
  const [showGenericForm, setShowGenericForm] = useState(false);
  const [selectedApplicationType, setSelectedApplicationType] =
    useState<any>(null);
  const navigation = useNavigation();
  const { avatarUri, loadUserInfo } = useUserInfo();

  useEffect(() => {
    loadUserInfo();
    const unsubscribe = (navigation as any).addListener("focus", loadUserInfo);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMenuPress = (menuName: string) => {
    if (menuName === "other_request") {
      setShowApplicationTypes(true);
    } else {
      setActivePopup(menuName);
    }
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  const handleApplicationTypeSelect = (type: any) => {
    setShowApplicationTypes(false);
    if (type.id === "leave_request") {
      setShowLeaveRequestForm(true);
    } else if (type.id === "schedule_change") {
      setShowScheduleChangeForm(true);
    } else {
      // Handle other application types with generic form
      setSelectedApplicationType(type);
      setShowGenericForm(true);
    }
  };

  const handleShowForm = (formType: string) => {
    setShowApplicationTypes(false);
    if (formType === "leave_request") {
      setShowLeaveRequestForm(true);
    } else if (formType === "schedule_change") {
      setShowScheduleChangeForm(true);
    }
  };

  const handleApplicationSubmit = async (data: any) => {
    try {
      console.log("Application submitted:", data);

      // Gọi API để tạo đơn
      await createApplication({
        title: data.title,
        content: data.content,
        media: data.media || "",
        status: data.status || "pending",
        type: data.type,
      });

      // Đóng form và quay lại màn hình chọn loại đơn
      setShowLeaveRequestForm(false);
      setShowScheduleChangeForm(false);
      setShowGenericForm(false);
      setSelectedApplicationType(null);
      setShowApplicationTypes(true);

      // Hiển thị thông báo thành công
      // Toast.show({
      //   type: "success",
      //   text1: "Gửi đơn thành công",
      //   text2: "Đơn của bạn đã được gửi và đang chờ xử lý",
      // });
    } catch (error) {
      console.error("Error submitting application:", error);
      // Toast.show({
      //   type: "error",
      //   text1: "Lỗi gửi đơn",
      //   text2: "Vui lòng thử lại sau",
      // });
    }
  };

  const handleFormClose = () => {
    setShowLeaveRequestForm(false);
    setShowScheduleChangeForm(false);
    setShowGenericForm(false);
    setSelectedApplicationType(null);
    setShowApplicationTypes(true); // Quay lại màn hình chọn loại đơn
  };

  // Menu items data with icons - single color theme
  const menuItems = [
    {
      id: "other_request",
      title: "Gửi đơn",
      subtitle: "Yêu cầu khác",
      icon: "document-text-outline",
    },
    {
      id: "schedule",
      title: "Thời khóa biểu",
      subtitle: "Lịch dạy",
      icon: "time-outline",
    },
    {
      id: "course_info",
      title: "Thông tin khóa học",
      subtitle: "Chi tiết khóa học",
      icon: "school-outline",
    },
    {
      id: "feedback_facilities",
      title: "Ý kiến cơ sở vật chất",
      subtitle: "Góp ý cơ sở",
      icon: "business-outline",
    },
    {
      id: "other_feedback",
      title: "Ý kiến khác",
      subtitle: "Góp ý chung",
      icon: "chatbubble-outline",
    },
    {
      id: "attendance_report",
      title: "Báo cáo chấm công",
      subtitle: "Thống kê",
      icon: "stats-chart-outline",
    },
    {
      id: "student_feedback",
      title: "Góp ý học viên",
      subtitle: "Phản hồi",
      icon: "people-outline",
    },
    {
      id: "personal_info",
      title: "Thông tin cá nhân",
      subtitle: "Hồ sơ",
      icon: "person-outline",
    },
    {
      id: "regulations",
      title: "Các quy định",
      subtitle: "Nội quy",
      icon: "library-outline",
    },
  ];

  // Get popup title based on activePopup
  const getPopupTitle = () => {
    switch (activePopup) {
      case "other_request":
        return truncateText("Gửi đơn", 30);
      case "schedule":
        return truncateText("Thời khóa biểu", 30);
      case "course_info":
        return truncateText("Thông tin các khóa học", 30);
      case "feedback_facilities":
        return truncateText("Ý kiến về cơ sở vật chất", 30);
      case "other_feedback":
        return truncateText("Ý kiến khác", 30);
      case "attendance_report":
        return truncateText("Báo cáo chấm công", 30);
      case "student_feedback":
        return truncateText("Góp ý từ học viên", 30);
      case "personal_info":
        return truncateText("Thông tin cá nhân", 30);
      case "regulations":
        return truncateText("Các quy định", 30);
      default:
        return "";
    }
  };

  // Popup content based on activePopup - now using component imports
  const renderPopupContent = () => {
    switch (activePopup) {
      case "other_request":
        return <RequestPopup />;
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
      case "student_feedback":
        return <StudentFeedbackPopup />;
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
        {/* Removed hamburger since Drawer is no longer used */}
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>SWIM COURSE</Text>
          <Text style={styles.headerSubtitle}>Instructor Portal</Text>
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
      >
        <View style={styles.contentContainer}>
          <View style={styles.gridContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleMenuPress(item.id)}
                activeOpacity={0.8}
              >
                <GlassCard style={styles.blurContainer}>
                  <View style={styles.cardContent}>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name={item.icon as any}
                        size={28}
                        color={colors.primary}
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

      {/* Application Types Modal */}
      <ApplicationTypesModal
        visible={showApplicationTypes}
        onClose={() => setShowApplicationTypes(false)}
        onSelectType={handleApplicationTypeSelect}
        onShowForm={handleShowForm}
      />

      {/* Leave Request Form Modal */}
      <LeaveRequestForm
        visible={showLeaveRequestForm}
        onClose={handleFormClose}
        onSubmit={handleApplicationSubmit}
      />

      {/* Schedule Change Form Modal */}
      <ScheduleChangeForm
        visible={showScheduleChangeForm}
        onClose={handleFormClose}
        onSubmit={handleApplicationSubmit}
      />

      {/* Generic Application Form Modal */}
      {selectedApplicationType && (
        <GenericApplicationForm
          visible={showGenericForm}
          onClose={handleFormClose}
          onSubmit={handleApplicationSubmit}
          applicationType={selectedApplicationType}
        />
      )}
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
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 2,
    borderColor: "rgba(0, 119, 190, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: colors.primary,
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
