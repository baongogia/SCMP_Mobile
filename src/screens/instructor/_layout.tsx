import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { CustomDrawerContent } from "@/src/components";
import { AnimatedTabBar } from "@/src/components/layout/AnimatedTabBar";

// Import screen components
import InstructorHomeScreen from "./index";
import InstructorChatScreen from "./chat";
import InstructorNotificationScreen from "./notification";
import InstructorQRScreen from "./qr-screen";

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

function InstructorTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={InstructorHomeScreen}
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={InstructorChatScreen}
        options={{
          title: "Tin nhắn",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Notification"
        component={InstructorNotificationScreen}
        options={{
          title: "Thông báo",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="QR"
        component={InstructorQRScreen}
        options={{
          title: "QR Code",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "qr-code" : "qr-code-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function TabLayout() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent {...props} userRole="instructor" />
      )}
    >
      <Drawer.Screen
        name="Tabs"
        component={InstructorTabs}
        options={{ headerShown: false }}
      />
    </Drawer.Navigator>
  );
}
