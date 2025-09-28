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

const { width } = Dimensions.get("window");

interface NewsCardProps {
  news: NewsItem;
  onPress: () => void;
  variant?: "horizontal" | "vertical";
}

export const NewsCard: React.FC<NewsCardProps> = ({
  news,
  onPress,
  variant = "horizontal",
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
                {getTimeAgo(news.published_at)}
              </Text>
            </View>
            <View style={styles.verticalMeta}>
              <Ionicons
                name="eye-outline"
                size={12}
                color={colors.textTertiary}
              />
              <Text style={styles.verticalViews}>{news.view_count || 0}</Text>
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
              name="eye-outline"
              size={10}
              color={colors.textTertiary}
            />
            <Text style={styles.horizontalViews}>{news.view_count || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Vertical card styles
  verticalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    overflow: "hidden",
  },
  verticalImageContainer: {
    height: 180,
    position: "relative",
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
});
