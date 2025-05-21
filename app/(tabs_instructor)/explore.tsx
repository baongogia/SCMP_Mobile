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

// Mock data for courses
const mockCourses = Array(20).fill(0).map((_, i) => ({
  id: i + 1,
  title: `Course ${i + 1}: Introduction to Subject ${i + 1}`,
  instructor: `Instructor ${i % 5 + 1}`,
  category: [`Development`, `Design`, `Business`, `Marketing`, `Photography`][i % 5],
  rating: (Math.random() * 2 + 3).toFixed(1),
  students: Math.floor(Math.random() * 10000),
  price: Math.floor(Math.random() * 200) + 9.99,
  image: `https://picsum.photos/id/${i + 10}/200/120`
}));

// Available categories
const categories = ['All', 'Development', 'Design', 'Business', 'Marketing', 'Photography'];

type Course = {
  id: number;
  title: string;
  instructor: string;
  category: string;
  rating: string;
  students: number;
  price: number;
  image: string;
};

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const coursesPerPage = 5;
  
  // Filter courses based on search query and category
  useEffect(() => {
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      let filteredCourses = [...mockCourses];
      
      if (searchQuery) {
        filteredCourses = filteredCourses.filter(course => 
          course.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (selectedCategory !== 'All') {
        filteredCourses = filteredCourses.filter(course => 
          course.category === selectedCategory
        );
      }
      
      setCourses(filteredCourses);
      setCurrentPage(1);
      setLoading(false);
    }, 300); // Reduced delay for better performance
  }, [searchQuery, selectedCategory]);
  
  // Calculate pagination values
  const totalPages = Math.ceil(courses.length / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const endIndex = startIndex + coursesPerPage;
  const currentCourses = courses.slice(startIndex, endIndex);
  
  // Render course item
  const renderCourseItem = ({ item }: any) => (
    <TouchableOpacity style={styles.courseCard} activeOpacity={0.7}>
      <Image 
        source={{ uri: item.image }} 
        style={styles.courseImage}
        resizeMode="cover"
      />
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.instructorName}>{item.instructor}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>{item.rating}</Text>
          <Ionicons name="star" size={14} color="#FFC107" />
          <Text style={styles.students}>({item.students.toLocaleString()} students)</Text>
        </View>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Courses</Text>
      </View>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for courses..."
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
            ? 'Loading courses...' 
            : `Showing ${Math.min(currentCourses.length, endIndex - startIndex)} of ${courses.length} courses`}
        </Text>
      </View>
      {/* Course listing and pagination */}
      <View style={styles.mainContentContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#0066CC" style={styles.loader} />
        ) : courses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={60} color="#ccc" />
            <Text style={styles.emptyStateText}>No courses found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={currentCourses}
              renderItem={renderCourseItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.coursesList}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={false}
              initialNumToRender={coursesPerPage}
              ListFooterComponent={() => (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity 
                    style={styles.paginationArrow}
                    onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <Ionicons 
                      name="chevron-back" 
                      size={24} 
                      color={currentPage === 1 ? "#ccc" : "#333"} 
                    />
                  </TouchableOpacity>
                  <View style={styles.paginationCenter}>
                    <Text style={styles.paginationText}>
                      Page {currentPage} of {Math.max(totalPages, 1)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.paginationArrow}
                    onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <Ionicons 
                      name="chevron-forward" 
                      size={24} 
                      color={currentPage === totalPages ? "#ccc" : "#333"} 
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
          </>
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