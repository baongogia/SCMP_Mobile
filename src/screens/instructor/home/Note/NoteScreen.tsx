import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Modal,
  Image,
} from "react-native";
// Use centralized toast helpers (wired to CustomToast via global config)
import * as ImagePicker from "expo-image-picker";
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
import { addImageToProfile } from "@/src/services/auth/authService";
import {
  showErrorToast,
  showSuccessToast,
  showInfoToast,
} from "@/src/utils/errorHandler";
import { CustomDropdown } from "@/src/components/custom/dropdown/CustomDropdown";

interface Note {
  _id: string;
  note: string;
  created_at: string;
  updated_at: string;
  media?: string[]; // Array of media IDs
  member?: {
    _id: string;
    name?: string;
    username?: string;
    email?: string;
    featured_image?: {
      path?: string;
    };
  };
  schedule?: {
    _id: string;
    date: string;
    classroom: string;
    instructor: string;
    slot: string;
  };
  evaluation?: Record<string, number>; // Evaluation scores for criteria
}

interface ScheduleItem {
  _id: string;
  date: string;
  slot?: any;
  classroom?: string;
  instructor?: string;
}

interface RouteParams {
  class_id: string;
  course_id: string;
  class_name?: string;
  course_title?: string;
  schedule_id?: string;
  schedule_title?: string;
}

