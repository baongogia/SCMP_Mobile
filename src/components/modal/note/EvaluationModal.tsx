import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { isBooleanTrue } from "../../../screens/instructor/home/Note/utils";

interface EvaluationModalProps {
  visible: boolean;
  onClose: () => void;
  evaluationData: {
    text: string;
    evaluation: Record<string, number | string>;
    evaluationCriteria: any[];
  } | null;
}

export function EvaluationModal({
  visible,
  onClose,
  evaluationData,
}: EvaluationModalProps) {
  if (!evaluationData) return null;

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
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Chi tiết đánh giá</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Note Content */}
          <View style={styles.evaluationNoteSection}>
            <Text style={styles.evaluationNoteLabel}>Nội dung ghi chú:</Text>
            <Text style={styles.evaluationNoteText}>{evaluationData.text}</Text>
          </View>

          {/* Evaluation Results */}
          <View style={styles.evaluationResultsSection}>
            <View style={styles.evaluationHeader}>
              <Ionicons name="star" size={20} color={colors.primary} />
              <Text style={styles.evaluationTitle}>Kết quả đánh giá</Text>
            </View>

            {evaluationData.evaluationCriteria.map((criterion, index) => {
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
                        const fieldValue = evaluationData.evaluation[fieldKey];

                        // Determine if we need a column layout (for long text/media)
                        const isColumnLayout =
                          fieldConfig?.type === "string" ||
                          fieldConfig?.type === "relation";

                        return (
                          <View
                            key={fieldKey}
                            style={[
                              styles.fieldResultContainer,
                              isColumnLayout && {
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: 8,
                              },
                            ]}
                          >
                            <Text style={styles.fieldResultLabel}>
                              {fieldName.charAt(0).toUpperCase() +
                                fieldName.slice(1)}
                            </Text>

                            {/* Hiển thị giá trị theo loại field */}
                            {fieldConfig?.type === "boolean" ? (
                              <View style={styles.booleanResultContainer}>
                                <Text
                                  style={[
                                    styles.booleanResultText,
                                    isBooleanTrue(fieldValue)
                                      ? styles.booleanResultSelected
                                      : styles.booleanResultUnselected,
                                  ]}
                                >
                                  {isBooleanTrue(fieldValue)
                                    ? "Đạt"
                                    : "Không Đạt"}
                                </Text>
                              </View>
                            ) : fieldConfig?.type === "select" ? (
                              <View style={styles.textResultContainer}>
                                <Text style={styles.textResultValue}>
                                  {fieldValue || "Chưa chọn"}
                                </Text>
                              </View>
                            ) : fieldConfig?.type === "string" ? (
                              <View style={styles.cleanTextResultContainer}>
                                <Text style={styles.cleanTextResultValue}>
                                  {fieldValue || "Chưa nhập"}
                                </Text>
                              </View>
                            ) : fieldConfig?.type === "relation" ? (
                              <View style={styles.relationResultContainer}>
                                {fieldValue ? (
                                  <View style={styles.evaluationMediaContainer}>
                                    <Image
                                      source={{
                                        uri: fieldValue?.toString() || "",
                                      }}
                                      style={styles.evaluationMediaImage}
                                      resizeMode="cover"
                                    />
                                  </View>
                                ) : (
                                  <Text style={styles.relationResultText}>
                                    Chưa thêm media
                                  </Text>
                                )}
                              </View>
                            ) : (
                              /* NUMBER / SCORE */
                              <View style={styles.scoreResultContainer}>
                                <View style={styles.evaluationScoreBadge}>
                                  <Text style={styles.evaluationScoreText}>
                                    {fieldValue || 0}
                                  </Text>
                                </View>

                                {/* Only show visualization if max is small (e.g. 5 or 10) */}
                                {(fieldConfig?.max || 100) <= 10 && (
                                  <View style={styles.scoreVisualization}>
                                    {Array.from({
                                      length: fieldConfig?.max || 5,
                                    }).map((_, i) => {
                                      const starValue = i + 1;
                                      return (
                                        <Ionicons
                                          key={starValue}
                                          name={
                                            starValue <= Number(fieldValue || 0)
                                              ? "star"
                                              : "star-outline"
                                          }
                                          size={16}
                                          color={
                                            starValue <= Number(fieldValue || 0)
                                              ? colors.primary
                                              : colors.gray[300]
                                          }
                                          style={styles.scoreStar}
                                        />
                                      );
                                    })}
                                  </View>
                                )}
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
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    textAlign: "center",
  },
  modalCloseButton: {
    padding: 4,
    zIndex: 10,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  evaluationNoteSection: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[100],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  evaluationNoteLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.gray[500],
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  evaluationNoteText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  evaluationResultsSection: {
    marginBottom: 24,
  },
  evaluationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingLeft: 4,
  },
  evaluationTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginLeft: 8,
  },
  evaluationResultItem: {
    backgroundColor: "transparent",
    marginBottom: 16,
  },
  evaluationResultHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  evaluationResultTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
    opacity: 0.8,
  },
  fieldResultContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  fieldResultLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  booleanResultContainer: {
    alignItems: "flex-end",
  },
  booleanResultText: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  booleanResultSelected: {
    color: "#166534",
    backgroundColor: "#DCFCE7",
  },
  booleanResultUnselected: {
    color: "#991B1B",
    backgroundColor: "#FEE2E2",
  },
  textResultContainer: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  textResultValue: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: "700",
  },
  cleanTextResultContainer: {
    width: "100%",
    marginTop: 4,
  },
  cleanTextResultValue: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
  relationResultContainer: {
    marginTop: 4,
  },
  relationResultText: {
    fontSize: 13,
    color: colors.gray[400],
    fontStyle: "italic",
  },
  evaluationMediaContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  evaluationMediaImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  scoreResultContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  evaluationScoreBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  evaluationScoreText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.gray[600],
  },
  scoreVisualization: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreStar: {
    marginRight: 2,
  },
  noFieldsResultContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderStyle: "dashed",
  },
  noFieldsResultText: {
    fontSize: 13,
    color: colors.gray[400],
    fontStyle: "italic",
  },
});
