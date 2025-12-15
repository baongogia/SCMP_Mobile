import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { colors, IMAGES } from "@/src/constants";
import { useUserInfo } from "@/src/hooks";

interface SearchCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
}

interface AppFunction {
  id: string;
  label: string;
  description: string;
  icon: string;
  screen: string;
  roles: ("instructor" | "member")[];
  keywords: string[];
  params?: any;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  icon: string;
  screen: string;
  params?: any;
}

// All searchable app functions
const ALL_APP_FUNCTIONS: AppFunction[] = [
  // Common functions (both roles)
  {
    id: "schedule",
    label: "Thời khóa biểu",
    description: "Xem lịch học/lịch dạy",
    icon: "time-outline",
    screen: "Schedule",
    roles: ["instructor", "member"],
    keywords: [
      "lịch",
      "thời khóa biểu",
      "schedule",
      "lịch học",
      "lịch dạy",
      "thời gian",
    ],
  },
  // {
  //   id: "feedback-facilities",
  //   label: "Ý kiến cơ sở vật chất",
  //   description: "Góp ý về cơ sở vật chất",
  //   icon: "business-outline",
  //   screen: "FeedbackFacilities",
  //   roles: ["instructor", "member"],
  //   keywords: ["cơ sở vật chất", "góp ý", "feedback", "ý kiến", "cơ sở"],
  // },
  // {
  //   id: "feedback",
  //   label: "Ý kiến khác",
  //   description: "Gửi ý kiến và phản hồi",
  //   icon: "chatbubble-outline",
  //   screen: "Feedback",
  //   roles: ["instructor", "member"],
  //   keywords: ["ý kiến", "phản hồi", "feedback", "góp ý", "đóng góp"],
  // },
  {
    id: "regulations",
    label: "Các quy định",
    description: "Xem quy định và nội quy",
    icon: "library-outline",
    screen: "Regulations",
    roles: ["instructor", "member"],
    keywords: ["quy định", "nội quy", "regulations", "rules", "luật"],
  },
  // Instructor-only functions
  {
    id: "attendance-evaluation",
    label: "Điểm danh & Đánh giá",
    description: "Điểm danh và đánh giá học viên",
    icon: "checkmark-circle-outline",
    screen: "AttendanceEvaluation",
    roles: ["instructor"],
    keywords: [
      "điểm danh",
      "đánh giá",
      "attendance",
      "evaluation",
      "chấm điểm",
      "điểm",
    ],
  },
  {
    id: "class-management",
    label: "Quản lý lớp học",
    description: "Quản lý thông tin, ghi chú và học viên",
    icon: "school-outline",
    screen: "ClassManagement",
    roles: ["instructor"],
    keywords: [
      "quản lý lớp",
      "lớp học",
      "class",
      "management",
      "quản lý",
      "học viên",
    ],
  },
  {
    id: "student-feedback",
    label: "Góp ý học viên",
    description: "Xem góp ý từ học viên",
    icon: "people-outline",
    screen: "StudentFeedback",
    roles: ["instructor"],
    keywords: [
      "góp ý học viên",
      "student feedback",
      "phản hồi học viên",
      "học viên",
    ],
  },
  {
    id: "request",
    label: "Gửi đơn",
    description: "Gửi đơn xin nghỉ, đổi ca",
    icon: "document-text-outline",
    screen: "Request",
    roles: ["instructor"],
    keywords: ["gửi đơn", "đơn", "request", "xin nghỉ", "đổi ca", "nghỉ phép"],
  },
  // Member-only functions
  {
    id: "course-info",
    label: "Tiến trình học tập",
    description: "Xem tiến trình học tập",
    icon: "school-outline",
    screen: "CourseInfo",
    roles: ["member"],
    keywords: [
      "tiến trình",
      "học tập",
      "course",
      "progress",
      "khóa học",
      "tiến độ",
    ],
  },
  {
    id: "attendance-report",
    label: "Báo cáo điểm danh",
    description: "Xem báo cáo điểm danh",
    icon: "stats-chart-outline",
    screen: "AttendanceReport",
    roles: ["member"],
    keywords: ["báo cáo", "điểm danh", "attendance", "report", "thống kê"],
  },
  {
    id: "learning-path",
    label: "Lộ trình học tập",
    description: "Xem lộ trình học tập",
    icon: "map-outline",
    screen: "LearningPath",
    // Temporarily hide the study-plan feature by removing member role
    roles: [],
    keywords: ["lộ trình", "học tập", "learning path", "roadmap", "kế hoạch"],
  },
  {
    id: "create-learning-path",
    label: "Tư vấn khoá học phù hợp",
    description: "Nhận tư vấn khoá học phù hợp với bạn",
    icon: "sparkles-outline",
    screen: "CreateLearningPath",
    roles: ["member"],
    keywords: [
      "tạo lộ trình",
      "ai",
      "artificial intelligence",
      "tư vấn",
      "sparkles",
    ],
    // Open AI chat in learningPath mode
    params: { type: "learningPath" },
  },
  {
    id: "learning-consultation",
    label: "Tư vấn học tập",
    description: "Nhận tư vấn về quá trình học tập",
    icon: "bulb-outline",
    screen: "LearningConsultation",
    roles: ["member"],
    keywords: ["tư vấn", "học tập", "consultation", "advice", "ai", "hỏi đáp"],
    params: { type: "consultation" },
  },
  {
    id: "children",
    label: "Con của tôi",
    description: "Quản lý thông tin con",
    icon: "people-outline",
    screen: "Children",
    roles: ["member"],
    keywords: ["con", "children", "trẻ em", "học viên nhỏ", "quản lý con"],
  },
  {
    id: "payment-history",
    label: "Lịch sử thanh toán",
    description: "Xem lịch sử thanh toán",
    icon: "card-outline",
    screen: "PaymentHistory",
    roles: ["member"],
    keywords: [
      "thanh toán",
      "payment",
      "lịch sử",
      "history",
      "hóa đơn",
      "bill",
    ],
  },
  {
    id: "member-request",
    label: "Đơn đã gửi",
    description: "Xem các đơn đã gửi",
    icon: "document-text-outline",
    screen: "MemberRequest",
    roles: ["member"],
    keywords: ["đơn đã gửi", "request", "đơn", "application", "yêu cầu"],
  },
];

const SearchTabScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userInfo } = useUserInfo();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [focusedInput, setFocusedInput] = useState(false);

  const searchInputAnimation = React.useRef(new Animated.Value(0)).current;

  // Get user roles from userInfo
  const userRoles = useMemo(() => {
    const roleFront = (userInfo as any)?.role_front;
    if (Array.isArray(roleFront)) {
      return roleFront.filter(
        (role) => role === "instructor" || role === "member"
      );
    }
    return [];
  }, [userInfo]);

  // Filter functions based on user roles
  const availableFunctions = useMemo(() => {
    if (userRoles.length === 0) {
      return ALL_APP_FUNCTIONS; // Show all if no role detected
    }
    return ALL_APP_FUNCTIONS.filter((func) =>
      func.roles.some((role) => userRoles.includes(role))
    );
  }, [userRoles]);

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

  // Search function with Vietnamese text matching
  const performSearch = useCallback(
    (query: string): SearchResult[] => {
      if (!query.trim()) {
        return [];
      }

      const normalizedQuery = query.toLowerCase().trim();
      const results: { function: AppFunction; score: number }[] = [];

      availableFunctions.forEach((func) => {
        let score = 0;
        const normalizedLabel = func.label.toLowerCase();
        const normalizedDescription = func.description.toLowerCase();
        const normalizedKeywords = func.keywords.map((k) => k.toLowerCase());

        // Exact match in label (highest priority)
        if (normalizedLabel === normalizedQuery) {
          score += 100;
        } else if (normalizedLabel.includes(normalizedQuery)) {
          score += 50;
        }

        // Match in description
        if (normalizedDescription.includes(normalizedQuery)) {
          score += 20;
        }

        // Match in keywords
        normalizedKeywords.forEach((keyword) => {
          if (keyword === normalizedQuery) {
            score += 30;
          } else if (keyword.includes(normalizedQuery)) {
            score += 15;
          } else if (normalizedQuery.includes(keyword)) {
            score += 10;
          }
        });

        // Check if query starts with label
        if (normalizedLabel.startsWith(normalizedQuery)) {
          score += 25;
        }

        if (score > 0) {
          results.push({ function: func, score });
        }
      });

      // Sort by score (descending) and then by label
      results.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.function.label.localeCompare(b.function.label, "vi");
      });

      // Convert to SearchResult format
      return results.map(({ function: func }) => ({
        id: func.id,
        title: func.label,
        subtitle: func.description,
        type: func.screen,
        icon: func.icon,
        screen: func.screen,
        params: func.params,
      }));
    },
    [availableFunctions]
  );

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      setIsSearching(true);
      // Animate search input
      Animated.spring(searchInputAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Perform search with slight delay for better UX
      const timeoutId = setTimeout(() => {
        const results = performSearch(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      }, 300);

      return () => clearTimeout(timeoutId);
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
  }, [searchQuery, performSearch, searchInputAnimation]);

  const handleCategoryPress = (category: SearchCategory) => {
    setSearchQuery(category.title);
  };

  const handleRecentSearchPress = (search: string) => {
    setSearchQuery(search);
  };

  const handleResultPress = (result: SearchResult) => {
    const nav: any = navigation as any;
    const parent = nav?.getParent?.();

    // Handle navigation with params if needed
    const params = result.params;

    // Prefer navigating on the parent stack so we can reach stack-level routes
    if (parent && typeof parent.navigate === "function") {
      parent.navigate(result.screen, params);
      return;
    }
    nav.navigate(result.screen, params);
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
    <TouchableOpacity
      style={styles.resultItem}
      activeOpacity={0.8}
      onPress={() => handleResultPress(item)}
    >
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
        <View style={styles.headerOverlay} pointerEvents="none" />
        <View style={styles.searchContainer}>
          <Animated.View
            style={[
              styles.searchWrapper,
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
            collapsable={false}
          >
            <View
              style={[
                styles.searchInputContainer,
                focusedInput && styles.searchInputFocused,
              ]}
              collapsable={false}
            >
              <TextInput
                placeholder="Tìm kiếm"
                placeholderTextColor="rgba(255, 255, 255, 0.7)" // màu placeholder
                selectionColor="#FFFFFF" // màu con trỏ
                value={searchQuery}
                onChangeText={handleSearchChange}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                style={styles.searchInput}
                autoFocus={false}
                blurOnSubmit={false}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity style={styles.searchButton} activeOpacity={0.8}>
              <Ionicons name="search" size={20} color="#FFFFFF" />
            </TouchableOpacity>
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
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.resultsList}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
                <Text style={styles.emptySubtitle}>
                  Thử tìm kiếm với từ khóa khác
                </Text>
              </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  searchContainer: {
    height: 50,
    marginTop: 44,
    zIndex: 1,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputContainer: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 45,
    justifyContent: "center",
  },
  searchInputFocused: {
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    padding: 0,
    margin: 0,
  },
  searchButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    marginTop: -33,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
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
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});

export default SearchTabScreen;
