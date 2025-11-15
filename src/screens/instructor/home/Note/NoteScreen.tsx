import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  Image,
  Dimensions,
} from "react-native";
// Use centralized toast helpers (wired to CustomToast via global config)
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { SharedHeader } from "@/src/components/custom";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from "@/src/services/learning_process/note/noteServices";
import { showErrorToast, showSuccessToast } from "@/src/utils/errorHandler";
import { styles } from "./style";
import { CreateNoteModal } from "@/src/components/modal/note/CreateNoteModal";
import { EditNoteModal } from "@/src/components/modal/note/EditNoteModal";
import { EvaluationModal } from "@/src/components/modal/note/EvaluationModal";
import { DeleteNoteModal } from "@/src/components/modal/note/DeleteNoteModal";
import { Note, ScheduleItem, RouteParams } from "./types";
// Import các component modal đã có

export function NoteScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    class_id,
    course_id,
    class_name,
    course_title,
    schedule_id,
    selectedStudentId: routeSelectedStudentId,
  } = route.params as RouteParams;
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImages, setPreviewImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null
  );
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [evaluationCriteria, setEvaluationCriteria] = useState<any[]>([]);

  // Refs/positions for auto-scrolling session tabs
  const sessionTabsScrollRef = useRef<ScrollView | null>(null);
  const [sessionTabLayouts, setSessionTabLayouts] = useState<
    Record<string, { x: number; width: number }>
  >({});
  const windowWidth = Dimensions.get("window").width;

  // State for evaluation detail modal
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [selectedEvaluationData, setSelectedEvaluationData] = useState<{
    text: string;
    evaluation: Record<string, number>;
    evaluationCriteria: any[];
  } | null>(null);

  // Debug logs
  useEffect(() => {
    console.log("Debug - courseInfo:", courseInfo);
    console.log("Debug - evaluationCriteria:", evaluationCriteria);
  }, [courseInfo, evaluationCriteria]);

  // Helper function để parse note content
  const parseNoteContent = (noteContent: string) => {
    try {
      const parsed = JSON.parse(noteContent);
      if (parsed.text && parsed.evaluation) {
        return {
          text: parsed.text,
          evaluation: parsed.evaluation,
          evaluationCriteria: parsed.evaluationCriteria || [],
          isEvaluated: true,
        };
      }
    } catch {
      // Nếu không parse được thì dùng trực tiếp
    }
    return {
      text: noteContent,
      evaluation: null,
      evaluationCriteria: [],
      isEvaluated: false,
    };
  };

  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(
    new Set()
  );

  const getSlotLabel = (slot: any) => {
    if (!slot) return "";
    if (typeof slot === "string") return slot;
    const pad = (n: number) => String(n ?? 0).padStart(2, "0");
    const start = `${pad(slot.start_time)}:${pad(slot.start_minute)}`;
    const end = `${pad(slot.end_time)}:${pad(slot.end_minute)}`;
    return slot.title
      ? `${slot.title} (${start} - ${end})`
      : `${start} - ${end}`;
  };

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching notes with:", { class_id, course_id });
      const response = await getNotes(class_id, course_id);
      console.log("Notes API response:", response.data);
      console.log("Notes data:", response.data?.data);

      // Xử lý dữ liệu để đảm bảo có cấu trúc đúng
      let notesData: Note[] = [];
      let schedulesData: ScheduleItem[] = [];
      if (response.data?.data) {
        console.log("response.data.data:", response.data.data);

        if (Array.isArray(response.data.data)) {
          console.log(
            "response.data.data is array, length:",
            response.data.data.length
          );

          // Dữ liệu có cấu trúc: [notes[], courseInfo, schedules[]]
          const scheduleCollector: Record<string, ScheduleItem> = {};

          notesData = response.data.data
            .flatMap((item: any, index: number) => {
              console.log(`Processing item ${index}:`, item);

              if (Array.isArray(item) && item.length > 0) {
                const noteArray = item[0];
                const courseInfoData = item[1];
                const schedulesArray = item[2];

                // Lưu courseInfo để sử dụng cho các tiêu chí đánh giá
                if (courseInfoData) {
                  console.log("CourseInfo data found:", courseInfoData);

                  // courseInfoData có thể là mảng hoặc object
                  const actualCourseInfo = Array.isArray(courseInfoData)
                    ? courseInfoData[0]
                    : courseInfoData;
                  console.log("Actual courseInfo:", actualCourseInfo);
                  console.log("CourseInfo detail:", actualCourseInfo?.detail);

                  setCourseInfo(actualCourseInfo);

                  // Trích xuất các tiêu chí đánh giá từ courseInfo.detail
                  if (
                    actualCourseInfo?.detail &&
                    Array.isArray(actualCourseInfo.detail)
                  ) {
                    // Xử lý dữ liệu đánh giá từ form_judge.items thay vì detail.title
                    const processedCriteria = actualCourseInfo.detail.map(
                      (item: any, index: number) => {
                        const criteria = {
                          _id: `criteria_${index}`,
                          title: item.title,
                          form_judge: item.form_judge,
                          // Trích xuất các trường đánh giá từ form_judge.items
                          evaluationFields: item.form_judge?.items
                            ? Object.keys(item.form_judge.items)
                            : [],
                        };
                        return criteria;
                      }
                    );

                    setEvaluationCriteria(processedCriteria);
                    console.log(
                      "Evaluation criteria loaded:",
                      processedCriteria
                    );
                  } else {
                    console.log(
                      "No evaluation criteria found in courseInfo.detail"
                    );
                  }
                }

                // Thu thập danh sách buổi học từ item[2]
                if (Array.isArray(schedulesArray)) {
                  schedulesArray.forEach((s: any) => {
                    if (s && s._id && !scheduleCollector[s._id]) {
                      scheduleCollector[s._id] = {
                        _id: s._id,
                        date: s.date,
                        slot: s.slot,
                        classroom: s.classroom,
                        instructor: s.instructor,
                      };
                    }
                  });
                } else if (schedulesArray && schedulesArray._id) {
                  const s = schedulesArray;
                  if (!scheduleCollector[s._id]) {
                    scheduleCollector[s._id] = {
                      _id: s._id,
                      date: s.date,
                      slot: s.slot,
                      classroom: s.classroom,
                      instructor: s.instructor,
                    };
                  }
                }

                console.log(`Note array for item ${index}:`, noteArray);
                if (Array.isArray(noteArray) && noteArray.length > 0) {
                  console.log(`All notes for item ${index}:`, noteArray);
                  return noteArray;
                }
              }
              return [];
            })
            .filter((note: any) => note && note._id); // Lọc ra các note hợp lệ

          schedulesData = Object.values(scheduleCollector);

          console.log("Final processed notes:", notesData);
        } else if (
          // Trường hợp API trả về object có notes và schedules
          response.data?.data?.notes ||
          response.data?.data?.schedules
        ) {
          if (Array.isArray(response.data.data.notes)) {
            notesData = response.data.data.notes;
          }
          if (Array.isArray(response.data.data.schedules)) {
            schedulesData = response.data.data.schedules;
          }
        } else if (
          response.data.data.data &&
          Array.isArray(response.data.data.data)
        ) {
          notesData = response.data.data.data;
        }

        // Nếu không tìm thấy schedules theo các key trên, thử suy luận từ mảng có field date/slot/classroom
        if (schedulesData.length === 0) {
          const maybeArray =
            response.data.data?.schedules ||
            response.data.data?.class_schedules ||
            response.data.data?.sessions;
          if (Array.isArray(maybeArray)) {
            schedulesData = maybeArray as ScheduleItem[];
          }
        }
      }

      console.log("Processed notes data:", notesData);

      // Debug log để kiểm tra cấu trúc member data
      if (notesData.length > 0) {
        console.log("🔍 Sample note member structure:", {
          firstNote: notesData[0],
          member: notesData[0]?.member,
          featured_image: notesData[0]?.member?.featured_image,
          path: notesData[0]?.member?.featured_image?.[0]?.path,
        });
      }

      if (Array.isArray(schedulesData)) {
        console.log("Processed schedules data:", schedulesData);

        // Filter schedules to last 1 month if schedule_id is not provided
        let filteredSchedules = schedulesData;
        let filteredNotes = notesData;

        if (!schedule_id) {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

          filteredSchedules = schedulesData.filter((schedule) => {
            if (!schedule.date) return false;
            const scheduleDate = new Date(schedule.date);
            return scheduleDate >= oneMonthAgo;
          });

          // Also filter notes to only show those from filtered schedules
          const filteredScheduleIds = new Set(
            filteredSchedules.map((s) => s._id)
          );
          filteredNotes = notesData.filter((note) => {
            if (!note.schedule?._id) return false;
            return filteredScheduleIds.has(note.schedule._id);
          });
        }

        setNotes(filteredNotes);
        setSchedules(filteredSchedules);
        // thiết lập buổi học đang chọn từ route param hoặc buổi đầu tiên
        if (!selectedScheduleId) {
          const defaultId =
            (route.params as any)?.schedule_id || filteredSchedules[0]?._id;
          if (defaultId) setSelectedScheduleId(defaultId);
        }
      } else {
        setNotes(notesData);
      }
    } catch (error) {
      console.log("Error fetching notes:", error);
      showErrorToast(error, {
        title: "Lỗi tải ghi chú",
        message: "Không thể tải danh sách ghi chú. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  }, [class_id, course_id, selectedScheduleId, schedule_id, route.params]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotes();
    setRefreshing(false);
  };

  // Auto-scroll to the focused tab when selection changes
  useEffect(() => {
    if (!selectedScheduleId) return;
    const target = sessionTabLayouts[selectedScheduleId];
    if (!target) return;

    // Try to center the selected tab within the horizontal list
    try {
      const centerOffset = Math.max(
        target.x - windowWidth / 2 + target.width / 2,
        0
      );
      sessionTabsScrollRef.current?.scrollTo({
        x: centerOffset,
        animated: true,
        // animated: false,
      });
    } catch {}
  }, [selectedScheduleId, sessionTabLayouts, windowWidth]);

  const fetchStudents = useCallback(async () => {
    if (!schedule_id) return;

    try {
      console.log("Fetching students for schedule:", schedule_id);

      // Gọi API để lấy chi tiết schedule và học viên
      const { getInstructorScheduleDetail } = await import(
        "@/src/services/learning_process/schedules/scheduleServices"
      );
      const response = await getInstructorScheduleDetail(schedule_id);
      const detailArray = response.data?.data;

      // API returns an array, get the first item
      const detail = Array.isArray(detailArray) ? detailArray[0] : detailArray;

      if (
        detail &&
        detail.classroom?.member &&
        Array.isArray(detail.classroom.member)
      ) {
        const studentsData = detail.classroom.member.map((member: any) => ({
          _id: member._id,
          name: member.name || member.username || `Học viên ${member._id}`,
          email: member.email || "",
        }));

        setStudents(studentsData);
        console.log("Students loaded from API:", studentsData);
      } else {
        console.log("No students found in schedule detail");
        setStudents([]);
      }
    } catch (error) {
      console.log("Error fetching students:", error);
      setStudents([]);
    }
  }, [schedule_id]);

  const handleCreateNote = async (noteData: {
    note: string;
    mediaIds: string[];
    selectedStudentId: string;
    evaluationScores: Record<string, number | null>;
  }) => {
    const {
      note: noteText,
      mediaIds,
      selectedStudentId,
      evaluationScores,
    } = noteData;

    if (!noteText.trim()) {
      showErrorToast("Vui lòng nhập nội dung ghi chú", {
        title: "Thiếu thông tin",
        message: "Nội dung ghi chú không được để trống.",
      });
      return;
    }

    // Kiểm tra duplicate note theo buổi đang focus
    const effectiveScheduleId = selectedScheduleId || schedule_id;
    if (selectedStudentId && effectiveScheduleId) {
      const existingNote = notes.find(
        (note) =>
          note.member?._id === selectedStudentId &&
          note.schedule?._id === effectiveScheduleId
      );

      if (existingNote) {
        showErrorToast(null, {
          title: "Lỗi tạo ghi chú",
          message: "Đã có ghi chú cho học viên này trong buổi học này rồi!",
        });
        return;
      }
    }

    setIsCreating(true);
    try {
      console.log("Creating note with class_id:", class_id);
      console.log("Note content:", noteText);

      // Tạo note content kết hợp text và evaluation data
      let noteContent = noteText;
      if (selectedStudentId && Object.keys(evaluationScores).length > 0) {
        const evaluationData = {
          text: noteText,
          evaluation: evaluationScores,
          evaluationCriteria: evaluationCriteria,
        };
        noteContent = JSON.stringify(evaluationData);
      }

      const payload = {
        note: noteContent,
        member: selectedStudentId || "", // ID của học viên được chọn (để trống nếu không chọn)
        schedule: effectiveScheduleId || "", // ID buổi học theo tab đang chọn
        media: mediaIds, // Array các ID media đã upload
      };

      console.log("📝 Creating note with class_id:", class_id);
      console.log("📄 Note content:", noteText);
      console.log("👤 Selected student ID:", selectedStudentId);
      console.log("📅 Schedule ID (effective):", effectiveScheduleId);
      console.log("🆔 Media IDs in payload:", mediaIds);
      console.log("📦 Full payload:", payload);

      const response = await createNote(class_id, payload);
      console.log("✅ Create note response:", response.data);
      console.log("📊 Response status:", response.status);
      console.log("📋 Response headers:", response.headers);

      setShowCreateModal(false); // Close modal after creation
      await fetchNotes();
      showSuccessToast("Tạo ghi chú thành công!");
    } catch (error) {
      console.log("Error creating note:", error);
      showErrorToast(error, {
        title: "Lỗi tạo ghi chú",
        message: "Không thể tạo ghi chú. Vui lòng thử lại.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowEditModal(true);
  };

  const handleUpdateNote = async (noteData: {
    note: string;
    editUploadedMedia: any[];
    editSelectedStudentId: string;
    editEvaluationScores: Record<string, number | null>;
  }) => {
    const {
      note: noteText,
      editUploadedMedia,
      editSelectedStudentId,
      editEvaluationScores,
    } = noteData;

    if (!noteText.trim()) {
      showErrorToast("Vui lòng nhập nội dung ghi chú", {
        title: "Thiếu thông tin",
        message: "Nội dung ghi chú không được để trống.",
      });
      return;
    }

    if (!editingNote) return;

    setIsUpdating(true);
    try {
      // Tạo note content kết hợp text và evaluation data
      let noteContent = noteText;
      if (
        editSelectedStudentId &&
        Object.keys(editEvaluationScores).length > 0
      ) {
        const evaluationData = {
          text: noteText,
          evaluation: editEvaluationScores,
          evaluationCriteria: evaluationCriteria,
        };
        noteContent = JSON.stringify(evaluationData);
      }

      // Lấy media IDs từ editUploadedMedia
      const mediaIds = editUploadedMedia.map(
        (media: any) => media._id || media.id
      );

      const payload = {
        note: noteContent,
        media: mediaIds, // Use edit media IDs
        member: editSelectedStudentId || "", // ID của học viên được chọn
      };

      console.log("📝 Updating note:", editingNote._id);
      console.log("📄 New content:", noteText);
      console.log("🆔 Edit media IDs:", mediaIds);
      console.log("📦 Full payload:", payload);

      const response = await updateNote(class_id, editingNote._id, payload);
      console.log("✅ Update note response:", response.data);

      setEditingNote(null);
      setShowEditModal(false);
      await fetchNotes();
      showSuccessToast("Cập nhật ghi chú thành công!");
    } catch (error: any) {
      console.log("❌ Error updating note:", error);
      console.log("❌ Error details:", JSON.stringify(error, null, 2));
      console.log("❌ Error response:", error.response?.data);
      console.log("❌ Error status:", error.response?.status);
      showErrorToast(error, {
        title: "Lỗi cập nhật ghi chú",
        message: `Không thể cập nhật ghi chú. Lỗi: ${
          error.response?.data?.message || error.message || "Unknown error"
        }`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteNoteClick = (note: Note) => {
    setNoteToDelete(note);
    setShowDeleteModal(true);
  };

  const handleViewEvaluation = (note: Note) => {
    const parsed = parseNoteContent(note.note);
    if (parsed.isEvaluated) {
      setSelectedEvaluationData(parsed);
      setShowEvaluationModal(true);
    }
  };

  const handleImagePress = (images: any[], index: number) => {
    setPreviewImages(images);
    setCurrentImageIndex(index);
    setShowImagePreview(true);
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    try {
      console.log("🗑️ Deleting note:", noteToDelete._id);
      console.log("📋 Note data:", noteToDelete);

      const response = await deleteNote(class_id, noteToDelete._id);
      console.log("✅ Delete note response:", response);
      console.log("📊 Response status:", response.status);
      console.log("📋 Response data:", response.data);

      setShowDeleteModal(false);
      setNoteToDelete(null);
      await fetchNotes();
      showSuccessToast("Xóa ghi chú thành công!");
    } catch (error: any) {
      console.log("❌ Error deleting note:", error);
      console.log("❌ Error details:", JSON.stringify(error, null, 2));
      console.log("❌ Error response:", error.response?.data);
      console.log("❌ Error status:", error.response?.status);
      showErrorToast(error, {
        title: "Lỗi xóa ghi chú",
        message: `Không thể xóa ghi chú. Lỗi: ${
          error.response?.data?.message || error.message || "Unknown error"
        }`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchStudents();
  }, [class_id, course_id, fetchNotes, fetchStudents]);

  // Auto-open create modal when selectedStudentId is provided in route params
  useEffect(() => {
    if (routeSelectedStudentId && students.length > 0 && !loading) {
      // Wait a bit for the screen to fully mount
      const timer = setTimeout(() => {
        setShowCreateModal(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [routeSelectedStudentId, students.length, loading]);

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Chưa xác định";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Chưa xác định";

      // Nếu chuỗi có hậu tố 'Z' (UTC), hiển thị đúng theo UTC (tránh lệch +7h)
      const isUTC = /Z$/i.test(dateString);
      const pad = (n: number) => String(n).padStart(2, "0");

      const dd = pad(isUTC ? date.getUTCDate() : date.getDate());
      const mm = pad((isUTC ? date.getUTCMonth() : date.getMonth()) + 1);
      const yyyy = (
        isUTC ? date.getUTCFullYear() : date.getFullYear()
      ).toString();
      const hh = pad(isUTC ? date.getUTCHours() : date.getHours());
      const min = pad(isUTC ? date.getUTCMinutes() : date.getMinutes());

      return `${hh}:${min} ${dd}/${mm}/${yyyy}`;
    } catch (error) {
      console.log("Error formatting date:", error, dateString);
      return "Chưa xác định";
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <SharedHeader
        title="Ghi chú lớp học"
        bottomCurveColor="#ffffff"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Class Info */}
        <View style={styles.classInfoCard}>
          <View style={styles.classInfoHeader}>
            <Ionicons name="school-outline" size={24} color={colors.primary} />
            <View style={styles.classInfoText}>
              <Text style={styles.className}>{class_name || "Lớp học"}</Text>
              <Text style={styles.courseTitle}>
                {course_title || "Khóa học"}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes List */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>
            Danh sách ghi chú ({notes.length})
          </Text>

          {schedules.length > 0 ? (
            <>
              {/* Tabs chọn buổi học */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.sessionTabs}
                contentContainerStyle={styles.sessionTabsContent}
                ref={sessionTabsScrollRef}
              >
                {schedules.map((session) => {
                  const isActive = selectedScheduleId === session._id;
                  const count = notes.filter(
                    (n) => n.schedule?._id === session._id
                  ).length;
                  return (
                    <TouchableOpacity
                      key={`tab-${session._id}`}
                      onPress={() => setSelectedScheduleId(session._id)}
                      style={[
                        styles.sessionTab,
                        isActive && styles.sessionTabActive,
                      ]}
                      onLayout={(e) => {
                        const { x, width } = e.nativeEvent.layout;
                        setSessionTabLayouts((prev) => ({
                          ...prev,
                          [session._id]: { x, width },
                        }));
                      }}
                    >
                      <Ionicons
                        name="calendar"
                        size={14}
                        color={isActive ? colors.white : colors.primary}
                        style={styles.sessionTabIcon}
                      />
                      <Text
                        style={[
                          styles.sessionTabText,
                          isActive && styles.sessionTabTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {formatDate(session.date)}
                      </Text>
                      <View
                        style={[
                          styles.sessionTabBadge,
                          isActive && styles.sessionTabBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.sessionTabBadgeText,
                            isActive && styles.sessionTabBadgeTextActive,
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {schedules
                .filter(
                  (s) => !selectedScheduleId || s._id === selectedScheduleId
                )
                .map((session) => {
                  const notesOfSession = notes.filter(
                    (n) => n.schedule?._id === session._id
                  );
                  return (
                    <View
                      key={`session-${session._id}`}
                      style={styles.noteCard}
                    >
                      <View style={styles.sessionHeaderCard}>
                        <Ionicons
                          name="calendar"
                          size={22}
                          color={colors.primary}
                          style={{ marginRight: 10 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sessionHeaderTitle}>
                            Buổi học: {formatDate(session.date)}
                          </Text>
                          {session.slot && (
                            <Text style={styles.sessionHeaderSub}>
                              Ca: {getSlotLabel(session.slot)}
                            </Text>
                          )}
                        </View>
                      </View>

                      {loading ? (
                        <Text style={styles.emptySubtext}>
                          Đang tải ghi chú...
                        </Text>
                      ) : notesOfSession.length === 0 ? (
                        <Text style={styles.emptySubtext}>
                          Chưa có ghi chú cho buổi này
                        </Text>
                      ) : (
                        notesOfSession.map((note, index) => {
                          return (
                            <View
                              key={note._id || `note-${index}`}
                              style={{ marginTop: 8 }}
                            >
                              <View style={styles.noteHeader}>
                                <View style={styles.noteHeaderLeft}>
                                  <View style={styles.noteAvatar}>
                                    {(() => {
                                      const avatarPath =
                                        note.member?.featured_image?.[0]?.path;
                                      return avatarPath ? (
                                        <Image
                                          source={{ uri: avatarPath }}
                                          style={styles.noteAvatarImage}
                                        />
                                      ) : (
                                        <Ionicons
                                          name="person"
                                          size={20}
                                          color={colors.gray[500]}
                                        />
                                      );
                                    })()}
                                  </View>
                                  <View style={styles.noteMemberInfo}>
                                    <Text style={styles.noteMemberName}>
                                      {note.member?.name ||
                                        note.member?.username ||
                                        "Học viên"}
                                    </Text>
                                    <Text style={styles.noteDate}>
                                      {formatDate(note.created_at)}
                                    </Text>
                                  </View>
                                </View>

                                <View style={styles.noteActions}>
                                  {/* Evaluation Info Button */}
                                  {parseNoteContent(note.note).isEvaluated && (
                                    <TouchableOpacity
                                      style={styles.noteActionButton}
                                      onPress={() => handleViewEvaluation(note)}
                                    >
                                      <Ionicons
                                        name="information-circle-outline"
                                        size={18}
                                        color={colors.primary}
                                      />
                                    </TouchableOpacity>
                                  )}

                                  <TouchableOpacity
                                    style={styles.noteActionButton}
                                    onPress={() => handleEditNote(note)}
                                  >
                                    <Ionicons
                                      name="create-outline"
                                      size={18}
                                      color={colors.primary}
                                    />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.noteActionButton}
                                    onPress={() => handleDeleteNoteClick(note)}
                                    disabled={isDeleting}
                                  >
                                    <Ionicons
                                      name="trash-outline"
                                      size={18}
                                      color={colors.error}
                                    />
                                  </TouchableOpacity>
                                </View>
                              </View>

                              <View style={styles.noteContentContainer}>
                                <Text style={styles.noteContent}>
                                  {parseNoteContent(note.note).text ||
                                    "Nội dung ghi chú"}
                                </Text>
                              </View>

                              {note.media && note.media.length > 0 && (
                                <View style={styles.mediaGrid}>
                                  {note.media
                                    .slice(0, 3)
                                    .map((media: any, mediaIndex: number) => (
                                      <TouchableOpacity
                                        key={mediaIndex}
                                        onPress={() =>
                                          handleImagePress(
                                            note.media || [],
                                            mediaIndex
                                          )
                                        }
                                        style={styles.mediaThumbnailContainer}
                                      >
                                        {imageLoadErrors.has(media.path) ? (
                                          <View style={styles.mediaFallback}>
                                            <Ionicons
                                              name="image-outline"
                                              size={24}
                                              color={colors.gray[500]}
                                            />
                                            <Text
                                              style={styles.mediaFallbackText}
                                            >
                                              {media.title || "Media"}
                                            </Text>
                                          </View>
                                        ) : (
                                          <View
                                            style={styles.mediaDebugContainer}
                                          >
                                            <Image
                                              source={{
                                                uri: media.path,
                                                cache: "reload",
                                              }}
                                              style={styles.mediaThumbnail}
                                              resizeMode="cover"
                                              onError={() =>
                                                setImageLoadErrors(
                                                  (prev) =>
                                                    new Set([
                                                      ...prev,
                                                      media.path,
                                                    ])
                                                )
                                              }
                                            />
                                            <Text style={styles.mediaDebugText}>
                                              IMG
                                            </Text>
                                          </View>
                                        )}
                                      </TouchableOpacity>
                                    ))}
                                  {note.media.length > 3 && (
                                    <TouchableOpacity
                                      style={styles.moreMediaIndicator}
                                      onPress={() =>
                                        handleImagePress(note.media || [], 3)
                                      }
                                    >
                                      <Text style={styles.moreMediaText}>
                                        +{note.media.length - 3}
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              )}

                              {note.updated_at !== note.created_at && (
                                <Text style={styles.noteUpdated}>
                                  Cập nhật: {formatDate(note.updated_at)}
                                </Text>
                              )}
                            </View>
                          );
                        })
                      )}
                    </View>
                  );
                })}
            </>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Đang tải ghi chú...</Text>
            </View>
          ) : notes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={colors.gray[500]}
              />
              <Text style={styles.emptyText}>Chưa có ghi chú nào</Text>
              <Text style={styles.emptySubtext}>
                Tạo ghi chú đầu tiên cho lớp học này
              </Text>
            </View>
          ) : (
            notes.map((note, index) => {
              return (
                <View key={note._id || `note-${index}`} style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <View style={styles.noteHeaderLeft}>
                      {/* Avatar */}
                      <View style={styles.noteAvatar}>
                        {(() => {
                          const avatarPath =
                            note.member?.featured_image?.[0]?.path;
                          return avatarPath ? (
                            <Image
                              source={{ uri: avatarPath }}
                              style={styles.noteAvatarImage}
                            />
                          ) : (
                            <Ionicons
                              name="person"
                              size={20}
                              color={colors.gray[500]}
                            />
                          );
                        })()}
                      </View>

                      {/* Member info */}
                      <View style={styles.noteMemberInfo}>
                        <Text style={styles.noteMemberName}>
                          {note.member?.name ||
                            note.member?.username ||
                            "Học viên"}
                        </Text>
                        <Text style={styles.noteDate}>
                          {formatDate(note.created_at)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.noteActions}>
                      {/* Evaluation Info Button */}
                      {parseNoteContent(note.note).isEvaluated && (
                        <TouchableOpacity
                          style={styles.noteActionButton}
                          onPress={() => handleViewEvaluation(note)}
                        >
                          <Ionicons
                            name="information-circle-outline"
                            size={18}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.noteActionButton}
                        onPress={() => handleEditNote(note)}
                      >
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.noteActionButton}
                        onPress={() => handleDeleteNoteClick(note)}
                        disabled={isDeleting}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.noteContentContainer}>
                    <Text style={styles.noteContent}>
                      {parseNoteContent(note.note).text || "Nội dung ghi chú"}
                    </Text>
                  </View>

                  {/* Media Display - Compact */}
                  {note.media && note.media.length > 0 && (
                    <View style={styles.mediaGrid}>
                      {note.media
                        .slice(0, 3)
                        .map((media: any, mediaIndex: number) => {
                          return (
                            <TouchableOpacity
                              key={mediaIndex}
                              onPress={() =>
                                handleImagePress(note.media || [], mediaIndex)
                              }
                              style={styles.mediaThumbnailContainer}
                            >
                              {imageLoadErrors.has(media.path) ? (
                                <View style={styles.mediaFallback}>
                                  <Ionicons
                                    name="image-outline"
                                    size={24}
                                    color={colors.gray[500]}
                                  />
                                  <Text style={styles.mediaFallbackText}>
                                    {media.title || "Media"}
                                  </Text>
                                </View>
                              ) : (
                                <View style={styles.mediaDebugContainer}>
                                  <Image
                                    source={{
                                      uri: media.path,
                                      cache: "reload", // Force reload to avoid cache issues
                                    }}
                                    style={styles.mediaThumbnail}
                                    resizeMode="cover"
                                    onError={(error) => {
                                      console.log(
                                        "❌ Image load error:",
                                        error
                                      );
                                      console.log("❌ Failed URI:", media.path);
                                      setImageLoadErrors(
                                        (prev) => new Set([...prev, media.path])
                                      );
                                    }}
                                    onLoad={() => {}}
                                  />
                                  <Text style={styles.mediaDebugText}>IMG</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      {note.media.length > 3 && (
                        <TouchableOpacity
                          style={styles.moreMediaIndicator}
                          onPress={() => handleImagePress(note.media || [], 3)}
                        >
                          <Text style={styles.moreMediaText}>
                            +{note.media.length - 3}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Schedule info if available */}
                  {note.schedule && (
                    <View style={styles.noteScheduleInfo}>
                      <View style={styles.noteScheduleRow}>
                        <Ionicons
                          name="calendar"
                          size={14}
                          color={colors.gray[500]}
                        />
                        <Text style={styles.noteScheduleText}>
                          Buổi học: {formatDate(note.schedule.date)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {note.updated_at !== note.created_at && (
                    <Text style={styles.noteUpdated}>
                      Cập nhật: {formatDate(note.updated_at)}
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={24} color={colors.white} />
      </TouchableOpacity>

      {/* Create Note Modal */}
      <CreateNoteModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateNote={handleCreateNote}
        students={students}
        schedule_id={selectedScheduleId || schedule_id}
        evaluationCriteria={evaluationCriteria}
        isCreating={isCreating}
        initialSelectedStudentId={routeSelectedStudentId}
      />

      {/* Edit Note Modal */}
      <EditNoteModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdateNote={handleUpdateNote}
        note={editingNote}
        students={students}
        schedule_id={schedule_id}
        evaluationCriteria={evaluationCriteria}
        isUpdating={isUpdating}
      />

      {/* Evaluation Detail Modal */}
      <EvaluationModal
        visible={showEvaluationModal}
        onClose={() => setShowEvaluationModal(false)}
        evaluationData={selectedEvaluationData}
      />

      {/* Delete Confirmation Modal */}
      <DeleteNoteModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleteConfirm={handleDeleteNote}
        isDeleting={isDeleting}
      />

      {/* Image Preview Modal */}
      <Modal
        visible={showImagePreview}
        animationType="fade"
        transparent
        onRequestClose={() => {
          console.log("🖼️ Closing image preview");
          setShowImagePreview(false);
        }}
      >
        <View style={styles.imagePreviewOverlay}>
          <View style={styles.imagePreviewContainer}>
            <View style={styles.imagePreviewHeader}>
              <TouchableOpacity
                style={styles.imagePreviewCloseButton}
                onPress={() => setShowImagePreview(false)}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.imagePreviewCounter}>
                {currentImageIndex + 1} / {previewImages.length}
              </Text>
              <View style={styles.imagePreviewHeaderSpacer} />
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x /
                    event.nativeEvent.layoutMeasurement.width
                );
                setCurrentImageIndex(index);
              }}
              style={styles.imagePreviewScroll}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              {previewImages.map((media: any, index: number) => {
                console.log("🖼️ Rendering preview image:", media.path);
                return (
                  <View key={index} style={styles.imagePreviewItem}>
                    <Image
                      source={{ uri: media.path }}
                      style={styles.imagePreviewImage}
                      resizeMode="contain"
                      onLoad={() => {
                        console.log("✅ Preview image loaded:", media.path);
                      }}
                      onError={(error) => {
                        console.log("❌ Preview image error:", error);
                      }}
                    />
                    {media.title && (
                      <Text style={styles.imagePreviewTitle} numberOfLines={2}>
                        {media.title}
                      </Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
