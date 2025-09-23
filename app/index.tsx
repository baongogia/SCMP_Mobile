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
import { CommonActions } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { authService } from "@/src/services";
import { toastConfig } from "@/src/components/feedback/CustomToast";
import { CustomDropdown } from "@/src/components";
import { colors } from "@/src/constants/colors";
import { dimensions } from "@/src/constants/dimensions";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "@react-native-community/blur";

export default function LoginScreen() {
  const [email, setEmail] = useState("admin2024@gmail.com");
  const [password, setPassword] = useState("123");
  const [role, setRole] = useState("instructor");
  const navigation = useNavigation();

  useEffect(() => {
    if (role === "member") {
      setEmail("member1@gmail.com");
    } else if (role === "instructor") {
      setEmail("admin2024@gmail.com");
    }
  }, [role]);

  const handleLogin = async () => {
    try {
      const response = await authService.login({ email, password });
      const role_front = response?.data?.user?.role_front;
      if (!Array.isArray(role_front)) {
        throw new Error("User data is invalid or role_front is not an array");
      }

      // Check if user has valid role but navigate to tenant selection first
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="water" size={50} color={colors.white} />
              </View>
              <Text style={styles.appTitle}>SwimCourse</Text>
              <Text style={styles.appSubtitle}>Quản lý khóa học bơi</Text>
            </View>

            <View style={styles.formContainer}>
              <BlurView
                style={styles.formBlurOverlay}
                blurType="light"
                blurAmount={20}
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

              <TouchableOpacity style={styles.button} onPress={handleLogin}>
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
            </View>
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
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    overflow: "hidden",
    padding: dimensions.spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    height: "43%",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  formBlurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: dimensions.borderRadius.xl,
  },
  inputContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: dimensions.borderRadius.lg,
    marginBottom: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.md,
    borderWidth: 0,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
    color: colors.gray[800],
    fontWeight: "500",
  },
  button: {
    borderRadius: dimensions.borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
