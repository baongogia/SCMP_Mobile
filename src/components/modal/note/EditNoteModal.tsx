import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "@/src/constants/colors";
import { CustomDropdown } from "@/src/components/custom/dropdown/CustomDropdown";
import { addImageToProfile } from "@/src/services/auth/authService";
import {
  showErrorToast,
  showSuccessToast,
  showInfoToast,
} from "@/src/utils/errorHandler";
import { Note } from "../../../screens/instructor/home/Note/types";
import {
  parseNoteContent,
  isBooleanTrue,
} from "../../../screens/instructor/home/Note/utils";

interface EditNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdateNote: (noteData: {
    note: string;
    editUploadedMedia: any[];
    editSelectedStudentId: string;
    editEvaluationScores: Record<string, number | null>;
  }) => Promise<void>;
  isUpdating: boolean;
  note: Note | null;
  schedule_id?: string;
  students: any[];
  evaluationCriteria: any[];
}

export function EditNoteModal({
  visible,
  onClose,
  onUpdateNote,
  isUpdating,
  note,
  schedule_id,
  students,
  evaluationCriteria,
}: EditNoteModalProps) {
  const [editNote, setEditNote] = useState("");
  const [editUploadedMedia, setEditUploadedMedia] = useState<any[]>([]);
  const [editSelectedStudentId, setEditSelectedStudentId] =
    useState<string>("");
  const [editEvaluationScores, setEditEvaluationScores] = useState<
    Record<string, number | null>
  >({});

  useEffect(() => {
    if (note) {
      // Parse note content để lấy text và evaluation data
      const parsedContent = parseNoteContent(note.note);
      setEditNote(parsedContent.text);

      // Initialize media state for editing
      setEditUploadedMedia(note.media || []);

      // Initialize student and evaluation state for editing
      setEditSelectedStudentId(note.member?._id || "");
      setEditEvaluationScores(parsedContent.evaluation || {});
    }
  }, [note]);

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
    setEditUploadedMedia((prev) => prev.filter((_, i) => i !== index));
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

  const handleEditRemoveMedia = (fieldKey: string) => {
    setEditEvaluationScores((prev) => ({
      ...prev,
      [fieldKey]: null,
    }));
    showSuccessToast("Đã xóa media!");
  };

  const handleUpdateNote = async () => {
    if (!editNote.trim()) {
      showInfoToast("Vui lòng nhập nội dung ghi chú", "Thông báo");
      return;
    }

    await onUpdateNote({
      note: editNote,
      editUploadedMedia: editUploadedMedia.map((media) => ({
        ...media,
        id: media.id || media._id,
      })),
      editSelectedStudentId,
      editEvaluationScores,
    });
  };

  if (!note) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
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
              <Text style={styles.studentLabel}>Chọn học viên (tùy chọn)</Text>
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
                <View key={criterion._id || index} style={styles.criterionItem}>
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
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
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
    fontSize: 20,
    fontWeight: "700",
    color: colors.white,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 40,
  },
  modalCloseButton: {
    position: "absolute",
    left: 24,
    top: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  noteInput: {
    borderWidth: 0,
    borderRadius: 12,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.gray[50],
    minHeight: 100,
    textAlignVertical: "top",
  },
  mediaSection: {
    marginBottom: 24,
  },
  mediaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  mediaTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  uploadButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  mediaGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    flexWrap: "wrap",
  },
  mediaItem: {
    position: "relative",
    marginRight: 12,
    marginBottom: 12,
  },
  mediaThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.gray[200],
    borderWidth: 2,
    borderColor: colors.primary,
  },
  removeMediaButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
  },
  studentSection: {
    marginBottom: 24,
  },
  studentLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  evaluationSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  evaluationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  evaluationTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginLeft: 12,
  },
  evaluationSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  criterionItem: {
    marginBottom: 32,
  },
  criterionHeader: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  criterionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  booleanContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 16,
  },
  booleanButton: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: colors.gray[100],
    borderRadius: 24,
    alignItems: "center",
  },
  booleanButtonSelected: {
    backgroundColor: colors.primary,
  },
  booleanButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.gray[600],
  },
  booleanButtonTextSelected: {
    color: colors.white,
  },
  textInputContainer: {
    marginTop: 12,
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
  },
  relationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
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
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  scoreButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  scoreButtonSelected: {
    backgroundColor: colors.primary,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  scoreTextSelected: {
    color: colors.white,
  },
  noFieldsContainer: {
    padding: 32,
    alignItems: "center",
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: "dashed",
  },
  noFieldsText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  createButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  createButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
