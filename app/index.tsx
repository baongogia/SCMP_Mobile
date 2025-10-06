import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Stack, useNavigation } from "expo-router";
import Toast from "react-native-toast-message";
import { authService } from "@/src/services";
import { BubbleAnimation } from "@/src/components/ui";
import { colors } from "@/src/constants/colors";
import { dimensions } from "@/src/constants/dimensions";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CustomDropdown } from "@/src/components";
import {
  Canvas,
  BackdropFilter,
  Blur,
  RoundedRect,
} from "@shopify/react-native-skia";
import { toastConfig } from "@/src/components/custom/CustomToast";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export default function LoginScreen() {
  const [email, setEmail] = useState("admin2024@gmail.com");
  const [password, setPassword] = useState("123");
  const [role, setRole] = useState("instructor");
  const [formW, setFormW] = useState(0);
  const [formH, setFormH] = useState(0);
  const navigation = useNavigation();

  // Animations
  const logoScale = useSharedValue(0.85);
  const logoOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(32);
  const formOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const glassTintBackground =
    Platform.OS === "ios" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)";

  useEffect(() => {
    if (role === "member") {
      setEmail("member1@gmail.com");
    } else if (role === "instructor") {
      setEmail("admin2024@gmail.com");
    }
  }, [role]);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 140, mass: 0.8 });
    formOpacity.value = withDelay(150, withTiming(1, { duration: 500 }));
    formTranslateY.value = withDelay(
      150,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formTranslateY.value }],
    opacity: formOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleLogin = async () => {
    try {
      const response = await authService.login({ email, password });
      const role_front = response?.data?.user?.role_front;
      if (!Array.isArray(role_front)) {
        throw new Error("User data is invalid or role_front is not an array");
      }
      if (
        (role === "member" && role_front.includes("member")) ||
        (role === "instructor" && role_front.includes("instructor"))
      ) {
        navigation.navigate("select-tenant" as never);
      } else {
        throw new Error("Invalid role");
      }
    } catch (error) {
      console.error("Login error:", error);
      Toast.show({
        type: "error",
        text1: (error as any).message ?? "Login failed",
      });
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Login", headerShown: false }} />
      <LinearGradient
        colors={[colors.primary, colors.primaryLight, colors.secondary]}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <BubbleAnimation bubbleCount={10} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
              <View style={styles.logoCircle}>
                <Canvas style={{ flex: 1, borderRadius: 50 }} opaque={false}>
                  <BackdropFilter filter={<Blur blur={25} />}>
                    <RoundedRect
                      x={0}
                      y={0}
                      width={100}
                      height={100}
                      r={50}
                      color="rgba(255,255,255,0.08)"
                    />
                  </BackdropFilter>
                </Canvas>
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.45)",
                    backgroundColor: "rgba(0, 170, 255, 0.41)",
                    borderRadius: 50,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="water" size={50} color={colors.white} />
                </View>
              </View>
              <Text style={styles.appTitle}>SwimCourse</Text>
              <Text style={styles.appSubtitle}>Quản lý khóa học bơi</Text>
            </Animated.View>
            <Animated.View
              style={[styles.formContainer, formAnimatedStyle]}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                setFormW(width);
                setFormH(height);
              }}
            >
              {/* Soft tint on top of blur for true glass look */}
              <View
                pointerEvents="none"
                style={[
                  styles.glassTint,
                  { backgroundColor: glassTintBackground },
                ]}
              />
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.gray[500]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu"
                  placeholderTextColor={colors.gray[500]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.dropdownContainer}>
                <CustomDropdown
                  items={[
                    {
                      label: "Học viên",
                      value: "member",
                      icon: "school-outline",
                    },
                    {
                      label: "Huấn luyện viên",
                      value: "instructor",
                      icon: "fitness-outline",
                    },
                  ]}
                  selectedValue={role}
                  onValueChange={setRole}
                  placeholder="Chọn vai trò"
                  icon="person-outline"
                />
              </View>

              <Animated.View
                style={[styles.button, buttonAnimatedStyle]}
                onTouchStart={() => {
                  buttonScale.value = withTiming(0.98, { duration: 80 });
                }}
                onTouchEnd={() => {
                  buttonScale.value = withTiming(1, { duration: 80 });
                }}
              >
                <TouchableOpacity
                  style={{ flex: 1 }}
                  activeOpacity={0.9}
                  onPress={handleLogin}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>Đăng nhập</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={colors.white}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
      <Toast config={toastConfig} />
    </>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
    zIndex: 10,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.xl,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: dimensions.spacing.xxl,
    zIndex: 10,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "transparent",
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
    fontSize: dimensions.fontSize.xxxl,
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
  },
  formContainer: {
    position: "relative",
    backgroundColor: "transparent",
    borderRadius: 20,
    overflow: "hidden",
    padding: dimensions.spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.45)",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    height: "43%",
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    zIndex: 10,
  },
  glassTint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // background set at runtime via inline style
    zIndex: 2,
  },
  skiaBlurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    overflow: "hidden",
    opacity: 1,
    zIndex: 1,
  },
  formBlurView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    overflow: "hidden",
    zIndex: 1,
  },
  formBlurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    opacity: 0.8,
  },
  inputContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      Platform.OS === "ios"
        ? "rgba(255,255,255,0.12)"
        : "rgba(255,255,255,0.16)",
    borderRadius: dimensions.borderRadius.lg,
    marginBottom: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.md,
    borderWidth: 1,
    borderColor:
      Platform.OS === "ios"
        ? "rgba(255,255,255,0.22)"
        : "rgba(255,255,255,0.28)",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    zIndex: 10,
  },
  dropdownContainer: {
    marginBottom: dimensions.spacing.lg,
    zIndex: 1000,
  },
  inputIcon: {
    marginRight: dimensions.spacing.sm,
  },
  input: {
    flex: 1,
    height: dimensions.inputHeight.lg,
    fontSize: dimensions.fontSize.md,
    color: colors.white,
    fontWeight: "500",
  },
  button: {
    borderRadius: dimensions.borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor:
      Platform.OS === "ios"
        ? "rgba(255,255,255,0.2)"
        : "rgba(255,255,255,0.26)",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 1,
    zIndex: 10,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: dimensions.buttonHeight.lg,
    paddingHorizontal: dimensions.spacing.xl,
  },
  buttonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.lg,
    fontWeight: "bold",
    marginRight: dimensions.spacing.sm,
  },
});
