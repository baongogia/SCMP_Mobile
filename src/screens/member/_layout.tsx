import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { CustomDrawerContent } from "@/src/components";
import { AnimatedTabBar } from "@/src/components/layout/AnimatedTabBar";

// Import screen components
import MemberHomeScreen from "./index";
import MemberChatScreen from "./chat/chat";
import MemberExploreScreen from "./explore/explore";
import MemberNotificationScreen from "./notification/notification";
import MemberQRScreen from "./qr_code/qr-screen";

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

function MemberTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={MemberHomeScreen}
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
        component={MemberChatScreen}
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
        name="Explore"
        component={MemberExploreScreen}
        options={{
          title: "Khóa học",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "library" : "library-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Notification"
        component={MemberNotificationScreen}
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
        component={MemberQRScreen}
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
        <CustomDrawerContent {...props} userRole="member" />
      )}
    >
      <Drawer.Screen
        name="Tabs"
        component={MemberTabs}
        options={{ headerShown: false }}
      />
    </Drawer.Navigator>
  );
}
