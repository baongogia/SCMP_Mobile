import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import {
  ClassItem,
  ClassSchedulePlan,
  CourseDetailSection,
  CourseEvaluationField,
} from "@/src/types/schedule";

interface ClassDetailModalProps {
  visible: boolean;
  onClose: () => void;
  classItem: ClassItem | null;
}

export function ClassDetailModal({
  visible,
  onClose,
  classItem,
}: ClassDetailModalProps) {
  const navigation = useNavigation();

  if (!classItem) return null;

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

  const buildFieldMeta = (field?: CourseEvaluationField) => {
    if (!field) return "";
    const pieces: string[] = [];
    if (field.required) {
      pieces.push("Bắt buộc");
    }
    return pieces.join(" • ");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết lớp học</Text>
          <TouchableOpacity
            style={styles.noteButton}
            onPress={() => {
              onClose();
              (navigation as any).navigate("Note", {
                class_id: classItem._id,
                course_id: classItem.course._id,
                class_name: classItem.name,
                course_title: classItem.course.title,
              });
            }}
          >
            <Ionicons name="create-outline" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Class Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={styles.classIcon}>
                <Ionicons
                  name="school-outline"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{classItem.name}</Text>
                <Text style={styles.courseTitle}>{classItem.course.title}</Text>
              </View>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Ionicons
                  name="book-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Mô tả khóa học</Text>
                  <Text style={styles.detailValue}>
                    {classItem.course.description}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="trending-up-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Số buổi</Text>
                  <Text style={styles.detailValue}>
                    {classItem.course.session_number}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Thời lượng</Text>
                  <Text style={styles.detailValue}>
                    {classItem.course.session_number_duration}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="cash-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Học phí</Text>
                  <Text style={styles.detailValue}>
                    {classItem.course.price.toLocaleString()} VNĐ
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Số học viên</Text>
                  <Text style={styles.detailValue}>
                    {classItem.member.length} người
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Course Detail & Evaluations */}
          {courseSections.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="reader-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.sectionTitle}>Nội dung khóa học</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Các hạng mục và tiêu chí đánh giá giúp bạn theo dõi tiến trình
                học viên.
              </Text>

              {courseSections.map((section, index) => {
                const evaluationItems = section.form_judge?.items
                  ? Object.entries(section.form_judge.items)
                  : [];
                return (
                  <View
                    key={`${section.title}-${index}`}
                    style={styles.sectionBlock}
                  >
                    <View style={styles.sectionBlockHeader}>
                      <Text style={styles.sectionBlockTitle}>
                        {section.title}
                      </Text>
                      {evaluationItems.length > 0 && (
                        <Text style={styles.sectionBlockSubtitle}>
                          {evaluationItems.length} tiêu chí
                        </Text>
                      )}
                    </View>

                    {evaluationItems.length > 0 ? (
                      <View style={styles.criteriaList}>
                        {evaluationItems.map(([label, meta]) => {
                          const metaText = buildFieldMeta(meta);
                          return (
                            <View key={label} style={styles.criteriaItem}>
                              <Ionicons
                                name="checkmark-circle-outline"
                                size={18}
                                color={colors.primary}
                                style={styles.criteriaIcon}
                              />
                              <View style={styles.criteriaContent}>
                                <Text style={styles.criteriaLabel}>
                                  {label.trim()}
                                </Text>
                                {metaText ? (
                                  <Text style={styles.criteriaMeta}>
                                    {metaText}
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={styles.emptyCriteriaText}>
                        Chưa có tiêu chí đánh giá cụ thể.
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Weekly Schedule */}
          {schedulePlans.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.sectionTitle}>Lịch học hàng tuần</Text>
              </View>

              <View style={styles.scheduleList}>
                {schedulePlans.map((plan, index) => (
                  <View
                    key={`${plan.slot ?? "slot"}-${index}`}
                    style={[
                      styles.scheduleRow,
                      index < schedulePlans.length - 1 &&
                        styles.scheduleDivider,
                    ]}
                  >
                    <View style={styles.scheduleBadge}>
                      <Ionicons
                        name="time-outline"
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.scheduleContent}>
                      <Text style={styles.scheduleDays}>
                        {plan.days_of_week.join(" • ")}
                      </Text>
                      {plan.slot ? (
                        <Text style={styles.scheduleSlot}>
                          Ca học: {plan.slot}
                        </Text>
                      ) : null}
                      {plan.location ? (
                        <Text style={styles.scheduleSlot}>
                          Địa điểm: {plan.location}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Students List */}
          <View style={styles.studentsCard}>
            <View style={styles.studentsHeader}>
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={styles.studentsTitle}>
                Danh sách học viên ({classItem.member.length})
              </Text>
            </View>

            {classItem.member.map((student, index) => (
              <View
                key={student._id}
                style={[
                  styles.studentRow,
                  index < classItem.member.length - 1 && styles.studentDivider,
                ]}
              >
                <View style={styles.studentInfo}>
                  {student.featured_image?.[0]?.path ? (
                    <Image
                      source={{ uri: student.featured_image?.[0]?.path }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={20} color={colors.white} />
                    </View>
                  )}
                  <View style={styles.studentDetails}>
                    <Text style={styles.studentName}>{student.username}</Text>
                    <Text style={styles.studentContact}>{student.email}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
  },
  headerRight: {
    width: 32,
  },
  noteButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  classIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  sectionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  sectionBlock: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 12,
  },
  sectionBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 12,
  },
  sectionBlockTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  sectionBlockSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  criteriaList: {
    gap: 10,
  },
  criteriaItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  criteriaIcon: {
    marginTop: 2,
  },
  criteriaContent: {
    flex: 1,
    gap: 4,
  },
  criteriaLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 20,
  },
  criteriaMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  emptyCriteriaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  scheduleList: {
    marginTop: 4,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  scheduleDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  scheduleBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.lightPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  scheduleContent: {
    flex: 1,
    gap: 2,
  },
  scheduleDays: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  scheduleSlot: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  studentsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  studentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  studentsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  studentDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 2,
  },
  studentContact: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
  },
});
