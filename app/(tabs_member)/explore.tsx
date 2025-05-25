import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  ScrollView,
  Image,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPublicCourses } from '@/api/public-courses';
import { getPublicCourseCategories } from '@/api/public-course-categories';

// TypeScript interfaces for API response
interface ApiCategory {
  _id: string;
  title: string;
}

interface ApiCreatedBy {
  username: string;
}

interface ApiCourse {
  _id: string;
  title: string;
  created_by: ApiCreatedBy;
  category: ApiCategory[];
  price: number;
  session_number: number;
  session_number_duration: string;
  description: string;
  slug: string;
}

// Transform API course to UI course
const transformCourse = (apiCourse: ApiCourse, index: number) => ({
  id: apiCourse._id,
  title: apiCourse.title,
  instructor: apiCourse.created_by.username,
  category: apiCourse.category.map(cat => cat.title).join(', '),
  categoryIds: apiCourse.category.map(cat => cat._id),
  rating: (Math.random() * 2 + 3).toFixed(1), // Mock rating for now
  students: Math.floor(Math.random() * 1000), // Mock students count
  price: apiCourse.price / 1000, // Convert VND to thousands
  image: `https://picsum.photos/id/${index + 10}/200/120`, // Mock image
  sessionNumber: apiCourse.session_number,
  sessionDuration: apiCourse.session_number_duration,
  description: apiCourse.description,
  slug: apiCourse.slug
});

