import { Image, StyleSheet, Platform, TouchableOpacity, View, Text, Modal, Pressable, SafeAreaView, StatusBar } from 'react-native';
import { useState } from 'react';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
// Import all popup components
import {
  LeaveRequestPopup,
  OtherRequestPopup,
  SchedulePopup,
  CourseInfoPopup,
  FeedbackFacilitiesPopup,
  AttendanceReportPopup,
  StudentFeedbackPopup,
  PersonalInfoPopup,
  RegulationsPopup,
  FeedbackPopup
} from '@/components/home-instructor';

export default function HomeScreen() {
  const [activePopup, setActivePopup] = useState<string | null>(null);

  const handleMenuPress = (menuName: string) => {
    setActivePopup(menuName);
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  // Get popup title based on activePopup
  const getPopupTitle = () => {
    switch(activePopup) {
      case 'leave_request':
        return truncateText('Xin nghỉ phép, xếp lịch', 30);
      case 'other_request':
        return truncateText('Đơn khác', 30);
      case 'schedule':
        return truncateText('Thời khóa biểu', 30);
      case 'course_info':
        return truncateText('Thông tin các khóa học', 30);
      case 'feedback_facilities':
        return truncateText('Ý kiến về cơ sở vật chất', 30);
      case 'other_feedback':
        return truncateText('Ý kiến khác', 30);
      case 'attendance_report':
        return truncateText('Báo cáo chấm công', 30);
      case 'student_feedback':
        return truncateText('Góp ý từ học viên', 30);
      case 'personal_info':
        return truncateText('Thông tin cá nhân', 30);
      case 'regulations':
        return truncateText('Các quy định', 30);
      default:
        return '';
    }
  };

  // Popup content based on activePopup - now using component imports
  const renderPopupContent = () => {
    switch(activePopup) {
      case 'leave_request':
        return <LeaveRequestPopup />;
      case 'other_request':
        return <OtherRequestPopup />;
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
      case 'student_feedback':
        return <StudentFeedbackPopup />;
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
        {/* Thủ tục/đơn từ section */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Thủ tục/đơn từ</ThemedText>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('leave_request')}>
              <View style={styles.bullet}></View>
              <ThemedText style={styles.menuText}>{truncateText('Xin nghỉ phép, xếp lịch...')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('other_request')}>
              <View style={styles.bullet}></View>
              <ThemedText style={styles.menuText}>{truncateText('Đơn khác')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Tra cứu thông tin section */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Tra cứu thông tin</ThemedText>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('schedule')}>
              <View style={styles.bullet}></View>
              <ThemedText style={styles.menuText}>{truncateText('Thời khóa biểu')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('course_info')}>
              <View style={styles.bullet}></View>
              <ThemedText style={styles.menuText}>{truncateText('Thông tin các khóa học')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Ý kiến section */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Ý kiến</ThemedText>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('feedback_facilities')}>
              <View style={styles.bullet}></View>
              <ThemedText style={styles.menuText}>{truncateText('Ý kiến về điều kiện cơ sở vật chất')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('other_feedback')}>
              <View style={styles.bullet}></View>
              <ThemedText style={styles.menuText}>{truncateText('Ý kiến khác')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Báo cáo section */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Báo cáo</ThemedText>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('attendance_report')}>
              <View style={styles.bullet}></View>
              <ThemedText style={styles.menuText}>{truncateText('Báo cáo chấm công')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('student_feedback')}>
              <View style={styles.bullet}></View>
              <ThemedText style={styles.menuText}>{truncateText('Góp ý từ học viên')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Khác section */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Khác</ThemedText>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('personal_info')}>
              <View style={styles.bullet}></View>
              <ThemedText style={styles.menuText}>{truncateText('Thông tin cá nhân')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Các quy định section */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Các quy định</ThemedText>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('regulations')}>
              <View style={styles.bullet}></View>
              <ThemedText style={styles.menuText}>{truncateText('Xem thêm')}</ThemedText>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'space-around',
    marginTop: 20,
  },
  gridItem: {
    width: '40%',
    aspectRatio: 1, // This makes the item square
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    borderRadius: 10,
  },
  gridItemText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
