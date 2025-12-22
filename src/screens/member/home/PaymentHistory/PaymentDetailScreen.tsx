import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/src/constants/colors";
import { Order } from "@/src/types/order";
import { SharedHeader } from "@/src/components/custom/header/SharedHeader";
import { getCourseDetail } from "@/src/services/learning_process/course/courseService";

interface PaymentDetailScreenProps {
  order: Order;
}

export default function PaymentDetailScreen() {
  const route = useRoute();
  const { order } = route.params as PaymentDetailScreenProps;
  const [courseImageUrl, setCourseImageUrl] = useState<string | null>(null);

  // Fetch course detail to get media
  const fetchCourseMedia = async (courseId: string): Promise<string | null> => {
    try {
      const res = await getCourseDetail(courseId);
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

      const courseData: any = Array.isArray(responseData)
        ? responseData[0]
        : responseData;

      if (
        courseData?.media &&
        Array.isArray(courseData.media) &&
        courseData.media.length > 0 &&
        courseData.media[0] &&
        typeof courseData.media[0] === "object" &&
        (courseData.media[0]?.path || courseData.media[0]?.url)
      ) {
        return courseData.media[0]?.path || courseData.media[0]?.url || null;
      }
      return null;
    } catch (error) {
      console.log("Failed to fetch course media:", error);
      return null;
    }
  };

  useEffect(() => {
    const loadCourseImage = async () => {
      const courseId = order.course?._id;
      if (courseId) {
        const imageUrl = await fetchCourseMedia(String(courseId));
        setCourseImageUrl(imageUrl);
      }
    };
    loadCourseImage();
  }, [order.course?._id]);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Không xác định";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Không xác định";
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status text
  const getStatusText = (status: string[]) => {
    if (status.includes("paid")) return "Đã thanh toán";
    if (status.includes("expired")) return "Đã hết hạn";
    if (status.includes("pending")) return "Đang chờ thanh toán";
    if (status.includes("refunded")) return "Đã hoàn tiền";
    return "Không xác định";
  };

  // Get status icon
  const getStatusIcon = (status: string[]) => {
    if (status.includes("paid")) return "checkmark-circle";
    if (status.includes("pending")) return "time-outline";
    if (status.includes("expired")) return "close-circle";
    if (status.includes("refunded")) return "return-down-back";
    return "help-circle-outline";
  };

  // Status flags
  const isSuccess = order.status.includes("paid");
  const isPending = order.status.includes("pending");
  const isExpired = order.status.includes("expired");
  const isRefunded = order.status.includes("refunded");

  return (
    <View style={styles.container}>
      {/* Header */}
      <SharedHeader
        title="Chi tiết thanh toán"
        bottomCurveColor={colors.mainBackground}
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status Card */}
        <View style={styles.statusCard}>
          {/* Background Gradient */}
          <LinearGradient
            colors={
              isSuccess
                ? [colors.primary, colors.primaryDark]
                : isPending
                ? ["#f59e0b", "#d97706"]
                : isExpired
                ? ["#6b7280", "#4b5563"]
                : isRefunded
                ? ["#607D8B", "#455A64"] // Slate/Blue Grey for refunded
                : ["#ef4444", "#dc2626"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusCardGradient}
          />
          {/* Overlay */}
          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.2)"]}
            style={styles.statusCardOverlay}
          />
          {/* Content */}
          <View style={styles.statusCardContent}>
            <View style={styles.statusHeader}>
              <Ionicons
                name={getStatusIcon(order.status) as any}
                size={24}
                color={colors.white}
              />
              <Text style={styles.statusText}>
                {getStatusText(order.status)}
              </Text>
            </View>
            <Text style={styles.statusSubtext}>
              Đơn hàng #{order._id.slice(-8).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Course Information Redesign */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
              Thông tin khóa học
            </Text>
          </View>
          <View style={styles.courseCardNew}>
            {/* Banner Image */}
            <View style={styles.courseBannerContainer}>
              {courseImageUrl ? (
                <Image
                  source={{ uri: courseImageUrl }}
                  style={styles.courseBanner}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.courseBannerPlaceholder}>
                  <Ionicons
                    name="image-outline"
                    size={40}
                    color={colors.gray[300]}
                  />
                </View>
              )}
            </View>

            {/* Course Details Body */}
            <View style={styles.courseCardBody}>
              <Text style={styles.courseTitleLarge}>{order.course.title}</Text>
              {order.course.description && (
                <Text style={styles.courseDescriptionText}>
                  {order.course.description}
                </Text>
              )}

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statTag}>
                  <Ionicons
                    name="book-outline"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={styles.statTagText}>
                    {order.course.session_number} buổi học
                  </Text>
                </View>
                {order.course.session_number_duration && (
                  <View style={styles.statTag}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={styles.statTagText}>
                      {order.course.session_number_duration}
                    </Text>
                  </View>
                )}
              </View>

              {/* Class Info Optimized */}
              {order.class && (
                <View style={styles.classInfoContainer}>
                  <View style={styles.classInfoHeader}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.classInfoLabel}>
                      Lớp học đã đăng ký
                    </Text>
                  </View>
                  <View style={styles.classTagsRow}>
                    <View style={styles.classTag}>
                      <Text style={styles.classTagText}>
                        {order.class.name}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
              Thông tin thanh toán
            </Text>
          </View>
          <View style={[styles.infoCard, styles.infoCardWithPadding]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số tiền:</Text>
              <Text style={[styles.infoValue, styles.priceText]}>
                {formatPrice(order.price)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phương thức:</Text>
              <Text style={styles.infoValue}>ZaloPay</Text>
            </View>
            {order.payment && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Mã giao dịch:</Text>
                  <Text style={styles.infoValue}>
                    {order.payment.zp_trans_id}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Mã đơn hàng:</Text>
                  <Text style={styles.infoValue}>
                    {order.payment.app_trans_id}
                  </Text>
                </View>
              </>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày thanh toán:</Text>
              <Text style={styles.infoValue}>
                {formatDate(order.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* User Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
              Thông tin người đăng ký
            </Text>
          </View>
          <View style={[styles.infoCard, styles.infoCardWithPadding]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Họ tên:</Text>
              <Text style={styles.infoValue}>{order.user.username}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{order.user.email}</Text>
            </View>
            {order.guest && (
              <>
                {order.guest.username && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tên khách:</Text>
                    <Text style={styles.infoValue}>{order.guest.username}</Text>
                  </View>
                )}
                {order.guest.phone && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Số điện thoại:</Text>
                    <Text style={styles.infoValue}>{order.guest.phone}</Text>
                  </View>
                )}
                {order.guest.email && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email khách:</Text>
                    <Text style={styles.infoValue}>{order.guest.email}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Order Timeline */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
              Lịch sử đơn hàng
            </Text>
          </View>
          <View style={styles.timelineCard}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Đơn hàng được tạo</Text>
                <Text style={styles.timelineDate}>
                  {formatDate(order.created_at)}
                </Text>
              </View>
            </View>
            {order.status.includes("paid") && order.payment && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotActive]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>
                    Thanh toán thành công
                  </Text>
                  <Text style={styles.timelineDate}>
                    {formatDate(order.updated_at)}
                  </Text>
                </View>
              </View>
            )}
            {order.status.includes("pending") && (
              <View style={styles.timelineItem}>
                <View
                  style={[styles.timelineDot, { backgroundColor: "#FF9800" }]}
                />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Đang chờ thanh toán</Text>
                  <Text style={styles.timelineDate}>
                    {formatDate(order.updated_at)}
                  </Text>
                </View>
              </View>
            )}
            {order.status.includes("expired") && (
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: colors.text, opacity: 0.3 },
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Đơn hàng đã hết hạn</Text>
                  <Text style={styles.timelineDate}>
                    {formatDate(order.updated_at)}
                  </Text>
                </View>
              </View>
            )}
            {order.status.includes("refunded") && (
              <View style={styles.timelineItem}>
                <View
                  style={[styles.timelineDot, { backgroundColor: "#607D8B" }]}
                />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Đã hoàn tiền</Text>
                  <Text style={styles.timelineDate}>
                    {formatDate(order.updated_at)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.primary,
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusCardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  statusCardOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  statusCardContent: {
    position: "relative",
    zIndex: 2,
    padding: 20,
    alignItems: "center",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    color: colors.white,
  },
  statusSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  courseCardNew: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  courseBannerContainer: {
    width: "100%",
    height: 180,
    backgroundColor: colors.gray[100],
  },
  courseBanner: {
    width: "100%",
    height: "100%",
  },
  courseBannerPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  courseCardBody: {
    padding: 20,
  },
  courseTitleLarge: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
    lineHeight: 28,
  },
  courseDescriptionText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  statTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statTagText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: 6,
  },
  classInfoContainer: {
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  classInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  classInfoLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
    marginLeft: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  classTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  classTag: {
    backgroundColor: colors.primary + "10",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 6,
  },
  classTagText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoCardWithPadding: {
    padding: 16,
  },
  infoCardBackgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  infoCardOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  infoCardContent: {
    position: "relative",
    zIndex: 2,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  infoLabelWithBackground: {
    color: colors.white,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  infoValueWithBackground: {
    color: colors.white,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  timelineCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text,
    opacity: 0.3,
    marginTop: 4,
    marginRight: 12,
  },
  timelineDotActive: {
    backgroundColor: colors.primary,
    opacity: 1,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
  },
  lessonsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  lessonItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  lessonItemLast: {
    borderBottomWidth: 0,
  },
  lessonNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  lessonNumber: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
    lineHeight: 12,
  },
  lessonContent: {
    flex: 1,
    marginRight: 12,
    justifyContent: "center",
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  lessonDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
