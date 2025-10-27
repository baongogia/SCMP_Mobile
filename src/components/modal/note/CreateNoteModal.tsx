import React, { useState } from "react";
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
import { isBooleanTrue } from "../../../screens/instructor/home/Note/utils";

interface CreateNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateNote: (noteData: {
    note: string;
    mediaIds: string[];
    selectedStudentId: string;
    evaluationScores: Record<string, number | null>;
  }) => Promise<void>;
  isCreating: boolean;
  schedule_id?: string;
  students: any[];
  evaluationCriteria: any[];
}

export function CreateNoteModal({
  visible,
  onClose,
  onCreateNote,
  isCreating,
  schedule_id,
  students,
  evaluationCriteria,
}: CreateNoteModalProps) {
  const [newNote, setNewNote] = useState("");
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [evaluationScores, setEvaluationScores] = useState<
    Record<string, number | null>
  >({});

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

  const handleRemoveMedia = (fieldKey: string) => {
    setEvaluationScores((prev) => ({
      ...prev,
      [fieldKey]: null,
    }));
    showSuccessToast("Đã xóa media!");
  };

  const handleCreateNote = async () => {
    if (!newNote.trim()) {
      showInfoToast("Vui lòng nhập nội dung ghi chú", "Thông báo");
      return;
    }

    await onCreateNote({
      note: newNote,
      mediaIds,
      selectedStudentId,
      evaluationScores,
    });

    // Reset form
    setNewNote("");
    setMediaIds([]);
    setUploadedMedia([]);
    setSelectedStudentId("");
    setEvaluationScores({});
  };

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
                  <Text style={styles.mediaPreviewTitle}>Media đã upload</Text>
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
                                    isBooleanTrue(evaluationScores[fieldKey]) &&
                                      styles.booleanButtonSelected,
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
                                    evaluationScores[fieldKey]?.toString() || ""
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
                                        evaluationScores[fieldKey] === score &&
                                          styles.scoreTextSelected,
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
            onPress={handleCreateNote}
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
    paddingHorizontal: 24,
    paddingVertical: 20,
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
  studentSection: {
    marginBottom: 24,
  },
  studentLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
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
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
    backgroundColor: colors.gray[400],
  },
  uploadButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  mediaCount: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
    fontWeight: "500",
  },
  mediaPreviewContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  mediaPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  mediaPreviewTitle: {
    fontSize: 16,
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
    maxHeight: 120,
  },
  mediaPreviewContent: {
    paddingRight: 20,
  },
  mediaPreviewItem: {
    marginRight: 16,
  },
  mediaPreviewCard: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
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
    padding: 6,
  },
  mediaRemoveButton: {
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
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
