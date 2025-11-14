import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Import screen components
import MemberHomeScreen from "./index";
import MemberChatScreen from "./chat/chat";
import CoursesScreen from "./course/CoursesScreen";
import MemberNotificationScreen from "./extension/notification/notification";
import MemberQRScreen from "./extension/qr_code/qr-screen";
import ProfileScreen from "./auth/profile";
import CourseDetail from "./course/course_detail";
import ProfileTabScreen from "./auth/individual/ProfileTabScreen";
import SearchTabScreen from "../../components/layout/search_tab/SearchTabScreen";

// Import function screens (converted from popups)
import { ScheduleScreen } from "./home/Schedule";
import { CourseInfoScreen } from "./home/CourseInfo";
import { AttendanceReportScreen } from "./home/AttendanceReport";
import {
  PaymentHistoryScreen,
  PaymentDetailScreen,
} from "./home/PaymentHistory";
import { FeedbackFacilitiesScreen } from "./home/FeedbackFacilities";
import { FeedbackScreen } from "./home/Feedback";
import { PersonalInfoScreen } from "./home/PersonalInfo";
import { RegulationsScreen } from "./home/Regulations";
import { NewsScreen } from "../../components/ui/news/NewsScreen";
import { NewsDetailScreen } from "../../components/ui/news/NewsDetailScreen";
import {
  RequestScreen,
  ApplicationDetailScreen,
} from "../instructor/home/Request";

// Import children screens
import { ChildrenScreen, ChildrenScheduleScreen } from "./home/Children";

// Import class selection screen
import ClassSelectionScreen from "./course/class_selection/ClassSelectionScreen";
// PaymentScreen is platform-specific, React Native will auto-resolve
// @ts-ignore - React Native platform-specific resolution
import PaymentScreen from "./course/payment/PaymentScreen";

// Import AI chat screen
import AIChatScreen from "./home/AI_agent/AIChatScreen";

// Import BottomTabNavigator
import BottomTabNavigator from "@/src/components/custom/bottom-tab/BottomTabNavigator";
import { BottomTabProvider } from "@/src/contexts/BottomTabContext";
import LearningPathScreen from "./home/LearningPath/LearningPathScreen";
import { CertificateViewer } from "@/src/components/custom/certificate/CertificateViewer";

const Stack = createNativeStackNavigator();

// Bottom Tab Navigator for Member
function MemberBottomTabs() {
  return (
    <BottomTabProvider>
      <BottomTabNavigator>
        <BottomTabNavigator.Screen
          name="Home"
          component={MemberHomeScreen}
          options={{
            tabBarLabel: "Trang chủ",
          }}
        />
        <BottomTabNavigator.Screen
          name="Message"
          component={MemberChatScreen}
          options={{
            tabBarLabel: "Tin nhắn",
          }}
        />
        <BottomTabNavigator.Screen
          name="Search"
          component={SearchTabScreen}
          options={{
            tabBarLabel: "Tìm kiếm",
          }}
        />
        <BottomTabNavigator.Screen
          name="Profile"
          component={ProfileTabScreen}
          options={{
            tabBarLabel: "Cá nhân",
          }}
        />
      </BottomTabNavigator>
    </BottomTabProvider>
  );
}

export default function TabLayout() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="BottomTabs" component={MemberBottomTabs} />
      <Stack.Screen name="ProfileDetail" component={ProfileScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetail} />
      <Stack.Screen name="ClassSelection" component={ClassSelectionScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="Courses" component={CoursesScreen} />
      <Stack.Screen name="Chat" component={MemberChatScreen} />
      <Stack.Screen name="QR" component={MemberQRScreen} />
      <Stack.Screen name="Notification" component={MemberNotificationScreen} />
      <Stack.Screen
        name="ChildrenSchedule"
        component={ChildrenScheduleScreen as any}
      />
      <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
      {/* Function screens */}
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="CourseInfo" component={CourseInfoScreen} />
      <Stack.Screen name="Children" component={ChildrenScreen} />
      <Stack.Screen
        name="AttendanceReport"
        component={AttendanceReportScreen}
      />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
      <Stack.Screen
        name="FeedbackFacilities"
        component={FeedbackFacilitiesScreen}
      />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="Regulations" component={RegulationsScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
      <Stack.Screen name="MemberRequest" component={RequestScreen} />
      <Stack.Screen
        name="MemberApplicationDetail"
        component={ApplicationDetailScreen}
      />
      <Stack.Screen name="LearningPath" component={LearningPathScreen} />
      <Stack.Screen name="CertificateViewer" component={CertificateViewer} />
      {/* AI Chat screens */}
      <Stack.Screen name="CreateLearningPath" component={AIChatScreen} />
      <Stack.Screen name="LearningConsultation" component={AIChatScreen} />
    </Stack.Navigator>
  );
}
