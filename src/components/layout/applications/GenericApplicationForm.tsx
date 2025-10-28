import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { dimensions } from "@/src/constants/dimensions";
import Toast from "react-native-toast-message";
import { sendApplication } from "@/src/services/information/applications/applicationsServices";

interface GenericApplicationFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  applicationType: {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
  };
}

export default function GenericApplicationForm({
  visible,
  onClose,
  onSubmit,
  applicationType,
}: GenericApplicationFormProps) {
  const TITLE_MAX = 80;
  const CONTENT_MAX = 1000;
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    media: "",
    status: "pending",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Autofill title with the selected application type when opening
  useEffect(() => {
    if (!visible) return;
    setFormData((prev) => ({
      ...prev,
      title:
        prev.title && prev.title.trim().length > 0
          ? prev.title
          : applicationType?.title || "",
    }));
  }, [visible, applicationType?.title]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng điền đầy đủ tiêu đề và nội dung",
      });
      return;
    }

    setIsLoading(true);

    try {
      const applicationToSend: {
        title: string;
        content: string;
        file?: string;
        type?: string;
      } = {
        title: formData.title,
        content: formData.content,
        file: formData.media || undefined,
      };

      if (applicationType.id && applicationType.id.match(/^[0-9a-fA-F]{24}$/)) {
        applicationToSend.type = applicationType.id;
      }

      console.log("Sending application data:", applicationToSend);
      await sendApplication(applicationToSend);

      Toast.show({
        type: "success",
        text1: "Gửi đơn thành công",
        text2: "Đơn của bạn đã được gửi và sẽ được xem xét",
      });

      onSubmit({
        title: formData.title,
        content: formData.content,
        media: formData.media || "",
        status: formData.status,
        type: applicationType.id,
      });

      onClose();
    } catch {
      Toast.show({
        type: "error",
        text1: "Lỗi gửi đơn",
        text2: "Có lỗi xảy ra khi gửi đơn. Vui lòng thử lại.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      media: "",
      status: "pending",
    });
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View
          style={[styles.headerGradient, { backgroundColor: colors.primary }]}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text
              style={styles.headerTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {applicationType.title}
            </Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formContainer}>
            <View style={styles.section}>
              {/* <Text style={styles.sectionTitle}>Thông tin đơn</Text> */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tiêu đề *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập tiêu đề đơn"
                    maxLength={TITLE_MAX}
                    value={formData.title}
                    onChangeText={(text) =>
                      setFormData({ ...formData, title: text })
                    }
                  />
                </View>
                <View style={styles.fieldMetaRow}>
                  <Text style={styles.hintText}>Ngắn gọn, rõ ràng</Text>
                  <Text style={styles.counterText}>
                    {formData.title.length}/{TITLE_MAX}
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nội dung *</Text>
                <View style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Nhập nội dung chi tiết..."
                    maxLength={CONTENT_MAX}
                    value={formData.content}
                    onChangeText={(text) =>
                      setFormData({ ...formData, content: text })
                    }
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>
                <View style={styles.fieldMetaRow}>
                  <Text style={styles.hintText}>
                    Có thể đính kèm liên kết bên dưới
                  </Text>
                  <Text style={styles.counterText}>
                    {formData.content.length}/{CONTENT_MAX}
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tệp đính kèm (tùy chọn)</Text>
                <View style={[styles.inputContainer, styles.mbSmall]}>
                  <Ionicons
                    name="attach-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Link hoặc tên tệp đính kèm"
                    value={formData.media}
                    onChangeText={(text) =>
                      setFormData({ ...formData, media: text })
                    }
                  />
                </View>
                <Text style={styles.hintText}>
                  Ưu tiên liên kết Google Drive/Dropbox
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Trạng thái</Text>
                <View style={styles.statusContainer}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      formData.status === "pending" &&
                        styles.statusButtonActive,
                    ]}
                    onPress={() =>
                      setFormData({ ...formData, status: "pending" })
                    }
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        formData.status === "pending" &&
                          styles.statusButtonTextActive,
                      ]}
                    >
                      Chờ xử lý
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      formData.status === "urgent" && styles.statusButtonActive,
                    ]}
                    onPress={() =>
                      setFormData({ ...formData, status: "urgent" })
                    }
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        formData.status === "urgent" &&
                          styles.statusButtonTextActive,
                      ]}
                    >
                      Khẩn cấp
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <View
              style={[
                styles.submitGradient,
                { backgroundColor: colors.primary },
                isLoading && styles.submitButtonDisabled,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="send" size={20} color={colors.white} />
              )}
              <Text style={styles.submitButtonText}>
                {isLoading ? "Đang gửi..." : "Gửi đơn"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerGradient: {
    paddingTop: 28,
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: dimensions.spacing.md,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: dimensions.fontSize.md,
    fontWeight: "bold",
    color: colors.white,
  },
  placeholder: {
    width: 28,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: dimensions.spacing.md,
    paddingBottom: dimensions.spacing.xl,
  },
  formContainer: {
    backgroundColor: colors.white,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.lg,
  },
  section: {
    marginBottom: dimensions.spacing.lg,
  },
  sectionTitle: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: dimensions.spacing.lg,
  },
  inputGroup: {
    marginBottom: dimensions.spacing.lg,
  },
  label: {
    fontSize: dimensions.fontSize.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: dimensions.spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    paddingHorizontal: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    height: dimensions.inputHeight.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    flex: 1,
    height: dimensions.inputHeight.lg,
    fontSize: dimensions.fontSize.md,
    color: colors.text,
    marginLeft: dimensions.spacing.sm,
  },
  textAreaContainer: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    minHeight: 300,
    fontSize: dimensions.fontSize.md,
    color: colors.text,
    padding: dimensions.spacing.md,
    textAlignVertical: "top",
  },
  fieldMetaRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  counterText: {
    fontSize: dimensions.fontSize.xs,
    color: colors.gray[500],
  },
  hintText: {
    fontSize: dimensions.fontSize.xs,
    color: colors.gray[500],
  },
  mbSmall: {
    marginBottom: dimensions.spacing.sm,
  },
  statusContainer: {
    flexDirection: "row",
    gap: dimensions.spacing.sm,
  },
  statusButton: {
    flex: 1,
    paddingVertical: dimensions.spacing.sm,
    paddingHorizontal: dimensions.spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  statusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusButtonText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
  },
  statusButtonTextActive: {
    color: colors.white,
  },
  footer: {
    flexDirection: "row",
    padding: dimensions.spacing.lg,
    gap: dimensions.spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: dimensions.buttonHeight.lg,
    borderRadius: dimensions.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[300],
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: dimensions.fontSize.md,
    fontWeight: "600",
    color: colors.gray[600],
  },
  submitButton: {
    flex: 2,
    borderRadius: dimensions.borderRadius.lg,
    overflow: "hidden",
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: dimensions.buttonHeight.lg,
    gap: dimensions.spacing.sm,
  },
  submitButtonText: {
    fontSize: dimensions.fontSize.md,
    fontWeight: "bold",
    color: colors.white,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});
