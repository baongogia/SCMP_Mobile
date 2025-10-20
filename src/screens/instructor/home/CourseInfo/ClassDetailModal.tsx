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
import { ClassItem } from "@/src/types/schedule";

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
            <Ionicons
              name="document-text-outline"
              size={24}
              color={colors.white}
            />
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
                  {student.avatar ? (
                    <Image
                      source={{ uri: student.featured_image?.path }}
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
                    {/* {student.phone && (
                      <Text style={styles.studentContact}>{student.phone}</Text>
                    )} */}
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
