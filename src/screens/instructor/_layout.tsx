import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Import screen components
import InstructorHomeScreen from "./index";
import InstructorChatScreen from "./chat/chat";
import InstructorNotificationScreen from "./extension/notification/notification";
import InstructorQRScreen from "./extension/qr_code/qr-screen";
import ProfileScreen from "./auth/profile";
import ProfileTabScreen from "./auth/individual/ProfileTabScreen";
import SearchTabScreen from "../../components/layout/search_tab/SearchTabScreen";

// Import function screens (converted from popups)
import { ScheduleScreen } from "./home/Schedule";
import { CourseInfoScreen } from "./home/CourseInfo";
import { AttendanceReportScreen } from "./home/AttendanceReport";
import { FeedbackFacilitiesScreen } from "./home/FeedbackFacilities";
import { FeedbackScreen } from "./home/Feedback";
import { PersonalInfoScreen } from "./home/PersonalInfo";
import { RegulationsScreen } from "./home/Regulations";
import { StudentFeedbackScreen } from "./home/StudentFeedback";
import { RequestScreen, ApplicationDetailScreen } from "./home/Request";
import { NewsScreen } from "../../components/ui/news/NewsScreen";
import { NewsDetailScreen } from "../../components/ui/news/NewsDetailScreen";
import { NoteScreen } from "./home/Note";
import {
  UpdatePassedStudentsScreen,
  StudentListScreen,
} from "./home/UpdatePassedStudents";
import {
  AttendanceEvaluationScreen,
  StudentListScreen as AttendanceStudentListScreen,
} from "./home/AttendanceEvaluation";

// Import BottomTabNavigator
import BottomTabNavigator from "@/src/components/custom/bottom-tab/BottomTabNavigator";
import { BottomTabProvider } from "@/src/contexts/BottomTabContext";

const Stack = createNativeStackNavigator();

// Bottom Tab Navigator for Instructor
function InstructorBottomTabs() {
  return (
    <BottomTabProvider>
      <BottomTabNavigator>
        <BottomTabNavigator.Screen
          name="Home"
          component={InstructorHomeScreen}
          options={{
            tabBarLabel: "Trang chủ",
          }}
        />
        <BottomTabNavigator.Screen
          name="Message"
          component={InstructorChatScreen}
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
      <Stack.Screen name="BottomTabs" component={InstructorBottomTabs} />
      <Stack.Screen name="ProfileDetail" component={ProfileScreen} />
      <Stack.Screen name="Chat" component={InstructorChatScreen} />
      <Stack.Screen name="QR" component={InstructorQRScreen} />
      <Stack.Screen
        name="Notification"
        component={InstructorNotificationScreen}
      />
      {/* Function screens */}
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="CourseInfo" component={CourseInfoScreen} />
      <Stack.Screen
        name="AttendanceReport"
        component={AttendanceReportScreen}
      />
      <Stack.Screen
        name="FeedbackFacilities"
        component={FeedbackFacilitiesScreen}
      />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="StudentFeedback" component={StudentFeedbackScreen} />
      <Stack.Screen name="Request" component={RequestScreen} />
      <Stack.Screen
        name="ApplicationDetail"
        component={ApplicationDetailScreen}
      />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="Regulations" component={RegulationsScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
      <Stack.Screen name="Note" component={NoteScreen} />
      <Stack.Screen
        name="UpdatePassedStudents"
        component={UpdatePassedStudentsScreen}
      />
      <Stack.Screen name="StudentList" component={StudentListScreen} />
      <Stack.Screen
        name="AttendanceEvaluation"
        component={AttendanceEvaluationScreen}
      />
      <Stack.Screen
        name="AttendanceStudentList"
        component={AttendanceStudentListScreen}
      />
    </Stack.Navigator>
  );
}
