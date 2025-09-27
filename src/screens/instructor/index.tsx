import {
  Image,
  StyleSheet,
  Platform,
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  Dimensions,
} from "react-native";
import { memo, useEffect } from "react";
import { BlurView } from "@react-native-community/blur";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { useUserInfo } from "@/src/hooks";

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
  const navigation = useNavigation();
  const { userInfo, avatarUri, loadUserInfo } = useUserInfo();

  useEffect(() => {
    loadUserInfo();
    const unsubscribe = (navigation as any).addListener("focus", loadUserInfo);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        <Image style={styles.backgroundImage} resizeMode="cover" />
        <View style={styles.gradientOverlay} />
        <View style={styles.overlay} />
      </View>

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
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Chào mừng {userInfo?.name ? userInfo.name : "bạn"} đến với
          </Text>
          <Text style={styles.welcomeSubtitle}>Hệ thống quản lý</Text>
          <Text style={styles.welcomeDescription}>
            Quản lý khóa học, học viên và các hoạt động giảng dạy một cách hiệu
            quả
          </Text>
        </View>

        {/* Statistics Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Thống kê</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="school" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Khóa học</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>45</Text>
              <Text style={styles.statLabel}>Học viên</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>98%</Text>
              <Text style={styles.statLabel}>Hài lòng</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  menuSection: {
    paddingVertical: 30,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
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
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