type Course = {
  id: string;
  title: string;
  instructor: string;
  category: string;
  categoryIds: string[];
  rating: string;
  students: number;
  price: number;
  image: string;
  sessionNumber: number;
  sessionDuration: string;
  description: string;
  slug: string;
};

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [categoryMap, setCategoryMap] = useState<{[key: string]: string}>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalCourses, setTotalCourses] = useState(0);
  const [metaData, setMetaData] = useState<{count: number, limit: number, page: number}>({
    count: 0,
    limit: 10,
    page: 1
  });
  
  const coursesPerPage = 5;

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const tenantString = await AsyncStorage.getItem('tenant');
      
      if (!tenantString) {
        console.error('No tenant found in storage');
        setCategories(['All']);
        return;
      }
      
      const tenantObject = JSON.parse(tenantString);
      const tenant = tenantObject?.value;
      
      if (!tenant) {
        console.error('No tenant value found in stored object');
        setCategories(['All']);
        return;
      }
      
      const response = await getPublicCourseCategories(tenant);
      const apiCategories = response.data || [];
      const categoryTitles = apiCategories.map((cat: ApiCategory) => cat.title);
      
      // Create mapping from title to ID
      const titleToIdMap: {[key: string]: string} = {};
      apiCategories.forEach((cat: ApiCategory) => {
        titleToIdMap[cat.title] = cat._id;
      });
      
      setCategories(['All', ...categoryTitles]);
      setCategoryMap(titleToIdMap);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(['All']);
      setCategoryMap({});
    }
  };

  // Fetch courses from API with pagination
  const fetchCourses = async (page: number = 1, search: string = '', category: string = 'All') => {
    setLoading(true);
    try {
      const tenantString = await AsyncStorage.getItem('tenant');
      if (!tenantString) {
        console.error('No tenant found in storage');
        setCourses([]);
        setLoading(false);
        return;
      }
      
      const tenantObject = JSON.parse(tenantString);
      const tenant = tenantObject?.value;
      
      if (!tenant) {
        console.error('No tenant value found in stored object');
        setCourses([]);
        setLoading(false);
        return;
      }

      let queryParams = `page=${page}&limit=${coursesPerPage}`;
      
      // Use searchKey parameter for title search
      if (search.trim()) {
        queryParams += `&searchKey=${encodeURIComponent(search.trim())}`;
      }
      
      // Use category ID instead of title
      if (category && category !== 'All') {
        const categoryId = categoryMap[category];
        if (categoryId) {
          queryParams += `&category=${encodeURIComponent(categoryId)}`;
        }
      }

      const response = await getPublicCourses(tenant, queryParams);
      
      const apiCourses = response.data || [];
      const transformedCourses = apiCourses.map((course: ApiCourse, index: number) => transformCourse(course, index));
      
      setCourses(transformedCourses);
      
      // Handle missing meta_data gracefully
      const metaData = response.meta_data || { count: apiCourses.length, limit: coursesPerPage, page: page };
      setMetaData(metaData);
      setTotalCourses(metaData.count || apiCourses.length);

      // Only update allCourses on initial load or when no filters
      if (page === 1 && !search && category === 'All') {
        setAllCourses(transformedCourses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
      setTotalCourses(0);
      setMetaData({count: 0, limit: coursesPerPage, page: page});
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCategories();
    fetchCourses(1);
  }, []);
  
  // Handle search and category changes
  useEffect(() => {
    setCurrentPage(1);
    fetchCourses(1, searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchCourses(newPage, searchQuery, selectedCategory);
  };
  
  // Calculate pagination values
  const totalPages = Math.ceil(metaData.count / coursesPerPage);
  
  // Render course item
  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity style={styles.courseCard} activeOpacity={0.7}>
      <Image 
        source={{ uri: item.image }} 
        style={styles.courseImage}
        resizeMode="cover"
      />
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.instructorName}>{item.instructor}</Text>
        <View style={styles.courseDetails}>
          <Text style={styles.sessionInfo}>{item.sessionNumber} buổi • {item.sessionDuration}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>{item.rating}</Text>
          <Ionicons name="star" size={14} color="#FFC107" />
          <Text style={styles.students}>({item.students} học viên)</Text>
        </View>
        <Text style={styles.price}>{item.price.toLocaleString('vi-VN')}k VNĐ</Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm khóa học..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#aaa"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Category filters */}
      <View style={styles.categoriesWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity 
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.selectedCategory
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text 
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.selectedCategoryText
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results status */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {loading 
            ? 'Đang tải khóa học...' 
            : `Hiển thị ${courses.length} trong ${metaData.count} khóa học (Trang ${currentPage}/${Math.max(totalPages, 1)})`}
        </Text>
      </View>

      {/* Course listing and pagination */}
      <View style={styles.mainContentContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#0066CC" style={styles.loader} />
        ) : courses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={60} color="#ccc" />
            <Text style={styles.emptyStateText}>Không tìm thấy khóa học</Text>
            <Text style={styles.emptyStateSubtext}>Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc</Text>
          </View>
        ) : (
          <FlatList
            data={courses}
            renderItem={renderCourseItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.coursesList}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            initialNumToRender={coursesPerPage}
            ListFooterComponent={() => (
              <View style={styles.paginationContainer}>
                <TouchableOpacity 
                  style={styles.paginationArrow}
                  onPress={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  <Ionicons 
                    name="chevron-back" 
                    size={24} 
                    color={currentPage === 1 || loading ? "#ccc" : "#333"} 
                  />
                </TouchableOpacity>
                <View style={styles.paginationCenter}>
                  <Text style={styles.paginationText}>
                    Trang {currentPage} / {Math.max(totalPages, 1)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.paginationArrow}
                  onPress={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || totalPages === 0 || loading}
                >
                  <Ionicons 
                    name="chevron-forward" 
                    size={24} 
                    color={currentPage >= totalPages || loading ? "#ccc" : "#333"} 
                  />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
    color: '#888',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  categoriesWrapper: {
    paddingVertical: 5,
    backgroundColor: '#fff',
  },
  categoriesContainer: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCategory: {
    backgroundColor: '#3162C9',
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  resultsInfo: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resultsText: {
    fontSize: 15,
    color: '#666',
  },
  mainContentContainer: {
    flex: 1,
    position: 'relative',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  coursesList: {
    paddingHorizontal: 15,
    paddingBottom: 20, // Reduced padding as we don't need extra space for absolute positioning
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#eee',
    height: 100,
  },
  courseImage: {
    width: 100,
    height: 100,
  },
  courseInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222',
    lineHeight: 20,
  },
  instructorName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  courseDetails: {
    marginBottom: 4,
  },
  sessionInfo: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
    color: '#444',
  },
  students: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3162C9',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  paginationArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationCenter: {
    backgroundColor: '#fff',
    paddingHorizontal: 2,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#eee',
    minWidth: 120,
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});