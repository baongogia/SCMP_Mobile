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
      console.error("Error loading courses:", error);
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
                  size={36}
                  color={colors.primary}
                />
              </View>
            )}
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
            </View>
          </View>
          <View style={styles.content}>
            <Text numberOfLines={2} style={styles.title}>
              {item.title}
            </Text>
            <Text numberOfLines={2} style={styles.description}>
              {item.description}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.metaText}>
                  {item.session_number_duration}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons
                  name="book-outline"
                  size={16}
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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tất cả khóa học</Text>
        <View style={{ width: 40 }} />
      </View>

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
          numColumns={2}
          columnWrapperStyle={styles.column}
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
    </SafeAreaView>
  );
}

const CARD_SPACING = 12;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
  },
  column: {
    gap: CARD_SPACING,
    paddingHorizontal: 4,
    marginBottom: CARD_SPACING,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  imageContainer: {
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
    top: 10,
    right: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  priceText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 12,
  },
  content: {
    padding: 12,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  description: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    color: colors.text,
    marginLeft: 4,
    opacity: 0.8,
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
