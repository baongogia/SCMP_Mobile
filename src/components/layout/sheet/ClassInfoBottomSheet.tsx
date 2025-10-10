import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";

interface ClassInfoBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  className: string;
  memberCount: number;
}

export function ClassInfoBottomSheet({
  visible,
  onClose,
  className,
  memberCount,
}: ClassInfoBottomSheetProps) {
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
          <Text style={styles.headerTitle}>Thông tin lớp học</Text>
          <View style={styles.headerRight} />
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
                <Text style={styles.className}>{className}</Text>
                <Text style={styles.courseTitle}>Khóa học bơi lội</Text>
              </View>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Lịch học</Text>
                  <Text style={styles.detailValue}>
                    Thứ 2, 4, 6 - 18:00-19:30
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Giáo viên</Text>
                  <Text style={styles.detailValue}>Thầy Nguyễn Văn A</Text>
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
                  <Text style={styles.detailValue}>{memberCount} người</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Địa điểm</Text>
                  <Text style={styles.detailValue}>
                    Bể bơi Olympic - Tầng 2
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
                  <Text style={styles.detailValue}>2,500,000 VNĐ</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.descriptionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>Mô tả lớp học</Text>
            </View>
            <Text style={styles.descriptionText}>
              Lớp học bơi lội cơ bản dành cho người mới bắt đầu. Học viên sẽ
              được hướng dẫn các kỹ thuật bơi cơ bản, an toàn dưới nước và cách
              thở đúng cách. Lớp học được thiết kế với tỷ lệ giáo viên/học viên
              tối ưu để đảm bảo chất lượng giảng dạy.
            </Text>
          </View>

          {/* Requirements Section */}
          <View style={styles.requirementsCard}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>Yêu cầu</Text>
            </View>
            <View style={styles.requirementList}>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
                <Text style={styles.requirementText}>
                  Không cần kinh nghiệm bơi lội
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
                <Text style={styles.requirementText}>
                  Mang theo đồ bơi và khăn tắm
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
                <Text style={styles.requirementText}>
                  Không ăn no trước khi bơi
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
                <Text style={styles.requirementText}>
                  Có giấy khám sức khỏe
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: colors.white,
    margin: 15,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  classIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lightPrimary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: "500",
  },
  detailsContainer: {
    padding: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: "500",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
  },
  descriptionCard: {
    backgroundColor: colors.white,
    margin: 15,
    marginTop: 0,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  requirementsCard: {
    backgroundColor: colors.white,
    margin: 15,
    marginTop: 0,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.gray,
    lineHeight: 20,
    padding: 20,
  },
  requirementList: {
    padding: 20,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  requirementText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
});
