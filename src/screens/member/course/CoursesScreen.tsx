import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { colors } from "@/src/constants/colors";
import { getAllCourses } from "@/src/services/learning_process/course/courseService";
import { SafeAreaView } from "react-native-safe-area-context";
import { showErrorToast } from "@/src/utils/errorHandler";
import { SharedHeader } from "@/src/components";

export default function CoursesScreen() {
  const navigation = useNavigation();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllCourses();
      if (response.data && response.data.data) {
        setCourses(response.data.data);
      } else {
        setCourses([]);
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải khóa học",
        message: "Không thể tải danh sách khóa học",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={styles.cardWrapper}
      >
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.9}
          onPress={() =>
            (navigation as any).navigate("CourseDetail", { course: item })
          }
        >
          <View style={styles.imageContainer}>
            {item.media && item.media[0] ? (
              <Image
                source={{ uri: item.media[0].path }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons
                  name="school-outline"
                  size={28}
                  color={colors.primary}
                />
              </View>
            )}
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text numberOfLines={1} style={styles.title}>
                {item.title}
              </Text>
              <View style={styles.enrollButton}>
                <Text style={styles.enrollButtonText}>Đăng ký</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.white} />
              </View>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={colors.primary}
                />
                <Text style={styles.metaText}>
                  {item.session_number_duration}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons
                  name="book-outline"
                  size={14}
                  color={colors.primary}
                />
                <Text style={styles.metaText}>{item.session_number} buổi</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <SharedHeader title="Tất cả khóa học" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải khóa học...</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="school-outline"
                size={56}
                color={colors.primary}
              />
              <Text style={styles.emptyText}>Chưa có khóa học</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const CARD_SPACING = 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  header: {
    minHeight: 60,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  cardWrapper: {
    marginBottom: CARD_SPACING,
  },
  card: {
    flexDirection: "column",
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 0,
  },
  imageContainer: {
    width: "100%",
    height: 120,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 119, 190, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  priceTag: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priceText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 10,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: colors.text,
    marginLeft: 4,
    opacity: 0.8,
    fontWeight: "500",
  },
  enrollButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  enrollButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
});
