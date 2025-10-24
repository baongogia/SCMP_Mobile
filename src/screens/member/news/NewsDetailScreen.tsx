import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { NewsItem } from "@/src/types/news";
import { SharedHeader } from "@/src/components";

export function NewsDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { news } = route.params as { news: NewsItem };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Compact, readable absolute date for older items
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Vừa xong";
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    return formatDate(dateString);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SharedHeader title="Chi tiết tin tức" bottomCurveColor={colors.white} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Image */}
        {(news.image || news.cover?.[0]?.path) && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: news.image || news.cover?.[0]?.path }}
              style={styles.featuredImage}
            />
            {news.is_featured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={16} color={colors.white} />
                <Text style={styles.featuredText}>Tin nổi bật</Text>
              </View>
            )}
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{news.title}</Text>

          {/* Meta Information */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons
                name="time-outline"
                size={16}
                color={colors.textTertiary}
              />
              <Text style={styles.metaText}>{getTimeAgo(news.created_at)}</Text>
            </View>
            {news.author && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={colors.textTertiary}
                />
                <Text style={styles.metaText}>{news.author.name}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons
                name="person-outline"
                size={16}
                color={colors.textTertiary}
              />
              <Text style={styles.metaText}>
                {news.created_by?.username || "Ẩn danh"}
              </Text>
            </View>
          </View>

          {/* Category and Tags */}
          {(news.category || (news.tags && news.tags.length > 0)) && (
            <View style={styles.tagsContainer}>
              {news.category && (
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{news.category}</Text>
                </View>
              )}
              {news.tags &&
                news.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
            </View>
          )}

          {/* Summary */}
          {news.summary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summary}>{news.summary}</Text>
            </View>
          )}

          {/* Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>{news.content}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="heart-outline" size={20} color={colors.primary} />
              <Text style={styles.actionText}>
                Thích ({news.like_count || 0})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-outline" size={20} color={colors.primary} />
              <Text style={styles.actionText}>Chia sẻ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons
                name="bookmark-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.actionText}>Lưu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
  },
  headerRight: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    height: 280,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featuredText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "600",
    marginLeft: 4,
  },
  content: {
    padding: 24,
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    lineHeight: 36,
    marginBottom: 20,
    textAlign: "center",
  },
  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    marginHorizontal: -4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.white,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: "500",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
    justifyContent: "center",
  },
  categoryTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: "600",
  },
  tag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  tagText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  summaryContainer: {
    backgroundColor: colors.gray[50],
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderLeftWidth: 5,
    borderLeftColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summary: {
    fontSize: 17,
    color: colors.text,
    lineHeight: 26,
    fontStyle: "italic",
    textAlign: "center",
  },
  contentContainer: {
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  contentText: {
    fontSize: 17,
    color: colors.text,
    lineHeight: 28,
    textAlign: "justify",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: 8,
  },
});
