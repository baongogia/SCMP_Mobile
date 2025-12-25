import React, { useCallback, useMemo, useState } from "react";
import {
  LayoutAnimation,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/src/constants/colors";
import { ZaloPayService } from "@/src/services/zalopay";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  withSpring,
  withTiming,
  FadeInUp,
  FadeOut,
  Layout,
  Extrapolation,
  LinearTransition,
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
  // Initialize ZaloPay SDK on component mount
  React.useEffect(() => {
    ZaloPayService.getInstance().initialize("2554", "sandbox");
  }, []);

  const { userInfo, loadUserInfo } = useUserInfo();

  useFocusEffect(
    React.useCallback(() => {
      loadUserInfo(true);
    }, [loadUserInfo])
  );

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.2, 1],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [-100, 0, HEADER_HEIGHT],
      [-50, 0, 0],
      Extrapolation.CLAMP
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

  const CourseContentItem = ({ item, index }: { item: any; index: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const rotation = useSharedValue(0);

    const toggleExpand = () => {
      setIsExpanded(!isExpanded);
      rotation.value = withSpring(isExpanded ? 0 : 1);
    };

    const chevronStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            rotate: `${interpolate(rotation.value, [0, 1], [0, 180])}deg`,
          },
        ],
      };
    });

    const formattedIndex = (index + 1).toString().padStart(2, "0");

    return (
      <Animated.View
        layout={LinearTransition.duration(300)}
        style={styles.contentCard}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleExpand}
          style={styles.cardHeader}
        >
          <View style={styles.indexContainer}>
            <Text style={styles.indexText}>{formattedIndex}</Text>
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            {item.description && !isExpanded && (
              <Text style={styles.itemDescriptionCollapsed} numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>
          <Animated.View style={chevronStyle}>
            <Ionicons
              name="chevron-down"
              size={20}
              color={colors.primary}
              style={{ opacity: 0.6 }}
            />
          </Animated.View>
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View
            entering={FadeInUp.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.cardExpandedContent}
          >
            {item.description && (
              <Text style={styles.itemDescriptionFull}>{item.description}</Text>
            )}
            {item.form_judge?.items &&
              Object.keys(item.form_judge.items).length > 0 && (
                <View style={styles.criteriaBox}>
                  <View style={styles.criteriaHeader}>
                    <Ionicons
                      name="ribbon-outline"
                      size={16}
                      color={colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.criteriaLabel}>TIÊU CHÍ ĐÁNH GIÁ</Text>
                  </View>
                  {Object.keys(item.form_judge.items).map((criterion, idx) => (
                    <View key={idx} style={styles.criterionRow}>
                      <View style={styles.criterionDot} />
                      <Text style={styles.criterionName}>{criterion}</Text>
                    </View>
                  ))}
                </View>
              )}
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  const renderDetailSection = (title: string, content: any[]) => (
    <Animated.View
      layout={LinearTransition.duration(300)}
      style={styles.detailSection}
    >
      <Text style={styles.detailSectionTitle}>{title}</Text>
      {content.map((item, index) => (
        <CourseContentItem key={index} item={item} index={index} />
      ))}
    </Animated.View>
  );

  // Compute user age (years) from birthday string (ISO format)
  const userAge = useMemo(() => {
    try {
      if (!userInfo || !userInfo.birthday) return null;
      let birthYear, birthMonth, birthDay;

      // Try ISO format: YYYY-MM-DD
      const isoMatch = userInfo.birthday.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        birthYear = parseInt(isoMatch[1]);
        birthMonth = parseInt(isoMatch[2]) - 1; // 0-indexed
        birthDay = parseInt(isoMatch[3]);
      } else {
        // Try DD/MM/YYYY format
        const localMatch = userInfo.birthday.match(
          /^(\d{2})\/(\d{2})\/(\d{4})/
        );
        if (localMatch) {
          birthDay = parseInt(localMatch[1]);
          birthMonth = parseInt(localMatch[2]) - 1;
          birthYear = parseInt(localMatch[3]);
        } else {
          // Final fallback to Date object
          const birth = new Date(userInfo.birthday);
          if (isNaN(birth.getTime())) return null;
          birthYear = birth.getFullYear();
          birthMonth = birth.getMonth();
          birthDay = birth.getDate();
        }
      }

      if (birthYear === undefined) return null;

      const now = new Date();
      let age = now.getFullYear() - birthYear;
      const m = now.getMonth() - birthMonth;
      if (m < 0 || (m === 0 && now.getDate() < birthDay)) {
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
      return course.type_of_age.map((t: any) => {
        const range = Array.isArray(t.age_range) ? t.age_range : [];
        const min = range.length > 0 ? Number(range[0]) : 0;
        const max = range.length > 1 ? Number(range[1]) : 999;
        return {
          min: isNaN(min) ? 0 : min,
          max: isNaN(max) ? 999 : max,
          title: t.title || "",
        };
      });
    } catch (err) {
      console.error("[CourseDetail] Error normalizing ageRestrictions:", err);
      return null;
    }
  }, [course]);

  const isAgeAllowed = useMemo(() => {
    try {
      if (!ageRestrictions || ageRestrictions.length === 0) return true; // No restrictions
      if (userAge === null) return false; // Restrictions exist but age is unknown
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
          {/* Title & Price */}
          <View style={styles.titleSection}>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{formatPrice(course.price)}</Text>
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
                  ? `khoá học này không phù hợp với độ tuổi của bạn`
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
                      .map((r: any) => {
                        if (r.title && !r.min && r.max === 999) return r.title;
                        if (r.max === 999) return `${r.min}+ tuổi`;
                        return `${r.min}-${r.max} tuổi`;
                      })
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
            <Animated.View
              layout={LinearTransition.duration(300)}
              style={styles.categoriesSection}
            >
              <Text style={styles.sectionTitle}>Danh mục</Text>
              <View style={styles.categoriesContainer}>
                {course.category.map((cat: any, index: number) => {
                  const tagColors = [
                    { bg: "#E0F2FE", text: "#0369A1" }, // Blue
                    { bg: "#DCFCE7", text: "#15803D" }, // Green
                    { bg: "#FEF9C3", text: "#A16207" }, // Yellow
                    { bg: "#F3E8FF", text: "#7E22CE" }, // Purple
                    { bg: "#FEE2E2", text: "#B91C1C" }, // Red
                  ];
                  const colorMatch = tagColors[index % tagColors.length];
                  return (
                    <View
                      key={index}
                      style={[
                        styles.categoryTag,
                        { backgroundColor: colorMatch.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          { color: colorMatch.text },
                        ]}
                      >
                        {cat.title}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Features */}
          <Animated.View
            layout={LinearTransition.duration(300)}
            style={styles.featuresSection}
          >
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
          </Animated.View>

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
  contentCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  indexContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0, 119, 190, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  indexText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
    opacity: 0.5,
  },
  headerTitleContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  itemDescriptionCollapsed: {
    fontSize: 13,
    color: "#64748b",
    opacity: 0.8,
  },
  cardExpandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.03)",
  },
  itemDescriptionFull: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 16,
  },
  criteriaBox: {
    backgroundColor: "rgba(0, 119, 190, 0.03)",
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  criteriaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  criteriaLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.8,
  },
  criterionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingLeft: 4,
  },
  criterionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 10,
    opacity: 0.5,
  },
  criterionName: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.7,
    flex: 1,
    lineHeight: 18,
  },
  categoriesSection: {
    marginBottom: 30,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryTag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
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
