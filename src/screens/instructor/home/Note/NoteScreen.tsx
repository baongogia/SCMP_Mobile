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
import Toast from "react-native-toast-message";
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
import { showErrorToast } from "@/src/utils/errorHandler";
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImages, setPreviewImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(
    new Set()
  );

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching notes with:", { class_id, course_id });
      const response = await getNotes(class_id, course_id);
      console.log("Notes API response:", response.data);
      console.log("Notes data:", response.data?.data);

      // Xử lý dữ liệu để đảm bảo có cấu trúc đúng
      let notesData: Note[] = [];
      if (response.data?.data) {
        console.log("response.data.data:", response.data.data);

        if (Array.isArray(response.data.data)) {
          console.log(
            "response.data.data is array, length:",
            response.data.data.length
          );

          // Dữ liệu có cấu trúc: [[[note1, note2], [course1]], [[note3], [course2]], ...]
          notesData = response.data.data
            .flatMap((item: any, index: number) => {
              console.log(`Processing item ${index}:`, item);

              if (Array.isArray(item) && item.length > 0) {
                // item có cấu trúc: [[note1, note2], [course]]
                const noteArray = item[0]; // Lấy array chứa tất cả notes
                console.log(`Note array for item ${index}:`, noteArray);

                if (Array.isArray(noteArray) && noteArray.length > 0) {
                  // Trả về tất cả notes trong array, không chỉ note đầu tiên
                  console.log(`All notes for item ${index}:`, noteArray);
                  return noteArray;
                }
              }
              return [];
            })
            .filter((note: any) => note && note._id); // Lọc ra các note hợp lệ

          console.log("Final processed notes:", notesData);
        } else if (
          response.data.data.data &&
          Array.isArray(response.data.data.data)
        ) {
          notesData = response.data.data.data;
        }
      }

      console.log("Processed notes data:", notesData);
      setNotes(notesData);
    } catch (error) {
      console.log("Error fetching notes:", error);
      showErrorToast(error, {
        title: "Lỗi tải ghi chú",
        message: "Không thể tải danh sách ghi chú. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  }, [class_id, course_id]);

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
        Toast.show({
          type: "info",
          text1: "Thông báo",
          text2: "Cần quyền truy cập thư viện ảnh để upload media",
        });
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
            Toast.show({
              type: "error",
              text1: "Lỗi upload",
              text2: "File quá lớn. Vui lòng chọn file nhỏ hơn 5MB.",
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
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: `Đã upload ${newMediaIds.length} media thành công!`,
        });
      }
    } catch (error) {
      console.log("Error in handleUploadMedia:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi upload media",
        text2: "Không thể upload media. Vui lòng thử lại.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.trim()) {
      Toast.show({
        type: "info",
        text1: "Thông báo",
        text2: "Vui lòng nhập nội dung ghi chú",
      });
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
        Toast.show({
          type: "error",
          text1: "Lỗi tạo ghi chú",
          text2: "Đã có ghi chú cho học viên này trong buổi học này rồi!",
        });
        return;
      }
    }

    setIsCreating(true);
    try {
      console.log("Creating note with class_id:", class_id);
      console.log("Note content:", newNote);

      const payload = {
        note: newNote,
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
      setShowCreateModal(false); // Close modal after creation
      await fetchNotes();
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Tạo ghi chú thành công!",
      });
    } catch (error) {
      console.log("Error creating note:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi tạo ghi chú",
        text2: "Không thể tạo ghi chú. Vui lòng thử lại.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setEditNote(note.note);
    setShowEditModal(true);
  };

  const handleUpdateNote = async () => {
    if (!editNote.trim()) {
      Toast.show({
        type: "info",
        text1: "Thông báo",
        text2: "Vui lòng nhập nội dung ghi chú",
      });
      return;
    }

    if (!editingNote) return;

    setIsUpdating(true);
    try {
      const payload = {
        note: editNote,
        media: editingNote.media || [], // Keep existing media for now
      };

      console.log("📝 Updating note:", editingNote._id);
      console.log("📄 New content:", editNote);

      const response = await updateNote(class_id, editingNote._id, payload);
      console.log("✅ Update note response:", response.data);

      setEditNote("");
      setEditingNote(null);
      setShowEditModal(false);
      await fetchNotes();
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Cập nhật ghi chú thành công!",
      });
    } catch (error: any) {
      console.log("❌ Error updating note:", error);
      console.log("❌ Error details:", JSON.stringify(error, null, 2));
      console.log("❌ Error response:", error.response?.data);
      console.log("❌ Error status:", error.response?.status);

      Toast.show({
        type: "error",
        text1: "Lỗi cập nhật ghi chú",
        text2: `Không thể cập nhật ghi chú. Lỗi: ${
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
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Xóa ghi chú thành công!",
      });
    } catch (error: any) {
      console.log("❌ Error deleting note:", error);
      console.log("❌ Error details:", JSON.stringify(error, null, 2));
      console.log("❌ Error response:", error.response?.data);
      console.log("❌ Error status:", error.response?.status);

      Toast.show({
        type: "error",
        text1: "Lỗi xóa ghi chú",
        text2: `Không thể xóa ghi chú. Lỗi: ${
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
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
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

                  <Text style={styles.noteContent}>
                    {note.note || "Nội dung ghi chú"}
                  </Text>

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
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Tạo ghi chú mới</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent}>
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

            {/* Student Selection Section */}
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
                  selectedValue={selectedStudentId}
                  onValueChange={setSelectedStudentId}
                  placeholder="Chọn học viên"
                  icon="person"
                />
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
              <Ionicons name="close" size={24} color={colors.text} />
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
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
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
    padding: 16,
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
});
