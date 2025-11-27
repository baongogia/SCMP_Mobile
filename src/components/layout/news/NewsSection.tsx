import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { NewsItem } from "@/src/types/news";
import { NewsCard } from "./NewsCard";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

interface NewsSectionProps {
  title: string;
  newsData: NewsItem[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onViewAll?: () => void;
  onNewsPress: (news: NewsItem) => void;
  maxItems?: number;
  variant?: "horizontal" | "vertical";
  showViewAll?: boolean;
}

export const NewsSection: React.FC<NewsSectionProps> = ({
  title,
  newsData,
  loading = false,
  refreshing = false,
  onRefresh,
  onViewAll,
  onNewsPress,
  maxItems = 3,
  variant = "horizontal",
  showViewAll = true,
}) => {
  const [displayedNews, setDisplayedNews] = useState<NewsItem[]>([]);
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (newsData && newsData.length > 0) {
      setDisplayedNews(newsData.slice(0, maxItems));
    } else {
      setDisplayedNews([]);
    }
  }, [newsData, maxItems]);

  // Animated scroll handler for horizontal carousel
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="newspaper-outline" size={48} color={colors.gray[400]} />
      <Text style={styles.emptyText}>Chưa có tin tức nào</Text>
      <Text style={styles.emptySubtext}>
        Tin tức mới sẽ được cập nhật sớm nhất
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={styles.loadingText}>Đang tải tin tức...</Text>
    </View>
  );

  if (loading && newsData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        {renderLoadingState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {showViewAll && displayedNews.length > 0 && onViewAll && (
          <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {displayedNews.length === 0 ? (
        renderEmptyState()
      ) : variant === "horizontal" ? (
        <View>
          <Animated.FlatList
            ref={flatListRef}
            data={displayedNews}
            renderItem={({ item, index }) => (
              <NewsCard
                news={item}
                index={index}
                scrollX={scrollX}
                onPress={() => onNewsPress(item)}
                variant="carousel"
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 16}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContainer}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            keyExtractor={(item) => item._id}
          />
          {refreshing && (
            <View style={styles.refreshIndicator}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.verticalContainer}>
          {displayedNews.map((item) => (
            <NewsCard
              key={item._id}
              news={item}
              onPress={() => onNewsPress(item)}
              variant="vertical"
            />
          ))}
          {refreshing && (
            <View style={styles.refreshIndicator}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.titleColor,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 16,
    color: colors.titleColor,
    fontWeight: "500",
    marginRight: 4,
  },
  horizontalList: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  carouselContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  verticalContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 4,
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  refreshIndicator: {
    alignItems: "center",
    paddingVertical: 10,
  },
});
