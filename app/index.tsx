import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Stack, useNavigation } from "expo-router";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService, courseService } from "@/src/services";
import { colors } from "@/src/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { toastConfig } from "@/src/components/custom/toast/CustomToast";
import Svg, { Path } from "react-native-svg";
import BubbleAnimation from "@/src/components/animation/bubble/BubbleAnimation";

const WaveSvg = () => {
  return (
    <Svg
      height={160}
      width="100%"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
      style={styles.waveSvg}
    >
      <Path
        fill={colors.mainBackground}
        d="M0,120 C360,40 560,230 800,270 C1040,300 1260,200 1440,160 L1440,320 L0,320 Z"
      />
    </Svg>
  );
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, setShowTenantSelection] = useState(false);
  const [tenants, setTenants] = useState<{ label: string; value: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigation = useNavigation();

  // Animation values
  const loginFormTranslateX = useSharedValue(0);
  const tenantFormTranslateY = useSharedValue(100);
  const tenantFormOpacity = useSharedValue(0);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await courseService.getAvailableTenants();
      const rawTenants = response.data || [];
      const tenantsData =
        Array.isArray(rawTenants) && Array.isArray(rawTenants[0])
          ? rawTenants[0]
          : rawTenants;
      const mappedTenants = (tenantsData as any[]).map((item: any) => ({
        label: item?.tenant_id?.title ?? item?.title ?? "",
        value: item?.tenant_id?._id ?? item?._id ?? "",
      }));
      setTenants(mappedTenants);
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to fetch tenants",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = async () => {
    try {
      const response = await authService.login({ email, password });
      const role_front = response?.data?.user?.role_front;
      if (!Array.isArray(role_front)) {
        throw new Error("User data is invalid or role_front is not an array");
      }
      if (role_front.includes("member") || role_front.includes("instructor")) {
        setUser(response?.data?.user);
        await fetchTenants();
        setShowTenantSelection(true);

        // Animate login form to slide left and show tenant form
        loginFormTranslateX.value = withTiming(-400, {
          duration: 500,
          easing: Easing.out(Easing.cubic),
        });
        tenantFormTranslateY.value = withTiming(0, {
          duration: 500,
          easing: Easing.out(Easing.cubic),
        });
        tenantFormOpacity.value = withTiming(1, { duration: 300 });
      } else {
        throw new Error("Invalid role");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: (error as any).message ?? "Login failed",
      });
    }
  };

  const handleTenantSelect = async (tenant: {
    label: string;
    value: string;
  }) => {
    try {
      await AsyncStorage.setItem("tenant", JSON.stringify(tenant));
      const role_front = user?.role_front;
      if (Array.isArray(role_front)) {
        if (role_front.includes("member")) {
          navigation.navigate("member" as never);
        } else if (role_front.includes("instructor")) {
          navigation.navigate("instructor" as never);
        }
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to select tenant",
      });
    }
  };

  const handleBackToLogin = () => {
    setShowTenantSelection(false);
    loginFormTranslateX.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    tenantFormTranslateY.value = withTiming(100, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    tenantFormOpacity.value = withTiming(0, { duration: 300 });
  };

  // Animated styles
  const loginFormAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: loginFormTranslateX.value }],
  }));

  const tenantFormAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tenantFormTranslateY.value }],
    opacity: tenantFormOpacity.value,
  }));

  return (
    <>
      <Stack.Screen options={{ title: "Login", headerShown: false }} />
      <View style={styles.container}>
        {/* Top background with image */}
        <View style={styles.topSection}>
          {/* Background image */}
          <Image
            source={{
              uri: "https://i.pinimg.com/736x/8b/43/a0/8b43a08ba74cd6ac4351278830062530.jpg",
            }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />

          {/* Wave divider */}
          <View style={styles.waveContainer}>
            <WaveSvg />
          </View>
        </View>
        {/* Bubble Animation */}
        <BubbleAnimation bubbleCount={18} />

        {/* White content card */}
        <View style={styles.contentCard}>
          {/* Login Form */}
          <Animated.View style={[styles.formContainer, loginFormAnimatedStyle]}>
            {/* Sign in title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Đăng nhập</Text>
              <View style={styles.titleUnderline} />
            </View>

            {/* Email input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View
                style={[
                  styles.inputContainer,
                  emailFocused && styles.inputContainerFocused,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={emailFocused ? colors.primary : "#9CA3AF"}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="demo@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View
                style={[
                  styles.inputContainer,
                  passwordFocused && styles.inputContainerFocused,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={passwordFocused ? colors.primary : "#9CA3AF"}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="nhập mật khẩu"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={passwordFocused ? colors.primary : "#9CA3AF"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember me and Forgot password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe && <View style={styles.checkboxDot} />}
                </View>
                <Text style={styles.rememberMeText}>Ghi nhớ đăng nhập</Text>
              </TouchableOpacity>

              <TouchableOpacity>
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            {/* Login button */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Tenant Selection Form */}
          <Animated.View
            style={[styles.tenantFormContainer, tenantFormAnimatedStyle]}
          >
            {/* Back button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
              <Text style={styles.backButtonText}>Quay lại</Text>
            </TouchableOpacity>

            {/* Tenant selection title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Chọn chi nhánh</Text>
              <View style={styles.titleUnderline} />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                  Đang tải danh sách chi nhánh...
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.tenantList}
                showsVerticalScrollIndicator={false}
              >
                {tenants.map((tenant) => (
                  <TouchableOpacity
                    key={tenant.value}
                    style={styles.tenantCard}
                    onPress={() => handleTenantSelect(tenant)}
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
                        <Text style={styles.tenantText}>{tenant.label}</Text>
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
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </View>
      <Toast config={toastConfig} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    flex: 0.6,
    position: "relative",
    backgroundColor: colors.mainBackground,
    marginTop: -50,
    paddingTop: 50,
  },
  backgroundImage: {
    position: "absolute",
    top: -50,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "130%",
    zIndex: 0,
  },
  waveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    height: 160,
  },
  waveSvg: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  contentCard: {
    flex: 0.4,
    backgroundColor: colors.mainBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    marginTop: -20,
    zIndex: 3,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 8,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 8,
  },
  inputContainerFocused: {
    borderBottomColor: colors.primary,
    borderBottomWidth: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    paddingVertical: 8,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  rememberMeText: {
    fontSize: 14,
    color: "#374151",
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpText: {
    fontSize: 14,
    color: "#6B7280",
  },
  signUpLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  // Form container styles
  formContainer: {
    width: "100%",
  },
  // Tenant form styles
  tenantFormContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.mainBackground,
    padding: 20,
  },
  // Back button styles
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    marginTop: 16,
    textAlign: "center",
  },
  // Tenant list styles
  tenantList: {
    flex: 1,
  },
  tenantCard: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: colors.black,
    borderBottomColor: colors.primary,
    borderBottomWidth: 1,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  tenantGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    minHeight: 70,
  },
  tenantIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  tenantTextContainer: {
    flex: 1,
  },
  tenantText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  tenantSubtext: {
    fontSize: 14,
    color: colors.gray[600],
  },
  // Empty state styles
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray[700],
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: "center",
  },
});
