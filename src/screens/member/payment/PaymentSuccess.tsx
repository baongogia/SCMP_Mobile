import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/src/constants/colors";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

interface PaymentSuccessProps {
  course?: any;
  transactionId?: string;
  amount?: number;
}

export default function PaymentSuccess() {
  const navigation = useNavigation();
  const route = useRoute();
  const { course, transactionId, amount } = route.params as PaymentSuccessProps;

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0);

  useEffect(() => {
    // Animate success icon
    scale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 100 }),
      withSpring(1, { damping: 8, stiffness: 100 })
    );

    // Animate content
    opacity.value = withDelay(300, withSpring(1));

    // Animate checkmark
    checkmarkScale.value = withDelay(600, withSpring(1));
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: (1 - opacity.value) * 20 }],
  }));

  const animatedCheckmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleContinue = () => {
    navigation.navigate("Home" as never);
  };

  const handleViewCourse = () => {
    navigation.navigate("CourseInfo" as never);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, "#4A90E2"]}
        style={styles.background}
      >
        {/* Success Animation */}
        <View style={styles.animationContainer}>
          <Animated.View style={[styles.successIcon, animatedIconStyle]}>
            <View style={styles.iconBackground}>
              <Animated.View
                style={[styles.checkmarkContainer, animatedCheckmarkStyle]}
              >
                <Ionicons name="checkmark" size={60} color={colors.white} />
              </Animated.View>
            </View>
          </Animated.View>
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, animatedContentStyle]}>
          <Text style={styles.title}>Thanh toán thành công!</Text>
          <Text style={styles.subtitle}>
            Bạn đã đăng ký khóa học thành công
          </Text>

          {/* Course Info Card */}
          {course && (
            <View style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <View style={styles.courseIcon}>
                  <Ionicons name="school" size={24} color={colors.primary} />
                </View>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <Text style={styles.coursePrice}>
                    {formatPrice(amount || course.price)}
                  </Text>
                </View>
              </View>

              {course.media && course.media[0] && (
                <Image
                  source={{ uri: course.media[0].path }}
                  style={styles.courseImage}
                  resizeMode="cover"
                />
              )}
            </View>
          )}

          {/* Transaction Info */}
          {transactionId && (
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionLabel}>Mã giao dịch</Text>
              <Text style={styles.transactionId}>{transactionId}</Text>
            </View>
          )}

          {/* Success Message */}
          <View style={styles.messageContainer}>
            <Ionicons
              name="information-circle"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.messageText}>
              Thông tin khóa học sẽ được gửi đến email của bạn. Vui lòng kiểm
              tra email để biết thêm chi tiết.
            </Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[styles.actions, animatedContentStyle]}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinue}
          >
            <Text style={styles.primaryButtonText}>Về trang chủ</Text>
            <Ionicons name="home" size={20} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleViewCourse}
          >
            <Text style={styles.secondaryButtonText}>Xem khóa học</Text>
            <Ionicons name="book" size={20} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  animationContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4CAF50",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  checkmarkContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  courseCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    width: "100%",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  courseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  coursePrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  courseImage: {
    width: "100%",
    height: 120,
    borderRadius: 12,
  },
  transactionInfo: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    width: "100%",
  },
  transactionLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  transactionId: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
    fontFamily: "monospace",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: 12,
    width: "100%",
  },
  messageText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.white,
    marginRight: 8,
  },
});
