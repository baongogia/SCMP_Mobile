import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors } from "@/src/constants/colors";
import {
  getAllCourses,
  getCustomCourses,
} from "@/src/services/learning_process/course/courseService";
import { useUserInfo } from "@/src/hooks";
import { showErrorToast } from "@/src/utils/errorHandler";
import { SharedHeader } from "@/src/components";

export default function CoursesScreen() {
  const navigation = useNavigation();
  const { userInfo } = useUserInfo();
  const [courses, setCourses] = useState<any[]>([]);
  const [customCourses, setCustomCourses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "custom">("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const [allRes, customRes] = await Promise.all([
        getAllCourses(),
        userInfo?._id
          ? getCustomCourses("custom", userInfo._id)
          : Promise.resolve({ data: { data: [] } }),
      ]);

      let allData = allRes.data?.data || [];
      let customData = customRes.data?.data || [];

      // Mark items in customData as isCustom
      customData = customData.map((c: any) => ({ ...c, isCustom: true }));

      // Create a set of custom course IDs
      const customIds = new Set(customData.map((c: any) => c._id || c.id));

      // Mark items in allData as isCustom if they exist in customIds
      allData = allData.map((c: any) => ({
        ...c,
        isCustom: customIds.has(c._id || c.id),
      }));

      setCourses(allData);
      setCustomCourses(customData);
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải khóa học",
        message: "Không thể tải danh sách khóa học",
      });
    } finally {
      setLoading(false);
    }
  }, [userInfo?._id]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const renderItem = ({ item }: { item: any }) => {
    return <CourseListItem item={item} navigation={navigation} />;
  };

  return (
    <View style={styles.container}>
      <SharedHeader title="Tất cả khóa học" />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "all" && styles.activeTabText,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "custom" && styles.activeTab]}
          onPress={() => setActiveTab("custom")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "custom" && styles.activeTabText,
            ]}
          >
            Dành cho bạn
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải khóa học...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === "all" ? courses : customCourses}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="school-outline"
                size={56}
                color={colors.primary}
              />
              <Text style={styles.emptyText}>
                {activeTab === "all"
                  ? "Chưa có khóa học"
                  : "Chưa có khóa học dành riêng cho bạn"}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const CourseListItem = React.memo(({ item, navigation }: any) => {
  const imageOpacity = useSharedValue(0);

  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: imageOpacity.value,
    };
  });

  const handleImageLoad = () => {
    imageOpacity.value = withTiming(1, { duration: 500 });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={styles.cardWrapper}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() =>
          (navigation as any).navigate("CourseDetail", { course: item })
        }
      >
        {/* Placeholder (Always visible until image loads on top) */}
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <Ionicons
            name="school-outline"
            size={48}
            color="rgba(255,255,255,0.5)"
          />
        </View>

        {/* Background Image */}
        {item.media && item.media[0] && (
          <Animated.Image
            source={{ uri: item.media[0].path }}
            style={[StyleSheet.absoluteFillObject, imageAnimatedStyle]}
            resizeMode="cover"
            onLoad={handleImageLoad}
          />
        )}

        {/* Overlay */}
        <View style={styles.cardOverlay} />

        {/* Badges (Top) */}
        <View style={styles.topBadges}>
          {item.isCustom && (
            <View style={styles.customBadge}>
              <Ionicons name="star" size={10} color={colors.white} />
              <Text style={styles.customBadgeText}>Dành cho bạn</Text>
            </View>
          )}
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
          </View>
        </View>

        {/* Content (Bottom) */}
        <View style={styles.contentContainer}>
          <Text numberOfLines={2} style={styles.title}>
            {item.title}
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={12} color={colors.white} />
                <Text style={styles.metaText}>
                  {item.session_number_duration}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="book-outline" size={12} color={colors.white} />
                <Text style={styles.metaText}>{item.session_number} buổi</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.enrollButton} onPress={() => {}}>
              <Text style={styles.enrollButtonText}>Đăng ký ngay</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const CARD_SPACING = 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  header: {
    minHeight: 60,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  cardWrapper: {
    marginBottom: CARD_SPACING,
  },
  card: {
    height: 160,
    borderRadius: 12, // Reduced from 16
    overflow: "hidden",
    backgroundColor: colors.text, // fallback color
    position: "relative",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  placeholder: {
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)", // Dark overlay
    // Add gradient-like effect if possible, or just solid semi-transparent
  },
  topBadges: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 10,
  },
  priceTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    backdropFilter: "blur(10px)", // Note: works on web, ignored on native usually unless using specific libs
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  priceText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 14,
  },
  customBadge: {
    backgroundColor: "rgba(255, 165, 0, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  customBadgeText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 4,
  },
  contentContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    // Gradient background could be simulated with another view if needed
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.white,
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Push button to end
    width: "100%",
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 11,
    color: colors.white,
    marginLeft: 4,
    fontWeight: "600",
  },
  enrollButton: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  enrollButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.mainBackground,
  },
  tabButton: {
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.white,
  },
});
