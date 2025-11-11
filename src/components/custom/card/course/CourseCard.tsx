import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Dimensions, TouchableOpacity, View, Text, Image } from "react-native";
import { styles } from "@/src/screens/member/style";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants";

type CourseCardProps = {
  course: any;
  index: number;
  scrollX: SharedValue<number>;
  onPress: () => void;
};

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

export const CourseCard = ({
  course,
  index,
  scrollX,
  onPress,
}: CourseCardProps) => {
  const inputRange = [
    (index - 1) * CARD_WIDTH,
    index * CARD_WIDTH,
    (index + 1) * CARD_WIDTH,
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      "clamp"
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.6, 1, 0.6],
      "clamp"
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Animated.View style={[styles.courseCard, animatedStyle]}>
        <View style={styles.courseImageContainer}>
          {course.media && course.media[0] ? (
            <Image
              source={{ uri: course.media[0].path }}
              style={styles.courseImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons
                name="school-outline"
                size={40}
                color={colors.primary}
              />
            </View>
          )}
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{formatPrice(course.price)}</Text>
          </View>
        </View>

        <View style={styles.courseContent}>
          {/* Text Content Section */}
          <View style={styles.textContentSection}>
            <Text style={styles.courseTitle} numberOfLines={1}>
              {course.title}
            </Text>
            <Text
              style={styles.courseDescription}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {course.description || "Mô tả khóa học sẽ được cập nhật"}
            </Text>
          </View>

          {/* Info Section */}
          <View style={styles.courseInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                {course.session_number_duration}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="book-outline" size={16} color={colors.primary} />
              <Text style={styles.infoText}>{course.session_number} buổi</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};
