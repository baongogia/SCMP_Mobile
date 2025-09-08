import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { PopupBase } from './PopupBase';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

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
    >
      <ThemedText style={styles.courseName}>{item.name}</ThemedText>
      <ThemedText style={styles.courseCode}>Mã: {item.code}</ThemedText>
      <ThemedText style={styles.courseStudents}>Số học viên: {item.students}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <PopupBase title="Thông tin các khóa bơi" useScrollView={false}>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.listTitle}>Danh sách các khóa bơi bạn đang giảng dạy:</ThemedText>
        
        <FlatList
          data={coursesData}
          renderItem={renderCourseItem}
          keyExtractor={item => item.id}
          style={styles.courseList}
          showsVerticalScrollIndicator={false}
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
            <TouchableOpacity style={styles.viewButton}>
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
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  courseList: {
    width: '100%',
    marginBottom: 20,
  },
  courseItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedItem: {
    borderColor: '#007BFF',
    backgroundColor: 'rgba(0, 123, 255, 0.05)',
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  courseCode: {
    marginTop: 4,
  },
  courseStudents: {
    marginTop: 4,
    fontSize: 14,
  },
  courseDetails: {
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    flex: 2,
    fontWeight: 'bold',
  },
  detailValue: {
    flex: 3,
  },
  viewButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 16,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
