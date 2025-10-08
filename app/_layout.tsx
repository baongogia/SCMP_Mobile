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
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { SocketProvider } from "@/src/contexts/SocketContext";
import GlobalToast from "@/src/components/custom/GlobalToast";
import AsyncStorage from "@react-native-async-storage/async-storage";
// useRouter imported above with Stack

if (__DEV__) {
  void import("../src/config/flipper");
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
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
        // Wait for fonts before navigating to avoid flicker
        if (!loaded) return;

        const [token, userString, tenantString] = await Promise.all([
          AsyncStorage.getItem("loginToken"),
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("tenant"),
        ]);

        if (token && userString) {
          // Decide destination based on tenant and role
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
        // Fail silently and stay on login
      } finally {
        setBootstrapped(true);
        SplashScreen.hideAsync();
      }
    };

    bootstrapAuth();
  }, [loaded, router]);

  // Suppress web Wake Lock keep-awake promise rejection during dev
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

  return (
    <SafeAreaProvider>
      <SocketProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="select-tenant"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="member" options={{ headerShown: false }} />
            <Stack.Screen name="instructor" options={{ headerShown: false }} />
            <Stack.Screen
              name="webview-call"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="payment-success"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
          <Toast />
          <GlobalToast />
        </ThemeProvider>
      </SocketProvider>
    </SafeAreaProvider>
  );
}
