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
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/src/constants/colors";
import { getAllOrders } from "@/src/services/learning_process/orders/orderServices";
import { getCourseDetail } from "@/src/services/learning_process/course/courseService";
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
import Svg, { Path } from "react-native-svg";

const WaveSvg = () => {
  return (
    <Svg
      height={120}
      width="100%"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
      style={styles.waveSvg}
    >
      <Path
        fill="#f8fafc"
        d="M0,120 C360,40 560,230 800,270 C1040,300 1260,200 1440,160 L1440,320 L0,320 Z"
      />
    </Svg>
  );
};

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const navigation = useNavigation();
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
            targetOrder?.course?.id ||
            targetOrder?.course?._id;
          console.log("🎯 Target courseId:", targetCourseId);
          if (targetCourseId) {
            try {
              const res = await getCourseDetail(String(targetCourseId));
              console.log(
                "🎯 Raw API response:",
                JSON.stringify(res?.data, null, 2)
              );
              // API returns: { data: [[[{course}]]] } - nested arrays
              let responseData = res?.data?.data ?? res?.data;

              // Flatten nested arrays
              while (Array.isArray(responseData) && responseData.length > 0) {
                if (Array.isArray(responseData[0])) {
                  responseData = responseData[0];
                } else {
                  break;
                }
              }

              const data: any = Array.isArray(responseData)
                ? responseData[0]
                : responseData;
              if (data) {
                console.log("🎯 Course data from API:", data);
                console.log("🎯 Course media:", data?.media);
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
          // Try to get courseId from course object and fetch again
          if (targetOrder?.course) {
            const fallbackCourseId =
              targetOrder.course._id || targetOrder.course.id;
            if (fallbackCourseId) {
              try {
                const res = await getCourseDetail(String(fallbackCourseId));
                console.log(
                  "🎯 Raw fallback API response:",
                  JSON.stringify(res?.data, null, 2)
                );
                // API returns: { data: [[[{course}]]] } - nested arrays
                let responseData = res?.data?.data ?? res?.data;

                // Flatten nested arrays
                while (Array.isArray(responseData) && responseData.length > 0) {
                  if (Array.isArray(responseData[0])) {
                    responseData = responseData[0];
                  } else {
                    break;
                  }
                }

                const data: any = Array.isArray(responseData)
                  ? responseData[0]
                  : responseData;
                if (data) {
                  console.log("🎯 Course data from fallback API:", data);
                  console.log("🎯 Course media from fallback:", data?.media);
                  const amountFromOrder = Number(
                    (targetOrder as any)?.price ??
                      (targetOrder as any)?.total ??
                      (targetOrder as any)?.amount ??
                      0
                  );
                  setCourse({
                    ...data,
                    price: amountFromOrder || data.price,
                    paidAmount: amountFromOrder || data.price,
                    transactionId:
                      targetOrder?.transactionId || targetOrder?.transaction_id,
                    status:
                      normalizeStatus(targetOrder?.status) || data?.status,
                  });
                  setLoading(false);
                  return;
                }
              } catch (error) {
                console.log(
                  "Failed to fetch course details from fallback:",
                  error
                );
              }
            }

            // Final fallback: use order course data (media might be IDs only)
            const amountFromOrder = Number(
              (targetOrder as any)?.price ??
                (targetOrder as any)?.total ??
                (targetOrder as any)?.amount ??
                0
            );
            console.log(
              "⚠️ Using order course data (media might be IDs only):",
              targetOrder.course.media
            );
            setCourse({
              title: targetOrder.course.title || "Khóa học",
              description: targetOrder.course.description || "",
              price: amountFromOrder || parseInt(amount || "0"),
              paidAmount: amountFromOrder || parseInt(amount || "0"),
              media: targetOrder.course.media || [],
              detail: targetOrder.course.detail || [],
              session_number: targetOrder.course.session_number,
              session_number_duration:
                targetOrder.course.session_number_duration,
              level: targetOrder.course.level,
              category: targetOrder.course.category || [],
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

    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, [checkmarkScale, opacity, pulseAnimation, scale, cardScale, cardOpacity]);

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

  const handleResetOrder = async () => {
    // Get courseId from course object or params
    const targetCourseId =
      course?.id ||
      course?._id ||
      courseId ||
      course?.courseId ||
      course?.course_id;

    if (targetCourseId) {
      try {
        // Fetch fresh course detail from API to ensure we have all data including media and category
        const res = await getCourseDetail(String(targetCourseId));
        console.log(
          "🎯 Raw reset API response:",
          JSON.stringify(res?.data, null, 2)
        );
        // API returns: { data: [[[{course}]]] } - nested arrays
        let responseData = res?.data?.data ?? res?.data;

        // Flatten nested arrays
        while (Array.isArray(responseData) && responseData.length > 0) {
          if (Array.isArray(responseData[0])) {
            responseData = responseData[0];
          } else {
            break;
          }
        }

        const fullCourseData: any = Array.isArray(responseData)
          ? responseData[0]
          : responseData;

        if (fullCourseData) {
          // Try to navigate directly to CourseDetail with full course data
          try {
            (navigation as any).navigate("CourseDetail", {
              course: fullCourseData,
            });
          } catch {
            // If direct navigation fails, navigate to member section first
            // then navigate to CourseDetail
            router.replace("/member");
            setTimeout(() => {
              try {
                (navigation as any).navigate("CourseDetail", {
                  course: fullCourseData,
                });
              } catch (err) {
                console.log("Navigation error:", err);
                // If navigation still fails, user is already on member screen
                // They can manually navigate to course detail
              }
            }, 300);
          }
        } else {
          // Fallback: use existing course object if API fails
          if (course) {
            try {
              (navigation as any).navigate("CourseDetail", { course });
            } catch {
              router.replace("/member");
            }
          } else {
            router.replace("/member");
          }
        }
      } catch (error) {
        console.log("Failed to fetch course detail:", error);
        // Fallback: use existing course object if API fails
        if (course) {
          try {
            (navigation as any).navigate("CourseDetail", { course });
          } catch {
            router.replace("/member");
          }
        } else {
          router.replace("/member");
        }
      }
    } else if (course) {
      // If no courseId but have course object, try to navigate with it
      try {
        (navigation as any).navigate("CourseDetail", { course });
      } catch {
        router.replace("/member");
      }
    } else {
      // If no course data available, navigate to member section
      router.replace("/member");
    }
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

      {/* Hero Section with Image Background */}
      <View style={styles.heroContainer}>
        {/* Background Gradient by Status */}
        <LinearGradient
          colors={
            isSuccess
              ? [colors.primary, colors.primaryDark]
              : isPending
              ? ["#f59e0b", "#d97706"]
              : isExpired
              ? ["#6b7280", "#4b5563"]
              : ["#ef4444", "#dc2626"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBackgroundGradient}
        />

        {/* Overlay */}
        <LinearGradient
          colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.5)"]}
          style={styles.heroOverlay}
        />

        {/* Wave Divider */}
        <View style={styles.waveContainer}>
          <WaveSvg />
        </View>

        {/* Content */}
        <View style={styles.heroContent}>
          <Animated.View
            style={[
              styles.heroIconWrapper,
              animatedIconStyle,
              animatedPulseStyle,
            ]}
          >
            <View style={styles.heroIconCircle}>
              <Animated.View style={animatedCheckmarkStyle}>
                <Ionicons
                  name={
                    isSuccess
                      ? "checkmark-circle"
                      : isPending
                      ? "time"
                      : isExpired
                      ? "hourglass"
                      : "close-circle"
                  }
                  size={36}
                  color="white"
                />
              </Animated.View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.heroTextWrapper, animatedContentStyle]}>
            <Text style={styles.heroTitle}>
              {isSuccess
                ? "Thanh toán thành công"
                : isPending
                ? "Chờ thanh toán"
                : isExpired
                ? "Đã hết hạn"
                : "Thanh toán thất bại"}
            </Text>
            <Text style={styles.heroSubtitle}>
              {isSuccess
                ? "Chúc mừng! Bạn đã đăng ký khóa học thành công"
                : isPending
                ? "Đơn hàng đang chờ thanh toán"
                : isExpired
                ? "Đơn hàng đã hết hạn thanh toán"
                : "Đã xảy ra lỗi trong quá trình thanh toán"}
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Course Info Card */}
        {course && (
          <Animated.View style={[styles.card, animatedCardStyle]}>
            {/* Background Image with Overlay */}
            {course.media &&
              Array.isArray(course.media) &&
              course.media.length > 0 &&
              course.media[0] &&
              typeof course.media[0] === "object" &&
              (course.media[0]?.path || course.media[0]?.url) && (
                <View style={styles.cardBackgroundImageContainer}>
                  <Image
                    source={{
                      uri: course.media[0]?.path || course.media[0]?.url,
                    }}
                    style={styles.cardBackgroundImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.5)"]}
                    style={styles.cardBackgroundOverlay}
                  />
                </View>
              )}
            <View style={styles.cardContent}>
              {/* Course Header */}
              <View style={styles.courseHeader}>
                <Text
                  style={[
                    styles.courseTitle,
                    course.media &&
                      Array.isArray(course.media) &&
                      course.media.length > 0 &&
                      course.media[0] &&
                      typeof course.media[0] === "object" &&
                      (course.media[0]?.path || course.media[0]?.url) &&
                      styles.courseTitleWithBackground,
                  ]}
                  numberOfLines={2}
                >
                  {course.title}
                </Text>
                <View style={styles.courseHeaderBottom}>
                  <Text
                    style={[
                      styles.coursePrice,
                      course.media &&
                        Array.isArray(course.media) &&
                        course.media.length > 0 &&
                        course.media[0] &&
                        typeof course.media[0] === "object" &&
                        (course.media[0]?.path || course.media[0]?.url) &&
                        styles.coursePriceWithBackground,
                    ]}
                  >
                    {formatPrice(getDisplayAmount())}
                  </Text>
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
                        styles.statusBadgeText,
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

              {/* Course Info Grid */}
              {(course.session_number ||
                course.session_number_duration ||
                course.level) && (
                <View style={styles.courseInfoGrid}>
                  {course.session_number && (
                    <View
                      style={[
                        styles.infoItem,
                        course.media &&
                          Array.isArray(course.media) &&
                          course.media.length > 0 &&
                          course.media[0] &&
                          typeof course.media[0] === "object" &&
                          (course.media[0]?.path || course.media[0]?.url) &&
                          styles.infoItemWithBackground,
                      ]}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={colors.primary}
                      />
                      <Text style={styles.infoLabel}>Số buổi</Text>
                      <Text style={styles.infoValue}>
                        {course.session_number}
                      </Text>
                    </View>
                  )}
                  {course.session_number_duration && (
                    <View
                      style={[
                        styles.infoItem,
                        course.media &&
                          Array.isArray(course.media) &&
                          course.media.length > 0 &&
                          course.media[0] &&
                          typeof course.media[0] === "object" &&
                          (course.media[0]?.path || course.media[0]?.url) &&
                          styles.infoItemWithBackground,
                      ]}
                    >
                      <Ionicons
                        name="time-outline"
                        size={18}
                        color={colors.primary}
                      />
                      <Text style={styles.infoLabel}>Thời lượng</Text>
                      <Text style={styles.infoValue}>
                        {course.session_number_duration}
                      </Text>
                    </View>
                  )}
                  {course.level && (
                    <View
                      style={[
                        styles.infoItem,
                        course.media &&
                          Array.isArray(course.media) &&
                          course.media.length > 0 &&
                          course.media[0] &&
                          typeof course.media[0] === "object" &&
                          (course.media[0]?.path || course.media[0]?.url) &&
                          styles.infoItemWithBackground,
                      ]}
                    >
                      <Ionicons
                        name="trending-up-outline"
                        size={18}
                        color={colors.primary}
                      />
                      <Text style={styles.infoLabel}>Cấp độ</Text>
                      <Text style={styles.infoValue}>
                        {course.level === "beginner"
                          ? "Cơ bản"
                          : course.level === "intermediate"
                          ? "Trung bình"
                          : course.level === "advanced"
                          ? "Nâng cao"
                          : course.level}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Transaction Details Card */}
        <Animated.View style={[styles.card, animatedCardStyle]}>
          <View style={styles.cardContent}>
            <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>

            <View style={styles.transactionList}>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Số tiền</Text>
                <Text style={styles.transactionValue}>
                  {formatPrice(getDisplayAmount())}
                </Text>
              </View>

              {(course?.transactionId ||
                (Array.isArray(params.transactionId)
                  ? params.transactionId[0]
                  : params.transactionId)) && (
                <View style={styles.transactionRow}>
                  <Text style={styles.transactionLabel}>Mã giao dịch</Text>
                  <Text style={styles.transactionId}>
                    {course?.transactionId ||
                      (Array.isArray(params.transactionId)
                        ? params.transactionId[0]
                        : params.transactionId)}
                  </Text>
                </View>
              )}

              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Thời gian</Text>
                <Text style={styles.transactionValue}>
                  {new Date().toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>

              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Trạng thái</Text>
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
                      styles.statusBadgeText,
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
            </View>

            {/* Total */}
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Tổng thanh toán</Text>
              <Text style={styles.totalValue}>
                {formatPrice(getDisplayAmount())}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Action Card for non-success states */}
        {(isPending ||
          isExpired ||
          (!isSuccess && !isPending && !isExpired)) && (
          <Animated.View style={[styles.card, animatedCardStyle]}>
            <View
              style={[
                styles.cardContent,
                {
                  backgroundColor: isPending
                    ? "#fefbf0"
                    : isExpired
                    ? "#f9fafb"
                    : "#fef2f2",
                },
              ]}
            >
              <View style={styles.actionContent}>
                <Ionicons
                  name={
                    isPending
                      ? "card-outline"
                      : isExpired
                      ? "refresh"
                      : "warning"
                  }
                  size={32}
                  color={
                    isPending ? "#d97706" : isExpired ? "#6b7280" : "#dc2626"
                  }
                />
                <View style={styles.actionText}>
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
                      : "Vui lòng thử lại hoặc liên hệ với chúng tôi"}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          {isSuccess ? (
            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <Ionicons name="home" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Về trang chủ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleViewCourse}
                activeOpacity={0.8}
              >
                <Ionicons name="book" size={20} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>Bắt đầu học</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={isExpired ? handleResetOrder : handleContinue}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPending ? "card" : "refresh"}
                size={20}
                color="white"
              />
              <Text style={styles.primaryButtonText}>
                {isPending
                  ? "Thanh toán ngay"
                  : isExpired
                  ? "Đặt lại"
                  : "Thử lại"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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

  // Hero Section - Wave Style
  heroContainer: {
    height: 320,
    position: "relative",
    overflow: "hidden",
  },
  heroBackgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  heroBackgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  waveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    height: 120,
  },
  waveSvg: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  heroContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 24,
    zIndex: 3,
  },
  heroIconWrapper: {
    marginBottom: 16,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  heroTextWrapper: {
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  // Content
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Card - Primary Theme
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
  },
  cardContent: {
    padding: 16,
    position: "relative",
    zIndex: 2,
  },
  cardBackgroundImageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  cardBackgroundImage: {
    width: "100%",
    height: "100%",
  },
  cardBackgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },

  // Course Card - Compact
  courseImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
  courseHeader: {
    marginBottom: 0,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  courseTitleWithBackground: {
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  courseHeaderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coursePrice: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
  },
  coursePriceWithBackground: {
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  courseInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  infoItemWithBackground: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 4,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },

  // Category Section
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  categoryTagText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },

  // Course Content - Primary Theme
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 14,
  },
  contentSection: {
    marginBottom: 16,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  detailsSection: {
    gap: 14,
  },
  detailItem: {
    marginBottom: 12,
    paddingLeft: 4,
  },
  detailItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  detailItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  detailItemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  detailSubItems: {
    paddingLeft: 18,
    gap: 6,
  },
  subItem: {
    marginBottom: 4,
  },
  subItemText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  // Transaction - Primary Theme
  transactionList: {
    gap: 14,
    marginBottom: 16,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  transactionLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  transactionValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  transactionId: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    fontFamily: "monospace",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
  },

  // Status Badge - Primary Theme
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Action Card - Primary Theme
  actionContent: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  actionMessage: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Bottom Bar - Primary Theme
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  bottomBarContent: {
    paddingTop: 16,
    paddingBottom: 34,
    paddingHorizontal: 16,
  },
  successActions: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
});
