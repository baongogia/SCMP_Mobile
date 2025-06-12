import { Image, StyleSheet, Platform, TouchableOpacity, View, Text, Modal, Pressable, SafeAreaView, StatusBar } from 'react-native';
import { useState } from 'react';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
// Import all popup components
import {
  SchedulePopup,
  CourseInfoPopup,
  FeedbackFacilitiesPopup,
  AttendanceReportPopup,
  PaymentHistoryPopup,
  PersonalInfoPopup,
  RegulationsPopup,
  FeedbackPopup
} from '@/components/home-member';

export default function HomeScreen() {
  const [activePopup, setActivePopup] = useState<string | null>(null);

  const handleMenuPress = (menuName: string) => {
    setActivePopup(menuName);
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  // Menu items data
  const menuItems = [
    { id: 'schedule', title: 'Thời khóa biểu', icon: 'time-outline', color: '#FF9800' },
    { id: 'course_info', title: 'Thông tin các khóa học', icon: 'school-outline', color: '#9C27B0' },
    { id: 'feedback_facilities', title: 'Ý kiến về cơ sở vật chất', icon: 'business-outline', color: '#F44336' },
    { id: 'other_feedback', title: 'Ý kiến khác', icon: 'chatbubble-outline', color: '#607D8B' },
    { id: 'attendance_report', title: 'Báo cáo điểm danh', icon: 'stats-chart-outline', color: '#795548' },
    { id: 'payment_history', title: 'Lịch sử giao dịch', icon: 'people-outline', color: '#009688' },
    { id: 'personal_info', title: 'Thông tin cá nhân', icon: 'person-outline', color: '#3F51B5' },
    { id: 'regulations', title: 'Các quy định', icon: 'library-outline', color: '#E91E63' },
  ];

  // Get popup title based on activePopup
  const getPopupTitle = () => {
    const item = menuItems.find(item => item.id === activePopup);
    return item ? item.title : '';
  };

  // Popup content based on activePopup - now using component imports
  const renderPopupContent = () => {
    switch (activePopup) {
      case 'schedule':
        return <SchedulePopup />;
      case 'course_info':
        return <CourseInfoPopup />;
      case 'feedback_facilities':
        return <FeedbackFacilitiesPopup />;
      case 'other_feedback':
        return <FeedbackPopup />;
      case 'attendance_report':
        return <AttendanceReportPopup />;
      case 'payment_history':
        return <PaymentHistoryPopup />;
      case 'personal_info':
        return <PersonalInfoPopup />;
      case 'regulations':
        return <RegulationsPopup />;
      default:
        return null;
    }
  };

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number = 24) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <View style={styles.container}>
        <ThemedText style={styles.mainTitle}>Danh mục chức năng</ThemedText>

        <View style={styles.gridContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.gridItem, { backgroundColor: item.color }]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons name={item.icon as any} size={32} color="white" />
              <Text style={styles.gridItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Full Screen Popup */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={activePopup !== null}
          onRequestClose={closePopup}
        >
          <SafeAreaView style={styles.fullScreenPopup}>
            <StatusBar barStyle="light-content" />
            <View style={styles.popupHeader}>
              <TouchableOpacity style={styles.backButton} onPress={closePopup}>
                <Text style={styles.backButtonText}>Quay lại</Text>
              </TouchableOpacity>
              <Text style={styles.popupHeaderTitle}>{getPopupTitle()}</Text>
            </View>

            <View style={styles.popupContent}>
              {renderPopupContent()}
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  gridItem: {
    width: '47%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gridItemText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  container: {
    padding: 16,
    gap: 16,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  sectionContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
  },
  menuText: {
    fontSize: 16,
    flex: 1, // This allows the text to take available space but still truncate
  },
  fullScreenPopup: {
    flex: 1,
    backgroundColor: '#fff',
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#007BFF', // Blue color matching the screenshot
    height: 56,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  popupHeaderTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 50, // Add padding to prevent overlapping with back button
  },
  popupContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  popupText: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 20,
  },
});
