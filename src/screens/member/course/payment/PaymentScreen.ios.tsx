import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../../../constants/colors";
import {
  payOrderZaloPay,
  getAllOrders,
} from "../../../../services/learning_process/orders/orderServices";
import { useUserInfo } from "../../../../hooks/useUserInfo";
import { showErrorToast } from "../../../../utils/errorHandler";
import { SharedHeader } from "@/src/components/custom/header/SharedHeader";
import { ZaloPayService } from "@/src/services/zalopay";

interface PaymentProps {
  course: any;
  selectedClass: any;
  autoPay?: boolean;
}

export default function PaymentScreen() {
  const route = useRoute();
  const router = useRouter();
  const { course, selectedClass } = route.params as PaymentProps;
  const { userInfo } = useUserInfo();
  const [submitting, setSubmitting] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Initialize ZaloPay SDK on component mount
  React.useEffect(() => {
    ZaloPayService.getInstance().initialize("2554", "sandbox");
  }, []);

  // Log whether ZaloPay app is detected on device (for debugging)
  React.useEffect(() => {
    (async () => {
      const installed =
        await ZaloPayService.getInstance().checkZaloPayInstalled();
      console.log("[ZaloPay] Installed on device:", installed);
    })();
  }, []);

  // Check for pending order when component mounts
  React.useEffect(() => {
    const checkPendingOrder = async () => {
      try {
        console.log("🔍 [PAYMENT DEBUG] Checking for pending orders...");
        const response = await getAllOrders();
        const orders = response?.data?.data || [];

        // Find the latest pending order for this course
        const latestPendingOrder = orders.find(
          (order: any) =>
            order.status === "pending" &&
            (order.course?._id === course?._id || order.course === course?._id)
        );

        if (latestPendingOrder) {
          console.log(
            "✅ [PAYMENT DEBUG] Found pending order:",
            latestPendingOrder
          );
          setPendingOrder(latestPendingOrder);
        } else {
          console.log("ℹ️ [PAYMENT DEBUG] No pending order found");
        }
      } catch (error) {
        console.error(
          "❌ [PAYMENT DEBUG] Error checking pending orders:",
          error
        );
      }
    };

    checkPendingOrder();
  }, [course]);

  // No auto pay state needed; payment starts only when user presses the button

  const paymentPayload = useMemo(() => {
    const courseId = course?._id || course?.id || "";
    const total = Number(course?.price || 0);
    const username = userInfo?.name || "";
    const phone = userInfo?.phone || "";
    const email = userInfo?.email || "";
    const payload = {
      total,
      course: courseId,
      selectedClass: selectedClass?.id,
      guest: {
        username,
        phone,
        email,
      },
    };
    console.log("💰 Payment payload:", JSON.stringify(payload, null, 2));
    console.log("💰 Selected class ID:", selectedClass?.id);
    console.log("💰 Selected class originalData:", selectedClass?.originalData);
    return payload;
  }, [course, selectedClass, userInfo]);

  // Handle ZaloPay callback via myapp:// deep link
  React.useEffect(() => {
    const parseParams = (u: string): Record<string, string> => {
      try {
        const query = u.split("?")[1] || "";
        const pairs = query.split("&").filter(Boolean);
        const params: Record<string, string> = {};
        for (const pair of pairs) {
          const [k, v] = pair.split("=");
          if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || "");
        }
        return params;
      } catch {
        return {};
      }
    };

    const handleUrl = (incoming: { url: string }) => {
      const { url } = incoming;
      if (!url || !url.startsWith("myapp://")) return;

      const params = parseParams(url);
      const status = params.status || params.return_code || params.code;

      if (status === "success" || status === "1" || status === "0") {
        // Navigate to success screen with known context
        router.push({
          pathname: "/payment-success",
          params: {
            courseId: (course as any)?._id || (course as any)?.id,
            courseTitle: (course as any)?.title || (course as any)?.name || "",
            coursePrice: String(
              (course as any)?.price || paymentPayload.total || 0
            ),
            classId: (selectedClass as any)?.id,
            className:
              (selectedClass as any)?.originalData?.name ||
              (selectedClass as any)?.name ||
              "",
            transactionId: params.transactionId || params.apptransid || "N/A",
            amount: String(paymentPayload.total || 0),
            status: "success",
          },
        });
      } else if (status === "4" || status === "cancel") {
        // User canceled – do nothing or show a message
      } else if (status) {
        Alert.alert("Thanh toán thất bại", `Mã trạng thái: ${status}`);
      }
    };

    const subscription = Linking.addEventListener("url", handleUrl);
    (async () => {
      const initial = await Linking.getInitialURL();
      if (initial) handleUrl({ url: initial });
    })();

    return () => {
      subscription.remove();
    };
  }, [router, course, selectedClass, paymentPayload]);

  const handlePayment = useCallback(async () => {
    try {
      console.log("═══════════════════════════════════════════════════");
      console.log("🚀 [PAYMENT DEBUG] Bắt đầu thanh toán");
      console.log("═══════════════════════════════════════════════════");

      // Log đầy đủ paymentPayload
      console.log(
        "📦 [PAYMENT DEBUG] paymentPayload:",
        JSON.stringify(paymentPayload, null, 2)
      );
      console.log(
        "📦 [PAYMENT DEBUG] paymentPayload.course:",
        paymentPayload.course
      );
      console.log(
        "📦 [PAYMENT DEBUG] paymentPayload.total:",
        paymentPayload.total
      );
      console.log(
        "📦 [PAYMENT DEBUG] paymentPayload.selectedClass:",
        paymentPayload.selectedClass
      );
      console.log(
        "📦 [PAYMENT DEBUG] paymentPayload.guest:",
        JSON.stringify(paymentPayload.guest, null, 2)
      );

      // Log đầy đủ course và selectedClass
      console.log(
        "📚 [PAYMENT DEBUG] course object:",
        JSON.stringify(course, null, 2)
      );
      console.log(
        "📚 [PAYMENT DEBUG] selectedClass object:",
        JSON.stringify(selectedClass, null, 2)
      );
      console.log(
        "👤 [PAYMENT DEBUG] userInfo:",
        JSON.stringify(userInfo, null, 2)
      );

      if (!paymentPayload.course) {
        console.error("❌ [PAYMENT DEBUG] Thiếu mã khóa học");
        Alert.alert("Lỗi", "Thiếu mã khóa học");
        return;
      }
      if (!paymentPayload.total || paymentPayload.total <= 0) {
        console.error(
          "❌ [PAYMENT DEBUG] Số tiền không hợp lệ:",
          paymentPayload.total
        );
        Alert.alert("Lỗi", "Số tiền không hợp lệ");
        return;
      }
      setSubmitting(true);

      // Check if ZaloPay app is installed first
      console.log("🔍 [PAYMENT DEBUG] Kiểm tra ZaloPay app đã cài đặt...");
      const isZaloPayInstalled =
        await ZaloPayService.getInstance().checkZaloPayInstalled();

      console.log(
        "✅ [PAYMENT DEBUG] ZaloPay app installed:",
        isZaloPayInstalled
      );

      const forceUseSDK = true;
      console.log("🔧 [PAYMENT DEBUG] forceUseSDK:", forceUseSDK);

      let orderUrl: string | undefined;
      let zpTransToken: string | undefined;

      // Check if there's a pending order to reuse
      if (pendingOrder && pendingOrder.status === "pending") {
        console.log("🔄 [PAYMENT DEBUG] Reusing pending order:", pendingOrder);
        // Extract payment info from pending order
        orderUrl = pendingOrder.payment_info?.order_url;
        zpTransToken = pendingOrder.payment_info?.zp_trans_token;
        console.log("🔄 [PAYMENT DEBUG] Reusing orderUrl:", orderUrl);
        console.log("🔄 [PAYMENT DEBUG] Reusing zpTransToken:", zpTransToken);
      } else {
        // Create new order
        console.log(
          "💰 [PAYMENT DEBUG] Calling payOrderZaloPay with payload:",
          JSON.stringify(paymentPayload, null, 2)
        );
        console.log(
          "💰 [PAYMENT DEBUG] class_id:",
          paymentPayload.selectedClass
        );

        try {
          const response = await payOrderZaloPay(paymentPayload);

          console.log("═══════════════════════════════════════════════════");
          console.log("📥 [PAYMENT DEBUG] Response từ API:");
          console.log("═══════════════════════════════════════════════════");
          console.log(
            "📥 [PAYMENT DEBUG] Full payment response:",
            JSON.stringify(response, null, 2)
          );

          // Extract payment data from response
          const paymentData = response?.data?.data?.payment;
          orderUrl = paymentData?.order_url;
          zpTransToken = paymentData?.zp_trans_token;

          // Save this as pending order
          const newPendingOrder = {
            status: "pending",
            course: course._id || course.id,
            payment_info: {
              order_url: orderUrl,
              zp_trans_token: zpTransToken,
            },
          };
          setPendingOrder(newPendingOrder);
        } catch (createOrderError: any) {
          // Handle 500 error for existing pending transaction
          if (createOrderError?.response?.status === 500) {
            console.warn(
              "⚠️ [PAYMENT DEBUG] 500 Error - có giao dịch chưa hoàn tất"
            );
            setErrorMessage(
              "Bạn có một giao dịch chưa hoàn tất. Vui lòng hoàn tất giao dịch trước hoặc thử lại sau."
            );
            setErrorModalVisible(true);
            return;
          }
          throw createOrderError;
        }
      }

      console.log("═══════════════════════════════════════════════════");
      console.log("🔍 [PAYMENT DEBUG] Payment data to use:");
      console.log("═══════════════════════════════════════════════════");
      console.log("🔍 [PAYMENT DEBUG] orderUrl:", orderUrl);
      console.log("🔍 [PAYMENT DEBUG] zpTransToken:", zpTransToken);
      console.log(
        "🔍 [PAYMENT DEBUG] zpTransToken length:",
        zpTransToken?.length
      );
      console.log("🔍 [PAYMENT DEBUG] zpTransToken type:", typeof zpTransToken);
      console.log("🔍 [PAYMENT DEBUG] isZaloPayInstalled:", isZaloPayInstalled);
      console.log("🔍 [PAYMENT DEBUG] forceUseSDK:", forceUseSDK);
      console.log(
        "🔍 [PAYMENT DEBUG] willUseSDK:",
        (isZaloPayInstalled || forceUseSDK) && !!zpTransToken
      );
      console.log("🔍 [PAYMENT DEBUG] hasZpTransToken:", !!zpTransToken);
      console.log("🔍 [PAYMENT DEBUG] hasOrderUrl:", !!orderUrl);

      if ((isZaloPayInstalled || forceUseSDK) && zpTransToken) {
        // Use native ZaloPay SDK if app is installed and we have zpTransToken
        console.log("═══════════════════════════════════════════════════");
        console.log("💳 [PAYMENT DEBUG] Sử dụng ZaloPay SDK");
        console.log("═══════════════════════════════════════════════════");
        console.log(
          "💳 [PAYMENT DEBUG] zpTransToken để truyền vào SDK:",
          zpTransToken
        );
        console.log(
          "💳 [PAYMENT DEBUG] zpTransToken (raw):",
          JSON.stringify(zpTransToken)
        );
        console.log(
          "💳 [PAYMENT DEBUG] ZaloPayService instance:",
          ZaloPayService.getInstance()
        );
        console.log(
          "💳 [PAYMENT DEBUG] Gọi ZaloPayService.getInstance().payOrder()..."
        );

        try {
          const result = await ZaloPayService.getInstance().payOrder(
            zpTransToken,
            orderUrl || undefined
          );

          console.log("═══════════════════════════════════════════════════");
          console.log("📊 [PAYMENT DEBUG] ZaloPay SDK result:");
          console.log("═══════════════════════════════════════════════════");
          console.log(
            "📊 [PAYMENT DEBUG] result:",
            JSON.stringify(result, null, 2)
          );
          console.log(
            "📊 [PAYMENT DEBUG] result.returnCode:",
            result?.returnCode
          );
          console.log(
            "📊 [PAYMENT DEBUG] result.returnMessage:",
            result?.returnMessage
          );
          console.log("📊 [PAYMENT DEBUG] result (full object):", result);

          if (result.returnCode === 1) {
            // Clear pending order on success
            setPendingOrder(null);

            // Navigate to payment success page using router
            console.log("🎯 Navigating to payment-success with params:", {
              courseId: course._id || course.id,
              courseTitle: course.title || course.name || "",
              coursePrice: String(course.price || paymentPayload.total || 0),
              classId: selectedClass.id,
              className: selectedClass.originalData?.name || selectedClass.name,
              transactionId: (result as any).transactionId || "N/A",
              amount: paymentPayload.total.toString(),
              status: "success",
            });

            router.push({
              pathname: "/payment-success",
              params: {
                courseId: course._id || course.id,
                courseTitle: course.title || course.name || "",
                coursePrice: String(course.price || paymentPayload.total || 0),
                classId: selectedClass.id,
                className:
                  selectedClass.originalData?.name || selectedClass.name,
                transactionId: (result as any).transactionId || "N/A",
                amount: paymentPayload.total.toString(),
                status: "success",
              },
            });
          } else if (result.returnCode === 4) {
            // User cancelled payment
            console.log("Payment cancelled by user");
          } else {
            Alert.alert("Lỗi", result.returnMessage || "Thanh toán thất bại");
          }
        } catch (sdkError: any) {
          console.error("[PaymentScreen] ZaloPay SDK error:", sdkError);
          console.error("[PaymentScreen] Error code:", sdkError?.code);
          console.error("[PaymentScreen] Error message:", sdkError?.message);

          showErrorToast(sdkError, {
            title: "Lỗi ZaloPay SDK",
            message: `Có lỗi xảy ra với ZaloPay SDK: ${
              sdkError?.message || sdkError
            }`,
          });
          Alert.alert(
            "Lỗi SDK",
            `Lỗi: ${(sdkError as any)?.message || sdkError}`
          );
        }
      } else {
        Alert.alert("Lỗi", "Không nhận được thông tin thanh toán");
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Thanh toán thất bại");
    } finally {
      setSubmitting(false);
    }
  }, [paymentPayload, router, course, selectedClass, userInfo, pendingOrder]);

  // Auto trigger payment if requested (after handlePayment is defined)
  // No autoPay: user must press the button to initiate payment

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SharedHeader title="Thanh toán" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Course Info */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khóa học</Text>
          <LinearGradient
            colors={["#0B61A4", "#084B83"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.courseCard, { borderWidth: 0 }]}
          >
            <View style={styles.courseHeader}>
              <Ionicons name="school" size={24} color={colors.white} />
              <Text style={[styles.courseTitle, { color: colors.white }]}>
                {course?.title}
              </Text>
            </View>
            <Text style={[styles.coursePrice, { color: colors.white }]}>
              {formatPrice(course?.price || 0)}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Selected Class Info */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Lớp học đã chọn</Text>
          <View style={styles.classCard}>
            <View style={styles.classHeader}>
              <View style={styles.classHeaderContent}>
                <Text style={styles.className}>
                  {selectedClass?.originalData?.name || selectedClass?.name}
                </Text>
                <Text style={styles.instructor}>
                  Huấn luyện viên:{" "}
                  {selectedClass?.originalData?.instructor?.username ||
                    selectedClass?.originalData?.instructor?.name ||
                    selectedClass?.instructor}
                </Text>
              </View>
              <View style={styles.checkmarkContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.success}
                />
              </View>
            </View>

            <View style={styles.classDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={18} color={colors.primary} />
                <Text style={styles.detailText}>
                  {selectedClass?.originalData?.start_date ||
                    selectedClass?.startDate}{" "}
                  -{" "}
                  {selectedClass?.originalData?.end_date ||
                    selectedClass?.endDate}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="time" size={18} color={colors.primary} />
                <Text style={styles.detailText}>
                  Thời lượng: {selectedClass?.duration}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="location" size={18} color={colors.primary} />
                <Text style={styles.detailText}>
                  {selectedClass?.originalData?.pool?.name ||
                    selectedClass?.originalData?.pool_name ||
                    selectedClass?.pool}
                </Text>
              </View>
            </View>

            <View style={styles.scheduleSection}>
              <Text style={styles.scheduleTitle}>Lịch học hàng tuần</Text>
              <View style={styles.weeklySchedule}>
                {selectedClass?.originalData?.schedule_plan &&
                selectedClass.originalData.schedule_plan.length > 0
                  ? selectedClass.originalData.schedule_plan.map(
                      (plan: any, index: number) => (
                        <Animated.View
                          key={index}
                          entering={FadeInUp.delay(400 + index * 50)}
                          style={styles.sessionItem}
                        >
                          <Text style={styles.sessionDay}>
                            {plan.days_of_week?.[0] || "Thứ"}
                          </Text>
                          <Text style={styles.sessionTime}>
                            {plan.slot?.title || "Slot"} -{" "}
                            {plan.slot?.duration || "45 phút"}
                          </Text>
                        </Animated.View>
                      )
                    )
                  : selectedClass?.schedule?.map(
                      (session: any, index: number) => (
                        <Animated.View
                          key={index}
                          entering={FadeInUp.delay(400 + index * 50)}
                          style={styles.sessionItem}
                        >
                          <Text style={styles.sessionDay}>{session.day}</Text>
                          <Text style={styles.sessionTime}>{session.time}</Text>
                        </Animated.View>
                      )
                    )}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Payment Summary */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Tóm tắt thanh toán</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Học phí</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(course?.price || 0)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>
                {formatPrice(course?.price || 0)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Payment Method */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <View style={styles.paymentMethodCard}>
            <View style={styles.paymentMethodGradient}>
              <View style={styles.paymentMethod}>
                <Ionicons name="card" size={28} color={colors.primary} />
                <Text
                  style={[styles.paymentMethodText, { color: colors.primary }]}
                >
                  ZaloPay
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Action */}
      <Animated.View entering={FadeInUp.delay(700)} style={styles.bottomAction}>
        <TouchableOpacity
          style={[styles.payButton, submitting && styles.disabledButton]}
          disabled={submitting}
          onPress={handlePayment}
        >
          <LinearGradient
            colors={
              submitting
                ? ["#94A3B8", "#94A3B8"]
                : [colors.primary, colors.primary + "CC"]
            }
            style={StyleSheet.absoluteFillObject}
          />
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={colors.white}
              />
              <Text style={styles.payButtonText}>
                {pendingOrder
                  ? "Tiếp tục thanh toán"
                  : `Thanh toán ${formatPrice(course?.price || 0)}`}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>

        {pendingOrder && (
          <Text style={styles.pendingOrderNote}>
            💡 Bạn có một giao dịch chưa hoàn tất. Nhấn để tiếp tục thanh toán.
          </Text>
        )}
      </Animated.View>

      {/* Error Modal */}
      <Modal
        visible={errorModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.errorIconContainer}>
                <Ionicons name="warning" size={32} color={colors.error} />
              </View>
              <Text style={styles.modalTitle}>Thông báo</Text>
            </View>

            <Text style={styles.modalMessage}>{errorMessage}</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setErrorModalVisible(false)}
            >
              <LinearGradient
                colors={[colors.primary, colors.primary + "CC"]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.modalButtonText}>Đã hiểu</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  courseCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6EEF9",
    backgroundColor: colors.white,
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  coursePrice: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "right",
  },
  classCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6EEF9",
  },
  classHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  classHeaderContent: {
    flex: 1,
  },
  checkmarkContainer: {
    marginLeft: 12,
  },
  className: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
    lineHeight: 24,
  },
  instructor: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  classDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  scheduleSection: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 20,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  weeklySchedule: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sessionItem: {
    backgroundColor: "#F8FAFC",
    padding: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sessionDay: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  sessionTime: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
  },
  summaryCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6EEF9",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
  },
  paymentMethodCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E6EEF9",
    backgroundColor: colors.white,
  },
  paymentMethodGradient: {
    padding: 20,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  paymentMethodText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
  },
  bottomAction: {
    padding: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#E7EEF8",
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    position: "relative",
    overflow: "hidden",
    borderWidth: 0,
  },
  disabledButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  pendingOrderNote: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  errorIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.error + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  modalMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
    textAlign: "center",
  },
});
