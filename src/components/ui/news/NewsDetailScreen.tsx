import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/src/constants/colors";
import { NewsItem } from "@/src/types/news";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.45; // 45% of screen height

export function NewsDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { news } = route.params as { news: NewsItem };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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

  const imageUri = news.image || news.cover?.[0]?.path;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Full-width Featured Image */}
        <View style={[styles.imageContainer, { height: IMAGE_HEIGHT }]}>
          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={styles.featuredImage}
                resizeMode="cover"
              />

              {/* Gradient Overlay */}
              <LinearGradient
                colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
                locations={[0, 0.5, 1]}
                style={styles.gradientOverlay}
              />
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="newspaper-outline"
                size={60}
                color={colors.primary}
              />
            </View>
          )}

          {/* Header with Back Button */}
          <View style={[styles.headerOverlay, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <View
                style={[
                  styles.backButtonCircle,
                  !imageUri && styles.backButtonCirclePlaceholder,
                ]}
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color={imageUri ? colors.white : colors.text}
                />
              </View>
            </TouchableOpacity>

            {news.is_featured && (
              <View style={styles.featuredBadge}>
                <Ionicons
                  name="star"
                  size={14}
                  color={colors.white}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.featuredText}>Tin nổi bật</Text>
              </View>
            )}
          </View>

          {/* Title Overlay on Image */}
          <View style={styles.titleOverlay}>
            {news.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{news.category}</Text>
              </View>
            )}
            <Text
              style={[
                styles.titleOnImage,
                !imageUri && styles.titleOnPlaceholder,
              ]}
              numberOfLines={3}
            >
              {news.title}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItemOnImage}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={imageUri ? colors.white : colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.metaTextOnImage,
                    !imageUri && styles.metaTextOnPlaceholder,
                  ]}
                >
                  {getTimeAgo(news.created_at)}
                </Text>
              </View>
              {news.author && (
                <View style={styles.metaItemOnImage}>
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={imageUri ? colors.white : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.metaTextOnImage,
                      !imageUri && styles.metaTextOnPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {news.author.name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentWrapper}>
          {/* Author Info Card */}
          {(news.author || news.created_by) && (
            <View style={styles.authorCard}>
              <View style={styles.authorInfo}>
                <View style={styles.authorAvatar}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
                <View style={[styles.authorDetails, { marginLeft: 12 }]}>
                  <Text style={styles.authorUsername}>
                    {news.created_by?.username || "Ẩn danh"}
                  </Text>
                  {news.created_by?.email && (
                    <Text style={styles.authorEmail}>
                      {news.created_by.email}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Tags */}
          {news.tags && news.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {news.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Summary */}
          {news.summary && (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryHeader}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.summaryTitle}>Tóm tắt</Text>
              </View>
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
              <View style={styles.actionIconContainer}>
                <Ionicons
                  name="heart-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.actionText, { marginLeft: 8 }]}>
                {news.like_count || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <Ionicons
                  name="share-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.actionText, { marginLeft: 8 }]}>
                Chia sẻ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <Ionicons
                  name="bookmark-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.actionText, { marginLeft: 8 }]}>Lưu</Text>
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
  scrollView: {
    flex: 1,
  },
  // Image Section
  imageContainer: {
    width: SCREEN_WIDTH,
    position: "relative",
    overflow: "hidden",
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    zIndex: 11,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },
  backButtonCirclePlaceholder: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  featuredText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "700",
  },
  titleOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    zIndex: 10,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  titleOnImage: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.white,
    lineHeight: 36,
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleOnPlaceholder: {
    color: colors.text,
    textShadowColor: "transparent",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metaItemOnImage: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  metaTextOnImage: {
    fontSize: 13,
    color: colors.white,
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  metaTextOnPlaceholder: {
    color: colors.textSecondary,
    textShadowColor: "transparent",
  },
  // Content Section
  contentWrapper: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    minHeight: SCREEN_HEIGHT * 0.6,
  },
  authorCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  authorEmail: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "500",
    marginBottom: 4,
  },
  authorUsername: {
    fontSize: 15,
    color: colors.primary,
    textTransform: "capitalize",
    fontWeight: 600,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  tag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  summaryContainer: {
    backgroundColor: colors.lightPrimary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  summary: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    fontWeight: "500",
  },
  contentContainer: {
    marginBottom: 32,
  },
  contentText: {
    fontSize: 17,
    color: colors.text,
    lineHeight: 28,
    textAlign: "justify",
    fontWeight: "400",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 6,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "700",
  },
});
