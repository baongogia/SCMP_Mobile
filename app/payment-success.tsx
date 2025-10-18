import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/src/constants/colors";
import { courseService } from "@/src/services";
import { getAllOrders } from "@/src/services/learning_process/orders/orderServices";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { showErrorToast } from "@/src/utils/errorHandler";

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    courseId?: string;
    courseTitle?: string;
    coursePrice?: string;
    transactionId?: string;
    amount?: string;
    status?: string;
  }>();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0);
  const floatingAnimation = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);

  useEffect(() => {
    console.log("🎯 PaymentSuccessScreen params:", params);

    const loadCourseData = async () => {
      try {
        // 1) If we have courseId directly, fetch course detail
        if (params.courseId) {
          const res = await courseService.getPublicCourseDetail(
            params.courseId
          );
          const data: any = res?.data ?? null;
          if (data) {
            console.log("🎯 Course data from API:", data);
            setCourse(data);
            setLoading(false);
            return;
          }
        }

        // 2) If we only have transactionId, try to match it from orders then fetch course detail
        if (params.transactionId) {
          try {
            const ordersRes: any = await getAllOrders();
            const list: any[] = ordersRes?.data?.data ?? ordersRes?.data ?? [];
            const matched = list.find((o: any) => {
              const tx =
                o?.transactionId ||
                o?.transaction_id ||
                o?.payment?.transactionId;
              return tx && String(tx) === String(params.transactionId);
            });

            const matchedCourseId =
              matched?.courseId || matched?.course_id || matched?.course?.id;
            if (matchedCourseId) {
              const res = await courseService.getPublicCourseDetail(
                String(matchedCourseId)
              );
              const data: any = res?.data ?? null;
              if (data) {
                setCourse(data);
                setLoading(false);
                return;
              }
            }

            // Fallback to minimal info from order
            if (matched?.course) {
              setCourse({
                title: matched.course.title || "Khóa học",
                price: matched.total || parseInt(params.amount || "0"),
                media: matched.course.media || [],
              });
              setLoading(false);
              return;
            }
          } catch {
            // ignore and fallback below
          }
        }

        // 3) Final fallback when nothing found: use passed title/price if available
        const fallbackCourse = {
          title:
            params.courseTitle || (params.courseId ? "Khóa học" : "Khóa học"),
          price: parseInt(params.coursePrice || params.amount || "0"),
          media: [],
        } as any;
        console.log("🎯 Using fallback course data:", fallbackCourse);
        setCourse(fallbackCourse);
      } catch (error) {
        showErrorToast(error, {
          title: "Lỗi tải khóa học",
          message: "Không thể tải thông tin khóa học",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();

    // Animate success icon
    scale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 100 }),
      withSpring(1, { damping: 8, stiffness: 100 })
    );

    // Animate content
    opacity.value = withDelay(300, withSpring(1));

    // Animate checkmark
    checkmarkScale.value = withDelay(600, withSpring(1));

    // Floating animation for background elements
    floatingAnimation.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      true
    );

    // Pulse animation for success icon
    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, [
    checkmarkScale,
    floatingAnimation,
    opacity,
    params.amount,
    params.courseId,
    params.transactionId,
    pulseAnimation,
    scale,
  ]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: (1 - opacity.value) * 20 }],
  }));

  const animatedCheckmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  const animatedFloatingStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatingAnimation.value * 10 },
      { rotate: `${floatingAnimation.value * 5}deg` },
    ],
    opacity: 0.6 + floatingAnimation.value * 0.4,
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleContinue = () => {
    router.replace("/member");
  };

  const handleViewCourse = () => {
    router.replace("/member");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  const isSuccess = params.status === "success" || !params.status;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <LinearGradient
        colors={
          isSuccess
            ? ["#E3F2FD", "#BBDEFB", colors.primary]
            : ["#FFEBEE", "#FFCDD2", "#F44336"]
        }
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Floating Background Elements */}
        <Animated.View
          style={[styles.floatingElement1, animatedFloatingStyle]}
        />
        <Animated.View
          style={[styles.floatingElement2, animatedFloatingStyle]}
        />
        <Animated.View
          style={[styles.floatingElement3, animatedFloatingStyle]}
        />

        {/* Success/Error Animation */}
        <View style={styles.animationContainer}>
          <Animated.View
            style={[styles.successIcon, animatedIconStyle, animatedPulseStyle]}
          >
            <LinearGradient
              colors={
                isSuccess ? [colors.success, "#66BB6A"] : ["#FF5722", "#FF7043"]
              }
              style={styles.iconBackground}
            >
              <Animated.View
                style={[styles.checkmarkContainer, animatedCheckmarkStyle]}
              >
                <Ionicons
                  name={isSuccess ? "checkmark" : "close"}
                  size={50}
                  color={colors.white}
                />
              </Animated.View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, animatedContentStyle]}>
          <Text style={styles.title}>
            {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại!"}
          </Text>
          <Text style={styles.subtitle}>
            {isSuccess
              ? "Bạn đã đăng ký khóa học thành công"
              : "Có lỗi xảy ra trong quá trình thanh toán"}
          </Text>

          {/* Course Info Card */}
          {course && isSuccess && (
            <Animated.View style={[styles.courseCard, animatedContentStyle]}>
              {console.log("🎯 Rendering course info:", {
                title: course.title,
                price: course.price,
              })}
              <LinearGradient
                colors={[colors.white, "#F8FBFF"]}
                style={styles.courseCardGradient}
              >
                <View style={styles.courseHeader}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryLight]}
                    style={styles.courseIcon}
                  >
                    <Ionicons name="school" size={24} color={colors.white} />
                  </LinearGradient>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle} numberOfLines={2}>
                      {course.title}
                    </Text>
                    <Text style={styles.coursePrice}>
                      {formatPrice(course.price)}
                    </Text>
                  </View>
                  <View style={styles.successBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.success}
                    />
                  </View>
                </View>

                {course.media && course.media[0] && (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{
                        uri: course.media[0].path || course.media[0].url,
                      }}
                      style={styles.courseImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(0,119,190,0.1)"]}
                      style={styles.imageOverlay}
                    />
                  </View>
                )}
              </LinearGradient>
            </Animated.View>
          )}

          {/* Transaction Info */}
          {params.transactionId && (
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionLabel}>Mã giao dịch</Text>
              <Text style={styles.transactionId}>{params.transactionId}</Text>
            </View>
          )}

          {/* Error Message */}
          {!isSuccess && (
            <View style={styles.messageContainer}>
              <Ionicons name="warning" size={20} color="#FF5722" />
              <Text style={styles.messageText}>
                Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[styles.actions, animatedContentStyle]}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.primaryButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="home" size={20} color={colors.white} />
              <Text style={styles.primaryButtonText}>
                {isSuccess ? "Về trang chủ" : "Thử lại"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {isSuccess && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleViewCourse}
              activeOpacity={0.8}
            >
              <View style={styles.secondaryButtonContent}>
                <Ionicons name="book" size={20} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>Xem khóa học</Text>
              </View>
            </TouchableOpacity>
          )}
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  // Floating background elements
  floatingElement1: {
    position: "absolute",
    top: 100,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  floatingElement2: {
    position: "absolute",
    top: 200,
    left: 40,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  floatingElement3: {
    position: "absolute",
    bottom: 150,
    right: 50,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  animationContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  successIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.success,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  checkmarkContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    marginBottom: 50,
    width: "100%",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: colors.primaryDark,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 26,
    fontWeight: "500",
  },
  courseCard: {
    borderRadius: 20,
    marginBottom: 24,
    width: "100%",
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
  },
  courseCardGradient: {
    padding: 20,
    borderRadius: 20,
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  courseIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
    lineHeight: 24,
  },
  coursePrice: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
  },
  successBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  courseImage: {
    width: "100%",
    height: 140,
    borderRadius: 16,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  transactionInfo: {
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(0,119,190,0.1)",
  },
  transactionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: "500",
  },
  transactionId: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    fontFamily: "monospace",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 20,
    borderRadius: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(0,119,190,0.1)",
  },
  messageText: {
    fontSize: 15,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
    fontWeight: "500",
  },
  actions: {
    width: "100%",
    gap: 16,
  },
  primaryButton: {
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButtonContent: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
});
