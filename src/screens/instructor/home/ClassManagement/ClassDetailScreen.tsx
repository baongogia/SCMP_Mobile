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
        const data = response.data.data[0];
        console.log("🔍 Class Detail API Data:", JSON.stringify(data, null, 2));
        setClassItem(data);
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
            <Text style={styles.className}>{classItem.name}</Text>
            <Text style={styles.courseName}>Khoá học: {classItem.course?.title}</Text>
        </View>

        {/* 3 Square Tiles Grid */}
        <View style={styles.gridContainer}>
             <InfoTile
                icon="layers"
                label="Số buổi"
                value={`${classItem.session_number ?? classItem.course?.session_number ?? 0} buổi`}
             />
             <InfoTile
                icon="time"
                label="Thời lượng"
                value={classItem.session_number_duration || classItem.course?.session_number_duration || "-- phút"}
             />
             <InfoTile
                icon="pricetag"
                label="Học phí"
                value={`${Number(classItem.course?.price ?? 0).toLocaleString()}đ`}
             />
        </View>

        {/* Description Section */}
        {classItem.course?.description ? (
            <View style={styles.sectionContainer}>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
                    <Text style={[styles.sectionTitle, {marginBottom: 0}]}>Mô tả khóa học</Text>
                    {(() => {
                        const typeOfAge = classItem.type_of_age && classItem.type_of_age.length > 0
                            ? classItem.type_of_age
                            : classItem.course?.type_of_age;

                        if (typeOfAge && typeOfAge.length > 0) {
                            return (
                                <View style={[styles.ageBadge, {marginTop: 0}]}>
                                    <Text style={styles.ageText}>
                                        {typeOfAge.map((t) => {
                                            if (typeof t === 'string') return t;
                                            return t.title;
                                        }).join(", ")}
                                    </Text>
                                </View>
                            );
                        }
                        return null;
                    })()}
                </View>
                <Text style={styles.descriptionText}>{classItem.course.description}</Text>
            </View>
        ) : null}

        {/* Course Detail Section (Curriculum) */}
        {(classItem.detail && classItem.detail.length > 0) || (classItem.course?.detail && classItem.course.detail.length > 0) ? (
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Nội dung đào tạo</Text>
                {(classItem.detail && classItem.detail.length > 0 ? classItem.detail : classItem.course?.detail || []).map((item, index) => (
                    <View key={index} style={styles.detailRow}>
                        <View style={styles.detailHeader}>
                             <View style={styles.detailDot} />
                             <Text style={styles.detailTitle}>{item.title}</Text>
                        </View>
                        {item.description ? (
                            <Text style={styles.detailDescription}>{item.description}</Text>
                        ) : null}
                    </View>
                ))}
            </View>
        ) : null}

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

                       const age = student.birthday
                           ? new Date().getFullYear() - new Date(student.birthday).getFullYear()
                           : null;

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
                                    {age !== null && (
                                         <Text style={styles.studentDetailText}>{age} tuổi</Text>
                                    )}
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
      color: colors.primary,
      fontWeight: '700',
      marginBottom: 0,
  },
  className: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
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
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  detailDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 14,
    lineHeight: 18,
  },
  studentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  roleBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  roleText: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '600',
  },
  studentDetailText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: colors.text,
    fontWeight: '500',
    fontSize: 14,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  ageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  ageText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
