import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { NewsItem } from "@/src/types/news";
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

interface NewsCardProps {
  news: NewsItem;
  onPress: () => void;
  variant?: "horizontal" | "vertical" | "carousel";
  index?: number;
  scrollX?: SharedValue<number>;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  news,
  onPress,
  variant = "horizontal",
  index = 0,
  scrollX,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return "Không xác định";

    const now = new Date();
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Không xác định";
    }

    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Vừa xong";
    if (diffInHours < 24) return `${diffInHours}h trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    return formatDate(dateString);
  };

  // Carousel variant with animation
  if (variant === "carousel" && scrollX) {
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

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <Animated.View style={[styles.carouselCard, animatedStyle]}>
          <View style={styles.carouselImageContainer}>
            {news.image || news.cover?.[0]?.path ? (
              <Image
                source={{ uri: news.image || news.cover?.[0]?.path }}
                style={styles.carouselImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.carouselPlaceholder}>
                <Ionicons
                  name="newspaper-outline"
                  size={40}
                  color={colors.primary}
                />
              </View>
            )}
            {news.is_featured && (
              <View style={styles.carouselFeaturedBadge}>
                <Ionicons name="star" size={12} color={colors.white} />
                <Text style={styles.featuredText}>Nổi bật</Text>
              </View>
            )}
          </View>

          <View style={styles.carouselContent}>
            <Text style={styles.carouselTitle} numberOfLines={2}>
              {news.title}
            </Text>
            <Text style={styles.carouselSummary} numberOfLines={3}>
              {news.summary || news.content}
            </Text>

            <View style={styles.carouselFooter}>
              <View style={styles.carouselMeta}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={colors.textTertiary}
                />
                <Text style={styles.carouselTime}>
                  {getTimeAgo(news.created_at)}
                </Text>
              </View>
              <View style={styles.carouselMeta}>
                <Ionicons
                  name="person-outline"
                  size={14}
                  color={colors.textTertiary}
                />
                <Text style={styles.carouselAuthor} numberOfLines={1}>
                  {news.created_by?.username || "Ẩn danh"}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  if (variant === "vertical") {
    return (
      <TouchableOpacity
        style={styles.verticalCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.verticalImageContainer}>
          {news.image || news.cover?.[0]?.path ? (
            <Image
              source={{ uri: news.image || news.cover?.[0]?.path }}
              style={styles.verticalImage}
            />
          ) : (
            <View style={styles.verticalPlaceholder}>
              <Ionicons
                name="newspaper-outline"
                size={40}
                color={colors.primary}
              />
            </View>
          )}
          {news.is_featured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={12} color={colors.white} />
              <Text style={styles.featuredText}>Nổi bật</Text>
            </View>
          )}
        </View>

        <View style={styles.verticalContent}>
          <Text style={styles.verticalTitle} numberOfLines={2}>
            {news.title}
          </Text>
          <Text style={styles.verticalSummary} numberOfLines={3}>
            {news.summary || news.content}
          </Text>

          <View style={styles.verticalFooter}>
            <View style={styles.verticalMeta}>
              <Ionicons
                name="time-outline"
                size={12}
                color={colors.textTertiary}
              />
              <Text style={styles.verticalTime}>
                {getTimeAgo(news.created_at)}
              </Text>
            </View>
            <View style={styles.verticalMeta}>
              <Ionicons
                name="person-outline"
                size={12}
                color={colors.textTertiary}
              />
              <Text style={styles.verticalViews} numberOfLines={1}>
                {news.created_by?.username || "Ẩn danh"}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.horizontalCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.horizontalImageContainer}>
        {news.image || news.cover?.[0]?.path ? (
          <Image
            source={{ uri: news.image || news.cover?.[0]?.path }}
            style={styles.horizontalImage}
          />
        ) : (
          <View style={styles.horizontalPlaceholder}>
            <Ionicons
              name="newspaper-outline"
              size={24}
              color={colors.primary}
            />
          </View>
        )}
        {news.is_featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color={colors.white} />
            <Text style={styles.featuredTextSmall}>Nổi bật</Text>
          </View>
        )}
      </View>

      <View style={styles.horizontalContent}>
        <Text style={styles.horizontalTitle} numberOfLines={2}>
          {news.title}
        </Text>
        <Text style={styles.horizontalSummary} numberOfLines={2}>
          {news.summary || news.content}
        </Text>

        <View style={styles.horizontalFooter}>
          <View style={styles.horizontalMeta}>
            <Ionicons
              name="time-outline"
              size={10}
              color={colors.textTertiary}
            />
            <Text style={styles.horizontalTime}>
              {getTimeAgo(news.published_at)}
            </Text>
          </View>
          <View style={styles.horizontalMeta}>
            <Ionicons
              name="person-outline"
              size={10}
              color={colors.textTertiary}
            />
            <Text style={styles.horizontalViews} numberOfLines={1}>
              {news.author?.name || "Ẩn danh"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Vertical card styles
  verticalCard: {
    backgroundColor: colors.mainBackground,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    overflow: "hidden",
  },
  verticalImageContainer: {
    height: 180,
    borderRadius: 12,
    position: "relative",
    overflow: "hidden",
  },
  verticalImage: {
    width: "100%",
    height: "100%",
  },
  verticalPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  verticalContent: {
    padding: 16,
  },
  verticalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  verticalSummary: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  verticalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  verticalMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  verticalTime: {
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: 4,
  },
  verticalViews: {
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: 4,
  },

  // Horizontal card styles
  horizontalCard: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 8,
    padding: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    width: width - 40, // Fixed width to prevent overflow
  },
  horizontalImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 10,
    position: "relative",
    overflow: "hidden",
    flexShrink: 0, // Prevent image from shrinking
  },
  horizontalImage: {
    width: "100%",
    height: "100%",
  },
  horizontalPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  horizontalContent: {
    flex: 1,
    justifyContent: "space-between",
    minWidth: 0, // Allow text to wrap properly
  },
  horizontalTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 3,
    lineHeight: 18,
    flexShrink: 1,
  },
  horizontalSummary: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 6,
    flexShrink: 1,
  },
  horizontalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  horizontalMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  horizontalTime: {
    fontSize: 10,
    color: colors.textTertiary,
    marginLeft: 3,
  },
  horizontalViews: {
    fontSize: 10,
    color: colors.textTertiary,
    marginLeft: 3,
  },

  // Featured badge styles
  featuredBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  featuredText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: "600",
    marginLeft: 2,
  },
  featuredTextSmall: {
    fontSize: 8,
    color: colors.white,
    fontWeight: "600",
    marginLeft: 2,
  },

  // Carousel card styles
  carouselCard: {
    width: CARD_WIDTH,
    marginRight: 16,
    borderRadius: 16,
    backgroundColor: colors.mainBackground,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: "hidden",
  },
  carouselImageContainer: {
    height: 200,
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
  },
  carouselPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  carouselFeaturedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  carouselContent: {
    padding: 16,
    flex: 1,
    justifyContent: "flex-start",
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  carouselSummary: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
    minHeight: 60,
  },
  carouselFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  carouselMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  carouselTime: {
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: 4,
  },
  carouselAuthor: {
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: 4,
  },
});
