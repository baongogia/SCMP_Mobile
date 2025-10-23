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
  StatusBar,
  Platform,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, IMAGES } from "@/src/constants";

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ImageBackground
        source={{
          uri: IMAGES.SEARCH_BACKGROUND,
        }}
        style={styles.header}
        imageStyle={styles.headerImage}
      >
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
              size={22}
              color="#1F2937"
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Tìm kiếm..."
              placeholderTextColor="#6B7280"
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
                <Ionicons name="close-circle" size={22} color="#6B7280" />
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </ImageBackground>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 20 : 10,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerImage: {
    resizeMode: "cover",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  searchContainer: {
    height: 50,
    marginTop: 44,
  },
  searchInputContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  searchInputFocused: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderColor: "rgba(255,255,255,1)",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    transform: [{ scale: 1.02 }],
  },
  blurLayer1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  blurLayer2: {
    position: "absolute",
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 19,
  },
  blurLayer3: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
  },
  searchContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    position: "relative",
    zIndex: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "600",
    letterSpacing: -0.2,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  clearButton: {
    marginLeft: 12,
    padding: 4,
    borderRadius: 12,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
  },
  content: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  scrollContent: {
    paddingBottom: 100,
    paddingTop: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 12,
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
