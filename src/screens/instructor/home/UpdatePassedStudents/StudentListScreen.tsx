import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Switch,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { SharedHeader } from "@/src/components/custom";
import {
  getInstructorClassDetail,
  updateMemberPassed,
} from "@/src/services/learning_process/class/classService";
import { ClassItem } from "@/src/types/schedule";
import { showErrorToast, showSuccessToast } from "@/src/utils/errorHandler";
import { ConfirmModal } from "./ConfirmModal";

interface Student {
  _id: string;
  username: string;
  email?: string;
  featured_image?: Array<{ path: string }>;
}

interface RouteParams {
  class_id: string;
  class_name: string;
  course_title: string;
}

export function StudentListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { class_id, class_name, course_title } = (route.params ||
    {}) as RouteParams;

  const [students, setStudents] = useState<Student[]>([]);
  const [memberPassed, setMemberPassed] = useState<string[]>([]);
  const [localPassed, setLocalPassed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load class detail and students
  const loadClassDetail = useCallback(async () => {
    if (!class_id) return;

    try {
      setLoading(true);
      const response = await getInstructorClassDetail(class_id);
      console.log("Class detail response:", response.data);

      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data) &&
        response.data.data.length > 0
      ) {
        const classData: ClassItem = response.data.data[0];
        const classDataAny = classData as any; // Type assertion for member_passed
        const classStudents: Student[] = Array.isArray(classData.member)
          ? classData.member
          : [];
        const passedIds: string[] = Array.isArray(classDataAny.member_passed)
          ? classDataAny.member_passed
          : [];

        setStudents(classStudents);
        setMemberPassed(passedIds);
        setLocalPassed(new Set(passedIds));
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải danh sách học viên",
        message: "Không thể tải danh sách học viên",
      });
    } finally {
      setLoading(false);
    }
  }, [class_id]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadClassDetail();
    setRefreshing(false);
  };

  // Toggle student passed status
  const toggleStudentPassed = (studentId: string) => {
    setLocalPassed((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  // Handle save
  const handleSave = () => {
    setShowConfirmModal(true);
  };

  // Confirm save
  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    setSaving(true);

    try {
      const passedIds = Array.from(localPassed);
      await updateMemberPassed(class_id, passedIds);
      setMemberPassed(passedIds);
      showSuccessToast("Cập nhật danh sách học viên đã tốt nghiệp thành công!");
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi cập nhật",
        message: "Không thể cập nhật danh sách học viên đã tốt nghiệp",
      });
      // Revert to original state on error
      setLocalPassed(new Set(memberPassed));
    } finally {
      setSaving(false);
    }
  };

  // Check if there are changes
  const hasChanges = () => {
    if (localPassed.size !== memberPassed.length) return true;
    for (const id of memberPassed) {
      if (!localPassed.has(id)) return true;
    }
    return false;
  };

  // Initial load
  useEffect(() => {
    loadClassDetail();
  }, [loadClassDetail]);

  const renderStudentItem = ({ item }: { item: Student }) => {
    const isPassed = localPassed.has(item._id);
    return (
      <View style={styles.studentCard}>
        <View style={styles.studentInfo}>
          {item.featured_image?.[0]?.path ? (
            <Image
              source={{ uri: item.featured_image[0].path }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={colors.white} />
            </View>
          )}
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{item.username}</Text>
            {item.email && (
              <Text style={styles.studentEmail}>{item.email}</Text>
            )}
          </View>
        </View>
        <View style={styles.studentActions}>
          <View
            style={[
              styles.statusBadge,
              isPassed ? styles.passedBadge : styles.notPassedBadge,
            ]}
          >
            <Ionicons
              name={isPassed ? "trophy" : "trophy-outline"}
              size={14}
              color={isPassed ? colors.white : colors.textSecondary}
            />
            <Text
              style={[
                styles.statusText,
                isPassed ? styles.passedText : styles.notPassedText,
              ]}
            >
              {isPassed ? "Đã đạt" : "Chưa đạt"}
            </Text>
          </View>
          <Switch
            value={isPassed}
            onValueChange={() => toggleStudentPassed(item._id)}
            trackColor={{
              false: colors.gray[300],
              true: colors.primary,
            }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.gray[300]}
          />
        </View>
      </View>
    );
  };

  const passedCount = localPassed.size;
  const totalCount = students.length;

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <SharedHeader title={class_name || "Danh sách học viên"} />

      {/* Content */}
      <View style={styles.content}>
        {course_title && (
          <View style={styles.courseInfo}>
            <Ionicons name="school" size={18} color={colors.primary} />
            <Text style={styles.courseTitle}>{course_title}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              Đang tải danh sách học viên...
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={students}
              renderItem={renderStudentItem}
              keyExtractor={(item) => item._id}
              style={styles.studentList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconWrapper}>
                    <Ionicons
                      name="people-outline"
                      size={48}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>Chưa có học viên</Text>
                  <Text style={styles.emptySubtitle}>
                    Lớp học này chưa có học viên nào.
                  </Text>
                </View>
              }
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />

            {/* Save Button */}
            {students.length > 0 && (
              <View style={styles.saveButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    (!hasChanges() || saving) && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={!hasChanges() || saving}
                  activeOpacity={0.8}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="save" size={20} color={colors.white} />
                      <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* Confirm Modal */}
      <ConfirmModal
        visible={showConfirmModal}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirmModal(false)}
        passedCount={passedCount}
        totalCount={totalCount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  courseInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.lightPrimary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  studentList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  studentCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  studentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  passedBadge: {
    backgroundColor: colors.primary,
  },
  notPassedBadge: {
    backgroundColor: colors.gray[200],
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  passedText: {
    color: colors.white,
  },
  notPassedText: {
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.lightPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  saveButtonContainer: {
    position: "absolute",
    bottom: -12,
    left: 0,
    right: 0,
    padding: 16,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray[300],
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
});
