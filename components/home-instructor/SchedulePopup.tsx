import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { PopupBase } from './PopupBase';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

type ScheduleItem = {
  id: string;
  day: string;
  time: string;
  course: string;
  room: string;
};

const scheduleData: ScheduleItem[] = [
  { id: '1', day: 'Thứ hai', time: '08:00 - 10:00', course: 'Lập trình web', room: 'A1.201' },
  { id: '2', day: 'Thứ hai', time: '13:30 - 16:30', course: 'Cơ sở dữ liệu', room: 'A2.303' },
  { id: '3', day: 'Thứ ba', time: '07:00 - 09:00', course: 'Java nâng cao', room: 'B1.405' },
  { id: '4', day: 'Thứ năm', time: '09:30 - 11:30', course: 'Quản lý dự án', room: 'C2.108' },
  { id: '5', day: 'Thứ sáu', time: '14:00 - 17:00', course: 'React Native', room: 'A1.505' },
];

export function SchedulePopup() {
  const renderScheduleItem = ({ item }: { item: ScheduleItem }) => (
    <ThemedView style={styles.scheduleItem}>
      <View style={styles.dayTimeContainer}>
        <ThemedText style={styles.dayText}>{item.day}</ThemedText>
        <ThemedText style={styles.timeText}>{item.time}</ThemedText>
      </View>
      <View style={styles.courseContainer}>
        <ThemedText style={styles.courseText}>{item.course}</ThemedText>
        <ThemedText style={styles.roomText}>Phòng: {item.room}</ThemedText>
      </View>
    </ThemedView>
  );

  return (
    <PopupBase title="Thời khóa biểu" useScrollView={false}>
      <View style={styles.weekSelector}>
        <TouchableOpacity style={styles.weekButton}>
          <ThemedText style={styles.weekButtonText}>← Tuần trước</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.currentWeek}>14/08 - 20/08</ThemedText>
        <TouchableOpacity style={styles.weekButton}>
          <ThemedText style={styles.weekButtonText}>Tuần sau →</ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={scheduleData}
        renderItem={renderScheduleItem}
        keyExtractor={item => item.id}
        style={styles.scheduleList}
        showsVerticalScrollIndicator={false}
      />
    </PopupBase>
  );
}

const styles = StyleSheet.create({
  weekSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    marginBottom: 10,
  },
  weekButton: {
    padding: 8,
  },
  weekButtonText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
  currentWeek: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  scheduleList: {
    width: '100%',
    marginTop: 10,
  },
  scheduleItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  dayTimeContainer: {
    flex: 2,
  },
  dayText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  timeText: {
    marginTop: 4,
  },
  courseContainer: {
    flex: 3,
  },
  courseText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  roomText: {
    marginTop: 4,
    color: '#666',
  },
});
