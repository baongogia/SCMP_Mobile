import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { getInstructorScheduleDetail } from "@/src/services/learning_process/schedules/scheduleServices";
import { takeAttendance } from "@/src/services/learning_process/class/classService";
import {
  getNotes,
  createNote,
} from "@/src/services/learning_process/note/noteServices";
import { showErrorToast, showSuccessToast } from "@/src/utils/errorHandler";
import { SharedHeader } from "@/src/components/custom";
import { CreateNoteModal } from "@/src/components/modal/note/CreateNoteModal";
import { ScheduleItem, Student, RouteParams } from "./types";

export function StudentListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { scheduleId, schedule: routeSchedule } = route.params as RouteParams;

  const [schedule, setSchedule] = useState<ScheduleItem | null>(
    routeSchedule || null
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );
  const [evaluationCriteria, setEvaluationCriteria] = useState<any[]>([]);
  const [isCreatingEvaluation, setIsCreatingEvaluation] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [attendanceError, setAttendanceError] = useState<string>("");

  // Check if date is within 2 days range (2 days before to today)
  const isDateWithinRange = (dateString: string): boolean => {
    if (!dateString) return false;

    const scheduleDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    scheduleDate.setHours(0, 0, 0, 0);

    return scheduleDate >= twoDaysAgo && scheduleDate <= today;
  };

  useEffect(() => {
    fetchScheduleDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId]);

  const fetchScheduleDetail = async () => {
    if (!scheduleId) return;

    try {
      setLoading(true);
      const response = await getInstructorScheduleDetail(scheduleId);
      const detailArray = response.data?.data;
      const detail = Array.isArray(detailArray) ? detailArray[0] : detailArray;

      if (detail) {
        setSchedule(detail as ScheduleItem);

        // Check date validation
        if (detail.date) {
          if (!isDateWithinRange(detail.date)) {
            setAttendanceError(
              "Chỉ có thể điểm danh trong khoảng 2 ngày gần đây"
            );
          } else {
            setAttendanceError("");
          }
        }

        // Extract students
        if (
          detail.classroom?.member &&
          Array.isArray(detail.classroom.member)
        ) {
          setStudents(detail.classroom.member);
        }

        // Set initial attendance
        if (detail.attendees && Array.isArray(detail.attendees)) {
          const initialAttendance: Record<string, boolean> = {};
          detail.attendees.forEach((memberId: string) => {
            initialAttendance[memberId] = true;
          });
          setAttendance(initialAttendance);
        }

        // Fetch evaluation criteria
        const classId =
          typeof detail.classroom === "object" &&
          detail.classroom !== null &&
          "_id" in detail.classroom
            ? (detail.classroom as any)._id
            : detail.classroom;

        const courseId =
          typeof detail.classroom?.course === "object" &&
          detail.classroom?.course !== null &&
          "_id" in detail.classroom.course
            ? (detail.classroom.course as any)._id
            : detail.classroom?.course;

        if (classId && courseId) {
          try {
            const notesResponse = await getNotes(classId, courseId);
            const notesData = notesResponse.data?.data;

            if (Array.isArray(notesData) && notesData.length > 0) {
              // Dữ liệu có cấu trúc: [notes[], courseInfo, schedules[]]
              // Extract notes và courseInfo từ các item trong mảng
              let courseInfoData = null;
              let processedNotes: any[] = [];

              for (const item of notesData) {
                if (Array.isArray(item) && item.length > 0) {
                  // item[0] là notes array
                  const noteArray = item[0];
                  if (Array.isArray(noteArray)) {
                    processedNotes = noteArray.filter(
                      (note: any) => note && note._id
                    );
                  }

                  // item[1] là courseInfo
                  if (item.length > 1) {
                    const courseInfoItem = item[1];
                    if (courseInfoItem) {
                      const actualCourseInfo = Array.isArray(courseInfoItem)
                        ? courseInfoItem[0]
                        : courseInfoItem;
                      if (actualCourseInfo && actualCourseInfo._id) {
                        courseInfoData = actualCourseInfo;
                      }
                    }
                  }
                } else if (
                  item &&
                  !Array.isArray(item) &&
                  item._id &&
                  item.detail
                ) {
                  // Trường hợp courseInfo là object trực tiếp
                  courseInfoData = item;
                }
              }

              // Set notes để check đánh giá
              setNotes(processedNotes);

              if (courseInfoData) {
                // Extract evaluation criteria
                if (
                  courseInfoData?.detail &&
                  Array.isArray(courseInfoData.detail)
                ) {
                  const processedCriteria = courseInfoData.detail.map(
                    (item: any, index: number) => {
                      return {
                        _id: `criteria_${index}`,
                        title: item.title,
                        form_judge: item.form_judge,
                        evaluationFields: item.form_judge?.items
                          ? Object.keys(item.form_judge.items)
                          : [],
                      };
                    }
                  );
                  setEvaluationCriteria(processedCriteria);
                }
              }
            }
          } catch {
            // Error fetching evaluation criteria
          }
        }
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải chi tiết",
        message: "Không thể tải thông tin buổi học",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceToggle = (studentId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleSelectAll = () => {
    const newAttendance: Record<string, boolean> = {};
    students.forEach((student) => {
      newAttendance[student._id] = true;
    });
    setAttendance(newAttendance);
  };

  const handleDeselectAll = () => {
    setAttendance({});
  };

  const handleSaveAttendance = async () => {
    if (!scheduleId) return;

    // Clear previous error
    setAttendanceError("");

    // Check date validation
    if (!schedule?.date) {
      setAttendanceError("Không thể xác định ngày của lịch học");
      return;
    }

    if (!isDateWithinRange(schedule.date)) {
      setAttendanceError("Chỉ có thể điểm danh trong khoảng 2 ngày gần đây");
      return;
    }

    try {
      setSaving(true);
      const attendees = Object.keys(attendance).filter((id) => attendance[id]);

      const attendanceData = {
        attendees: attendees,
      };

      await takeAttendance(scheduleId, attendanceData);

      showSuccessToast("Điểm danh thành công!");
      Toast.show({
        type: "success",
        text1: "Điểm danh thành công!",
        text2: `Đã điểm danh ${attendees.length}/${students.length} học viên`,
        position: "top",
        visibilityTime: 3000,
      });

      // Refresh data
      await fetchScheduleDetail();
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi điểm danh",
        message: "Không thể lưu điểm danh",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEvaluateStudent = (studentId: string) => {
    // Check date validation
    if (!schedule?.date) {
      setAttendanceError("Không thể xác định ngày của lịch học");
      return;
    }

    if (!isDateWithinRange(schedule.date)) {
      setAttendanceError("Chỉ có thể đánh giá trong khoảng 2 ngày gần đây");
      return;
    }

    setSelectedStudentId(studentId);
    setShowEvaluationModal(true);
  };

  const handleEvaluationComplete = async (noteData: {
    note: string;
    mediaIds: string[];
    selectedStudentId: string;
    evaluationScores: Record<string, number | string | null>;
  }) => {
    if (!schedule || !selectedStudentId) return;

    try {
      setIsCreatingEvaluation(true);
      const classId =
        typeof schedule.classroom === "object" &&
        schedule.classroom !== null &&
        "_id" in schedule.classroom
          ? (schedule.classroom as any)._id
          : schedule.classroom;

      if (!classId) {
        showErrorToast(new Error("Không tìm thấy thông tin lớp học"), {
          title: "Lỗi",
          message: "Không thể tạo đánh giá",
        });
        return;
      }

      // Create note content with evaluation data
      let noteContent = noteData.note;
      if (Object.keys(noteData.evaluationScores).length > 0) {
        const evaluationData = {
          text: noteData.note,
          evaluation: noteData.evaluationScores,
          evaluationCriteria: evaluationCriteria,
        };
        noteContent = JSON.stringify(evaluationData);
      }

      const payload = {
        note: noteContent,
        member: noteData.selectedStudentId || "",
        schedule: scheduleId || "",
        media: noteData.mediaIds || [],
      };

      await createNote(classId, payload);

      showSuccessToast("Đánh giá học viên thành công!");
      setShowEvaluationModal(false);
      setSelectedStudentId(null);

      // Refresh data including notes to show "Đã đánh giá"
      await fetchScheduleDetail();
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tạo đánh giá",
        message: "Không thể lưu đánh giá học viên",
      });
    } finally {
      setIsCreatingEvaluation(false);
    }
  };

  const getClassName = (classroom?: ScheduleItem["classroom"]) => {
    if (!classroom) return "Lớp học";
    if (typeof classroom.name === "string") return classroom.name;
    if (typeof classroom.name === "object" && classroom.name?.name)
      return classroom.name.name;
    return "Lớp học";
  };

  const getCourseName = (classroom?: ScheduleItem["classroom"]) => {
    if (!classroom) return "Khóa học";
    if (typeof classroom.course === "string") return classroom.course;
    if (typeof classroom.course === "object" && classroom.course) {
      return (
        (classroom.course as any).title ||
        (classroom.course as any).name ||
        "Khóa học"
      );
    }
    return "Khóa học";
  };

  const formatTime = (hour: number, minute: number) => {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )}`;
  };

  const getAttendanceStats = () => {
    const total = students.length;
    const present = Object.values(attendance).filter(Boolean).length;
    return { total, present, absent: total - present };
  };

  // Check if student has evaluation/note for this schedule
  const hasEvaluation = (studentId: string) => {
    if (!scheduleId) return false;
    return notes.some(
      (note) =>
        note.member?._id === studentId && note.schedule?._id === scheduleId
    );
  };

  // Navigate to NoteScreen
  const handleNavigateToNotes = () => {
    if (!schedule) return;

    const classId =
      typeof schedule.classroom === "object" &&
      schedule.classroom !== null &&
      "_id" in schedule.classroom
        ? (schedule.classroom as any)._id
        : schedule.classroom;

    const courseId =
      typeof schedule.classroom?.course === "object" &&
      schedule.classroom?.course !== null &&
      "_id" in schedule.classroom.course
        ? (schedule.classroom.course as any)._id
        : schedule.classroom?.course;

    if (!classId || !courseId) return;

    (navigation as any).navigate("Note", {
      class_id: classId,
      course_id: courseId,
      class_name: getClassName(schedule.classroom),
      course_title: getCourseName(schedule.classroom),
      schedule_id: scheduleId,
    });
  };

  const stats = getAttendanceStats();
  const allSelected = students.length > 0 && stats.present === stats.total;
  const canEvaluate = schedule?.date ? isDateWithinRange(schedule.date) : false;

  if (loading) {
    return (
      <View style={styles.container}>
        <SharedHeader
          title="Danh sách học viên"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách học viên...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SharedHeader
        title="Danh sách học viên"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Schedule Info Header */}
        {schedule && (
          <View style={styles.scheduleInfoCard}>
            <View style={styles.scheduleInfoHeader}>
              <View style={styles.scheduleInfoIcon}>
                <Ionicons name="calendar" size={24} color={colors.white} />
              </View>
              <View style={styles.scheduleInfoContent}>
                <Text style={styles.scheduleInfoTitle}>
                  {getClassName(schedule.classroom)}
                </Text>
                <Text style={styles.scheduleInfoSubtitle}>
                  {getCourseName(schedule.classroom)}
                </Text>
                {schedule.slot && (
                  <Text style={styles.scheduleInfoTime}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={colors.textSecondary}
                    />{" "}
                    {formatTime(
                      schedule.slot.start_time || 0,
                      schedule.slot.start_minute || 0
                    )}
                    {schedule.slot.end_time &&
                      schedule.slot.end_minute &&
                      ` - ${formatTime(
                        schedule.slot.end_time,
                        schedule.slot.end_minute
                      )}`}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.notesButtonHeader}
                onPress={handleNavigateToNotes}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Attendance Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Tổng số</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={[styles.statItem, styles.statItemDivider]}>
            <Text style={styles.statLabel}>Có mặt</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {stats.present}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Vắng mặt</Text>
            <Text style={[styles.statValue, { color: colors.error }]}>
              {stats.absent}
            </Text>
          </View>
        </View>

        {/* Students List */}
        <View style={styles.studentsList}>
          <Text style={styles.sectionTitle}>Danh sách học viên</Text>
          {students.map((student, index) => {
            const studentId = student._id;
            const studentName =
              student.username || student.name || `Học viên ${index + 1}`;
            const studentEmail = student.email || "";
            const avatarUrl = student.featured_image?.[0]?.path;
            const isPresent = attendance[studentId] || false;

            return (
              <View key={studentId} style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => handleAttendanceToggle(studentId)}
                  >
                    {isPresent ? (
                      <View style={styles.checkboxChecked}>
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={colors.white}
                        />
                      </View>
                    ) : (
                      <View style={styles.checkboxUnchecked} />
                    )}
                  </TouchableOpacity>
                  <View style={styles.studentAvatarContainer}>
                    {avatarUrl ? (
                      <Image
                        source={{ uri: avatarUrl }}
                        style={styles.studentAvatar}
                      />
                    ) : (
                      <View style={styles.studentAvatarPlaceholder}>
                        <Ionicons
                          name="person"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.studentTextInfo}>
                    <Text style={styles.studentName}>{studentName}</Text>
                    {studentEmail && (
                      <Text style={styles.studentEmail}>{studentEmail}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.studentActions}>
                  {hasEvaluation(studentId) ? (
                    <View style={styles.evaluatedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={colors.success}
                      />
                      <Text style={styles.evaluatedText}>Đã đánh giá</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.evaluateButton,
                        !canEvaluate && styles.evaluateButtonDisabled,
                      ]}
                      onPress={() => handleEvaluateStudent(studentId)}
                      disabled={!canEvaluate}
                    >
                      <Ionicons
                        name="star"
                        size={18}
                        color={canEvaluate ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.evaluateButtonText,
                          !canEvaluate && styles.evaluateButtonTextDisabled,
                        ]}
                      >
                        Đánh giá
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Action Bar */}
      <SafeAreaView edges={["bottom"]} style={styles.actionBar}>
        <View style={styles.actionBarContent}>
          {attendanceError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{attendanceError}</Text>
            </View>
          ) : null}
          <View style={styles.actionBarButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={allSelected ? handleDeselectAll : handleSelectAll}
            >
              <Ionicons
                name={allSelected ? "square-outline" : "checkbox"}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.actionButtonText}>
                {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.saveButton,
                attendanceError && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveAttendance}
              disabled={saving || !!attendanceError}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.white}
                  />
                  <Text style={styles.saveButtonText}>
                    Lưu điểm danh ({stats.present})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Evaluation Modal */}
      {showEvaluationModal && selectedStudentId && (
        <CreateNoteModal
          visible={showEvaluationModal}
          onClose={() => {
            setShowEvaluationModal(false);
            setSelectedStudentId(null);
          }}
          onCreateNote={handleEvaluationComplete}
          isCreating={isCreatingEvaluation}
          schedule_id={scheduleId || ""}
          students={students}
          evaluationCriteria={evaluationCriteria}
          initialSelectedStudentId={selectedStudentId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  scheduleInfoCard: {
    backgroundColor: colors.primary,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    position: "relative",
  },
  scheduleInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  scheduleInfoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  scheduleInfoContent: {
    flex: 1,
  },
  scheduleInfoTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 4,
  },
  scheduleInfoSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
  },
  scheduleInfoTime: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statItemDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  studentsList: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxUnchecked: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray[400],
  },
  studentAvatarContainer: {
    marginRight: 12,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  studentAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[200],
    alignItems: "center",
    justifyContent: "center",
  },
  studentTextInfo: {
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
    gap: 8,
  },
  evaluateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.lightPrimary,
    gap: 6,
  },
  evaluateButtonDisabled: {
    backgroundColor: colors.gray[200],
    opacity: 0.6,
  },
  evaluateButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  evaluateButtonTextDisabled: {
    color: colors.textSecondary,
  },
  evaluatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.success + "15",
    gap: 6,
  },
  evaluatedText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.success,
  },
  notesButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.lightPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  actionBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
    fontWeight: "500",
  },
  notesButtonHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  actionBarButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    gap: 8,
  },
  saveButton: {
    flex: 1.5,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray[300],
    borderColor: colors.gray[300],
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
});
