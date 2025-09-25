import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/src/constants/colors";
import { useUserInfo } from "@/src/hooks";

// Import screen components
import MemberHomeScreen from "./index";
import MemberChatScreen from "./chat/chat";
import MemberExploreScreen from "./explore/explore";
import MemberNotificationScreen from "./notification/notification";
import MemberQRScreen from "./qr_code/qr-screen";
import ProfileScreen from "./profile";
import CourseDetail from "./course-detail";

// Import function screens (converted from popups)
import { ScheduleScreen } from "./home/Schedule";
import { CourseInfoScreen } from "./home/CourseInfo";
import { AttendanceReportScreen } from "./home/AttendanceReport";
import { PaymentHistoryScreen } from "./home/PaymentHistory";
import { FeedbackFacilitiesScreen } from "./home/FeedbackFacilities";
import { FeedbackScreen } from "./home/Feedback";
import { PersonalInfoScreen } from "./home/PersonalInfo";
import { RegulationsScreen } from "./home/Regulations";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Custom Drawer Content
function CustomDrawerContent(props: any) {
  const { userInfo, avatarUri } = useUserInfo();

  const menuItems = [
    {
      name: "Home",
      label: "Trang chủ",
      icon: "home-outline",
      focusedIcon: "home",
    },
    {
      name: "Schedule",
      label: "Thời khóa biểu",
      icon: "time-outline",
      focusedIcon: "time",
    },
    {
      name: "CourseInfo",
      label: "Thông tin khóa học",
      icon: "school-outline",
      focusedIcon: "school",
    },
    {
      name: "AttendanceReport",
      label: "Báo cáo điểm danh",
      icon: "stats-chart-outline",
      focusedIcon: "stats-chart",
    },
    {
      name: "PaymentHistory",
      label: "Lịch sử thanh toán",
      icon: "card-outline",
      focusedIcon: "card",
    },
    {
      name: "FeedbackFacilities",
      label: "Ý kiến cơ sở vật chất",
      icon: "business-outline",
      focusedIcon: "business",
    },
    {
      name: "Feedback",
      label: "Ý kiến khác",
      icon: "chatbubble-outline",
      focusedIcon: "chatbubble",
    },
    {
      name: "PersonalInfo",
      label: "Thông tin cá nhân",
      icon: "person-outline",
      focusedIcon: "person",
    },
    {
      name: "Regulations",
      label: "Các quy định",
      icon: "library-outline",
      focusedIcon: "library",
    },
  ];

  return (
    <SafeAreaView style={styles.drawerContainer}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <Image
          source={
            avatarUri
              ? { uri: avatarUri }
              : require("@/assets/images/default-avatar.jpg")
          }
          style={styles.drawerAvatar}
        />
        <Text style={styles.drawerTitle}>
          {userInfo?.username || "SWIM COURSE"}
        </Text>
        <Text style={styles.drawerSubtitle}>
          {userInfo?.email || "Member Portal"}
        </Text>
      </View>

      {/* Menu Items */}
      <DrawerContentScrollView {...props} style={styles.drawerContent}>
        {menuItems.map((item) => {
          const isFocused =
            props.state.index ===
            props.state.routes.findIndex(
              (route: any) => route.name === item.name
            );

          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.drawerItem, isFocused && styles.drawerItemFocused]}
              onPress={() => props.navigation.navigate(item.name)}
            >
              <Ionicons
                name={
                  isFocused ? (item.focusedIcon as any) : (item.icon as any)
                }
                size={24}
                color={isFocused ? colors.white : colors.primary}
                style={styles.drawerIcon}
              />
              <Text
                style={[
                  styles.drawerItemText,
                  isFocused && styles.drawerItemTextFocused,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.drawerFooter}>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => props.navigation.navigate("Profile")}
        >
          <Ionicons name="person-outline" size={20} color={colors.primary} />
          <Text style={styles.profileButtonText}>Hồ sơ cá nhân</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function MemberDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 280,
          backgroundColor: colors.white,
        },
        drawerType: "slide",
        overlayColor: "rgba(0,0,0,0.3)",
      }}
    >
      <Drawer.Screen name="Home" component={MemberHomeScreen} />
      <Drawer.Screen name="Schedule" component={ScheduleScreen} />
      <Drawer.Screen name="CourseInfo" component={CourseInfoScreen} />
      <Drawer.Screen
        name="AttendanceReport"
        component={AttendanceReportScreen}
      />
      <Drawer.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
      <Drawer.Screen
        name="FeedbackFacilities"
        component={FeedbackFacilitiesScreen}
      />
      <Drawer.Screen name="Feedback" component={FeedbackScreen} />
      <Drawer.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Drawer.Screen name="Regulations" component={RegulationsScreen} />
    </Drawer.Navigator>
  );
}

export default function TabLayout() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Drawer" component={MemberDrawer} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetail} />
      <Stack.Screen name="Chat" component={MemberChatScreen} />
      <Stack.Screen name="QR" component={MemberQRScreen} />
      <Stack.Screen name="Notification" component={MemberNotificationScreen} />
      <Stack.Screen name="Explore" component={MemberExploreScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  drawerHeader: {
    backgroundColor: colors.primary,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  drawerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.white,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 4,
  },
  drawerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 20,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 12,
    marginVertical: 2,
  },
  drawerItemFocused: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  drawerIcon: {
    marginRight: 15,
    width: 24,
  },
  drawerItemText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  drawerItemTextFocused: {
    color: colors.white,
    fontWeight: "600",
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0,119,190,0.1)",
  },
  profileButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
  },
});
