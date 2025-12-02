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
    if (status.includes("paid")) return "#4CAF50";
    if (status.includes("pending")) return "#FF9800";
    if (status.includes("cancelled")) return "#F44336";
    return colors.text;
  };

  // Get status icon
  const getStatusIcon = (status: string[]) => {
    if (status.includes("paid")) return "checkmark-circle";
    if (status.includes("expired")) return "hourglass";
    if (status.includes("pending")) return "time";
    if (status.includes("refund")) return "arrow-back-circle";
    return "help-circle";
  };

  // Render order item
  const renderOrderItem = ({ item }: { item: Order }) => {
    const courseId = item.course?._id;
    const courseImageUrl = courseId ? courseMediaMap[String(courseId)] : null;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.7}
        onPress={() =>
          item.payment &&
          (navigation as any).navigate("PaymentDetail", { order: item })
        }
      >
        {/* Header với border primary accent */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View
              style={[
                styles.orderIconContainer,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            >
              <Ionicons
                name={getStatusIcon(item.status) as any}
                size={20}
                color={colors.white}
              />
            </View>
            <View style={styles.orderInfo}>
              <Text style={styles.orderTitle} numberOfLines={1}>
                {item.course.title}
              </Text>
              <View style={styles.orderMetaRow}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color="rgba(255, 255, 255, 0.9)"
                />
                <Text style={styles.orderDate}>
                  {formatDate(item.created_at)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content compact với background image */}
        <View style={styles.orderContent}>
          {/* Background Image */}
          {courseImageUrl && (
            <>
              <Image
                source={{ uri: courseImageUrl }}
                style={styles.orderContentBackgroundImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.5)"]}
                style={styles.orderContentOverlay}
              />
            </>
          )}
          {/* Content */}
          <View style={styles.orderContentInner}>
            <View style={styles.orderDetails}>
              <View
                style={[
                  styles.detailItem,
                  courseImageUrl && styles.detailItemWithBackground,
                ]}
              >
                <View style={styles.detailIcon}>
                  <Ionicons
                    name="book-outline"
                    size={14}
                    color={courseImageUrl ? colors.primary : colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.detailText,
                    courseImageUrl && styles.detailTextWithBackground,
                  ]}
                >
                  {item.course.session_number} buổi
                </Text>
              </View>
              {item.course.session_number_duration && (
                <View
                  style={[
                    styles.detailItem,
                    courseImageUrl && styles.detailItemWithBackground,
                  ]}
                >
                  <View style={styles.detailIcon}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={courseImageUrl ? colors.primary : colors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.detailText,
                      courseImageUrl && styles.detailTextWithBackground,
                    ]}
                  >
                    {item.course.session_number_duration}
                  </Text>
                </View>
              )}
              {item.class && (
                <View
                  style={[
                    styles.detailItem,
                    courseImageUrl && styles.detailItemWithBackground,
                  ]}
                >
                  <View style={styles.detailIcon}>
                    <Ionicons
                      name="people-outline"
                      size={14}
                      color={courseImageUrl ? colors.primary : colors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.detailText,
                      courseImageUrl && styles.detailTextWithBackground,
                    ]}
                    numberOfLines={1}
                  >
                    {item.class.name}
                  </Text>
                </View>
              )}
            </View>

            {/* Footer với price và button */}
            <View style={styles.orderFooter}>
              <View style={styles.priceContainer}>
                <Text
                  style={[
                    styles.price,
                    courseImageUrl && styles.priceWithBackground,
                  ]}
                >
                  {formatPrice(item.price)}
                </Text>
              </View>
              {item.payment && (
                <TouchableOpacity
                  style={[
                    styles.detailButton,
                    courseImageUrl && styles.detailButtonWithBackground,
                  ]}
                  onPress={() =>
                    (navigation as any).navigate("PaymentDetail", {
                      order: item,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={courseImageUrl ? colors.primary : colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
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
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    overflow: "hidden",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: colors.primary,
  },
  orderHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  orderIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 4,
    lineHeight: 20,
  },
  orderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderDate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginLeft: 4,
  },
  orderContent: {
    position: "relative",
    overflow: "hidden",
  },
  orderContentBackgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  orderContentOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  orderContentInner: {
    position: "relative",
    zIndex: 2,
    padding: 14,
  },
  orderDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightPrimary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  detailItemWithBackground: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  detailIcon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "500",
  },
  detailTextWithBackground: {
    color: colors.text,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.3,
  },
  priceWithBackground: {
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  detailButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lightPrimary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  detailButtonWithBackground: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: "rgba(255, 255, 255, 0.5)",
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
