import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ImageBackground,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUserInfo } from "@/src/hooks";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants";
import { showInfoToast } from "@/src/utils";

interface MenuItem {
  name: string;
  label: string;
  icon: string;
  focusedIcon: string;
  screen: string;
  description?: string;
}

const ProfileTabScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { userInfo, avatarUri } = useUserInfo();

  const menuItems: MenuItem[] = [
    {
      name: "Schedule",
      label: "Thời khóa biểu",
      icon: "time-outline",
      focusedIcon: "time",
      screen: "Schedule",
      description: "Xem lịch học của bạn",
    },
    {
      name: "CourseInfo",
      label: "Thông tin khóa học",
      icon: "school-outline",
      focusedIcon: "school",
      screen: "CourseInfo",
      description: "Xem thông tin khóa học",
    },
    {
      name: "Children",
      label: "Con của tôi",
      icon: "people-outline",
      focusedIcon: "people",
      screen: "Children",
      description: "Quản lý thông tin con",
    },
    {
      name: "AttendanceReport",
      label: "Báo cáo điểm danh",
      icon: "stats-chart-outline",
      focusedIcon: "stats-chart",
      screen: "AttendanceReport",
      description: "Xem báo cáo điểm danh",
    },
    {
      name: "PaymentHistory",
      label: "Lịch sử thanh toán",
      icon: "card-outline",
      focusedIcon: "card",
      screen: "PaymentHistory",
      description: "Xem lịch sử thanh toán",
    },
    {
      name: "FeedbackFacilities",
      label: "Ý kiến cơ sở vật chất",
      icon: "business-outline",
      focusedIcon: "business",
      screen: "FeedbackFacilities",
      description: "Góp ý về cơ sở vật chất",
    },
    {
      name: "Feedback",
      label: "Ý kiến khác",
      icon: "chatbubble-outline",
      focusedIcon: "chatbubble",
      screen: "Feedback",
      description: "Gửi ý kiến và phản hồi",
    },
    {
      name: "Regulations",
      label: "Các quy định",
      icon: "library-outline",
      focusedIcon: "library",
      screen: "Regulations",
      description: "Xem quy định và nội quy",
    },
  ];

  const handleMenuPress = (screen: string) => {
    (navigation as any).navigate(screen);
  };

  const handleProfilePress = () => {
    (navigation as any).navigate("ProfileDetail");
  };

  const renderMenuItem = (item: MenuItem, index: number) => (
    <TouchableOpacity
      key={item.name}
      style={styles.menuItem}
      onPress={() => handleMenuPress(item.screen)}
      activeOpacity={0.8}
    >
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemIcon}>
          <Ionicons name={item.icon as any} size={20} color="#1E3A8A" />
        </View>
        <View style={styles.menuItemText}>
          <Text style={styles.menuItemLabel}>{item.label}</Text>
          {item.description && (
            <Text style={styles.menuItemDescription}>{item.description}</Text>
          )}
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color="#9CA3AF"
          style={styles.menuItemArrow}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri: "https://i.pinimg.com/736x/56/13/8e/56138ebb21e03791f86c843aec147596.jpg",
        }}
        style={styles.header}
        imageStyle={styles.headerImage}
      >
        <SafeAreaView
          style={[
            styles.headerSafeArea,
            {
              paddingTop: Math.min(insets.top || 0, 12) + 6,
              paddingBottom: 16,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <Image
              source={
                avatarUri && avatarUri !== "null"
                  ? { uri: avatarUri }
                  : require("@/assets/images/default-avatar.jpg")
              }
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {userInfo?.username || "SWIM COURSE"}
              </Text>
              <Text style={styles.userEmail}>{userInfo?.email || ""}</Text>
              <Text style={styles.userRole}>Học viên</Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfilePress}
              activeOpacity={0.8}
            >
              <Ionicons name="person-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chức năng chính</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => renderMenuItem(item, index))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hỗ trợ</Text>
          <TouchableOpacity
            style={styles.supportItem}
            onPress={() =>
              showInfoToast("Thông báo", "Tính năng đang phát triển")
            }
            activeOpacity={0.8}
          >
            <View style={styles.supportItemContent}>
              <Ionicons name="help-circle-outline" size={20} color="#1E3A8A" />
              <Text style={styles.supportItemText}>Trợ giúp & Hỗ trợ</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  header: {
    height: 160,
  },
  headerImage: {
    resizeMode: "cover",
  },
  headerSafeArea: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 30,
    paddingTop: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: -0.5,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  userEmail: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.95,
    marginBottom: 2,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  userRole: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    backgroundColor: colors.mainBackground,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -12,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  menuGrid: {
    gap: 12,
  },
  menuItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 1,
    letterSpacing: -0.2,
  },
  menuItemDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  menuItemArrow: {
    marginLeft: 12,
  },
  supportItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  supportItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  supportItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
    marginLeft: 12,
    letterSpacing: -0.2,
  },
});

export default ProfileTabScreen;
