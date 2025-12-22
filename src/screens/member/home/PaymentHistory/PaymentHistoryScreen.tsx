import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/src/constants/colors";
import { SharedHeader } from "@/src/components/custom";
import { getAllOrders } from "@/src/services/learning_process/orders/orderServices";
import { getCourseDetail } from "@/src/services/learning_process/course/courseService";
import { Order } from "@/src/types/order";
import { showErrorToast } from "@/src/utils/errorHandler";

export default function PaymentHistoryScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courseMediaMap, setCourseMediaMap] = useState<
    Record<string, string | null>
  >({});

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

  // Load orders from API
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllOrders();
      if (response.data && response.data.data) {
        const ordersData = response.data.data;
        setOrders(ordersData);

        // Fetch course media for all orders
        const mediaMap: Record<string, string | null> = {};
        const uniqueCourseIds = new Set<string>();

        // Collect unique course IDs
        ordersData.forEach((order: Order) => {
          const courseId = order.course?._id;
          if (courseId) {
            uniqueCourseIds.add(String(courseId));
          }
        });

        // Fetch media for each unique course
        const mediaPromises = Array.from(uniqueCourseIds).map(
          async (courseId) => {
            const mediaUrl = await fetchCourseMedia(courseId);
            return { courseId, mediaUrl };
          }
        );

        const mediaResults = await Promise.all(mediaPromises);
        mediaResults.forEach(({ courseId, mediaUrl }) => {
          if (mediaUrl) {
            mediaMap[courseId] = mediaUrl;
          }
        });

        setCourseMediaMap(mediaMap);
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải lịch sử thanh toán",
        message: "Không thể tải lịch sử thanh toán",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

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
    if (status.includes("paid")) return "#10B981"; // Success green
    if (status.includes("pending")) return "#F59E0B"; // Warning orange
    if (status.includes("refunded")) return "#6B7280"; // Blue grey
    if (status.includes("expired")) return "#9CA3AF"; // Neutral gray for expired
    return colors.text;
  };

  // Get status icon
  const getStatusIcon = (status: string[]) => {
    if (status.includes("paid")) return "checkmark-circle";
    if (status.includes("expired")) return "hourglass";
    if (status.includes("pending")) return "time";
    if (status.includes("refunded")) return "return-down-back";
    return "help-circle";
  };

  // Get status text
  const getStatusText = (status: string[]) => {
    if (status.includes("paid")) return "Đã thanh toán";
    if (status.includes("pending")) return "Chờ thanh toán";
    if (status.includes("refunded")) return "Đã hoàn tiền";
    if (status.includes("expired")) return "Hết hạn";
    return "Không xác định";
  };

  // Render order item
  const renderOrderItem = ({ item }: { item: Order }) => {
    const courseId = item.course?._id;
    const courseImageUrl = courseId ? courseMediaMap[String(courseId)] : null;
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.7}
        onPress={() =>
          item.payment &&
          (navigation as any).navigate("PaymentDetail", { order: item })
        }
      >
        {/* Header - Course Title & Date */}
        <View style={styles.cardHeader}>
          <View style={styles.headerTop}>
            <Text style={styles.orderTitle} numberOfLines={2}>
              {item.course.title}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "15" }, // 15% opacity bg
              ]}
            >
              <Ionicons
                name={getStatusIcon(item.status) as any}
                size={14}
                color={statusColor}
              />
              <Text style={[styles.statusTextBadge, { color: statusColor }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
          <View style={styles.orderMetaRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
          </View>
        </View>

        {/* Body - 2 Columns */}
        <View style={styles.cardBody}>
          <View style={styles.bodyLeft}>
            <View style={styles.orderDetails}>
              <View style={styles.detailItem}>
                <Ionicons
                  name="book-outline"
                  size={14}
                  color={colors.primary}
                />
                <Text style={styles.detailText}>
                  {item.course.session_number} buổi học
                </Text>
              </View>
              {item.course.session_number_duration && (
                <View style={styles.detailItem}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={styles.detailText}>
                    {item.course.session_number_duration}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>Tổng tiền:</Text>
              <Text style={styles.priceMain}>{formatPrice(item.price)}</Text>
            </View>
          </View>

          <View style={styles.bodyRight}>
            {courseImageUrl ? (
              <Image
                source={{ uri: courseImageUrl }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Ionicons
                  name="image-outline"
                  size={30}
                  color={colors.gray[300]}
                />
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.divider} />
          <View style={styles.footerContent}>
            <Text style={styles.footerActionText}>Xem chi tiết</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textSecondary}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
    padding: 16,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardHeader: {
    marginBottom: 14,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  orderTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    marginRight: 10,
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusTextBadge: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  orderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bodyLeft: {
    flex: 1,
    paddingRight: 16,
  },
  orderDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: "500",
  },
  priceSection: {
    marginTop: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  priceMain: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
  },
  bodyRight: {
    width: 80,
    height: 80,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
  },
  thumbnailPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: "dashed",
  },
  cardFooter: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    width: "100%",
    marginBottom: 12,
  },
  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
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
