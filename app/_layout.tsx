// app/_layout.tsx
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ImageBackground, Platform, StyleSheet, View } from "react-native"; // 👈 thêm
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { SocketProvider } from "@/src/contexts/SocketContext";
import { UnreadMessagesProvider } from "@/src/contexts/UnreadMessagesContext";
import GlobalToast from "@/src/components/custom/GlobalToast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SkiaGlassProvider } from "@/src/components/layout/background/SkiaGlassProvider";

if (__DEV__) {
  void import("../src/config/flipper");
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [bootstrapped, setBootstrapped] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const initialPathRef = useRef(pathname);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        if (!loaded) return;

        const [token, userString, tenantString] = await Promise.all([
          AsyncStorage.getItem("loginToken"),
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("tenant"),
        ]);

        if (token && userString) {
          const user = JSON.parse(userString);
          const roleFront: string[] = Array.isArray(user?.role_front)
            ? user.role_front
            : [];

          const target = tenantString
            ? roleFront.includes("member")
              ? "/member"
              : roleFront.includes("instructor")
              ? "/instructor"
              : "/select-tenant"
            : "/select-tenant";

          const currentPath = initialPathRef.current || "/";
          const alreadyInSection =
            (target === "/member" && currentPath.startsWith("/member")) ||
            (target === "/instructor" &&
              currentPath.startsWith("/instructor")) ||
            (target === "/select-tenant" &&
              currentPath.startsWith("/select-tenant"));

          if (!alreadyInSection && currentPath !== target) {
            router.replace(target);
          }
        }
      } catch {
        // ignore
      } finally {
        setBootstrapped(true);
        SplashScreen.hideAsync();
      }
    };

    bootstrapAuth();
  }, [loaded, router]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = (event: PromiseRejectionEvent) => {
      const reason = String((event as any).reason ?? "");
      if (reason.includes("Unable to activate keep awake")) {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  if (!loaded || !bootstrapped) {
    return null;
  }

  // 👇 Optional: làm theme trong suốt để không “đè” nền (an toàn trên RN mới)
  const TransparentTheme = {
    ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      background: "transparent",
      card: "transparent",
    },
  };

  return (
    <SafeAreaProvider>
      <SocketProvider>
        <UnreadMessagesProvider>
          <ThemeProvider value={TransparentTheme}>
            <View style={{ flex: 1 }}>
              <SkiaGlassProvider
                backgroundUri="https://i.pinimg.com/736x/92/c3/db/92c3db414f04707ce9a00c7d07b7f449.jpg"
                backgroundBlur={0}
                backgroundEnabled={true}
              >
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: "transparent" },
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="select-tenant" />
                  <Stack.Screen name="member" />
                  <Stack.Screen name="instructor" />
                  <Stack.Screen name="webview-call" />
                  <Stack.Screen name="payment-success" />
                  <Stack.Screen
                    name="+not-found"
                    options={{ headerShown: true }}
                  />
                </Stack>

                <StatusBar style="auto" />
                <Toast />
                <GlobalToast />
              </SkiaGlassProvider>
            </View>
          </ThemeProvider>
        </UnreadMessagesProvider>
      </SocketProvider>
    </SafeAreaProvider>
  );
}
