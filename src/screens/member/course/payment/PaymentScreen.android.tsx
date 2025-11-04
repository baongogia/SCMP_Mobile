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
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../../../constants/colors";
import { payOrderZaloPay } from "../../../../services/learning_process/orders/orderServices";
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

  // Initialize ZaloPay SDK on component mount
  React.useEffect(() => {
    ZaloPayService.getInstance().initialize("2554", "sandbox");
  }, []);

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

  const handlePayment = useCallback(async () => {
    try {
      if (!paymentPayload.course) {
        Alert.alert("Lỗi", "Thiếu mã khóa học");
        return;
      }
      if (!paymentPayload.total || paymentPayload.total <= 0) {
        Alert.alert("Lỗi", "Số tiền không hợp lệ");
        return;
      }
      setSubmitting(true);

      // Check if ZaloPay app is installed first
      const isZaloPayInstalled =
        await ZaloPayService.getInstance().checkZaloPayInstalled();

      console.log("ZaloPay app installed:", isZaloPayInstalled);

      const forceUseSDK = true;
      console.log(
        "💰 Calling payOrderZaloPay with class_id:",
        paymentPayload.selectedClass
      );
      const response = await payOrderZaloPay(paymentPayload);

      console.log("Full payment response:", JSON.stringify(response, null, 2));

      // Extract payment data from response
      const paymentData = response?.data?.data?.payment;
      const orderUrl = paymentData?.order_url;
      const zpTransToken = paymentData?.zp_trans_token;

      console.log("Extracted payment data:", {
        paymentData,
        orderUrl,
        zpTransToken,
        isZaloPayInstalled,
        forceUseSDK,
        willUseSDK: (isZaloPayInstalled || forceUseSDK) && !!zpTransToken,
        hasZpTransToken: !!zpTransToken,
        hasOrderUrl: !!orderUrl,
      });

      if ((isZaloPayInstalled || forceUseSDK) && zpTransToken) {
        // Use native ZaloPay SDK if app is installed and we have zpTransToken
        console.log("Using ZaloPay SDK with token:", zpTransToken);
        try {
          const result = await ZaloPayService.getInstance().payOrder(
            zpTransToken
          );
          console.log("ZaloPay SDK result:", result);

          if (result.returnCode === 1) {
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
        } catch (sdkError) {
          showErrorToast(sdkError, {
            title: "Lỗi ZaloPay SDK",
            message: "Có lỗi xảy ra với ZaloPay SDK",
          });
          Alert.alert(
            "Lỗi SDK",
            `Lỗi: ${(sdkError as any)?.message || sdkError}`
          );
          // Fallback to URL opening if SDK fails
          if (orderUrl) {
            console.log("Falling back to URL:", orderUrl);
            try {
              await Linking.openURL(orderUrl);
            } catch (urlError) {
              showErrorToast(urlError, {
                title: "Lỗi mở URL",
                message: "Không thể mở thanh toán",
              });
              Alert.alert("Lỗi", "Không thể mở thanh toán");
            }
          } else {
            Alert.alert("Lỗi", "Không thể khởi tạo thanh toán");
          }
        }
      } else if (orderUrl) {
        // Fallback to URL opening (either no app installed or no zpTransToken)
        console.log("Using URL fallback:", orderUrl);
        const canOpen = await Linking.canOpenURL(orderUrl);
        if (canOpen) {
          await Linking.openURL(orderUrl);
        } else {
          router.push({ pathname: "/webview-call", params: { url: orderUrl } });
        }
      } else {
        Alert.alert("Lỗi", "Không nhận được thông tin thanh toán");
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Thanh toán thất bại");
    } finally {
      setSubmitting(false);
    }
  }, [paymentPayload, router, course, selectedClass]);

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
                  Lớp:{" "}
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
                Thanh toán {formatPrice(course?.price || 0)}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
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
});