export function NoteScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { class_id, course_id, class_name, course_title, schedule_id } =
    route.params as RouteParams;

  console.log("NoteScreen route params:", route.params);
  console.log("Parsed params:", {
    class_id,
    course_id,
    class_name,
    course_title,
  });

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNote, setEditNote] = useState("");
  const [editMediaIds, setEditMediaIds] = useState<string[]>([]);
  const [editUploadedMedia, setEditUploadedMedia] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
  const [evaluationScores, setEvaluationScores] = useState<
    Record<string, number | null>
  >({});
  const [editSelectedStudentId, setEditSelectedStudentId] =
    useState<string>("");
  const [editEvaluationScores, setEditEvaluationScores] = useState<
    Record<string, number | null>
  >({});

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

  // Helper function để kiểm tra boolean value
  const isBooleanTrue = (value: any): boolean => {
    return value === 1 || value === "1" || value === true || value === "true";
  };

  // Helper function để upload media cho relation field
  const handleRemoveMedia = (fieldKey: string) => {
    setEvaluationScores((prev) => ({
      ...prev,
      [fieldKey]: null,
    }));
    showSuccessToast("Đã xóa media!");
  };

  const handleEditRemoveMedia = (fieldKey: string) => {
    setEditEvaluationScores((prev) => ({
      ...prev,
      [fieldKey]: null,
    }));
    showSuccessToast("Đã xóa media!");
  };

  const handleEditRelationMediaUpload = async (fieldKey: string) => {
    try {
      // Request permission
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        showInfoToast(
          "Cần quyền truy cập thư viện ảnh để upload media",
          "Thông báo"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.3,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets.length > 0) {
        // Upload media riêng cho evaluation, không lưu vào uploadedMedia
        const uploadPromises = result.assets.map(async (asset) => {
          const formData = {
            title: `Evaluation Media ${Date.now()}`,
            alt: "Evaluation attachment",
            file: {
              uri: asset.uri,
              type: asset.type || "image/jpeg",
              name: asset.fileName || `evaluation_media_${Date.now()}.jpg`,
            },
          };

          try {
            const response = await addImageToProfile(formData);
            if (response.data && response.data.data) {
              return {
                id: response.data.data._id,
                path: response.data.data.path,
              };
            }
          } catch (error) {
            console.log("Error uploading evaluation media:", error);
            return null;
          }
        });

        const uploadResults = await Promise.all(uploadPromises);
        const validResults = uploadResults.filter((result) => result !== null);

        if (validResults.length > 0) {
          // Lưu media path để hiển thị ảnh
          const firstResult = validResults[0];
          if (firstResult) {
            setEditEvaluationScores((prev) => ({
              ...prev,
              [fieldKey]: firstResult.path, // Lưu media path
            }));
            showSuccessToast(
              `Đã upload ${validResults.length} media cho đánh giá!`
            );
          }
        }
      }
    } catch (error) {
      console.log("Error in handleEditRelationMediaUpload:", error);
      showErrorToast(error, {
        title: "Lỗi upload media",
        message: "Không thể upload media. Vui lòng thử lại.",
      });
    }
  };

  const handleRelationMediaUpload = async (fieldKey: string) => {
    try {
      // Request permission
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        showInfoToast(
          "Cần quyền truy cập thư viện ảnh để upload media",
          "Thông báo"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.3,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets.length > 0) {
        // Upload media riêng cho evaluation, không lưu vào uploadedMedia
        const uploadPromises = result.assets.map(async (asset) => {
          const formData = {
            title: `Evaluation Media ${Date.now()}`,
            alt: "Evaluation attachment",
            file: {
              uri: asset.uri,
              type: asset.type || "image/jpeg",
              name: asset.fileName || `evaluation_media_${Date.now()}.jpg`,
            },
          };

          try {
            const response = await addImageToProfile(formData);
            if (response.data && response.data.data) {
              return {
                id: response.data.data._id,
                path: response.data.data.path,
              };
            }
          } catch (error) {
            console.log("Error uploading evaluation media:", error);
            return null;
          }
        });

        const uploadResults = await Promise.all(uploadPromises);
        const validResults = uploadResults.filter((result) => result !== null);

        if (validResults.length > 0) {
          // Lưu media path để hiển thị ảnh
          const firstResult = validResults[0];
          if (firstResult) {
            setEvaluationScores((prev) => ({
              ...prev,
              [fieldKey]: firstResult.path, // Lưu media path
            }));
            showSuccessToast(
              `Đã upload ${validResults.length} media cho đánh giá!`
            );
          }
        }
      }
    } catch (error) {
      console.log("Error in handleRelationMediaUpload:", error);
      showErrorToast(error, {
        title: "Lỗi upload media",
        message: "Không thể upload media. Vui lòng thử lại.",
      });
    }
  };

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
      setNotes(notesData);
      if (Array.isArray(schedulesData)) {
        console.log("Processed schedules data:", schedulesData);
        setSchedules(schedulesData);
        // thiết lập buổi học đang chọn từ route param hoặc buổi đầu tiên
        if (!selectedScheduleId) {
          const defaultId =
            (route.params as any)?.schedule_id || schedulesData[0]?._id;
          if (defaultId) setSelectedScheduleId(defaultId);
        }
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
  }, [class_id, course_id, selectedScheduleId, route.params]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotes();
    setRefreshing(false);
  };

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

  const handleUploadMedia = async () => {
    try {
      // Request permission
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        showInfoToast(
          "Cần quyền truy cập thư viện ảnh để upload media",
          "Thông báo"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.3, // Giảm quality để giảm kích thước file
        allowsEditing: true, // Cho phép edit để resize
        aspect: [4, 3], // Tỷ lệ ảnh
      });

      if (!result.canceled && result.assets.length > 0) {
        setIsUploading(true);

        const uploadPromises = result.assets.map(async (asset) => {
          console.log("📏 Asset info:", {
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            fileSize: asset.fileSize,
            type: asset.type,
            fileName: asset.fileName,
          });

          // Kiểm tra kích thước file (5MB = 5 * 1024 * 1024 bytes)
          const maxFileSize = 5 * 1024 * 1024; // 5MB
          if (asset.fileSize && asset.fileSize > maxFileSize) {
            console.log("⚠️ File too large:", asset.fileSize, "bytes");
            showErrorToast(null, {
              title: "Lỗi upload",
              message: "File quá lớn. Vui lòng chọn file nhỏ hơn 5MB.",
            });
            return null;
          }

          const formData = {
            title: `Note Media ${Date.now()}`,
            alt: "Note attachment",
            file: {
              uri: asset.uri,
              type: asset.type || "image/jpeg",
              name: asset.fileName || `media_${Date.now()}.jpg`,
            },
          };

          try {
            console.log("🚀 Starting upload for asset:", asset.uri);
            const response = await addImageToProfile(formData);
            console.log("📤 Upload response:", response.data);

            const mediaId = response.data?.data?._id;
            const mediaData = response.data?.data;

            console.log("✅ Media ID extracted:", mediaId);
            console.log("📊 Media data:", mediaData);

            return {
              id: mediaId,
              data: mediaData,
              originalAsset: asset,
            };
          } catch (error) {
            console.log("❌ Error uploading media:", error);
            return null;
          }
        });

        const uploadedResults = await Promise.all(uploadPromises);
        console.log("📋 All upload results:", uploadedResults);

        const validResults = uploadedResults.filter(
          (result) => result && result.id
        );
        console.log("✅ Valid results:", validResults);

        const newMediaIds = validResults.map((result) => result!.id);
        const newMediaData = validResults.map((result) => ({
          id: result!.id,
          data: result!.data,
          preview: result!.originalAsset.uri,
          type: result!.originalAsset.type || "image",
        }));

        console.log("🆔 New media IDs to add:", newMediaIds);
        console.log("📊 New media data to add:", newMediaData);

        setMediaIds((prev) => {
          const updated = [...prev, ...newMediaIds];
          console.log("📝 Updated mediaIds state:", updated);
          return updated;
        });
        setUploadedMedia((prev) => {
          const updated = [...prev, ...newMediaData];
          console.log("🖼️ Updated uploadedMedia state:", updated);
          return updated;
        });
        showSuccessToast(`Đã upload ${newMediaIds.length} media thành công!`);
      }
    } catch (error) {
      console.log("Error in handleUploadMedia:", error);
      showErrorToast(error, {
        title: "Lỗi upload media",
        message: "Không thể upload media. Vui lòng thử lại.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.trim()) {
      showInfoToast("Vui lòng nhập nội dung ghi chú", "Thông báo");
      return;
    }

    // Kiểm tra duplicate note
    if (selectedStudentId && schedule_id) {
      const existingNote = notes.find(
        (note) =>
          note.member?._id === selectedStudentId &&
          note.schedule?._id === schedule_id
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
      console.log("Note content:", newNote);

      // Tạo note content kết hợp text và evaluation data
      let noteContent = newNote;
      if (selectedStudentId && Object.keys(evaluationScores).length > 0) {
        const evaluationData = {
          text: newNote,
          evaluation: evaluationScores,
          evaluationCriteria: evaluationCriteria,
        };
        noteContent = JSON.stringify(evaluationData);
      }

      const payload = {
        note: noteContent,
        member: selectedStudentId || "", // ID của học viên được chọn (để trống nếu không chọn)
        schedule: schedule_id || "", // ID buổi học
        media: mediaIds, // Array các ID media đã upload
      };

      console.log("📝 Creating note with class_id:", class_id);
      console.log("📄 Note content:", newNote);
      console.log("👤 Selected student ID:", selectedStudentId);
      console.log("📅 Schedule ID:", schedule_id);
      console.log("🆔 Media IDs in payload:", mediaIds);
      console.log("📦 Full payload:", payload);

      const response = await createNote(class_id, payload);
      console.log("✅ Create note response:", response.data);
      console.log("📊 Response status:", response.status);
      console.log("📋 Response headers:", response.headers);
      setNewNote("");
      setMediaIds([]); // Clear media after creation
      setUploadedMedia([]); // Clear uploaded media preview
      setSelectedStudentId(""); // Clear selected student
      setEvaluationScores({}); // Clear evaluation scores
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

    // Parse note content để lấy text và evaluation data
    const parsedContent = parseNoteContent(note.note);
    setEditNote(parsedContent.text);

    // Initialize media state for editing
    const existingMediaIds = note.media
      ? note.media.map((mediaItem: any) => mediaItem._id)
      : [];
    setEditMediaIds(existingMediaIds);
    setEditUploadedMedia(note.media || []);

    // Initialize student and evaluation state for editing
    setEditSelectedStudentId(note.member?._id || "");
    setEditEvaluationScores(parsedContent.evaluation || {});

    setShowEditModal(true);
  };

  const handleEditUploadMedia = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        showInfoToast(
          "Cần quyền truy cập thư viện ảnh để upload media",
          "Thông báo"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.3, // Giảm quality để giảm kích thước file
        allowsEditing: true, // Cho phép edit để resize
        aspect: [4, 3], // Tỷ lệ ảnh
      });

      if (!result.canceled && result.assets.length > 0) {
        const uploadPromises = result.assets.map(async (asset) => {
          console.log("📏 Edit Asset info:", {
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            fileSize: asset.fileSize,
            type: asset.type,
            fileName: asset.fileName,
          });

          // Kiểm tra kích thước file (5MB = 5 * 1024 * 1024 bytes)
          const maxFileSize = 5 * 1024 * 1024; // 5MB
          if (asset.fileSize && asset.fileSize > maxFileSize) {
            console.log("⚠️ File too large:", asset.fileSize, "bytes");
            showErrorToast(null, {
              title: "Lỗi upload",
              message: "File quá lớn. Vui lòng chọn file nhỏ hơn 5MB.",
            });
            return null;
          }

          const formData = {
            title: `Note Media ${Date.now()}`,
            alt: "Note attachment",
            file: {
              uri: asset.uri,
              type: asset.type || "image/jpeg",
              name: asset.fileName || `media_${Date.now()}.jpg`,
            },
          };

          try {
            console.log("🚀 Starting edit upload for asset:", asset.uri);
            const response = await addImageToProfile(formData);
            console.log("📤 Edit upload response:", response.data);

            const mediaId = response.data?.data?._id;
            const mediaData = response.data?.data;

            console.log("✅ Edit Media ID extracted:", mediaId);
            console.log("📊 Edit Media data:", mediaData);

            return {
              id: mediaId,
              data: mediaData,
              originalAsset: asset,
            };
          } catch (error) {
            console.log("❌ Error uploading edit media:", error);
            return null;
          }
        });

        const uploadedResults = await Promise.all(uploadPromises);
        console.log("📋 All edit upload results:", uploadedResults);

        const validResults = uploadedResults.filter(
          (result) => result && result.id
        );
        console.log("✅ Valid edit results:", validResults);

        const newMediaIds = validResults.map((result) => result!.id);
        const newMediaData = validResults.map((result) => ({
          id: result!.id,
          data: result!.data,
          path: result!.originalAsset.uri,
          type: result!.originalAsset.type || "image",
        }));

        console.log("🆔 New edit media IDs to add:", newMediaIds);
        console.log("📊 New edit media data to add:", newMediaData);

        if (newMediaIds.length > 0) {
          setEditMediaIds((prev) => [...prev, ...newMediaIds]);
          setEditUploadedMedia((prev) => [...prev, ...newMediaData]);
          showSuccessToast(`Đã upload ${newMediaIds.length} media thành công!`);
        }
      }
    } catch (error) {
      console.log("Error in handleEditUploadMedia:", error);
      showErrorToast(error, {
        title: "Lỗi upload media",
        message: "Không thể upload media. Vui lòng thử lại.",
      });
    }
  };

  const handleEditRemoveNoteMedia = (index: number) => {
    setEditMediaIds((prev) => prev.filter((_, i) => i !== index));
    setEditUploadedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // Function to show evaluation details
  const handleShowEvaluation = (note: Note) => {
    const parsedContent = parseNoteContent(note.note);
    if (parsedContent.isEvaluated && parsedContent.evaluation) {
      setSelectedEvaluationData({
        text: parsedContent.text,
        evaluation: parsedContent.evaluation,
        evaluationCriteria: evaluationCriteria,
      });
      setShowEvaluationModal(true);
    }
  };

  const handleUpdateNote = async () => {
    if (!editNote.trim()) {
      showInfoToast("Vui lòng nhập nội dung ghi chú", "Thông báo");
      return;
    }

    if (!editingNote) return;

    setIsUpdating(true);
    try {
      // Tạo note content kết hợp text và evaluation data
      let noteContent = editNote;
      if (
        editSelectedStudentId &&
        Object.keys(editEvaluationScores).length > 0
      ) {
        const evaluationData = {
          text: editNote,
          evaluation: editEvaluationScores,
          evaluationCriteria: evaluationCriteria,
        };
        noteContent = JSON.stringify(evaluationData);
      }

      const payload = {
        note: noteContent,
        media: editMediaIds, // Use edit media IDs
        member: editSelectedStudentId || "", // ID của học viên được chọn
      };

      console.log("📝 Updating note:", editingNote._id);
      console.log("📄 New content:", editNote);
      console.log("🆔 Edit media IDs:", editMediaIds);
      console.log("📦 Full payload:", payload);

      const response = await updateNote(class_id, editingNote._id, payload);
      console.log("✅ Update note response:", response.data);

      setEditNote("");
      setEditSelectedStudentId("");
      setEditEvaluationScores({});
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

  const handleDeleteConfirm = (note: Note) => {
    setNoteToDelete(note);
    setShowDeleteModal(true);
  };

  const handleImagePreview = (media: any[], startIndex: number = 0) => {
    console.log("🖼️ Opening image preview with media:", media);
    console.log("🖼️ Start index:", startIndex);
    setPreviewImages(media);
    setCurrentImageIndex(startIndex);
    setShowImagePreview(true);
    console.log("🖼️ Preview modal should be visible now!");
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

          {loading ? (
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
          ) : schedules.length > 0 ? (
            <>
              {/* Tabs chọn buổi học */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.sessionTabs}
                contentContainerStyle={styles.sessionTabsContent}
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

                      {notesOfSession.length === 0 ? (
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
                                    {note.member?.featured_image?.path ? (
                                      <Image
                                        source={{
                                          uri: note.member.featured_image.path,
                                        }}
                                        style={styles.noteAvatarImage}
                                      />
                                    ) : (
                                      <Ionicons
                                        name="person"
                                        size={20}
                                        color={colors.gray[500]}
                                      />
                                    )}
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
                                      onPress={() => handleShowEvaluation(note)}
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
                                    onPress={() => handleDeleteConfirm(note)}
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
                                          handleImagePreview(
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
                                        handleImagePreview(note.media || [], 3)
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
          ) : (
            notes.map((note, index) => {
              console.log(`Note ${index}:`, note);
              console.log(`Note ${index} content:`, note.note);
              console.log(`Note ${index} media:`, note.media);
              console.log(`Note ${index} media type:`, typeof note.media);
              console.log(`Note ${index} media length:`, note.media?.length);
              return (
                <View key={note._id || `note-${index}`} style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <View style={styles.noteHeaderLeft}>
                      {/* Avatar */}
                      <View style={styles.noteAvatar}>
                        {note.member?.featured_image?.path ? (
                          <Image
                            source={{ uri: note.member.featured_image.path }}
                            style={styles.noteAvatarImage}
                          />
                        ) : (
                          <Ionicons
                            name="person"
                            size={20}
                            color={colors.gray[500]}
                          />
                        )}
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
                          onPress={() => handleShowEvaluation(note)}
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
                        onPress={() => handleDeleteConfirm(note)}
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
                          console.log("🖼️ Media item:", media);
                          console.log("🖼️ Media path:", media.path);
                          console.log("🖼️ Media type:", typeof media);
                          console.log("🖼️ Media title:", media.title);
                          console.log("🖼️ Media mime:", media.mime);

                          return (
                            <TouchableOpacity
                              key={mediaIndex}
                              onPress={() =>
                                handleImagePreview(note.media || [], mediaIndex)
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
                                    onLoad={() => {
                                      console.log(
                                        "✅ Image loaded successfully:",
                                        media.path
                                      );
                                      console.log(
                                        "🖼️ Image should be visible now!"
                                      );
                                    }}
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
                          onPress={() =>
                            handleImagePreview(note.media || [], 3)
                          }
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
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Tạo ghi chú mới</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Student Selection Section */}
            {schedule_id && students.length > 0 && (
              <View style={styles.studentSection}>
                <Text style={styles.studentLabel}>Chọn học viên</Text>
                <CustomDropdown
                  items={[
                    { label: "Không chọn học viên", value: "" },
                    ...students.map((student) => ({
                      label: student.name,
                      value: student._id,
                    })),
                  ]}
                  selectedValue={selectedStudentId}
                  onValueChange={setSelectedStudentId}
                  placeholder="Chọn học viên"
                  icon="person"
                />
              </View>
            )}

            <TextInput
              style={styles.noteInput}
              placeholder="Nhập nội dung ghi chú..."
              value={newNote}
              onChangeText={setNewNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Media Upload Section */}
            <View style={styles.mediaSection}>
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  isUploading && styles.uploadButtonDisabled,
                ]}
                onPress={handleUploadMedia}
                disabled={isUploading}
              >
                <Ionicons
                  name="camera-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.uploadButtonText}>
                  {isUploading ? "Đang upload..." : "Thêm ảnh/video"}
                </Text>
              </TouchableOpacity>

              {mediaIds.length > 0 && (
                <Text style={styles.mediaCount}>
                  Đã chọn {mediaIds.length} media
                </Text>
              )}

              {/* Media Preview */}
              {uploadedMedia.length > 0 && (
                <View style={styles.mediaPreviewContainer}>
                  <View style={styles.mediaPreviewHeader}>
                    <Text style={styles.mediaPreviewTitle}>
                      Media đã upload
                    </Text>
                    <View style={styles.mediaCountBadge}>
                      <Text style={styles.mediaCountText}>
                        {uploadedMedia.length}
                      </Text>
                    </View>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.mediaPreviewScroll}
                    contentContainerStyle={styles.mediaPreviewContent}
                  >
                    {uploadedMedia.map((media, index) => (
                      <View
                        key={media.id || index}
                        style={styles.mediaPreviewItem}
                      >
                        <View style={styles.mediaPreviewCard}>
                          {media.type === "image" ? (
                            <Image
                              source={{ uri: media.preview }}
                              style={styles.mediaPreviewImage}
                            />
                          ) : (
                            <View style={styles.mediaPreviewVideo}>
                              <Ionicons
                                name="play-circle"
                                size={32}
                                color={colors.white}
                              />
                            </View>
                          )}
                          <View style={styles.mediaPreviewOverlay}>
                            <TouchableOpacity
                              style={styles.mediaRemoveButton}
                              onPress={() => {
                                const newMediaIds = mediaIds.filter(
                                  (id) => id !== media.id
                                );
                                const newUploadedMedia = uploadedMedia.filter(
                                  (m) => m.id !== media.id
                                );
                                setMediaIds(newMediaIds);
                                setUploadedMedia(newUploadedMedia);
                              }}
                            >
                              <Ionicons
                                name="close"
                                size={16}
                                color={colors.white}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Evaluation Criteria Section */}
            {selectedStudentId && evaluationCriteria.length > 0 && (
              <View style={styles.evaluationSection}>
                <View style={styles.evaluationHeader}>
                  <Ionicons name="star" size={20} color={colors.primary} />
                  <Text style={styles.evaluationTitle}>Đánh giá học viên</Text>
                </View>
                <Text style={styles.evaluationSubtitle}>
                  Đánh giá học viên theo các tiêu chí sau (thang điểm 1-5)
                </Text>
                {evaluationCriteria.map((criterion, index) => (
                  <View
                    key={criterion._id || index}
                    style={styles.criterionItem}
                  >
                    <View style={styles.criterionHeader}>
                      <Text style={styles.criterionLabel}>
                        {criterion.title ||
                          criterion.name ||
                          `Tiêu chí ${index + 1}`}
                      </Text>
                    </View>

                    {/* Hiển thị các trường đánh giá từ form_judge.items */}
                    {criterion.evaluationFields &&
                    criterion.evaluationFields.length > 0 ? (
                      criterion.evaluationFields.map(
                        (fieldName: string, fieldIndex: number) => {
                          const fieldKey = `${index}_${fieldName}`;
                          const fieldConfig =
                            criterion.form_judge?.items?.[fieldName];

                          return (
                            <View key={fieldKey} style={styles.fieldContainer}>
                              <Text style={styles.fieldLabel}>{fieldName}</Text>

                              {/* Hiển thị theo loại field */}
                              {fieldConfig?.type === "boolean" ? (
                                <View style={styles.booleanContainer}>
                                  <TouchableOpacity
                                    style={[
                                      styles.booleanButton,
                                      isBooleanTrue(
                                        evaluationScores[fieldKey]
                                      ) && styles.booleanButtonSelected,
                                    ]}
                                    onPress={() => {
                                      setEvaluationScores((prev) => ({
                                        ...prev,
                                        [fieldKey]: 1,
                                      }));
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.booleanButtonText,
                                        isBooleanTrue(
                                          evaluationScores[fieldKey]
                                        ) && styles.booleanButtonTextSelected,
                                      ]}
                                    >
                                      Pass
                                    </Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    style={[
                                      styles.booleanButton,
                                      !isBooleanTrue(
                                        evaluationScores[fieldKey]
                                      ) && styles.booleanButtonSelected,
                                    ]}
                                    onPress={() => {
                                      setEvaluationScores((prev) => ({
                                        ...prev,
                                        [fieldKey]: 0,
                                      }));
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.booleanButtonText,
                                        !isBooleanTrue(
                                          evaluationScores[fieldKey]
                                        ) && styles.booleanButtonTextSelected,
                                      ]}
                                    >
                                      Không Pass
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              ) : fieldConfig?.type === "string" &&
                                fieldConfig?.text_type === "short_text" ? (
                                <View style={styles.textInputContainer}>
                                  <TextInput
                                    style={styles.textInput}
                                    value={
                                      evaluationScores[fieldKey]?.toString() ||
                                      ""
                                    }
                                    onChangeText={(text) => {
                                      const numValue = parseInt(text) || 0;
                                      if (
                                        numValue >= (fieldConfig.min || 1) &&
                                        numValue <= (fieldConfig.max || 5)
                                      ) {
                                        setEvaluationScores((prev) => ({
                                          ...prev,
                                          [fieldKey]: numValue,
                                        }));
                                      }
                                    }}
                                    placeholder={`Nhập điểm (${
                                      fieldConfig.min || 1
                                    }-${fieldConfig.max || 5})`}
                                    keyboardType="numeric"
                                  />
                                </View>
                              ) : fieldConfig?.type === "relation" ? (
                                <View style={styles.relationContainer}>
                                  {evaluationScores[fieldKey] ? (
                                    <View style={styles.evaluationMediaPreview}>
                                      <View
                                        style={
                                          styles.evaluationMediaPreviewImageContainer
                                        }
                                      >
                                        <Image
                                          source={{
                                            uri:
                                              evaluationScores[
                                                fieldKey
                                              ]?.toString() || "",
                                          }}
                                          style={
                                            styles.evaluationMediaPreviewImage
                                          }
                                          resizeMode="cover"
                                        />
                                        <TouchableOpacity
                                          style={styles.editMediaButton}
                                          onPress={() =>
                                            handleRelationMediaUpload(fieldKey)
                                          }
                                        >
                                          <Ionicons
                                            name="create-outline"
                                            size={12}
                                            color={colors.white}
                                          />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={
                                            styles.removeEvaluationMediaButton
                                          }
                                          onPress={() =>
                                            handleRemoveMedia(fieldKey)
                                          }
                                        >
                                          <Ionicons
                                            name="close"
                                            size={12}
                                            color={colors.white}
                                          />
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  ) : (
                                    <View style={styles.relationContainer}>
                                      <View
                                        style={
                                          styles.evaluationMediaPreviewImageContainer
                                        }
                                      >
                                        <View
                                          style={[
                                            styles.evaluationMediaPreviewImage,
                                            {
                                              backgroundColor: colors.gray[100],
                                              justifyContent: "center",
                                              alignItems: "center",
                                            },
                                          ]}
                                        >
                                          <Ionicons
                                            name="image-outline"
                                            size={24}
                                            color={colors.gray[400]}
                                          />
                                        </View>
                                        <TouchableOpacity
                                          style={styles.addMediaButton}
                                          onPress={() =>
                                            handleRelationMediaUpload(fieldKey)
                                          }
                                        >
                                          <Ionicons
                                            name="add"
                                            size={12}
                                            color={colors.white}
                                          />
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  )}
                                </View>
                              ) : (
                                <View style={styles.scoreContainer}>
                                  {[1, 2, 3, 4, 5].map((score) => (
                                    <TouchableOpacity
                                      key={score}
                                      style={[
                                        styles.scoreButton,
                                        evaluationScores[fieldKey] === score &&
                                          styles.scoreButtonSelected,
                                      ]}
                                      onPress={() => {
                                        setEvaluationScores((prev) => ({
                                          ...prev,
                                          [fieldKey]: score,
                                        }));
                                      }}
                                    >
                                      <Text
                                        style={[
                                          styles.scoreText,
                                          evaluationScores[fieldKey] ===
                                            score && styles.scoreTextSelected,
                                        ]}
                                      >
                                        {score}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              )}
                            </View>
                          );
                        }
                      )
                    ) : (
                      <View style={styles.noFieldsContainer}>
                        <Text style={styles.noFieldsText}>
                          Không có trường đánh giá
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.createButton,
                isCreating && styles.createButtonDisabled,
              ]}
              onPress={async () => {
                await handleCreateNote();
                setShowCreateModal(false);
              }}
              disabled={isCreating}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={colors.white}
              />
              <Text style={styles.createButtonText}>
                {isCreating ? "Đang tạo..." : "Tạo ghi chú"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Note Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowEditModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sửa ghi chú</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.noteInput}
              placeholder="Nhập nội dung ghi chú..."
              value={editNote}
              onChangeText={setEditNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Media Section */}
            <View style={styles.mediaSection}>
              <View style={styles.mediaHeader}>
                <Text style={styles.mediaTitle}>Media đính kèm</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleEditUploadMedia}
                  disabled={isUpdating}
                >
                  <Ionicons name="add" size={20} color={colors.primary} />
                  <Text style={styles.uploadButtonText}>Thêm media</Text>
                </TouchableOpacity>
              </View>

              {editUploadedMedia.length > 0 && (
                <View style={styles.mediaGrid}>
                  {editUploadedMedia.map((media, index) => (
                    <View key={index} style={styles.mediaItem}>
                      <Image
                        source={{ uri: media.path }}
                        style={styles.mediaThumbnail}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeMediaButton}
                        onPress={() => handleEditRemoveNoteMedia(index)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color={colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Student Selection Section for Edit */}
            {schedule_id && students.length > 0 && (
              <View style={styles.studentSection}>
                <Text style={styles.studentLabel}>
                  Chọn học viên (tùy chọn)
                </Text>
                <CustomDropdown
                  items={[
                    { label: "Không chọn học viên", value: "" },
                    ...students.map((student) => ({
                      label: student.name,
                      value: student._id,
                    })),
                  ]}
                  selectedValue={editSelectedStudentId}
                  onValueChange={setEditSelectedStudentId}
                  placeholder="Chọn học viên"
                  icon="person"
                />
              </View>
            )}

            {/* Evaluation Criteria Section for Edit */}
            {editSelectedStudentId && evaluationCriteria.length > 0 && (
              <View style={styles.evaluationSection}>
                <View style={styles.evaluationHeader}>
                  <Ionicons name="star" size={20} color={colors.primary} />
                  <Text style={styles.evaluationTitle}>Đánh giá học viên</Text>
                </View>
                <Text style={styles.evaluationSubtitle}>
                  Đánh giá học viên theo các tiêu chí sau (thang điểm 1-5)
                </Text>
                {evaluationCriteria.map((criterion, index) => (
                  <View
                    key={criterion._id || index}
                    style={styles.criterionItem}
                  >
                    <View style={styles.criterionHeader}>
                      <Text style={styles.criterionLabel}>
                        {criterion.title ||
                          criterion.name ||
                          `Tiêu chí ${index + 1}`}
                      </Text>
                    </View>

                    {/* Hiển thị các trường đánh giá từ form_judge.items */}
                    {criterion.evaluationFields &&
                    criterion.evaluationFields.length > 0 ? (
                      criterion.evaluationFields.map(
                        (fieldName: string, fieldIndex: number) => {
                          const fieldKey = `${index}_${fieldName}`;
                          const fieldConfig =
                            criterion.form_judge?.items?.[fieldName];

                          return (
                            <View key={fieldKey} style={styles.fieldContainer}>
                              <Text style={styles.fieldLabel}>{fieldName}</Text>

                              {/* Hiển thị theo loại field */}
                              {fieldConfig?.type === "boolean" ? (
                                <View style={styles.booleanContainer}>
                                  <TouchableOpacity
                                    style={[
                                      styles.booleanButton,
                                      isBooleanTrue(
                                        editEvaluationScores[fieldKey]
                                      ) && styles.booleanButtonSelected,
                                    ]}
                                    onPress={() => {
                                      setEditEvaluationScores((prev) => ({
                                        ...prev,
                                        [fieldKey]: 1,
                                      }));
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.booleanButtonText,
                                        isBooleanTrue(
                                          editEvaluationScores[fieldKey]
                                        ) && styles.booleanButtonTextSelected,
                                      ]}
                                    >
                                      Pass
                                    </Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    style={[
                                      styles.booleanButton,
                                      !isBooleanTrue(
                                        editEvaluationScores[fieldKey]
                                      ) && styles.booleanButtonSelected,
                                    ]}
                                    onPress={() => {
                                      setEditEvaluationScores((prev) => ({
                                        ...prev,
                                        [fieldKey]: 0,
                                      }));
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.booleanButtonText,
                                        !isBooleanTrue(
                                          editEvaluationScores[fieldKey]
                                        ) && styles.booleanButtonTextSelected,
                                      ]}
                                    >
                                      Không Pass
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              ) : fieldConfig?.type === "string" &&
                                fieldConfig?.text_type === "short_text" ? (
                                <View style={styles.textInputContainer}>
                                  <TextInput
                                    style={styles.textInput}
                                    value={
                                      editEvaluationScores[
                                        fieldKey
                                      ]?.toString() || ""
                                    }
                                    onChangeText={(text) => {
                                      const numValue = parseInt(text) || 0;
                                      if (
                                        numValue >= (fieldConfig.min || 1) &&
                                        numValue <= (fieldConfig.max || 5)
                                      ) {
                                        setEditEvaluationScores((prev) => ({
                                          ...prev,
                                          [fieldKey]: numValue,
                                        }));
                                      }
                                    }}
                                    placeholder={`Nhập điểm (${
                                      fieldConfig.min || 1
                                    }-${fieldConfig.max || 5})`}
                                    keyboardType="numeric"
                                  />
                                </View>
                              ) : fieldConfig?.type === "relation" ? (
                                <View style={styles.relationContainer}>
                                  {editEvaluationScores[fieldKey] ? (
                                    <View style={styles.evaluationMediaPreview}>
                                      <View
                                        style={
                                          styles.evaluationMediaPreviewImageContainer
                                        }
                                      >
                                        <Image
                                          source={{
                                            uri:
                                              editEvaluationScores[
                                                fieldKey
                                              ]?.toString() || "",
                                          }}
                                          style={
                                            styles.evaluationMediaPreviewImage
                                          }
                                          resizeMode="cover"
                                        />
                                        <TouchableOpacity
                                          style={styles.editMediaButton}
                                          onPress={() =>
                                            handleEditRelationMediaUpload(
                                              fieldKey
                                            )
                                          }
                                        >
                                          <Ionicons
                                            name="create-outline"
                                            size={12}
                                            color={colors.white}
                                          />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={
                                            styles.removeEvaluationMediaButton
                                          }
                                          onPress={() =>
                                            handleEditRemoveMedia(fieldKey)
                                          }
                                        >
                                          <Ionicons
                                            name="close"
                                            size={12}
                                            color={colors.white}
                                          />
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  ) : (
                                    <View style={styles.relationContainer}>
                                      <View
                                        style={
                                          styles.evaluationMediaPreviewImageContainer
                                        }
                                      >
                                        <View
                                          style={[
                                            styles.evaluationMediaPreviewImage,
                                            {
                                              backgroundColor: colors.gray[100],
                                              justifyContent: "center",
                                              alignItems: "center",
                                            },
                                          ]}
                                        >
                                          <Ionicons
                                            name="image-outline"
                                            size={24}
                                            color={colors.gray[400]}
                                          />
                                        </View>
                                        <TouchableOpacity
                                          style={styles.addMediaButton}
                                          onPress={() =>
                                            handleEditRelationMediaUpload(
                                              fieldKey
                                            )
                                          }
                                        >
                                          <Ionicons
                                            name="add"
                                            size={12}
                                            color={colors.white}
                                          />
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  )}
                                </View>
                              ) : (
                                <View style={styles.scoreContainer}>
                                  {[1, 2, 3, 4, 5].map((score) => (
                                    <TouchableOpacity
                                      key={score}
                                      style={[
                                        styles.scoreButton,
                                        editEvaluationScores[fieldKey] ===
                                          score && styles.scoreButtonSelected,
                                      ]}
                                      onPress={() => {
                                        setEditEvaluationScores((prev) => ({
                                          ...prev,
                                          [fieldKey]: score,
                                        }));
                                      }}
                                    >
                                      <Text
                                        style={[
                                          styles.scoreText,
                                          editEvaluationScores[fieldKey] ===
                                            score && styles.scoreTextSelected,
                                        ]}
                                      >
                                        {score}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              )}
                            </View>
                          );
                        }
                      )
                    ) : (
                      <View style={styles.noFieldsContainer}>
                        <Text style={styles.noFieldsText}>
                          Không có trường đánh giá
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.createButton,
                isUpdating && styles.createButtonDisabled,
              ]}
              onPress={handleUpdateNote}
              disabled={isUpdating}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={colors.white}
              />
              <Text style={styles.createButtonText}>
                {isUpdating ? "Đang cập nhật..." : "Cập nhật ghi chú"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Evaluation Detail Modal */}
      <Modal
        visible={showEvaluationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEvaluationModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowEvaluationModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chi tiết đánh giá</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedEvaluationData && (
              <>
                {/* Note Content */}
                <View style={styles.evaluationNoteSection}>
                  <Text style={styles.evaluationNoteLabel}>
                    Nội dung ghi chú:
                  </Text>
                  <Text style={styles.evaluationNoteText}>
                    {selectedEvaluationData.text}
                  </Text>
                </View>

                {/* Evaluation Results */}
                <View style={styles.evaluationResultsSection}>
                  <View style={styles.evaluationHeader}>
                    <Ionicons name="star" size={20} color={colors.primary} />
                    <Text style={styles.evaluationTitle}>Kết quả đánh giá</Text>
                  </View>

                  {selectedEvaluationData.evaluationCriteria.map(
                    (criterion, index) => {
                      return (
                        <View key={index} style={styles.evaluationResultItem}>
                          <View style={styles.evaluationResultHeader}>
                            <Text style={styles.evaluationResultTitle}>
                              {criterion.title}
                            </Text>
                          </View>

                          {/* Hiển thị các trường đánh giá từ form_judge.items */}
                          {criterion.evaluationFields &&
                          criterion.evaluationFields.length > 0 ? (
                            criterion.evaluationFields.map(
                              (fieldName: string, fieldIndex: number) => {
                                const fieldKey = `${index}_${fieldName}`;
                                const fieldConfig =
                                  criterion.form_judge?.items?.[fieldName];
                                const fieldValue =
                                  selectedEvaluationData.evaluation[fieldKey];

                                return (
                                  <View
                                    key={fieldKey}
                                    style={styles.fieldResultContainer}
                                  >
                                    <Text style={styles.fieldResultLabel}>
                                      {fieldName}
                                    </Text>

                                    {/* Hiển thị giá trị theo loại field */}
                                    {fieldConfig?.type === "boolean" ? (
                                      <View
                                        style={styles.booleanResultContainer}
                                      >
                                        <Text
                                          style={[
                                            styles.booleanResultText,
                                            fieldValue === 1
                                              ? styles.booleanResultSelected
                                              : styles.booleanResultUnselected,
                                          ]}
                                        >
                                          {isBooleanTrue(fieldValue)
                                            ? "Pass"
                                            : "Không Pass"}
                                        </Text>
                                      </View>
                                    ) : fieldConfig?.type === "string" &&
                                      fieldConfig?.text_type ===
                                        "short_text" ? (
                                      <View style={styles.textResultContainer}>
                                        <Text style={styles.textResultValue}>
                                          {fieldValue || "Chưa nhập"}
                                        </Text>
                                      </View>
                                    ) : fieldConfig?.type === "relation" ? (
                                      <View
                                        style={styles.relationResultContainer}
                                      >
                                        {fieldValue ? (
                                          <View
                                            style={
                                              styles.evaluationMediaContainer
                                            }
                                          >
                                            <Image
                                              source={{
                                                uri:
                                                  fieldValue?.toString() || "",
                                              }}
                                              style={
                                                styles.evaluationMediaImage
                                              }
                                              resizeMode="cover"
                                            />
                                            <Text
                                              style={styles.evaluationMediaText}
                                            >
                                              Media đã chọn
                                            </Text>
                                          </View>
                                        ) : (
                                          <Text
                                            style={styles.relationResultText}
                                          >
                                            Chưa chọn media
                                          </Text>
                                        )}
                                      </View>
                                    ) : (
                                      <View style={styles.scoreResultContainer}>
                                        <View
                                          style={styles.evaluationScoreBadge}
                                        >
                                          <Text
                                            style={styles.evaluationScoreText}
                                          >
                                            {fieldValue || 0}/5
                                          </Text>
                                        </View>

                                        {/* Score Visualization */}
                                        <View style={styles.scoreVisualization}>
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Ionicons
                                              key={star}
                                              name={
                                                star <= (fieldValue || 0)
                                                  ? "star"
                                                  : "star-outline"
                                              }
                                              size={16}
                                              color={
                                                star <= (fieldValue || 0)
                                                  ? colors.primary
                                                  : colors.gray[400]
                                              }
                                              style={styles.scoreStar}
                                            />
                                          ))}
                                        </View>
                                      </View>
                                    )}
                                  </View>
                                );
                              }
                            )
                          ) : (
                            <View style={styles.noFieldsResultContainer}>
                              <Text style={styles.noFieldsResultText}>
                                Không có trường đánh giá
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    }
                  )}
                </View>

                {/* Overall Score */}
                <View style={styles.overallScoreSection}>
                  <View style={styles.overallScoreFieldContainer}>
                    <Text style={styles.overallScoreFieldLabel}>Tổng điểm</Text>
                    <View style={styles.overallScoreValueContainer}>
                      <Text style={styles.overallScoreValue}>
                        {Object.values(selectedEvaluationData.evaluation)
                          .filter((value) => typeof value === "number")
                          .reduce((a, b) => a + b, 0)}
                        /
                        {Object.keys(selectedEvaluationData.evaluation).length *
                          5}
                      </Text>
                      <Text style={styles.overallScoreMax}>
                        ({Object.keys(selectedEvaluationData.evaluation).length}{" "}
                        tiêu chí)
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={48} color={colors.error} />
              <Text style={styles.deleteModalTitle}>Xác nhận xóa</Text>
              <Text style={styles.deleteModalMessage}>
                Bạn có chắc chắn muốn xóa ghi chú này không? Hành động này không
                thể hoàn tác.
              </Text>
            </View>

            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setNoteToDelete(null);
                }}
              >
                <Text style={styles.deleteModalCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteModalConfirmButton,
                  isDeleting && styles.deleteModalConfirmButtonDisabled,
                ]}
                onPress={handleDeleteNote}
                disabled={isDeleting}
              >
                <Text style={styles.deleteModalConfirmText}>
                  {isDeleting ? "Đang xóa..." : "Xóa"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  classInfoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  classInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  classInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 14,
    color: colors.gray[500],
  },
  createNoteCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginTop: 12,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 80,
    marginBottom: 12,
  },
  createButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonDisabled: {
    backgroundColor: colors.gray[500],
  },
  mediaSection: {
    marginVertical: 12,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  mediaCount: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: "center",
    marginTop: 4,
  },
  mediaPreviewContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  mediaPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  mediaPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  // Modern session tabs
  sessionTabs: {
    marginBottom: 12,
  },
  sessionTabsContent: {
    paddingRight: 8,
  },
  sessionTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  sessionTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sessionTabIcon: {
    marginRight: 6,
  },
  sessionTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    maxWidth: 140,
  },
  sessionTabTextActive: {
    color: colors.white,
  },
  sessionTabBadge: {
    marginLeft: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  sessionTabBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  sessionTabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  sessionTabBadgeTextActive: {
    color: colors.white,
  },
  mediaCountBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: "center",
  },
  mediaCountText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "600",
  },
  mediaPreviewScroll: {
    maxHeight: 100,
  },
  mediaPreviewContent: {
    paddingRight: 16,
  },
  mediaPreviewItem: {
    marginRight: 12,
  },
  mediaPreviewCard: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mediaPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  mediaPreviewVideo: {
    width: 80,
    height: 80,
    backgroundColor: colors.gray[800],
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaPreviewOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    padding: 4,
  },
  mediaRemoveButton: {
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  studentSection: {
    marginVertical: 12,
  },
  studentLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 8,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  notesSection: {
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    color: colors.gray[500],
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.gray[500],
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
    textAlign: "center",
  },
  noteCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  noteHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  noteAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  noteAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  noteMemberInfo: {
    flex: 1,
  },
  noteMemberName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  noteDate: {
    fontSize: 12,
    color: colors.gray[500],
  },
  noteContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  noteScheduleInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  noteScheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  noteScheduleText: {
    fontSize: 12,
    color: colors.gray[600],
    marginLeft: 6,
  },
  noteUpdated: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 8,
    fontStyle: "italic",
  },
  noteMediaContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  noteMediaTitle: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: 8,
    fontWeight: "500",
  },
  noteMediaScroll: {
    maxHeight: 60,
  },
  noteMediaItem: {
    marginRight: 8,
  },
  noteMediaPlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  // FAB styles
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 40,
  },
  modalCloseButton: {
    position: "absolute",
    left: 20,
    top: 16,
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  noteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noteActionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.gray[100],
  },
  // Delete Modal styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  deleteModalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteModalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  deleteModalMessage: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: "center",
    lineHeight: 20,
  },
  deleteModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
    alignItems: "center",
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.gray[700],
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: "center",
  },
  deleteModalConfirmButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  // Media styles - Modern & Compact
  mediaGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  mediaThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.gray[200],
    borderWidth: 2,
    borderColor: colors.primary, // Debug border to see if image is there
  },
  mediaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  mediaTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  mediaItem: {
    position: "relative",
    marginRight: 8,
    marginBottom: 8,
  },
  removeMediaButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 2,
  },
  moreMediaIndicator: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderStyle: "dashed",
  },
  moreMediaText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray[600],
  },
  // Session header card
  sessionHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 8,
  },
  sessionHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  sessionHeaderSub: {
    marginTop: 2,
    fontSize: 13,
    color: colors.gray[600],
  },
  mediaThumbnailContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  mediaDebugContainer: {
    position: "relative",
    width: 50,
    height: 50,
  },
  mediaDebugText: {
    position: "absolute",
    top: 2,
    right: 2,
    fontSize: 8,
    color: colors.white,
    backgroundColor: colors.primary,
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 2,
    fontWeight: "bold",
  },
  mediaFallback: {
    width: 50,
    height: 50,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  mediaFallbackText: {
    fontSize: 8,
    color: colors.gray[600],
    textAlign: "center",
  },
  // Image Preview styles
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  imagePreviewContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
  },
  imagePreviewHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  imagePreviewCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  imagePreviewCounter: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  imagePreviewHeaderSpacer: {
    width: 40,
  },
  imagePreviewScroll: {
    flex: 1,
  },
  imagePreviewItem: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  imagePreviewImage: {
    width: "100%",
    height: "100%",
    maxHeight: 600,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  imagePreviewTitle: {
    position: "absolute",
    bottom: 60,
    left: 20,
    right: 20,
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  // Evaluation styles
  evaluationSection: {
    marginTop: 24,
    marginBottom: 24,
    padding: 24,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  evaluationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.gray[100],
  },
  evaluationTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  evaluationSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: "500",
  },
  criterionItem: {
    marginBottom: 20,
    padding: 0,
    backgroundColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    borderColor: "transparent",
  },
  criterionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  criterionLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    letterSpacing: 0.3,
  },
  scoreIndicator: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreIndicatorText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  scoreButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 0,
    backgroundColor: colors.gray[50],
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreButtonSelected: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  scoreTextSelected: {
    color: colors.white,
  },
  scoreLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  scoreLabelText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  // Evaluation Modal Styles
  evaluationNoteSection: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  evaluationNoteLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  evaluationNoteText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  evaluationResultsSection: {
    marginBottom: 20,
  },
  evaluationResultItem: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  evaluationResultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  evaluationResultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  evaluationScoreBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  evaluationScoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  scoreVisualization: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  scoreStar: {
    marginRight: 4,
  },
  scoreDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  overallScoreSection: {
    marginTop: 16,
    padding: 0,
    backgroundColor: "transparent",
  },
  overallScoreLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  overallScoreContainer: {
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  overallScoreValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
  },
  overallScoreFieldContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  overallScoreFieldLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.white,
    letterSpacing: 0.3,
    flex: 1,
  },
  overallScoreValueContainer: {
    alignItems: "flex-end",
  },
  overallScoreMax: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.8,
    marginTop: 2,
  },
  // Modern styles for form_judge fields
  fieldContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  booleanContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 12,
  },
  booleanButton: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: colors.gray[50],
    borderRadius: 28,
    borderWidth: 0,
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  booleanButtonSelected: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  booleanButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.gray[600],
    letterSpacing: 0.5,
  },
  booleanButtonTextSelected: {
    color: colors.white,
  },
  textInputContainer: {
    marginTop: 8,
  },
  textInput: {
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.gray[50],
    fontWeight: "500",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  relationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
  },
  relationText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "500",
  },
  relationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 24,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  relationButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
    letterSpacing: 0.5,
  },
  noFieldsContainer: {
    padding: 24,
    alignItems: "center",
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: "dashed",
  },
  noFieldsText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
    fontWeight: "500",
  },
  // Modern styles for evaluation modal results
  fieldResultContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    padding: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  fieldResultLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    letterSpacing: 0.3,
    flex: 1,
  },
  booleanResultContainer: {
    alignItems: "center",
  },
  booleanResultText: {
    fontSize: 15,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    letterSpacing: 0.5,
  },
  booleanResultSelected: {
    color: colors.white,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  booleanResultUnselected: {
    color: colors.gray[600],
    backgroundColor: colors.gray[100],
  },
  textResultContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
  textResultValue: {
    fontSize: 14,
    color: colors.white,
    fontWeight: "600",
    textAlign: "center",
  },
  relationResultContainer: {
    alignItems: "center",
  },
  relationResultText: {
    fontSize: 15,
    color: colors.text,
    fontStyle: "italic",
    fontWeight: "500",
    textAlign: "center",
  },
  evaluationMediaContainer: {
    alignItems: "center",
  },
  evaluationMediaImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  evaluationMediaText: {
    fontSize: 10,
    color: colors.gray[600],
    marginTop: 2,
    textAlign: "center",
  },
  evaluationMediaPreview: {
    alignItems: "center",
    marginTop: 8,
  },
  evaluationMediaPreviewImageContainer: {
    position: "relative",
    alignSelf: "center",
  },
  evaluationMediaPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  editMediaButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  removeEvaluationMediaButton: {
    position: "absolute",
    top: -6,
    left: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addMediaButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  scoreResultContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noFieldsResultContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: "dashed",
  },
  noFieldsResultText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
    fontWeight: "500",
  },
  // Styles for evaluation summary in note display
  noteContentContainer: {
    marginTop: 8,
  },
  evaluationSummary: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  evaluationSummaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  evaluationSummaryItem: {
    marginBottom: 8,
  },
  evaluationSummaryCriterion: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  evaluationSummaryField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 8,
    marginBottom: 2,
  },
  evaluationSummaryFieldName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
    flex: 1,
  },
  evaluationSummaryFieldValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "600",
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
});
