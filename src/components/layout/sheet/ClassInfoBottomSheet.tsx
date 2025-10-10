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
  classData?: any; // Simplified to avoid complex type issues
  className: string;
  memberCount: number;
}

export function ClassInfoBottomSheet({
  visible,
  onClose,
  classData,
  className,
  memberCount,
}: ClassInfoBottomSheetProps) {
  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return "Chưa có thông tin";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "Invalid Date")
      return "Chưa có thông tin";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Chưa có thông tin";
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getProgressStatus = (progress: any) => {
    if (!progress) return "Chưa có dữ liệu";

    const percentage = progress.progressPercentage || 0;
    if (percentage === 100) return "Hoàn thành";
    if (percentage > 0) return "Đang học";
    return "Chưa bắt đầu";
  };

  const getProgressColor = (progress: any) => {
    if (!progress) return colors.grayc;

    const percentage = progress.progressPercentage || 0;
    if (percentage === 100) return colors.success;
    if (percentage > 0) return colors.warning;
    return colors.grayc;
  };

  // Helper function to safely get nested values
  const getNestedValue = (
    obj: any,
    path: string,
    defaultValue: any = "Chưa có thông tin"
  ) => {
    if (!obj || !path) return defaultValue;

    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }

    // Handle special cases
    if (current === null || current === undefined) return defaultValue;
    if (typeof current === "number" && isNaN(current)) return defaultValue;
    if (typeof current === "string" && current.trim() === "")
      return defaultValue;

    return current;
  };

  // Extract the actual class data from the API response structure
  const actualClassData = React.useMemo(() => {
    if (!classData) return null;

    // If classData has a 'data' array, get the first item
    if (
      (classData as any).data &&
      Array.isArray((classData as any).data) &&
      (classData as any).data.length > 0
    ) {
      return (classData as any).data[0];
    }

    // If classData is already the class object, return it
    return classData;
  }, [classData]);

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
                <Text style={styles.className}>
                  {className || actualClassData?.name || "Lớp học"}
                </Text>
                <Text style={styles.courseTitle}>
                  {(() => {
                    let title = getNestedValue(actualClassData, "course.title");
                    if (title === "Chưa có thông tin" && actualClassData) {
                      title =
                        actualClassData.title || actualClassData.course?.title;
                    }
                    return title !== "Chưa có thông tin"
                      ? title
                      : "Khóa học bơi lội";
                  })()}
                </Text>
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
                  <Text style={styles.detailLabel}>Số buổi học</Text>
                  <Text style={styles.detailValue}>
                    {(() => {
                      let sessions = getNestedValue(
                        actualClassData,
                        "course.session_number",
                        0
                      );
                      if (sessions === "Chưa có thông tin" && actualClassData) {
                        sessions =
                          actualClassData.course?.session_number ||
                          actualClassData.session_number;
                      }
                      return `${sessions || 0} buổi`;
                    })()}
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
                  <Text style={styles.detailLabel}>Thời gian mỗi buổi</Text>
                  <Text style={styles.detailValue}>
                    {(() => {
                      let duration = getNestedValue(
                        actualClassData,
                        "course.session_number_duration"
                      );
                      if (duration === "Chưa có thông tin" && actualClassData) {
                        duration =
                          actualClassData.course?.session_number_duration ||
                          actualClassData.session_number_duration;
                      }
                      return duration !== "Chưa có thông tin"
                        ? duration
                        : "1 tiếng";
                    })()}
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
                  <Text style={styles.detailValue}>
                    {(() => {
                      let instructor = getNestedValue(
                        actualClassData,
                        "instructor.username"
                      );
                      if (
                        instructor === "Chưa có thông tin" &&
                        actualClassData
                      ) {
                        instructor =
                          actualClassData.instructor?.username ||
                          actualClassData.instructor;
                      }
                      return instructor !== "Chưa có thông tin"
                        ? instructor
                        : "Chưa có thông tin";
                    })()}
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
                  <Text style={styles.detailValue}>{memberCount} người</Text>
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
                    {(() => {
                      // Try nested path first
                      let price = getNestedValue(
                        actualClassData,
                        "course.price"
                      );

                      // If not found, try direct access (for malformed data)
                      if (price === "Chưa có thông tin" && actualClassData) {
                        price =
                          actualClassData.price ||
                          actualClassData.course?.price;
                      }

                      if (
                        price &&
                        price !== "Chưa có thông tin" &&
                        !isNaN(Number(price))
                      ) {
                        return formatPrice(Number(price));
                      }
                      return "Chưa có thông tin";
                    })()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Ngày tạo</Text>
                  <Text style={styles.detailValue}>
                    {(() => {
                      const date = getNestedValue(
                        actualClassData,
                        "created_at"
                      );
                      if (date && date !== "Chưa có thông tin") {
                        return formatDate(date);
                      }
                      return "Chưa có thông tin";
                    })()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Progress Card */}
          {actualClassData?.progress && (
            <View style={styles.progressCard}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="trending-up-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.sectionTitle}>Tiến độ học tập</Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Trạng thái:</Text>
                  <Text
                    style={[
                      styles.progressValue,
                      { color: getProgressColor(actualClassData.progress) },
                    ]}
                  >
                    {getProgressStatus(actualClassData.progress)}
                  </Text>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Tiến độ:</Text>
                  <Text style={styles.progressValue}>
                    {getNestedValue(
                      actualClassData,
                      "progress.progressPercentage",
                      0
                    )}
                    %
                  </Text>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Buổi đã học:</Text>
                  <Text style={styles.progressValue}>
                    {getNestedValue(
                      actualClassData,
                      "progress.daysAttended",
                      0
                    )}
                    /
                    {getNestedValue(
                      actualClassData,
                      "progress.totalSessions",
                      0
                    )}
                  </Text>
                </View>

                {getNestedValue(actualClassData, "progress.firstDate") && (
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>Ngày bắt đầu:</Text>
                    <Text style={styles.progressValue}>
                      {formatDate(
                        getNestedValue(actualClassData, "progress.firstDate")
                      )}
                    </Text>
                  </View>
                )}

                {getNestedValue(actualClassData, "progress.lastDate") && (
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>Ngày gần nhất:</Text>
                    <Text style={styles.progressValue}>
                      {formatDate(
                        getNestedValue(actualClassData, "progress.lastDate")
                      )}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Description Section */}
          <View style={styles.descriptionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>Mô tả khóa học</Text>
            </View>
            <Text style={styles.descriptionText}>
              {getNestedValue(
                actualClassData,
                "course.description",
                "Khóa học bơi lội được thiết kế để phát triển kỹ năng vận động và làm quen với nước. Học viên sẽ được hướng dẫn các kỹ thuật bơi cơ bản, an toàn dưới nước và cách thở đúng cách."
              )}
            </Text>
          </View>

          {/* Course Details */}
          <View style={styles.courseDetailsCard}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>Chi tiết khóa học</Text>
            </View>

            <View style={styles.courseDetailsList}>
              <View style={styles.courseDetailItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
                <Text style={styles.courseDetailText}>
                  Phù hợp cho mọi lứa tuổi
                </Text>
              </View>
              <View style={styles.courseDetailItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
                <Text style={styles.courseDetailText}>
                  Giáo viên có chứng chỉ chuyên nghiệp
                </Text>
              </View>
              <View style={styles.courseDetailItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
                <Text style={styles.courseDetailText}>
                  Thiết bị và cơ sở vật chất hiện đại
                </Text>
              </View>
              <View style={styles.courseDetailItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
                <Text style={styles.courseDetailText}>
                  Bảo hiểm tai nạn trong quá trình học
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
    color: colors.grayc,
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
    color: colors.grayc,
    fontWeight: "500",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
  },
  progressCard: {
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
  progressContainer: {
    padding: 20,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.grayc,
    fontWeight: "500",
  },
  progressValue: {
    fontSize: 14,
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
  courseDetailsCard: {
    backgroundColor: colors.white,
    margin: 15,
    marginTop: 0,
    marginBottom: 20,
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
    color: colors.grayc,
    lineHeight: 20,
    padding: 20,
  },
  courseDetailsList: {
    padding: 20,
  },
  courseDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  courseDetailText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
});
