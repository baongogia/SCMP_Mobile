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
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Chi tiết đánh giá</Text>
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
                            ) : fieldConfig?.type === "string" &&
                              fieldConfig?.text_type === "short_text" ? (
                              <View style={styles.textResultContainer}>
                                <Text style={styles.textResultValue}>
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
                                    {/* <Text style={styles.evaluationMediaText}>
                                      Media đã chọn
                                    </Text> */}
                                  </View>
                                ) : (
                                  <Text style={styles.relationResultText}>
                                    Chưa thêm media
                                  </Text>
                                )}
                              </View>
                            ) : (
                              <View style={styles.scoreResultContainer}>
                                <View style={styles.evaluationScoreBadge}>
                                  <Text style={styles.evaluationScoreText}>
                                    {fieldValue || 0}/5
                                  </Text>
                                </View>

                                {/* Score Visualization */}
                                <View style={styles.scoreVisualization}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Ionicons
                                      key={star}
                                      name={
                                        star <= Number(fieldValue || 0)
                                          ? "star"
                                          : "star-outline"
                                      }
                                      size={16}
                                      color={
                                        star <= Number(fieldValue || 0)
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
  modalHeaderSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
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
  evaluationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  evaluationTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginLeft: 10,
    letterSpacing: 0.5,
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
    backgroundColor: "#15803d", // Dark Green
    shadowColor: "#15803d",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  booleanResultUnselected: {
    color: colors.white,
    backgroundColor: "#b91c1c", // Dark Red
    shadowColor: "#b91c1c",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
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
  scoreResultContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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

});
