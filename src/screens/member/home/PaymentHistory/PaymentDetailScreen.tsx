import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { Order } from "@/src/types/order";
import { SharedHeader } from "@/src/components/custom/header/SharedHeader";

interface PaymentDetailScreenProps {
  order: Order;
}

export default function PaymentDetailScreen() {
  const route = useRoute();
  const { order } = route.params as PaymentDetailScreenProps;

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status color
  const getStatusColor = (status: string[]) => {
    if (status.includes("paid")) return "#4CAF50";
    if (status.includes("pending")) return "#FF9800";
    if (status.includes("cancelled")) return "#F44336";
    return colors.text;
  };

  // Get status text
  const getStatusText = (status: string[]) => {
    if (status.includes("paid")) return "Đã thanh toán";
    if (status.includes("expired")) return "Đã hết hạn";
    if (status.includes("pending")) return "Đang chờ thanh toán";
    if (status.includes("refund")) return "Đã hoàn trả";
    return "Không xác định";
  };

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
          <View style={styles.statusHeader}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={getStatusColor(order.status)}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(order.status) },
              ]}
            >
              {getStatusText(order.status)}
            </Text>
          </View>
          <Text style={styles.statusSubtext}>
            Đơn hàng #{order._id.slice(-8).toUpperCase()}
          </Text>
        </View>

        {/* Course Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
              Thông tin khóa học
            </Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tên khóa học:</Text>
              <Text style={styles.infoValue}>{order.course.title}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mô tả:</Text>
              <Text style={styles.infoValue}>{order.course.description}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số buổi học:</Text>
              <Text style={styles.infoValue}>
                {order.course.session_number} buổi
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Thời lượng:</Text>
              <Text style={styles.infoValue}>
                {order.course.session_number_duration}
              </Text>
            </View>
            {order.class && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Lớp học:</Text>
                <Text style={styles.infoValue}>{order.class.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Course Details - List of Lessons */}
        {(order.course as any).detail &&
          Array.isArray((order.course as any).detail) &&
          (order.course as any).detail.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="book-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
                  Danh sách bài học
                </Text>
              </View>
              <View style={styles.lessonsCard}>
                {(order.course as any).detail.map(
                  (lesson: any, index: number) => {
                    const isLast =
                      index === (order.course as any).detail.length - 1;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.lessonItem,
                          isLast && styles.lessonItemLast,
                        ]}
                      >
                        <View style={styles.lessonNumberContainer}>
                          <Text style={styles.lessonNumber}>{index + 1}</Text>
                        </View>
                        <View style={styles.lessonContent}>
                          <Text style={styles.lessonTitle}>
                            {lesson.title || `Bài học ${index + 1}`}
                          </Text>
                          {lesson.description && (
                            <Text style={styles.lessonDescription}>
                              {lesson.description}
                            </Text>
                          )}
                        </View>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                    );
                  }
                )}
              </View>
            </View>
          )}

        {/* Payment Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
              Thông tin thanh toán
            </Text>
          </View>
          <View style={styles.infoCard}>
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
          <View style={styles.infoCard}>
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
            {order.payment && (
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
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  },
  statusSubtext: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
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
  infoCard: {
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
    marginBottom: 0,
    lineHeight: 20,
  },
  lessonDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
