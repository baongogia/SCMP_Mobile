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
import GlobalToast from "@/src/components/custom/toast/GlobalToast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SkiaGlassProvider } from "@/src/components/layout/background/SkiaGlassProvider";
import { eventBus } from "@/src/utils/eventBus";
import { STORAGE_KEYS } from "@/src/constants/config";

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
    // Redirect to login on global logout
    const off = eventBus.on("auth:logout", async () => {
      try {
        router.replace("/");
      } catch {}
    });
    return () => off();
  }, [router]);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        if (!loaded) return;

        const [token, userString, tenantString] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.TENANT),
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

  const TransparentTheme = {
    ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      background: "transparent",
      card: "transparent",
    },
  };

  // https://i.pinimg.com/736x/92/c3/db/92c3db414f04707ce9a00c7d07b7f449.jpg - wave
  // https://i.pinimg.com/736x/94/7f/dd/947fdd8844d54e88323fb83e1c61cda1.jpg - simple
  // https://i.pinimg.com/1200x/92/1f/b3/921fb356ea781865a5ad340561c1f616.jpg - stary night
  // https://i.pinimg.com/736x/02/fe/d7/02fed762555422200ca3368f89affab1.jpg - cozy
  // https://i.pinimg.com/1200x/3e/12/7d/3e127d660c3233f20d1515737da7c0ca.jpg - pool

  return (
    <SafeAreaProvider>
      <SocketProvider>
        <UnreadMessagesProvider>
          <ThemeProvider value={TransparentTheme}>
            <View style={{ flex: 1 }}>
              <SkiaGlassProvider
                backgroundUri="https://i.pinimg.com/1200x/3e/12/7d/3e127d660c3233f20d1515737da7c0ca.jpg"
                backgroundBlur={6}
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
