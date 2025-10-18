import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { ScheduleItem, AttendanceData } from "@/src/types/schedule";
import { takeAttendance } from "@/src/services/learning_process/class/classService";
import { showErrorToast } from "@/src/utils/errorHandler";

interface ScheduleDetailModalProps {
  visible: boolean;
  onClose: () => void;
  schedule: ScheduleItem | null;
}

export function ScheduleDetailModal({
  visible,
  onClose,
  schedule,
}: ScheduleDetailModalProps) {
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!schedule) return null;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmitAttendance = async () => {
    if (Object.keys(attendanceData).length === 0) {
      Alert.alert("Thông báo", "Vui lòng điểm danh ít nhất một học viên");
      return;
    }

    setIsSubmitting(true);
    try {
      // Chỉ lấy các học viên có trạng thái "attended"
      const attendedStudentIds = Object.entries(attendanceData)
        .filter(([_, status]) => status === "attended")
        .map(([studentId, _]) => studentId);

      if (attendedStudentIds.length === 0) {
        Alert.alert("Thông báo", "Vui lòng chọn ít nhất một học viên có mặt");
        setIsSubmitting(false);
        return;
      }

      const payload: AttendanceData = {
        attendees: attendedStudentIds,
      };

      console.log("Attendance payload:", payload);
      console.log("Schedule ID:", schedule._id);

      await takeAttendance(schedule._id, payload);
      Alert.alert("Thành công", "Điểm danh thành công!");
      onClose();
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi điểm danh",
        message: "Có lỗi xảy ra khi điểm danh. Vui lòng thử lại.",
      });
      Alert.alert("Lỗi", "Có lỗi xảy ra khi điểm danh. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAttendanceStatus = (studentId: string) => {
    return attendanceData[studentId] || "pending";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dayNames = [
      "Chủ nhật",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
    ];
    return `${dayNames[date.getDay()]}, ${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
  };

  const getStatusColor = (status?: string) => {
    if (!status) return colors.primary;
    switch (status.toLowerCase()) {
      case "attended":
        return "#4CAF50";
      case "absent":
        return "#F44336";
      case "pending":
        return "#FF9800";
      default:
        return colors.primary;
    }
  };

  const getStatusText = (status?: string) => {
    if (!status) return "Chưa xác định";
    switch (status.toLowerCase()) {
      case "attended":
        return "Có mặt";
      case "absent":
        return "Vắng mặt";
      case "pending":
        return "Chờ xác nhận";
      default:
        return "Chưa xác định";
    }
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
          <Text style={styles.headerTitle}>Chi tiết buổi dạy</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Schedule Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={styles.timeContainer}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.timeText}>
                  {formatTime(schedule.slot.start_minute)} -{" "}
                  {formatTime(schedule.slot.end_minute)}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Đang dạy</Text>
              </View>
            </View>

            <Text style={styles.slotTitle}>{schedule.slot.title}</Text>
            <Text style={styles.dateText}>{formatDate(schedule.date)}</Text>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Lớp học</Text>
                  <Text style={styles.detailValue}>
                    {schedule.classroom.name}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Bể bơi</Text>
                  <Text style={styles.detailValue}>{schedule.pool.title}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="water-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Loại bể</Text>
                  <Text style={styles.detailValue}>{schedule.pool.type}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="resize-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Kích thước</Text>
                  <Text style={styles.detailValue}>
                    {schedule.pool.dimensions}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="speedometer-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Độ sâu</Text>
                  <Text style={styles.detailValue}>{schedule.pool.depth}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="people-circle-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Sức chứa</Text>
                  <Text style={styles.detailValue}>
                    {schedule.pool.capacity} người
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Attendees Section */}
          {schedule.attendees &&
            schedule.attendees.length > 0 &&
            schedule.classroom &&
            schedule.classroom.member && (
              <View style={styles.attendeesCard}>
                <View style={styles.attendeesHeader}>
                  <Ionicons name="people" size={20} color={colors.primary} />
                  <Text style={styles.attendeesTitle}>
                    Danh sách học viên ({schedule.attendees.length})
                  </Text>
                </View>

                {schedule.attendees.map((attendeeId, index) => {
                  // Find member details from classroom.member array
                  const member = schedule.classroom.member.find(
                    (m: any) => m._id === attendeeId
                  ) as any;

                  if (!member) return null;

                  return (
                    <View
                      key={attendeeId}
                      style={[
                        styles.attendeeRow,
                        index < schedule.attendees!.length - 1 &&
                          styles.attendeeDivider,
                      ]}
                    >
                      <View style={styles.attendeeInfo}>
                        {member.avatar ? (
                          <Image
                            source={{ uri: member.avatar }}
                            style={styles.avatar}
                          />
                        ) : (
                          <View style={styles.avatarPlaceholder}>
                            <Ionicons
                              name="person"
                              size={20}
                              color={colors.white}
                            />
                          </View>
                        )}
                        <View style={styles.attendeeDetails}>
                          <Text style={styles.attendeeName}>{member.name}</Text>
                          <Text style={styles.attendeeContact}>
                            {member.email}
                          </Text>
                          {member.phone && (
                            <Text style={styles.attendeeContact}>
                              {member.phone}
                            </Text>
                          )}
                        </View>
                      </View>
                      {/* Attendance Buttons */}
                      <View style={styles.attendanceButtons}>
                        <TouchableOpacity
                          style={[
                            styles.attendanceButton,
                            getAttendanceStatus(attendeeId) === "attended" &&
                              styles.attendedButton,
                          ]}
                          onPress={() =>
                            handleAttendanceChange(attendeeId, "attended")
                          }
                        >
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={
                              getAttendanceStatus(attendeeId) === "attended"
                                ? colors.white
                                : "#4CAF50"
                            }
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.attendanceButton,
                            getAttendanceStatus(attendeeId) === "absent" &&
                              styles.absentButton,
                          ]}
                          onPress={() =>
                            handleAttendanceChange(attendeeId, "absent")
                          }
                        >
                          <Ionicons
                            name="close"
                            size={16}
                            color={
                              getAttendanceStatus(attendeeId) === "absent"
                                ? colors.white
                                : "#F44336"
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitAttendance}
            disabled={isSubmitting}
          >
            <Ionicons name="checkmark-circle" size={20} color={colors.white} />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Đang xử lý..." : "Xác nhận điểm danh"}
            </Text>
          </TouchableOpacity>
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  statusBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1976D2",
  },
  slotTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 20,
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
  attendeesCard: {
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
  attendeesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  attendeesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  attendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  attendeeDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  attendeeInfo: {
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
  attendeeDetails: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  attendeeContact: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
  },
  attendeeStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  attendeeStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  attendanceButtons: {
    flexDirection: "row",
    gap: 8,
  },
  attendanceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  attendedButton: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  absentButton: {
    backgroundColor: "#F44336",
    borderColor: "#F44336",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
});
