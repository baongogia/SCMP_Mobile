import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { SharedHeader } from "@/src/components/custom";
import { getAllOrders } from "@/src/services/learning_process/orders/orderServices";
import { Order } from "@/src/types/order";
import { showErrorToast } from "@/src/utils/errorHandler";

export default function PaymentHistoryScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load orders from API
  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getAllOrders();
      if (response.data && response.data.data) {
        setOrders(response.data.data);
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải lịch sử thanh toán",
        message: "Không thể tải lịch sử thanh toán",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

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
    if (status.includes("refund")) return "Đã hoàn trả";
    return "Không xác định";
  };

  // Render order item
  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderTitle}>{item.course.title}</Text>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderContent}>
        <Text style={styles.courseDescription} numberOfLines={2}>
          {item.course.description}
        </Text>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={styles.detailText}>
              {item.course.session_number_duration}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="book-outline" size={16} color={colors.primary} />
            <Text style={styles.detailText}>
              {item.course.session_number} buổi học
            </Text>
          </View>
          {item.class && (
            <View style={styles.detailRow}>
              <Ionicons
                name="people-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.detailText}>Lớp: {item.class.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Tổng tiền:</Text>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
          </View>

          {item.payment && (
            <TouchableOpacity
              style={styles.paymentButton}
              onPress={() =>
                (navigation as any).navigate("PaymentDetail", { order: item })
              }
            >
              <Ionicons name="card-outline" size={16} color={colors.primary} />
              <Text style={styles.paymentButtonText}>Chi tiết</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <SharedHeader title="Lịch sử thanh toán" />

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              Đang tải lịch sử thanh toán...
            </Text>
          </View>
        ) : orders.length > 0 ? (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={80} color={colors.primary} />
            <Text style={styles.emptyTitle}>Chưa có giao dịch nào</Text>
            <Text style={styles.emptySubtitle}>
              Lịch sử thanh toán của bạn sẽ xuất hiện tại đây
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  menuButton: {
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 0.5,
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 12,
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
    lineHeight: 24,
  },
  orderDate: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  orderContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  courseDescription: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: 16,
  },
  orderDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
    marginLeft: 8,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
  },
  paymentButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  paymentButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.6,
    textAlign: "center",
    lineHeight: 24,
  },
});
