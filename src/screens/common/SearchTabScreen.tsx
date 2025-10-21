import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants";

interface SearchCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  icon: string;
}

const SearchTabScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [focusedInput, setFocusedInput] = useState(false);

  const searchInputAnimation = React.useRef(new Animated.Value(0)).current;

  const categories: SearchCategory[] = [
    {
      id: "1",
      title: "Lịch học",
      icon: "calendar-outline",
      color: "#1E3A8A",
      description: "Tìm kiếm lịch học, thời khóa biểu",
    },
    {
      id: "2",
      title: "Khóa học",
      icon: "school-outline",
      color: "#1E3A8A",
      description: "Tìm kiếm thông tin khóa học",
    },
    {
      id: "3",
      title: "Huấn luyện viên",
      icon: "person-outline",
      color: "#1E3A8A",
      description: "Tìm kiếm thông tin HLV",
    },
    {
      id: "4",
      title: "Tin tức",
      icon: "newspaper-outline",
      color: "#1E3A8A",
      description: "Tìm kiếm tin tức, thông báo",
    },
    {
      id: "5",
      title: "Hỗ trợ",
      icon: "help-circle-outline",
      color: "#1E3A8A",
      description: "Tìm kiếm trợ giúp, FAQ",
    },
  ];

  const recentSearches = [
    "Lịch học tuần này",
    "Khóa học bơi cơ bản",
    "Thông báo nghỉ lễ",
    "Đăng ký khóa học mới",
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setIsSearching(true);
      // Animate search input
      Animated.spring(searchInputAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Simulate search results
      setTimeout(() => {
        setSearchResults([
          {
            id: "1",
            title: "Lịch học tháng 12",
            subtitle: "Xem chi tiết lịch học trong tháng 12",
            type: "schedule",
            icon: "calendar",
          },
          {
            id: "2",
            title: "Khóa học bơi tự do",
            subtitle: "Khóa học bơi tự do cho người mới bắt đầu",
            type: "course",
            icon: "school",
          },
        ]);
        setIsSearching(false);
      }, 1000);
    } else {
      setSearchResults([]);
      setIsSearching(false);
      Animated.spring(searchInputAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const handleCategoryPress = (category: SearchCategory) => {
    setSearchQuery(category.title);
    handleSearch(category.title);
  };

  const handleRecentSearchPress = (search: string) => {
    setSearchQuery(search);
    handleSearch(search);
  };

  const renderCategory = ({ item }: { item: SearchCategory }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.categoryContent}>
        <View
          style={[styles.categoryIcon, { backgroundColor: item.color + "15" }]}
        >
          <Ionicons name={item.icon as any} size={20} color={item.color} />
        </View>
        <View style={styles.categoryText}>
          <Text style={styles.categoryTitle}>{item.title}</Text>
          <Text style={styles.categoryDescription}>{item.description}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color="#9CA3AF"
          style={styles.categoryArrow}
        />
      </View>
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.resultItem} activeOpacity={0.8}>
      <View style={styles.resultContent}>
        <View style={styles.resultIcon}>
          <Ionicons name={item.icon as any} size={16} color="#1E3A8A" />
        </View>
        <View style={styles.resultText}>
          <Text style={styles.resultTitle}>{item.title}</Text>
          <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color="#9CA3AF"
          style={styles.resultArrow}
        />
      </View>
    </TouchableOpacity>
  );

  const renderRecentSearch = (search: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.recentItem}
      onPress={() => handleRecentSearchPress(search)}
      activeOpacity={0.8}
    >
      <Ionicons name="time-outline" size={16} color="#9CA3AF" />
      <Text style={styles.recentText}>{search}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Animated.View
            style={[
              styles.searchInputContainer,
              focusedInput && styles.searchInputFocused,
              {
                transform: [
                  {
                    scale: searchInputAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.01],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={focusedInput ? "#1E3A8A" : "#9CA3AF"}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={handleSearch}
              onFocus={() => setFocusedInput(true)}
              onBlur={() => setFocusedInput(false)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {searchQuery.length === 0 ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tìm kiếm nhanh</Text>
              <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.categoriesList}
              />
            </View>

            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tìm kiếm gần đây</Text>
                <View style={styles.recentSearches}>
                  {recentSearches.map((search, index) =>
                    renderRecentSearch(search, index)
                  )}
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isSearching
                ? "Đang tìm kiếm..."
                : `Kết quả cho "${searchQuery}"`}
            </Text>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.resultsList}
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInputFocused: {
    backgroundColor: "#FFFFFF",
    borderColor: "#1E3A8A",
    shadowColor: "#1E3A8A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontWeight: "400",
  },
  clearButton: {
    marginLeft: 10,
    padding: 2,
  },
  content: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  categoriesList: {
    gap: 12,
  },
  categoryItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  categoryContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  categoryText: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  categoryDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  categoryArrow: {
    marginLeft: 12,
  },
  recentSearches: {
    gap: 8,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  recentText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#1E3A8A",
    fontWeight: "500",
  },
  resultsList: {
    gap: 8,
  },
  resultItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  resultContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  resultSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  resultArrow: {
    marginLeft: 12,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "400",
  },
});

export default SearchTabScreen;
