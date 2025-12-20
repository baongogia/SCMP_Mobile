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
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "@/src/constants/colors";
import { CustomDropdown } from "@/src/components/custom/dropdown/CustomDropdown";
import { postMedia } from "@/src/services/auth/authService";
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
    evaluationScores: Record<string, number | string | null>;
  }) => Promise<void>;
  isCreating: boolean;
  schedule_id?: string;
  students: any[];
  evaluationCriteria: any[];
  initialSelectedStudentId?: string;
  existingNotes?: any[];
  studentsLoading?: boolean; // New prop
}

export function CreateNoteModal({
  visible,
  onClose,
  onCreateNote,
  isCreating,
  schedule_id,
  students,
  evaluationCriteria,
  initialSelectedStudentId,
  existingNotes = [],
  studentsLoading = false, // New prop
}: CreateNoteModalProps) {
  const [newNote, setNewNote] = useState("");
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialSelectedStudentId || ""
  );
  const [evaluationScores, setEvaluationScores] = useState<
    Record<string, number | string | null>
  >({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Calculate if a note already exists for the selected student
  // Calculate if a note already exists for the selected student
  const existingNoteForStudent = selectedStudentId
    ? existingNotes?.find((note) => {
        // Check for member ID (try both member object and direct ID for safety)
        const noteStudentId = note.member?._id || note.student_id;
        const studentMatch = noteStudentId === selectedStudentId;

        // Check for schedule ID (try both schedule object and direct ID)
        const noteScheduleId = note.schedule?._id || note.schedule_id;
        const scheduleMatch = schedule_id
          ? noteScheduleId === schedule_id
          : true;

        return studentMatch && scheduleMatch;
      })
    : undefined;

  // Set initial selected student when modal opens or initialSelectedStudentId changes
  useEffect(() => {
    if (visible) {
      // When modal opens, set selected student from initialSelectedStudentId
      if (initialSelectedStudentId) {
        setSelectedStudentId(initialSelectedStudentId);
      }
    } else {
      // Reset when modal closes
      setSelectedStudentId("");
      setNewNote("");
      setMediaIds([]);
      setUploadedMedia([]);
      setEvaluationScores({});
      setFormErrors({});
    }
  }, [visible, initialSelectedStudentId]);

  // Debug: Log when selectedStudentId or evaluationCriteria changes
  useEffect(() => {
    if (visible) {
      console.log("CreateNoteModal - selectedStudentId:", selectedStudentId);
      console.log("CreateNoteModal - evaluationCriteria:", evaluationCriteria);
      console.log(
        "CreateNoteModal - evaluationCriteria length:",
        evaluationCriteria?.length || 0
      );
      console.log(
        "CreateNoteModal - should show evaluation:",
        selectedStudentId && evaluationCriteria?.length > 0
      );
    }
  }, [visible, selectedStudentId, evaluationCriteria]);

  // Log when props change
  useEffect(() => {
    console.log(
      "CreateNoteModal props - evaluationCriteria:",
      evaluationCriteria
    );
    console.log(
      "CreateNoteModal props - evaluationCriteria length:",
      evaluationCriteria?.length || 0
    );
  }, [evaluationCriteria]);

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
            const response = await postMedia(formData);
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
            const response = await postMedia(formData);
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
    // Validate required fields
    const newFormErrors: Record<string, string> = {};
    let hasError = false;
    // Prepare final scores to include default values for boolean fields
    const finalEvaluationScores = { ...evaluationScores };

    if (!newNote.trim()) {
      newFormErrors["note"] = "Vui lòng nhập nội dung ghi chú";
      hasError = true;
    }

    if (!selectedStudentId) {
      newFormErrors["student"] = "Vui lòng chọn học viên";
      hasError = true;
    }

    if (existingNoteForStudent) {
      showInfoToast("Đã có đánh giá cho học viên này", "Thông báo");
      return;
    }

    if (selectedStudentId && evaluationCriteria.length > 0) {
      evaluationCriteria.forEach((criterion, index) => {
        if (criterion.evaluationFields) {
          criterion.evaluationFields.forEach(
            (fieldName: string, fieldIndex: number) => {
              const fieldKey = `${index}_${fieldName}`;
              const fieldConfig = criterion.form_judge?.items?.[fieldName];
              const isBoolean = fieldConfig?.type === "boolean";

              // Handle boolean defaults
              if (
                isBoolean &&
                (finalEvaluationScores[fieldKey] === undefined ||
                  finalEvaluationScores[fieldKey] === null)
              ) {
                finalEvaluationScores[fieldKey] = 0; // Default to false/0
              }

              if (fieldConfig?.required) {
                const value = finalEvaluationScores[fieldKey];

                // For boolean, 0 is valid (false). checking for null/undefined/empty string
                if (value === undefined || value === null || value === "") {
                  newFormErrors[fieldKey] = "Vui lòng nhập thông tin bắt buộc";
                  hasError = true;
                }
              }
            }
          );
        }
      });
    }

    if (hasError) {
      setFormErrors(newFormErrors);
      return;
    }

    await onCreateNote({
      note: newNote,
      mediaIds,
      selectedStudentId,
      evaluationScores: finalEvaluationScores,
    });

    // Reset form
    setNewNote("");
    setMediaIds([]);
    setUploadedMedia([]);
    setSelectedStudentId("");
    setEvaluationScores({});
    setFormErrors({});
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
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Warning if note exists */}
          {existingNoteForStudent && (
            <View style={styles.warningContainer}>
              <Ionicons
                name="alert-circle"
                size={24}
                color={colors.warning}
                style={styles.warningIcon}
              />
              <Text style={styles.warningText}>
                Đã có đánh giá cho học viên này trong buổi học.
              </Text>
            </View>
          )}
          {/* Student Selection Section */}
          {schedule_id && students.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>
                  Chọn học viên
                </Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <CustomDropdown
                items={[
                  { label: "Không chọn học viên", value: "" },
                  ...students.map((student, index) => ({
                    label:
                      student.username ||
                      student.name ||
                      `Học viên ${index + 1}`,
                    value: student._id,
                  })),
                ]}
                selectedValue={selectedStudentId}
                onValueChange={setSelectedStudentId}
                placeholder="Chọn học viên"
                icon="person"
              />
              {studentsLoading && (
                <View
                  style={{
                    marginTop: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    Đang tải danh sách học viên...
                  </Text>
                </View>
              )}
              {formErrors["student"] && (
                <Text style={styles.errorText}>{formErrors["student"]}</Text>
              )}
            </View>
          )}

          {/* Note Content Section */}
          <View style={styles.sectionCard}>
            <View style={styles.labelRow}>
              <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>
                Nội dung ghi chú
              </Text>
              <Text style={styles.requiredStar}>*</Text>
            </View>
            <View style={styles.noteInputContainer}>
              <TextInput
                style={styles.noteInput}
                placeholder="Nhập nội dung ghi chú..."
                placeholderTextColor={colors.gray[400]}
                value={newNote}
                onChangeText={setNewNote}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <View style={styles.noteInputFooter}>
                <Text style={styles.characterCount}>{newNote.length}/500</Text>
              </View>
            </View>
            {formErrors["note"] && (
              <Text style={styles.errorText}>{formErrors["note"]}</Text>
            )}
          </View>

          {/* Evaluation Criteria Section */}
          {selectedStudentId && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="star" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Đánh giá học viên</Text>
              </View>
              {evaluationCriteria.length > 0 ? (
                <>
                  <Text style={styles.evaluationSubtitle}>
                    Đánh giá học viên theo các tiêu chí sau (thang điểm 1-5)
                  </Text>
                  {evaluationCriteria.map((criterion, index) => (
                    <View
                      key={criterion._id || index}
                      style={styles.criterionCard}
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

                            const isBoolean = fieldConfig?.type === "boolean";
                            const isSelect = fieldConfig?.type === "select";

                            return (
                              <View
                                key={fieldKey}
                                style={styles.fieldContainer}
                              >
                                {/* HEADER LABEL for fields that are NOT inline-row types (Boolean/Number) */}
                                {!isBoolean &&
                                  fieldConfig?.type !== "number" && (
                                    <View style={styles.labelRow}>
                                      <Text style={styles.fieldLabel}>
                                        {fieldName.charAt(0).toUpperCase() +
                                          fieldName.slice(1)}
                                      </Text>
                                      {fieldConfig?.required && (
                                        <Text style={styles.requiredStar}>
                                          *
                                        </Text>
                                      )}
                                    </View>
                                  )}

                                {/* 1. BOOLEAN - SWITCH */}
                                {isBoolean ? (
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      paddingVertical: 4,
                                      minHeight: 48,
                                    }}
                                  >
                                    <View
                                      style={{
                                        flex: 1,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        paddingRight: 12,
                                      }}
                                    >
                                      <Text
                                        style={[
                                          styles.fieldLabel,
                                          { marginBottom: 0 },
                                        ]}
                                      >
                                        {fieldName.charAt(0).toUpperCase() +
                                          fieldName.slice(1)}
                                      </Text>
                                      {fieldConfig?.required && (
                                        <Text style={styles.requiredStar}>
                                          *
                                        </Text>
                                      )}
                                    </View>
                                    <Switch
                                      trackColor={{
                                        false: colors.gray[300],
                                        true: colors.primary,
                                      }}
                                      thumbColor={colors.white}
                                      ios_backgroundColor={colors.gray[300]}
                                      onValueChange={(value) => {
                                        setEvaluationScores((prev) => ({
                                          ...prev,
                                          [fieldKey]: value ? 1 : 0,
                                        }));
                                      }}
                                      value={isBooleanTrue(
                                        evaluationScores[fieldKey]
                                      )}
                                    />
                                  </View>
                                ) : isSelect ? (
                                  /* 2. SELECT - WRAPPED CHIPS */
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      flexWrap: "wrap",
                                      gap: 8,
                                      paddingVertical: 4,
                                    }}
                                  >
                                    {fieldConfig?.select_values
                                      ?.split(",")
                                      .map((val: string, idx: number) => {
                                        const cleanVal = val.trim();
                                        const isSelected =
                                          evaluationScores[fieldKey] ===
                                          cleanVal;
                                        return (
                                          <TouchableOpacity
                                            key={idx}
                                            onPress={() => {
                                              setEvaluationScores((prev) => ({
                                                ...prev,
                                                [fieldKey]: cleanVal,
                                              }));
                                            }}
                                            style={{
                                              paddingHorizontal: 16,
                                              paddingVertical: 10,
                                              borderRadius: 12,
                                              backgroundColor: isSelected
                                                ? colors.primary
                                                : colors.gray[50],
                                              borderWidth: 1,
                                              borderColor: isSelected
                                                ? colors.primary
                                                : "transparent",
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: 14,
                                                fontWeight: isSelected
                                                  ? "600"
                                                  : "500",
                                                color: isSelected
                                                  ? colors.white
                                                  : colors.textSecondary,
                                              }}
                                            >
                                              {cleanVal}
                                            </Text>
                                          </TouchableOpacity>
                                        );
                                      })}
                                  </View>
                                ) : fieldConfig?.type === "string" &&
                                  fieldConfig?.text_type === "short_text" ? (
                                  /* 3. STRING */
                                  <View
                                    style={[
                                      styles.textInputContainer,
                                      {
                                        backgroundColor: colors.gray[50],
                                        borderWidth: 0,
                                      },
                                    ]}
                                  >
                                    <TextInput
                                      style={[styles.textInput, { height: 80 }]}
                                      multiline
                                      textAlignVertical="top"
                                      value={
                                        typeof evaluationScores[fieldKey] ===
                                        "string"
                                          ? (evaluationScores[
                                              fieldKey
                                            ] as string)
                                          : ""
                                      }
                                      onChangeText={(text) => {
                                        setEvaluationScores((prev) => ({
                                          ...prev,
                                          [fieldKey]: text,
                                        }));
                                      }}
                                      placeholder="Nhập nhận xét chi tiết..."
                                      placeholderTextColor={colors.gray[400]}
                                    />
                                  </View>
                                ) : fieldConfig?.type === "number" ? (
                                  /* 4. NUMBER - FLEX ROW (NO OVERLAP) */
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      paddingVertical: 4,
                                      minHeight: 48,
                                    }}
                                  >
                                    <View
                                      style={{
                                        flex: 1,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        paddingRight: 12,
                                      }}
                                    >
                                      <Text
                                        style={[
                                          styles.fieldLabel,
                                          { marginBottom: 0 },
                                        ]}
                                      >
                                        {fieldName.charAt(0).toUpperCase() +
                                          fieldName.slice(1)}
                                      </Text>
                                      {fieldConfig?.required && (
                                        <Text style={styles.requiredStar}>
                                          *
                                        </Text>
                                      )}
                                    </View>
                                    <View
                                      style={{
                                        width: "45%",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        backgroundColor: colors.gray[50],
                                        borderRadius: 12,
                                        paddingHorizontal: 12,
                                        height: 48,
                                      }}
                                    >
                                      <TextInput
                                        style={{
                                          flex: 1,
                                          textAlign: "right",
                                          fontWeight: "600",
                                          color: colors.primary,
                                          fontSize: 16,
                                          height: "100%",
                                        }}
                                        value={
                                          typeof evaluationScores[fieldKey] ===
                                          "number"
                                            ? evaluationScores[
                                                fieldKey
                                              ]?.toString() || ""
                                            : ""
                                        }
                                        onChangeText={(text) => {
                                          if (text === "") {
                                            setEvaluationScores((prev) => ({
                                              ...prev,
                                              [fieldKey]: null,
                                            }));
                                            return;
                                          }
                                          const numValue = parseInt(text) || 0;
                                          if (
                                            numValue >=
                                              (fieldConfig.min || 0) &&
                                            numValue <= (fieldConfig.max || 100)
                                          ) {
                                            setEvaluationScores((prev) => ({
                                              ...prev,
                                              [fieldKey]: numValue,
                                            }));
                                          }
                                        }}
                                        placeholder="0"
                                        placeholderTextColor={colors.gray[400]}
                                        keyboardType="numeric"
                                      />
                                      {fieldConfig.max && (
                                        <Text
                                          style={{
                                            color: colors.gray[400],
                                            fontSize: 14,
                                            marginLeft: 8,
                                          }}
                                        >
                                          /{fieldConfig.max}
                                        </Text>
                                      )}
                                    </View>
                                  </View>
                                ) : fieldConfig?.type === "relation" ? (
                                  /* 5. RELATION - IMAGE */
                                  <View style={styles.relationContainer}>
                                    {evaluationScores[fieldKey] ? (
                                      <View
                                        style={styles.evaluationMediaPreview}
                                      >
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
                                              handleRelationMediaUpload(
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
                                        <TouchableOpacity
                                          style={{
                                            height: 100,
                                            width: 100,
                                            backgroundColor: colors.gray[100],
                                            borderRadius: 8,
                                            justifyContent: "center",
                                            alignItems: "center",
                                            borderWidth: 1,
                                            borderColor: colors.gray[200],
                                            borderStyle: "dashed",
                                          }}
                                          onPress={() =>
                                            handleRelationMediaUpload(fieldKey)
                                          }
                                        >
                                          <Ionicons
                                            name="image-outline"
                                            size={24}
                                            color={colors.gray[400]}
                                          />
                                          <Text
                                            style={{
                                              fontSize: 10,
                                              color: colors.gray[500],
                                              marginTop: 4,
                                            }}
                                          >
                                            Thêm ảnh
                                          </Text>
                                        </TouchableOpacity>
                                      </View>
                                    )}
                                  </View>
                                ) : (
                                  /* FALLBACK - SCORE BUTTONS */
                                  <View style={styles.scoreContainer}>
                                    {[1, 2, 3, 4, 5].map((score) => (
                                      <TouchableOpacity
                                        key={score}
                                        style={[
                                          styles.scoreButton,
                                          evaluationScores[fieldKey] ===
                                            score && styles.scoreButtonSelected,
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

                                {formErrors[fieldKey] && (
                                  <Text style={styles.errorText}>
                                    {formErrors[fieldKey]}
                                  </Text>
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
                </>
              ) : (
                <View style={styles.noFieldsContainer}>
                  <Text style={styles.noFieldsText}>
                    Chưa có tiêu chí đánh giá cho buổi học này
                  </Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.createButton,
              isCreating && styles.createButtonDisabled,
            ]}
            onPress={handleCreateNote}
            disabled={isCreating || !!existingNoteForStudent}
          >
            <View
              style={[
                styles.createButtonContainer,
                !!existingNoteForStudent && styles.createButtonDisabled,
              ]}
            >
              <Ionicons
                name={
                  isCreating ? "hourglass-outline" : "checkmark-circle-outline"
                }
                size={20}
                color={colors.white}
              />
              <Text style={styles.createButtonText}>
                {isCreating ? "Đang tạo..." : "Tạo ghi chú"}
              </Text>
            </View>
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: colors.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
  },
  modalCloseButton: {
    position: "absolute",
    left: 20,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeaderSpacer: {
    width: 32,
  },
  modalContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  // Flat Sections
  sectionCard: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 8,
  },

  // Validation Styles
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  requiredStar: {
    color: colors.error,
    marginLeft: 4,
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7ed",
    padding: 12,
    marginVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  warningIcon: {
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    color: "#c2410c",
    fontSize: 14,
    fontWeight: "500",
  },

  // Note Input
  noteInputContainer: {
    position: "relative",
  },
  noteInput: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.gray[50],
    minHeight: 120,
    textAlignVertical: "top",
    borderWidth: 0.5,
    borderColor: colors.gray[200],
    fontFamily: "System",
    lineHeight: 24,
  },
  noteInputFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  characterCount: {
    fontSize: 12,
    color: colors.gray[400],
    fontWeight: "500",
  },

  // Checkbox (Compact Boolean)
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 15,
    color: colors.text,
    fontWeight: "500",
  },
  customCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: "#15803d", // Dark Green
  },
  checkboxUnchecked: {
    backgroundColor: "#b91c1c", // Dark Red
  },

  // Media Section
  mediaGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  mediaItem: {
    position: "relative",
    marginRight: 8,
    marginBottom: 8,
  },
  mediaThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: colors.gray[200],
  },
  removeMediaButton: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addMediaPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: "dashed",
  },
  addMediaPlaceholderContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  // Evaluation Section
  evaluationSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  criterionCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  criterionHeader: {
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  criterionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  fieldContainer: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  // Boolean Buttons
  booleanContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    gap: 8,
  },
  booleanButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.gray[100],
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  booleanButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  booleanButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.gray[600],
  },
  booleanButtonTextSelected: {
    color: colors.white,
  },

  // Text Input
  textInputContainer: {
    marginTop: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.white,
  },

  // Relation Container
  relationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
  },
  evaluationMediaPreview: {
    alignItems: "center",
    marginTop: 6,
  },
  evaluationMediaPreviewImageContainer: {
    position: "relative",
    alignSelf: "center",
  },
  evaluationMediaPreviewImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  editMediaButton: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  removeEvaluationMediaButton: {
    position: "absolute",
    top: -4,
    left: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    justifyContent: "center",
    alignItems: "center",
  },
  addMediaButton: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  // Score Container
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    gap: 6,
  },
  scoreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  scoreButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  scoreTextSelected: {
    color: colors.white,
  },

  noFieldsContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: "dashed",
  },
  noFieldsText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  // Create Button
  createButton: {
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginBottom: 20,
  },
  createButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  createButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
});
