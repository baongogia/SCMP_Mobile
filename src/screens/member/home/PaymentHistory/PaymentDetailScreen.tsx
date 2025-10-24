import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { Order } from "@/src/types/order";
import { SharedHeader } from "@/src/components/custom/header/SharedHeader";

interface PaymentDetailScreenProps {
  order: Order;
}

export default function PaymentDetailScreen() {
  const navigation = useNavigation();
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
    if (status.includes("completed")) return colors.success;
    if (status.includes("pending")) return colors.warning;
    if (status.includes("failed")) return colors.error;
    return colors.text;
  };

  // Get status text
  const getStatusText = (status: string[]) => {
    if (status.includes("completed")) return "Hoàn thành";
    if (status.includes("pending")) return "Đang xử lý";
    if (status.includes("failed")) return "Thất bại";
    if (status.includes("cancelled")) return "Đã hủy";
    return "Không xác định";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SharedHeader
        title="Chi tiết thanh toán"
        bottomCurveColor={colors.white}
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
          <Text style={styles.sectionTitle}>Thông tin khóa học</Text>
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

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
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
          <Text style={styles.sectionTitle}>Thông tin người đăng ký</Text>
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
          <Text style={styles.sectionTitle}>Lịch sử đơn hàng</Text>
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
    backgroundColor: colors.background,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
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
});
