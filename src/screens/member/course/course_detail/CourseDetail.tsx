import React, { useCallback, useMemo, useState } from "react";
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
import { useUserInfo } from "@/src/hooks";

const HEADER_HEIGHT = 300;

interface CourseDetailProps {
  course: any;
}

export default function CourseDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { course } = route.params as CourseDetailProps;
  const [submitting] = useState(false);
  const { userInfo } = useUserInfo();

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
      [-100, 0, HEADER_HEIGHT],
      [-50, 0, 0],
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

  // Compute user age (years) from birthday string (ISO format)
  const userAge = useMemo(() => {
    try {
      if (!userInfo || !userInfo.birthday) return null;
      const birth = new Date(userInfo.birthday);
      if (isNaN(birth.getTime())) return null;
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  }, [userInfo]);

  // Get course allowed age ranges; if any match user age then allowed
  const ageRestrictions = useMemo(() => {
    try {
      if (!course || !course.type_of_age || !Array.isArray(course.type_of_age))
        return null;
      // Normalize into an array of {min, max, title}
      return course.type_of_age.map((t: any) => ({
        min: (t.age_range && t.age_range[0]) || 0,
        max: (t.age_range && t.age_range[1]) || 999,
        title: t.title || "",
      }));
    } catch {
      return null;
    }
  }, [course]);

  const isAgeAllowed = useMemo(() => {
    try {
      if (!ageRestrictions || userAge === null) return true; // if we can't verify, let the user proceed
      return ageRestrictions.some(
        (r: any) => userAge >= r.min && userAge <= r.max
      );
    } catch {
      return true;
    }
  }, [ageRestrictions, userAge]);

  const isAgeMissing = useMemo(() => {
    return userAge === null;
  }, [userAge]);

  // Dev logs to inspect values at runtime (can be removed later)
  React.useEffect(() => {
    console.log("[CourseDetail] userInfo:", userInfo);
  }, [userInfo]);

  React.useEffect(() => {
    console.log("[CourseDetail] userAge:", userAge, "isMissing:", isAgeMissing);
  }, [userAge, isAgeMissing]);

  React.useEffect(() => {
    console.log("[CourseDetail] ageRestrictions:", ageRestrictions);
  }, [ageRestrictions]);

  React.useEffect(() => {
    console.log("[CourseDetail] isAgeAllowed:", isAgeAllowed);
  }, [isAgeAllowed]);

  const handleEnroll = useCallback(() => {
    try {
      console.log(
        "[CourseDetail] handleEnroll called. isAgeAllowed:",
        isAgeAllowed,
        "isMissing:",
        isAgeMissing
      );
      if (!course) {
        Alert.alert("Lỗi", "Thiếu thông tin khóa học");
        return;
      }
      if (!isAgeAllowed) {
        console.log(
          "[CourseDetail] Enrollment blocked due to age restriction. userAge:",
          userAge,
          "restrictions:",
          ageRestrictions
        );
        Alert.alert(
          "Không thể đăng ký",
          "Bạn không đủ điều kiện về độ tuổi để đăng ký khóa học này."
        );
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
  }, [
    course,
    navigation,
    isAgeAllowed,
    ageRestrictions,
    isAgeMissing,
    userAge,
  ]);

  return (
    <View style={styles.container}>
      {/* Sticky Hero (behind content) */}
      <View style={styles.heroContainer}>
        <Animated.View style={[styles.heroImageContainer, imageAnimatedStyle]}>
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
      </View>

      {/* Overlay controls above scroll content */}
      <View style={styles.controlsOverlay} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fixedBackButton}
          onPress={() => (navigation as any).goBack()}
          accessibilityLabel="Quay lại"
        >
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Featured Badge - in flow so it won't overlay content */}
          <View style={styles.inlineBadge}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.badgeText}>Khóa học nổi bật</Text>
          </View>
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

          {/* Small Age Notice under title */}
          {(!isAgeAllowed || isAgeMissing) && (
            <View
              style={[
                styles.ageBanner,
                !isAgeAllowed
                  ? styles.ageBannerForbidden
                  : styles.ageBannerInfo,
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={16}
                color={!isAgeAllowed ? "#B71C1C" : colors.warning}
              />
              <Text
                style={[
                  styles.ageBannerText,
                  !isAgeAllowed && styles.ageBannerTextForbidden,
                ]}
              >
                {!isAgeAllowed
                  ? "khoá học này không phù hợp với độ tuổi của bạn"
                  : "Bạn chưa cập nhật ngày sinh trong hồ sơ"}
              </Text>
              {isAgeMissing && (
                <TouchableOpacity
                  onPress={() => (navigation as any).navigate("ProfileDetail")}
                  style={styles.ageBannerLink}
                >
                  <Text style={styles.ageBannerLinkText}>Cập nhật</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

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
              <Text style={styles.infoValue}>
                {ageRestrictions && ageRestrictions.length > 0
                  ? ageRestrictions
                      .map((r: any) =>
                        r.min && r.max
                          ? `${r.min}-${r.max} tuổi`
                          : r.title || ""
                      )
                      .join(", ")
                  : "Mọi lứa tuổi"}
              </Text>
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
          style={[
            styles.enrollButton,
            (submitting || !isAgeAllowed) && styles.enrollButtonDisabled,
          ]}
          disabled={submitting || !isAgeAllowed}
          onPress={handleEnroll}
          accessibilityLabel={
            !isAgeAllowed ? "Không đủ độ tuổi để đăng ký" : "Đăng ký khóa học"
          }
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text
                style={[
                  styles.enrollButtonText,
                  (submitting || !isAgeAllowed) &&
                    styles.enrollButtonTextDisabled,
                ]}
              >
                Đăng ký ngay
              </Text>
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
    zIndex: 20,
  },
  scrollView: {
    flex: 1,
  },
  controlsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 15,
  },
  heroContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
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
    bottom: 30,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  inlineBadge: {
    alignSelf: "flex-end",
    marginTop: -60,
    marginRight: -12,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
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
  // Deprecated age warning styles removed; use `ageBanner` styles instead
  ageBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  ageBannerText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  ageBannerTextForbidden: {
    color: "#B71C1C",
  },
  ageBannerForbidden: {
    backgroundColor: "rgba(183,28,28,0.08)",
    borderColor: "rgba(183,28,28,0.36)",
  },
  ageBannerInfo: {
    backgroundColor: "rgba(255,162,0,0.08)",
    borderColor: "rgba(255,162,0,0.36)",
  },
  ageBannerLink: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    marginLeft: 8,
  },
  ageBannerLinkText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 13,
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
  enrollButtonDisabled: {
    backgroundColor: "#BDBDBD",
  },
  enrollButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
    marginRight: 8,
  },
  enrollButtonTextDisabled: {
    color: colors.text,
  },
});
