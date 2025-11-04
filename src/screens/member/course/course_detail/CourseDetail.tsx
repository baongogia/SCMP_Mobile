import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/src/constants/colors";
import { ZaloPayService } from "@/src/services/zalopay";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { showErrorToast } from "@/src/utils/errorHandler";

const HEADER_HEIGHT = 300;

interface CourseDetailProps {
  course: any;
}

export default function CourseDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { course } = route.params as CourseDetailProps;
  const [submitting, setSubmitting] = useState(false);

  // Initialize ZaloPay SDK on component mount
  React.useEffect(() => {
    ZaloPayService.getInstance().initialize("2554", "sandbox");
  }, []);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.2, 1],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -HEADER_HEIGHT / 2],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const renderDetailSection = (title: string, content: any[]) => (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>{title}</Text>
      {content.map((item, index) => (
        <View key={index} style={styles.detailItem}>
          <View style={styles.bulletPoint} />
          <Text style={styles.detailText}>{item.title}</Text>
        </View>
      ))}
    </View>
  );

  const handleEnroll = useCallback(() => {
    try {
      if (!course) {
        Alert.alert("Lỗi", "Thiếu thông tin khóa học");
        return;
      }
      (navigation as any).navigate("ClassSelection", { course });
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi điều hướng",
        message: "Có lỗi xảy ra khi điều hướng",
      });
      Alert.alert("Lỗi", "Có lỗi xảy ra");
    }
  }, [course, navigation]);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Animated.View
            style={[styles.heroImageContainer, imageAnimatedStyle]}
          >
            {course.media && course.media[0] ? (
              <Image
                source={{ uri: course.media[0].path }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderHero}>
                <Ionicons name="school" size={80} color={colors.primary} />
              </View>
            )}
          </Animated.View>

          {/* Gradient Overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)"]}
            style={styles.heroGradient}
          />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.fixedBackButton}
            onPress={() => (navigation as any).goBack()}
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>

          {/* Course Badge */}
          <View style={styles.courseBadge}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.badgeText}>Khóa học nổi bật</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Title & Price */}
          <View style={styles.titleSection}>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{formatPrice(course.price)}</Text>
              <View style={styles.originalPriceContainer}>
                <Text style={styles.originalPrice}>
                  {formatPrice(course.price * 1.2)}
                </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-20%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Info */}
          <View style={styles.quickInfoContainer}>
            <View style={styles.infoCard}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>Thời lượng</Text>
              <Text style={styles.infoValue}>
                {course.session_number_duration}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="book-outline" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>Số buổi</Text>
              <Text style={styles.infoValue}>{course.session_number} buổi</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons
                name="people-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoLabel}>Độ tuổi</Text>
              <Text style={styles.infoValue}>Mọi lứa tuổi</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Mô tả khóa học</Text>
            <Text style={styles.description}>{course.description}</Text>
          </View>

          {/* Course Details */}
          {course.detail &&
            course.detail.length > 0 &&
            renderDetailSection("Nội dung khóa học", course.detail)}

          {/* Categories */}
          {course.category && course.category.length > 0 && (
            <View style={styles.categoriesSection}>
              <Text style={styles.sectionTitle}>Danh mục</Text>
              <View style={styles.categoriesContainer}>
                {course.category.map((cat: any, index: number) => (
                  <View key={index} style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{cat.title}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Tính năng nổi bật</Text>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>
                Huấn luyện viên chuyên nghiệp
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Lớp học nhỏ, tương tác cao</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Cơ sở vật chất hiện đại</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Chứng chỉ hoàn thành</Text>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </View>
      </Animated.ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomActionBar}>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.enrollButton, submitting && { opacity: 0.7 }]}
          disabled={submitting}
          onPress={handleEnroll}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.enrollButtonText}>Đăng ký ngay</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  animatedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: colors.primary,
    zIndex: 10,
    justifyContent: "flex-end",
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
    marginHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  fixedBackButton: {
    position: "absolute",
    top: 36,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: HEADER_HEIGHT,
    position: "relative",
    overflow: "hidden",
  },
  heroImageContainer: {
    width: "100%",
    height: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  placeholderHero: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  courseBadge: {
    position: "absolute",
    bottom: 40,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  contentContainer: {
    backgroundColor: colors.mainBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  titleSection: {
    marginBottom: 20,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
    lineHeight: 32,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    marginRight: 12,
  },
  originalPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  originalPrice: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.6,
    textDecorationLine: "line-through",
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: "#FF5722",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.white,
  },
  quickInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "rgba(0, 119, 190, 0.05)",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  descriptionSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.8,
    lineHeight: 24,
  },
  detailSection: {
    marginBottom: 30,
  },
  detailSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  detailText: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.8,
    flex: 1,
  },
  categoriesSection: {
    marginBottom: 30,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryTag: {
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  featuresSection: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.8,
    marginLeft: 12,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  favoriteButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  enrollButton: {
    flex: 1,
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  enrollButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
    marginRight: 8,
  },
});
