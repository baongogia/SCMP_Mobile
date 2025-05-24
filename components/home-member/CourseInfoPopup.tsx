import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { PopupBase } from './PopupBase';

type Course = {
  id: string;
  name: string;
  code: string;
  students: number;
};

const coursesData: Course[] = [
  { id: '1', name: 'Bơi cơ bản cho người mới bắt đầu', code: 'SWIM101', students: 15 },
  { id: '2', name: 'Bơi sải nâng cao', code: 'FSTYLE202', students: 12 },
  { id: '3', name: 'Bơi ếch kỹ thuật', code: 'BREAST303', students: 10 },
  { id: '4', name: 'Bơi bướm chuyên nghiệp', code: 'BFLY404', students: 8 },
  { id: '5', name: 'Huấn luyện cứu hộ', code: 'SAVE505', students: 6 },
];

export function CourseInfoPopup() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity 
      style={[styles.courseItem, selectedCourse?.id === item.id && styles.selectedItem]} 
      onPress={() => setSelectedCourse(item)}
      activeOpacity={0.7}
    >
      <ThemedText style={styles.courseName}>{item.name}</ThemedText>
      <ThemedText style={styles.courseCode}>Mã: {item.code}</ThemedText>
      <ThemedText style={styles.courseStudents}>Số học viên: {item.students}</ThemedText>
    </TouchableOpacity>
  );

  const handleViewStudents = () => {
    // Add your navigation logic here
    console.log('View students for course:', selectedCourse?.code);
  };

  return (
    <PopupBase title="Thông tin các khóa bơi">
      <ThemedView style={styles.container}>
        <ThemedText style={styles.listTitle}>Danh sách các khóa bơi bạn đang giảng dạy:</ThemedText>
        
        <FlatList
          data={coursesData}
          renderItem={renderCourseItem}
          keyExtractor={(item) => item.id}
          style={styles.courseList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
        />

        {selectedCourse && (
          <ThemedView style={styles.courseDetails}>
            <ThemedText style={styles.detailsTitle}>Chi tiết khóa học</ThemedText>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Tên khóa học:</ThemedText>
              <ThemedText style={styles.detailValue}>{selectedCourse.name}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Mã khóa học:</ThemedText>
              <ThemedText style={styles.detailValue}>{selectedCourse.code}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Số học viên:</ThemedText>
              <ThemedText style={styles.detailValue}>{selectedCourse.students}</ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.viewButton}
              onPress={handleViewStudents}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.viewButtonText}>Xem danh sách học viên</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </ThemedView>
    </PopupBase>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  courseList: {
    width: '100%',
    maxHeight: 300, // Added max height to prevent overflow
  },
  flatListContent: {
    paddingBottom: 10,
  },
  courseItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  selectedItem: {
    borderColor: '#007BFF',
    backgroundColor: 'rgba(0, 123, 255, 0.05)',
    elevation: 2, // Added shadow for Android
    shadowColor: '#000', // Added shadow for iOS
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  courseStudents: {
    fontSize: 14,
    color: '#666',
  },
  courseDetails: {
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  detailLabel: {
    flex: 2,
    fontWeight: 'bold',
    color: '#555',
  },
  detailValue: {
    flex: 3,
    color: '#333',
  },
  viewButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});