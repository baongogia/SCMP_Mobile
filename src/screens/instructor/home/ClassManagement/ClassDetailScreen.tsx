import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { SharedHeader } from "@/src/components/custom";
import { getInstructorClassDetail } from "@/src/services/learning_process/class/classService";
import {
  ClassItem,
  ClassSchedulePlan,
  CourseDetailSection,
} from "@/src/types/schedule";
import { showErrorToast } from "@/src/utils/errorHandler";

// Square Tile Component
const InfoTile = ({ icon, label, value }: { icon: any, label: string, value: string | number }) => (
    <View style={styles.tile}>
        <View style={styles.tileIcon}>
            <Ionicons name={icon} size={20} color={colors.white} />
        </View>
        <Text style={styles.tileValue}>{value}</Text>
        <Text style={styles.tileLabel}>{label}</Text>
    </View>
);

export function ClassDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { classId } = route.params as { classId: string };
  const [classItem, setClassItem] = useState<ClassItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassDetail();
  }, [classId]);

  const fetchClassDetail = async () => {
    try {
      setLoading(true);
      const response = await getInstructorClassDetail(classId);
      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data) &&
        response.data.data.length > 0
      ) {
        setClassItem(response.data.data[0]);
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi",
        message: "Không thể tải chi tiết lớp học",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SharedHeader title="Chi tiết lớp học" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!classItem) {
    return (
      <View style={styles.container}>
         <SharedHeader title="Chi tiết lớp học" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Không tìm thấy thông tin lớp học</Text>
        </View>
      </View>
    );
  }

  const courseSections: CourseDetailSection[] = Array.isArray(
    classItem.course?.detail
  )
    ? classItem.course.detail.filter(
        (section): section is CourseDetailSection =>
          !!section && typeof section.title === "string"
      )
    : [];

  const schedulePlans: ClassSchedulePlan[] = Array.isArray(
    classItem.schedule_plan
  )
    ? classItem.schedule_plan.filter(
        (plan): plan is ClassSchedulePlan =>
          !!plan &&
          Array.isArray(plan.days_of_week) &&
          plan.days_of_week.length > 0
      )
    : [];

  const members = Array.isArray(classItem.member) ? classItem.member : [];

  return (
    <View style={styles.container}>
      <SharedHeader title="Chi tiết lớp học" showBackButton onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
            <Text style={styles.className}>{classItem.course?.title}</Text>
            <Text style={styles.courseName}>{classItem.name}</Text>
        </View>

        {/* 3 Square Tiles Grid */}
        <View style={styles.gridContainer}>
             <InfoTile
                icon="layers"
                label="Số buổi"
                value={classItem.course?.session_number ?? 0}
             />
             <InfoTile
                icon="people"
                label="Sĩ số"
                value={members.length}
             />
             <InfoTile
                icon="pricetag"
                label="Học phí"
                value={`${Number(classItem.course?.price ?? 0).toLocaleString()}đ`}
             />
        </View>

        {/* Schedule Section */}
        {schedulePlans.length > 0 && (
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Lịch học</Text>
                {schedulePlans.map((plan, index) => (
                    <View key={index} style={styles.scheduleRow}>
                        <View style={styles.scheduleDot} />
                        <View style={{flex: 1}}>
                            <Text style={styles.scheduleDays}>{plan.days_of_week.join(", ")}</Text>
                            {typeof plan.slot === "object" && plan.slot && 'title' in plan.slot && (
                                <Text style={styles.scheduleTime}>{(plan.slot as any).title}</Text>
                            )}
                             {plan.location && (
                                <Text style={styles.scheduleLocation}>
                                    <Ionicons name="location-sharp" size={12} /> {plan.location}
                                </Text>
                             )}
                        </View>
                    </View>
                ))}
            </View>
        )}

        {/* Full Student List */}
        <View style={styles.sectionContainer}>
            <View style={styles.studentHeader}>
                <Text style={styles.sectionTitle}>Danh sách học viên</Text>
                <View style={styles.studentCountBadge}>
                    <Text style={styles.studentCountText}>{members.length}</Text>
                </View>
            </View>

            <View style={styles.studentList}>
                {members.length > 0 ? (
                    members.map((student, index) => {
                        const avatarSource = (() => {
                           if (student.featured_image) {
                               if (Array.isArray(student.featured_image) && student.featured_image.length > 0) {
                                   return { uri: student.featured_image[0].path };
                               }
                               if (typeof student.featured_image === 'object' && student.featured_image.path) {
                                   return { uri: student.featured_image.path };
                               }
                               if (typeof student.featured_image === 'string') {
                                   return { uri: student.featured_image };
                               }
                           }
                           if (student.avatar) return { uri: student.avatar };
                           return null;
                       })();

                        return (
                            <View key={student._id} style={styles.studentItem}>
                                <View style={styles.studentAvatar}>
                                    {avatarSource ? (
                                        <Image source={avatarSource} style={styles.avatarImg} />
                                    ) : (
                                        <Text style={styles.avatarInitial}>{(student.username || student.name || "U").charAt(0).toUpperCase()}</Text>
                                    )}
                                </View>
                                <View style={styles.studentInfo}>
                                    <Text style={styles.studentName}>{student.username || student.name}</Text>
                                    <Text style={styles.studentEmail}>{student.email}</Text>
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <Text style={styles.emptyTextSimple}>Chưa có học viên nào.</Text>
                )}
            </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSecondary,
  },
  scrollContent: {
      padding: 16,
      paddingTop: 12,
  },

  // Header
  headerSection: {
      marginBottom: 12,
      backgroundColor: colors.white,
      padding: 16,
      borderRadius: 16,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
  },
  courseName: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '400',
      marginBottom: 4,
  },
  className: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
  },

  // Grid Tiles
  gridContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
  },
  tile: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 8,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
      minHeight: 100,
  },
  tileIcon: {
      marginBottom: 8,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
  },
  tileValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.white,
      marginBottom: 2,
      textAlign: 'center',
  },
  tileLabel: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.8)',
      textAlign: 'center',
      fontWeight: '500',
  },

  // Sections
  sectionContainer: {
      marginBottom: 12,
      backgroundColor: colors.white,
      padding: 16,
      borderRadius: 16,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
  },
  sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      paddingLeft: 8,
  },

  // Schedule
  scheduleRow: {
      flexDirection: 'row',
      marginBottom: 0,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
  },
  scheduleDot: {
      display: 'none',
  },
  scheduleDays: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
  },
  scheduleTime: {
      fontSize: 13,
      color: colors.textSecondary,
  },
  scheduleLocation: {
      fontSize: 12,
      color: colors.primary,
      marginTop: 2,
      fontWeight: '500',
  },

  // Student List
  studentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
  },
  studentCountBadge: {
      backgroundColor: colors.lightPrimary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
  },
  studentCountText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
  },
  studentList: {
      // removed padding/bg to blend with section
  },
  studentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
  },
  studentAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.lightPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      overflow: 'hidden',
  },
  avatarImg: {
      width: '100%',
      height: '100%',
  },
  avatarInitial: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 14,
  },
  studentInfo: {
      flex: 1,
  },
  studentName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
  },
  studentEmail: {
      fontSize: 11,
      color: colors.textSecondary,
  },
  emptyTextSimple: {
      padding: 16,
      textAlign: 'center',
      color: colors.textSecondary,
      fontStyle: 'italic',
  },
});
