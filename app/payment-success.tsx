import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  ScrollView,
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
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { showErrorToast } from "@/src/utils/errorHandler";

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    courseId?: string | string[];
    courseTitle?: string | string[];
    coursePrice?: string | string[];
    transactionId?: string | string[];
    amount?: string | string[];
    status?: string | string[];
  }>();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const floatingAnimation = useSharedValue(0);

  // Normalize params once to avoid referential changes causing repeated effects
  const courseId = useMemo(() => {
    const v = params.courseId as string | string[] | undefined;
    return Array.isArray(v) ? v[0] : v;
  }, [params.courseId]);

  const transactionId = useMemo(() => {
    const v = params.transactionId as string | string[] | undefined;
    return Array.isArray(v) ? v[0] : v;
  }, [params.transactionId]);

  const courseTitle = useMemo(() => {
    const v = params.courseTitle as string | string[] | undefined;
    return Array.isArray(v) ? v[0] : v;
  }, [params.courseTitle]);

  const coursePrice = useMemo(() => {
    const v = params.coursePrice as string | string[] | undefined;
    return Array.isArray(v) ? v[0] : v;
  }, [params.coursePrice]);

  const amount = useMemo(() => {
    const v = params.amount as string | string[] | undefined;
    return Array.isArray(v) ? v[0] : v;
  }, [params.amount]);

  const loadKey = `${courseId || ""}|${transactionId || ""}|${amount || ""}|${
    coursePrice || ""
  }|${courseTitle || ""}`;
  const lastLoadKeyRef = useRef<string | null>(null);

  // Load data only when normalized params change
  useEffect(() => {
    if (lastLoadKeyRef.current === loadKey) {
      return;
    }
    lastLoadKeyRef.current = loadKey;

    console.log("🎯 PaymentSuccessScreen params:", {
      courseId,
      transactionId,
      courseTitle,
      coursePrice,
      amount,
    });

    const loadCourseData = async () => {
      try {
        // Simplified logic: Always try to get latest order first for better UX
        const ordersRes: any = await getAllOrders();
        const list: any[] = ordersRes?.data?.data ?? ordersRes?.data ?? [];
        console.log("🧭 Orders fetched:", {
          count: Array.isArray(list) ? list.length : 0,
          sample: list?.[0],
        });

        if (Array.isArray(list) && list.length > 0) {
          // Sort orders by creation date to get the latest one
          const sortedOrders = [...list].sort((a: any, b: any) => {
            const ta = new Date(a?.createdAt || a?.created_at || 0).getTime();
            const tb = new Date(b?.createdAt || b?.created_at || 0).getTime();
            return tb - ta;
          });

          // If we have transactionId, try to find matching order first
          let targetOrder = null;
          if (transactionId) {
            targetOrder = sortedOrders.find((o: any) => {
              const tx =
                o?.transactionId ||
                o?.transaction_id ||
                o?.payment?.transactionId;
              return tx && String(tx) === String(transactionId);
            });
          }

          // If no matching transaction or no transactionId, use latest order
          if (!targetOrder) {
            targetOrder = sortedOrders[0];
          }
          console.log("🧭 Selected targetOrder:", targetOrder);

          // Try to get course details from the target order
          const targetCourseId =
            targetOrder?.courseId ||
            targetOrder?.course_id ||
            targetOrder?.course?.id;
          if (targetCourseId) {
            try {
              const res = await courseService.getPublicCourseDetail(
                String(targetCourseId)
              );
              const data: any = res?.data ?? null;
              if (data) {
                console.log("🎯 Course data from API:", data);
                const amountFromOrder = Number(
                  (targetOrder as any)?.price ??
                    (targetOrder as any)?.total ??
                    (targetOrder as any)?.amount ??
                    0
                );
                setCourse({
                  ...data,
                  // Override with actual order data if available
                  price: amountFromOrder || data.price,
                  paidAmount: amountFromOrder || data.price,
                  transactionId:
                    targetOrder?.transactionId || targetOrder?.transaction_id,
                  status: normalizeStatus(targetOrder?.status) || data?.status,
                });
                setLoading(false);
                return;
              }
            } catch (error) {
              console.log("Failed to fetch course details:", error);
            }
          }

          // Fallback to order info if course detail fetch fails
          if (targetOrder?.course) {
            const amountFromOrder = Number(
              (targetOrder as any)?.price ??
                (targetOrder as any)?.total ??
                (targetOrder as any)?.amount ??
                0
            );
            setCourse({
              title: targetOrder.course.title || "Khóa học",
              price: amountFromOrder || parseInt(amount || "0"),
              paidAmount: amountFromOrder || parseInt(amount || "0"),
              media: targetOrder.course.media || [],
              transactionId:
                targetOrder?.transactionId || targetOrder?.transaction_id,
              status: normalizeStatus(targetOrder?.status),
            });
            setLoading(false);
            return;
          }
        }

        // Final fallback when no orders found: use passed params
        const fallbackCourse = {
          title: courseTitle || "Khóa học",
          price: parseInt(coursePrice || amount || "0"),
          media: [],
          transactionId: transactionId,
        } as any;
        console.log("🎯 Using fallback course data:", fallbackCourse);
        setCourse(fallbackCourse);
      } catch (error) {
        console.log("Error loading course data:", error);
        showErrorToast(error, {
          title: "Lỗi tải khóa học",
          message: "Không thể tải thông tin khóa học",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();

    // Enhanced animations
    scale.value = withSequence(
      withSpring(1.3, { damping: 6, stiffness: 120 }),
      withSpring(1, { damping: 8, stiffness: 100 })
    );

    opacity.value = withDelay(
      200,
      withSpring(1, { damping: 10, stiffness: 80 })
    );
    checkmarkScale.value = withDelay(
      500,
      withSpring(1, { damping: 8, stiffness: 150 })
    );

    // Card animations
    cardScale.value = withDelay(
      800,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    cardOpacity.value = withDelay(
      800,
      withSpring(1, { damping: 8, stiffness: 80 })
    );

    // Floating animation for subtle movement
    floatingAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0, { duration: 3000 })
      ),
      -1,
      true
    );

    // Pulse animation for success icon
    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, [
    loadKey,
    courseId,
    transactionId,
    courseTitle,
    coursePrice,
    amount,
    scale,
    opacity,
    checkmarkScale,
    cardScale,
    cardOpacity,
    floatingAnimation,
    pulseAnimation,
  ]);

  // Run animations once on mount
  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.3, { damping: 6, stiffness: 120 }),
      withSpring(1, { damping: 8, stiffness: 100 })
    );

    opacity.value = withDelay(
      200,
      withSpring(1, { damping: 10, stiffness: 80 })
    );
    checkmarkScale.value = withDelay(
      500,
      withSpring(1, { damping: 8, stiffness: 150 })
    );

    cardScale.value = withDelay(
      800,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    cardOpacity.value = withDelay(
      800,
      withSpring(1, { damping: 8, stiffness: 80 })
    );

    floatingAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0, { duration: 3000 })
      ),
      -1,
      true
    );

    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, [
    checkmarkScale,
    opacity,
    pulseAnimation,
    scale,
    cardScale,
    cardOpacity,
    floatingAnimation,
  ]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: (1 - opacity.value) * 30 }],
  }));

  const animatedCheckmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { scale: cardScale.value },
      { translateY: (1 - cardOpacity.value) * 20 },
    ],
  }));

  const animatedFloatingStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      floatingAnimation.value,
      [0, 1],
      [0, -8],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateY }],
    };
  });

  const normalizeStatus = (value: any): string | undefined => {
    const v = Array.isArray(value) ? value[0] : value;
    if (v == null) return undefined;
    const s = String(v).toLowerCase();
    if (s === "success") return "paid";
    return s;
  };

  const getDisplayAmount = (): number => {
    const paramAmount = Array.isArray(params.amount)
      ? Number(params.amount?.[0])
      : Number(params.amount);
    if (!Number.isNaN(paramAmount) && paramAmount > 0) return paramAmount;

    const courseAmount = Number(
      (course?.paidAmount as any) ?? (course?.price as any) ?? 0
    );
    if (!Number.isNaN(courseAmount) && courseAmount > 0) return courseAmount;

    return 0;
  };

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

  const rawStatus = Array.isArray(params.status)
    ? params.status[0]
    : params.status;

  // Determine status from course data or params
  const orderStatus = normalizeStatus(course?.status ?? rawStatus);
  const isSuccess = orderStatus === "paid";
  const isPending = orderStatus === "pending";
  const isExpired = orderStatus === "expired";

  console.log("🧭 Status debug:", {
    rawStatus,
    courseStatus: course?.status,
    normalized: orderStatus,
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Modern Hero Section */}
      <LinearGradient
        colors={
          isSuccess
            ? [colors.primary, colors.primaryDark, "#1e40af"]
            : isPending
            ? ["#f59e0b", "#d97706", "#b45309"]
            : isExpired
            ? ["#6b7280", "#4b5563", "#374151"]
            : ["#ef4444", "#dc2626", "#b91c1c"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.modernHero}
      >
        {/* Animated background patterns */}
        <Animated.View
          style={[styles.backgroundPattern1, animatedFloatingStyle]}
        />
        <Animated.View
          style={[styles.backgroundPattern2, animatedFloatingStyle]}
        />
        <Animated.View
          style={[styles.backgroundPattern3, animatedFloatingStyle]}
        />

        {/* Success/Error Icon with modern design */}
        <Animated.View
          style={[
            styles.modernIconContainer,
            animatedIconStyle,
            animatedPulseStyle,
          ]}
        >
          <View style={styles.iconOuterRing}>
            <View style={styles.iconMiddleRing}>
              <LinearGradient
                colors={
                  isSuccess
                    ? ["#ffffff", "#f0f9ff"]
                    : isPending
                    ? ["#ffffff", "#fefbf0"]
                    : isExpired
                    ? ["#ffffff", "#f9fafb"]
                    : ["#ffffff", "#fef2f2"]
                }
                style={styles.iconInnerCircle}
              >
                <Animated.View style={[animatedCheckmarkStyle]}>
                  <Ionicons
                    name={
                      isSuccess
                        ? "checkmark-sharp"
                        : isPending
                        ? "time-sharp"
                        : isExpired
                        ? "hourglass-sharp"
                        : "close-sharp"
                    }
                    size={52}
                    color={
                      isSuccess
                        ? colors.primary
                        : isPending
                        ? "#f59e0b"
                        : isExpired
                        ? "#6b7280"
                        : "#ef4444"
                    }
                    style={{ fontWeight: "bold" }}
                  />
                </Animated.View>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Modern text section */}
        <Animated.View style={[styles.modernHeroText, animatedContentStyle]}>
          <Text style={styles.modernHeroTitle}>
            {isSuccess
              ? "Thanh toán thành công"
              : isPending
              ? "Chờ thanh toán"
              : isExpired
              ? "Đã hết hạn"
              : "Thanh toán thất bại"}
          </Text>
          <Text style={styles.modernHeroSubtitle}>
            {isSuccess
              ? "Chúc mừng! Bạn đã đăng ký khóa học thành công và có thể bắt đầu học ngay"
              : isPending
              ? "Đơn hàng của bạn đang chờ thanh toán. Vui lòng hoàn tất thanh toán để truy cập khóa học"
              : isExpired
              ? "Đơn hàng đã hết hạn thanh toán. Bạn có thể đặt lại đơn hàng mới"
              : "Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại"}
          </Text>

          {/* Status indicator */}
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: isSuccess
                  ? "rgba(255,255,255,0.2)"
                  : isPending
                  ? "rgba(255,255,255,0.18)"
                  : "rgba(255,255,255,0.15)",
              },
            ]}
          >
            <Ionicons
              name={
                isSuccess
                  ? "shield-checkmark"
                  : isPending
                  ? "time"
                  : isExpired
                  ? "refresh"
                  : "warning"
              }
              size={16}
              color="white"
            />
            <Text style={styles.statusText}>
              {isSuccess
                ? "Giao dịch an toàn"
                : isPending
                ? "Chờ xử lý"
                : isExpired
                ? "Có thể đặt lại"
                : "Cần thử lại"}
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {course && (
          <Animated.View style={[styles.modernCard, animatedCardStyle]}>
            <LinearGradient
              colors={["#ffffff", "#f8fafc", "#f1f5f9"]}
              style={styles.modernCardGradient}
            >
              {/* Course header with modern design */}
              <View style={styles.modernCardHeader}>
                <View style={styles.courseIconContainer}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={styles.modernCourseIcon}
                  >
                    <Ionicons name="play-circle" size={28} color="white" />
                  </LinearGradient>
                </View>

                <View style={styles.courseInfo}>
                  <Text style={styles.modernCourseTitle} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.modernCoursePrice}>
                      {formatPrice(getDisplayAmount())}
                    </Text>
                    <View
                      style={[
                        styles.modernStatusBadge,
                        {
                          backgroundColor: isSuccess
                            ? colors.primary
                            : isPending
                            ? "#f59e0b"
                            : isExpired
                            ? "#6b7280"
                            : "#ef4444",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          isSuccess
                            ? "checkmark"
                            : isPending
                            ? "time"
                            : isExpired
                            ? "hourglass"
                            : "close"
                        }
                        size={14}
                        color="white"
                      />
                      <Text style={styles.statusBadgeText}>
                        {isSuccess
                          ? "Đã mua"
                          : isPending
                          ? "Chờ thanh toán"
                          : isExpired
                          ? "Hết hạn"
                          : "Thất bại"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Course image with modern styling */}
              {course.media && course.media[0] && (
                <View style={styles.modernImageContainer}>
                  <Image
                    source={{
                      uri: course.media[0].path || course.media[0].url,
                    }}
                    style={styles.modernCourseImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={[
                      "transparent",
                      "rgba(0,0,0,0.1)",
                      "rgba(0,0,0,0.3)",
                    ]}
                    style={styles.modernImageOverlay}
                  />
                  <View style={styles.playButtonOverlay}>
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      style={styles.playButton}
                    >
                      <Ionicons name="play" size={20} color="white" />
                    </LinearGradient>
                  </View>
                </View>
              )}

              {/* Course features */}
              <View style={styles.courseFeatures}>
                <View style={styles.featureItem}>
                  <Ionicons name="time" size={16} color={colors.primary} />
                  <Text style={styles.featureText}>Học trọn đời</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="ribbon" size={16} color={colors.primary} />
                  <Text style={styles.featureText}>Có chứng chỉ</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="people" size={16} color={colors.primary} />
                  <Text style={styles.featureText}>Hỗ trợ 24/7</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        <Animated.View
          style={[styles.modernTransactionCard, animatedCardStyle]}
        >
          <LinearGradient
            colors={["#ffffff", "#f8fafc"]}
            style={styles.modernCardGradient}
          >
            {/* Modern transaction header */}
            <View style={styles.modernTransactionHeader}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.transactionIconContainer}
              >
                <Ionicons name="card" size={24} color="white" />
              </LinearGradient>
              <View style={styles.transactionHeaderText}>
                <Text style={styles.modernTransactionTitle}>
                  Chi tiết thanh toán
                </Text>
                <Text style={styles.transactionSubtitle}>
                  Thông tin giao dịch của bạn
                </Text>
              </View>
            </View>

            {/* Transaction details with modern styling */}
            <View style={styles.modernTransactionDetails}>
              <View style={styles.modernTransactionRow}>
                <View style={styles.transactionRowLeft}>
                  <View style={styles.transactionRowIcon}>
                    <Ionicons name="cash" size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.modernTransactionLabel}>
                    Số tiền thanh toán
                  </Text>
                </View>
                <Text style={styles.modernTransactionValue}>
                  {formatPrice(getDisplayAmount())}
                </Text>
              </View>

              {(course?.transactionId ||
                (Array.isArray(params.transactionId)
                  ? params.transactionId[0]
                  : params.transactionId)) && (
                <View style={styles.modernTransactionRow}>
                  <View style={styles.transactionRowLeft}>
                    <View style={styles.transactionRowIcon}>
                      <Ionicons
                        name="receipt"
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.modernTransactionLabel}>
                      Mã giao dịch
                    </Text>
                  </View>
                  <Text style={styles.modernTransactionMono}>
                    {course?.transactionId ||
                      (Array.isArray(params.transactionId)
                        ? params.transactionId[0]
                        : params.transactionId)}
                  </Text>
                </View>
              )}

              <View style={styles.modernTransactionRow}>
                <View style={styles.transactionRowLeft}>
                  <View style={styles.transactionRowIcon}>
                    <Ionicons name="time" size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.modernTransactionLabel}>Thời gian</Text>
                </View>
                <Text style={styles.modernTransactionValue}>
                  {new Date().toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>

              <View style={styles.modernTransactionRow}>
                <View style={styles.transactionRowLeft}>
                  <View style={styles.transactionRowIcon}>
                    <Ionicons
                      name="shield-checkmark"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={styles.modernTransactionLabel}>Trạng thái</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isSuccess
                        ? "#dcfce7"
                        : isPending
                        ? "#fef3c7"
                        : isExpired
                        ? "#f3f4f6"
                        : "#fee2e2",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.transactionStatusText,
                      {
                        color: isSuccess
                          ? "#16a34a"
                          : isPending
                          ? "#d97706"
                          : isExpired
                          ? "#6b7280"
                          : "#dc2626",
                      },
                    ]}
                  >
                    {isSuccess
                      ? "Thành công"
                      : isPending
                      ? "Chờ thanh toán"
                      : isExpired
                      ? "Hết hạn"
                      : "Thất bại"}
                  </Text>
                </View>
              </View>

              {/* Modern divider */}
              <View style={styles.modernDivider} />

              {/* Total section with gradient background */}
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.modernTotalSection}
              >
                <View style={styles.modernTotalRow}>
                  <Text style={styles.modernTotalLabel}>Tổng thanh toán</Text>
                  <Text style={styles.modernTotalValue}>
                    {formatPrice(getDisplayAmount())}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </LinearGradient>
        </Animated.View>

        {(isPending ||
          isExpired ||
          (!isSuccess && !isPending && !isExpired)) && (
          <Animated.View style={[styles.modernActionCard, animatedCardStyle]}>
            <LinearGradient
              colors={
                isPending
                  ? ["#fefbf0", "#fef3c7"]
                  : isExpired
                  ? ["#f9fafb", "#f3f4f6"]
                  : ["#fef2f2", "#fee2e2"]
              }
              style={styles.modernCardGradient}
            >
              <View style={styles.actionHeader}>
                <View
                  style={[
                    styles.actionIconContainer,
                    {
                      backgroundColor: isPending
                        ? "#fbbf24"
                        : isExpired
                        ? "#9ca3af"
                        : "#fca5a5",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      isPending ? "card" : isExpired ? "refresh" : "warning"
                    }
                    size={24}
                    color="white"
                  />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text
                    style={[
                      styles.actionTitle,
                      {
                        color: isPending
                          ? "#92400e"
                          : isExpired
                          ? "#4b5563"
                          : "#991b1b",
                      },
                    ]}
                  >
                    {isPending
                      ? "Hoàn tất thanh toán"
                      : isExpired
                      ? "Đặt lại đơn hàng"
                      : "Cần hỗ trợ?"}
                  </Text>
                  <Text
                    style={[
                      styles.actionMessage,
                      {
                        color: isPending
                          ? "#a16207"
                          : isExpired
                          ? "#6b7280"
                          : "#b91c1c",
                      },
                    ]}
                  >
                    {isPending
                      ? "Nhấn nút bên dưới để tiếp tục thanh toán"
                      : isExpired
                      ? "Đơn hàng đã hết hạn, bạn có thể tạo đơn hàng mới"
                      : "Vui lòng thử lại hoặc liên hệ với chúng tôi để được hỗ trợ"}
                  </Text>
                </View>
              </View>

              {!isPending && !isExpired && (
                <View style={styles.supportActions}>
                  <TouchableOpacity style={styles.supportButton}>
                    <Ionicons
                      name="chatbubble"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.supportButtonText}>Chat hỗ trợ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.supportButton}>
                    <Ionicons name="call" size={16} color={colors.primary} />
                    <Text style={styles.supportButtonText}>Gọi hotline</Text>
                  </TouchableOpacity>
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        )}
      </ScrollView>

      {/* Modern Bottom Actions */}
      <View style={styles.modernBottomBar}>
        <LinearGradient
          colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,1)"]}
          style={styles.bottomBarGradient}
        >
          <View style={styles.modernActionButtons}>
            <TouchableOpacity
              style={styles.modernPrimaryButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.modernButtonGradient}
              >
                <Ionicons
                  name={
                    isSuccess
                      ? "home"
                      : isPending
                      ? "card"
                      : isExpired
                      ? "refresh"
                      : "refresh"
                  }
                  size={20}
                  color="white"
                />
                <Text style={styles.modernButtonText}>
                  {isSuccess
                    ? "Về trang chủ"
                    : isPending
                    ? "Thanh toán ngay"
                    : isExpired
                    ? "Đặt lại"
                    : "Thử lại"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {isSuccess && (
              <TouchableOpacity
                style={styles.modernSecondaryButton}
                onPress={handleViewCourse}
                activeOpacity={0.8}
              >
                <View style={styles.modernSecondaryButtonInner}>
                  <Ionicons
                    name="play-circle"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.modernSecondaryButtonText}>
                    Bắt đầu học
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Additional info */}
          <View style={styles.bottomInfo}>
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={colors.primary}
            />
            <Text style={styles.bottomInfoText}>
              {isSuccess
                ? "Giao dịch được bảo mật 100%"
                : isPending
                ? "Thanh toán an toàn với SSL"
                : isExpired
                ? "Hỗ trợ tạo đơn hàng mới"
                : "Hỗ trợ 24/7"}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },

  // Modern Hero Styles
  modernHero: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: "relative",
    overflow: "hidden",
  },
  backgroundPattern1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  backgroundPattern2: {
    position: "absolute",
    top: 100,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  backgroundPattern3: {
    position: "absolute",
    bottom: -40,
    right: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  modernIconContainer: {
    alignSelf: "center",
    marginBottom: 24,
  },
  iconOuterRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  iconMiddleRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modernHeroText: {
    alignItems: "center",
  },
  modernHeroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  modernHeroSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },

  // Modern Content Styles
  scrollContent: {
    padding: 24,
    paddingBottom: 140,
  },

  // Modern Card Styles
  modernCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modernCardGradient: {
    padding: 20,
  },
  modernCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  courseIconContainer: {
    marginRight: 16,
  },
  modernCourseIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  courseInfo: {
    flex: 1,
  },
  modernCourseTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modernCoursePrice: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
  },
  modernStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  modernImageContainer: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    marginBottom: 16,
  },
  modernCourseImage: {
    width: "100%",
    height: 160,
  },
  modernImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  playButtonOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  courseFeatures: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  featureItem: {
    alignItems: "center",
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },

  // Modern Transaction Card
  modernTransactionCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modernTransactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionHeaderText: {
    flex: 1,
  },
  modernTransactionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  transactionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  modernTransactionDetails: {
    gap: 16,
  },
  modernTransactionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  transactionRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modernTransactionLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
    flex: 1,
  },
  modernTransactionValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  modernTransactionMono: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary,
    fontFamily: "monospace",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  transactionStatusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modernDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 8,
  },
  modernTotalSection: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  modernTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modernTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  modernTotalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
  },

  // Modern Action Card (for pending, expired, error states)
  modernActionCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  actionMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  supportActions: {
    flexDirection: "row",
    gap: 12,
  },
  supportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },

  // Modern Bottom Bar
  modernBottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  bottomBarGradient: {
    paddingTop: 20,
    paddingBottom: 34,
    paddingHorizontal: 24,
  },
  modernActionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  modernPrimaryButton: {
    flex: 2,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  modernButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  modernButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  modernSecondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: "white",
    overflow: "hidden",
  },
  modernSecondaryButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  modernSecondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  bottomInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bottomInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
});
