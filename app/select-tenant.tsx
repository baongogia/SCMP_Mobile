import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Stack, useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { courseService } from "@/src/services";
import { toastConfig } from "@/src/components/custom/toast/CustomToast";
import { colors } from "@/src/constants/colors";
import { dimensions } from "@/src/constants/dimensions";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BubbleAnimation } from "@/src/components/ui";
import {
  Canvas,
  BackdropFilter,
  Blur,
  RoundedRect,
  useImage,
  Image as SkiaImage,
} from "@shopify/react-native-skia";

export default function SelectTenantScreen() {
  const BG_URI =
    "https://i.pinimg.com/736x/a6/a8/a4/a6a8a4f2f47d02a5cb544e155c3365af.jpg";
  const bgImage = useImage(BG_URI);
  const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
  const [panelLayout, setPanelLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [tenants, setTenants] = useState<{ label: string; value: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigation = useNavigation();

  const initializeData = useCallback(async () => {
    try {
      setLoading(true);

      // Add a small delay to ensure token is stored after login
      await new Promise((resolve) => setTimeout(resolve, 100));

      const [userData, token] = await Promise.all([
        AsyncStorage.getItem("user"),
        AsyncStorage.getItem("loginToken"),
      ]);

      if (userData) {
        const parsedUserData = JSON.parse(userData);
        setUser(parsedUserData);

        if (token) {
          await fetchTenants(token, parsedUserData);
        } else {
          // Retry once after a short delay
          await new Promise((resolve) => setTimeout(resolve, 500));
          const retryToken = await AsyncStorage.getItem("loginToken");
          if (retryToken) {
            await fetchTenants(retryToken, parsedUserData);
          } else {
            Toast.show({
              type: "error",
              text1: "No authentication token found",
            });
          }
        }
      } else if (token) {
        await fetchTenants(token);
      } else {
        Toast.show({
          type: "error",
          text1: "No authentication token found",
        });
      }
    } catch (error) {
      console.error("Error initializing data:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load tenant data",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void initializeData();
  }, [initializeData]);

  const fetchTenants = async (token: string, userData?: any) => {
    try {
      const storedToken = await AsyncStorage.getItem("loginToken");
      if (!storedToken) {
        throw new Error("No authentication token found");
      }
      const currentUser = userData || user;
      const userRole = currentUser?.role_front?.[0] || "instructor";
      console.log("User role:", userRole);

      const response = await courseService.getAvailableTenants();
      console.log("Tenants response:", response);

      const rawTenants = response.data || [];
      const tenantsData =
        Array.isArray(rawTenants) && Array.isArray(rawTenants[0])
          ? rawTenants[0]
          : rawTenants;
      const mappedTenants = (tenantsData as any[]).map((item: any) => ({
        label: item?.tenant_id?.title ?? item?.title ?? "",
        value: item?.tenant_id?._id ?? item?._id ?? "",
      }));

      console.log("Mapped tenants:", mappedTenants);
      setTenants(mappedTenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      Toast.show({
        type: "error",
        text1: "Failed to fetch tenants",
      });
    }
  };

  const handleTenantSelect = async (tenant: {
    label: string;
    value: string;
  }) => {
    try {
      // This line already saves the tenant to AsyncStorage
      await AsyncStorage.setItem("tenant", JSON.stringify(tenant));

      // Navigate based on user role - now using screens from src/
      const role_front = user?.role_front;
      if (Array.isArray(role_front)) {
        if (role_front.includes("member")) {
          // Navigate to member layout using the navigation system
          // The actual navigation will be handled by the app structure
          navigation.navigate("member" as never);
        } else if (role_front.includes("instructor")) {
          // Navigate to instructor layout using the navigation system
          navigation.navigate("instructor" as never);
        }
      }
    } catch (error) {
      console.error("Error selecting tenant:", error);
      Toast.show({
        type: "error",
        text1: "Failed to select tenant",
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.gradientContainer}>
        <Canvas style={styles.bgCanvas} opaque={false}>
          {bgImage && (
            <SkiaImage
              image={bgImage}
              x={0}
              y={0}
              width={SCREEN_W}
              height={SCREEN_H}
              fit="cover"
            />
          )}
        </Canvas>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCircle}>
            <ActivityIndicator size="large" color={colors.white} />
          </View>
          <Text style={styles.loadingText}>
            Đang tải danh sách chi nhánh...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Chọn Chi Nhánh", headerShown: false }} />
      <BubbleAnimation bubbleCount={10} />
      <View style={styles.gradientContainer}>
        <Canvas style={styles.bgCanvas} opaque={false}>
          {bgImage && (
            <SkiaImage
              image={bgImage}
              x={0}
              y={0}
              width={SCREEN_W}
              height={SCREEN_H}
              fit="cover"
            />
          )}
          {panelLayout.width > 0 && panelLayout.height > 0 && (
            <BackdropFilter filter={<Blur blur={10} />}>
              <RoundedRect
                x={panelLayout.x}
                y={panelLayout.y}
                width={panelLayout.width}
                height={panelLayout.height}
                r={20}
                color="rgba(255,255,255,0.10)"
              />
            </BackdropFilter>
          )}
        </Canvas>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 48 : 0}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
          >
            <View style={styles.headerContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="business" size={40} color={colors.white} />
              </View>
              <Text style={styles.appTitle}>Chọn Chi Nhánh</Text>
              <Text style={styles.appSubtitle}>
                Vui lòng chọn chi nhánh để tiếp tục sử dụng ứng dụng
              </Text>
            </View>

            <View
              style={styles.contentContainer}
              onLayout={(e) => setPanelLayout(e.nativeEvent.layout)}
            >
              {tenants.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.tenantCard}
                  onPress={() => handleTenantSelect(item)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.white, "#f8f9fa"]}
                    style={styles.tenantGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.tenantIconContainer}>
                      <Ionicons
                        name="storefront"
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.tenantTextContainer}>
                      <Text style={styles.tenantText}>{item.label}</Text>
                      <Text style={styles.tenantSubtext}>Chi nhánh</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.gray[400]}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              ))}

              {tenants.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="business-outline"
                    size={60}
                    color={colors.gray[400]}
                  />
                  <Text style={styles.emptyText}>
                    Không tìm thấy chi nhánh nào
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Vui lòng liên hệ quản trị viên
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      <Toast config={toastConfig} />
    </>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  bgCanvas: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    fontSize: dimensions.fontSize.lg,
    color: colors.white,
    textAlign: "center",
    fontWeight: "600",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: dimensions.spacing.xxl,
    marginTop: dimensions.spacing.xxl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appTitle: {
    fontSize: dimensions.fontSize.xxl,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: dimensions.spacing.xs,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: dimensions.fontSize.md,
    color: colors.white,
    opacity: 0.9,
    textAlign: "center",
    paddingHorizontal: dimensions.spacing.md,
    lineHeight: 22,
  },
  contentContainer: {
    gap: dimensions.spacing.md,
  },
  tenantCard: {
    borderRadius: dimensions.borderRadius.xl,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: dimensions.spacing.sm,
  },
  tenantGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: dimensions.spacing.lg,
    minHeight: 75,
  },
  tenantIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.primaryLight + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: dimensions.spacing.md,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tenantTextContainer: {
    flex: 1,
  },
  tenantText: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  tenantSubtext: {
    fontSize: dimensions.fontSize.sm,
    color: colors.gray[600],
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: dimensions.spacing.xxl,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: dimensions.borderRadius.xl,
    marginTop: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyText: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: "600",
    color: colors.gray[700],
    marginTop: dimensions.spacing.md,
    marginBottom: dimensions.spacing.xs,
  },
  emptySubtext: {
    fontSize: dimensions.fontSize.md,
    color: colors.gray[500],
    textAlign: "center",
  },
});
