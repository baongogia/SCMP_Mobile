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
    editSelectedStudentId: string;
    editEvaluationScores: Record<string, number | string | null>;
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
  const [editSelectedStudentId, setEditSelectedStudentId] =
    useState<string>("");
  const [editEvaluationScores, setEditEvaluationScores] = useState<
    Record<string, number | string | null>
  >({});

  useEffect(() => {
    if (note) {
      // Parse note content để lấy text và evaluation data
      const parsedContent = parseNoteContent(note.note);
      setEditNote(parsedContent.text);

      // Initialize student and evaluation state for editing
      setEditSelectedStudentId(note.member?._id || "");
      setEditEvaluationScores(parsedContent.evaluation || {});
    }
  }, [note]);

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
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Note Content Section */}
          <View style={styles.sectionCard}>
            {/* Student Selection Section for Edit */}
            {schedule_id && students.length > 0 && (
              <View style={styles.sectionCard}>
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

            <View style={styles.noteInputContainer}>
              <TextInput
                style={styles.noteInput}
                placeholder="Nhập nội dung ghi chú..."
                placeholderTextColor={colors.gray[400]}
                value={editNote}
                onChangeText={setEditNote}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <View style={styles.noteInputFooter}>
                <Text style={styles.characterCount}>{editNote.length}/500</Text>
              </View>
            </View>
          </View>

          {/* Evaluation Criteria Section for Edit */}
          {editSelectedStudentId && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="star" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Đánh giá học viên</Text>
              </View>
              {evaluationCriteria.length > 0 ? (
                <>
                  <Text style={styles.evaluationSubtitle}>
                    Đánh giá học viên theo các tiêu chí sau
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
                            return (
                              <View
                                key={fieldKey}
                                style={styles.fieldContainer}
                              >
                                {!isBoolean &&
                                  fieldConfig?.type !== "number" && (
                                    <View
                                      style={{
                                        marginBottom: 8,
                                        flexDirection: "row",
                                      }}
                                    >
                                      <Text style={styles.fieldLabel}>
                                        {fieldName.charAt(0).toUpperCase() +
                                          fieldName.slice(1)}
                                      </Text>
                                      {fieldConfig?.required && (
                                        <Text
                                          style={{
                                            color: colors.error,
                                            marginLeft: 4,
                                            fontSize: 16,
                                            fontWeight: "bold",
                                          }}
                                        >
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
                                        <Text
                                          style={{
                                            color: colors.error,
                                            marginLeft: 4,
                                            fontSize: 16,
                                            fontWeight: "bold",
                                          }}
                                        >
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
                                        setEditEvaluationScores((prev) => ({
                                          ...prev,
                                          [fieldKey]: value ? 1 : 0,
                                        }));
                                      }}
                                      value={isBooleanTrue(
                                        editEvaluationScores[fieldKey]
                                      )}
                                    />
                                  </View>
                                ) : fieldConfig?.type === "select" ? (
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
                                          editEvaluationScores[fieldKey] ===
                                          cleanVal;
                                        return (
                                          <TouchableOpacity
                                            key={idx}
                                            onPress={() => {
                                              setEditEvaluationScores(
                                                (prev) => ({
                                                  ...prev,
                                                  [fieldKey]: cleanVal,
                                                })
                                              );
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
                                        marginTop: 0,
                                      },
                                    ]}
                                  >
                                    <TextInput
                                      style={[
                                        styles.textInput,
                                        {
                                          height: 80,
                                          backgroundColor: "transparent",
                                          borderWidth: 0,
                                        },
                                      ]}
                                      multiline
                                      textAlignVertical="top"
                                      value={
                                        typeof editEvaluationScores[
                                          fieldKey
                                        ] === "string"
                                          ? (editEvaluationScores[
                                              fieldKey
                                            ] as string)
                                          : ""
                                      }
                                      onChangeText={(text) => {
                                        setEditEvaluationScores((prev) => ({
                                          ...prev,
                                          [fieldKey]: text,
                                        }));
                                      }}
                                      placeholder="Nhập văn bản..."
                                      placeholderTextColor={colors.gray[400]}
                                      keyboardType="default"
                                    />
                                  </View>
                                ) : fieldConfig?.type === "number" ? (
                                  /* 4. NUMBER */
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
                                        <Text
                                          style={{
                                            color: colors.error,
                                            marginLeft: 4,
                                            fontSize: 16,
                                            fontWeight: "bold",
                                          }}
                                        >
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
                                          typeof editEvaluationScores[
                                            fieldKey
                                          ] === "number"
                                            ? editEvaluationScores[
                                                fieldKey
                                              ]?.toString() || ""
                                            : ""
                                        }
                                        onChangeText={(text) => {
                                          if (text === "") {
                                            setEditEvaluationScores((prev) => ({
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
                                            setEditEvaluationScores((prev) => ({
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
                                  <View style={styles.relationContainer}>
                                    {editEvaluationScores[fieldKey] ? (
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
                                                backgroundColor:
                                                  colors.gray[100],
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
                                  <View />
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
              isUpdating && styles.createButtonDisabled,
            ]}
            onPress={handleUpdateNote}
            disabled={isUpdating}
          >
            <View style={styles.createButtonContainer}>
              <Ionicons
                name={
                  isUpdating ? "hourglass-outline" : "checkmark-circle-outline"
                }
                size={20}
                color={colors.white}
              />
              <Text style={styles.createButtonText}>
                {isUpdating ? "Đang cập nhật..." : "Cập nhật ghi chú"}
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
    backgroundColor: "#15803d",
  },
  checkboxUnchecked: {
    backgroundColor: "#b91c1c",
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
    borderBottomColor: colors.primary,
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

  // No Fields Container
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
