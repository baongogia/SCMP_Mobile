import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { dimensions } from "@/src/constants/dimensions";
import Toast from "react-native-toast-message";

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
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    media: "",
    status: "pending",
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.content) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng điền đầy đủ tiêu đề và nội dung",
      });
      return;
    }

    onSubmit({
      title: formData.title,
      content: formData.content,
      media: formData.media || "",
      status: formData.status,
      type: applicationType.id,
    });

    onClose();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      media: "",
      status: "pending",
    });
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
          style={[
            styles.headerGradient,
            { backgroundColor: applicationType.color },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{applicationType.title}</Text>
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
              <Text style={styles.sectionTitle}>Thông tin đơn</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tiêu đề *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={applicationType.color}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập tiêu đề đơn"
                    value={formData.title}
                    onChangeText={(text) =>
                      setFormData({ ...formData, title: text })
                    }
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nội dung *</Text>
                <View style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Nhập nội dung chi tiết..."
                    value={formData.content}
                    onChangeText={(text) =>
                      setFormData({ ...formData, content: text })
                    }
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tệp đính kèm (tùy chọn)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="attach-outline"
                    size={20}
                    color={applicationType.color}
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
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <View
              style={[
                styles.submitGradient,
                { backgroundColor: applicationType.color },
              ]}
            >
              <Ionicons name="send" size={20} color={colors.white} />
              <Text style={styles.submitButtonText}>Gửi đơn</Text>
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
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: dimensions.spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: dimensions.fontSize.xl,
    fontWeight: "bold",
    color: colors.white,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: dimensions.spacing.lg,
    paddingBottom: dimensions.spacing.xl,
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: colors.gray[50],
    borderRadius: dimensions.borderRadius.lg,
    paddingHorizontal: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  input: {
    flex: 1,
    height: dimensions.inputHeight.lg,
    fontSize: dimensions.fontSize.md,
    color: colors.text,
    marginLeft: dimensions.spacing.sm,
  },
  textAreaContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: dimensions.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  textArea: {
    minHeight: 120,
    fontSize: dimensions.fontSize.md,
    color: colors.text,
    padding: dimensions.spacing.md,
    textAlignVertical: "top",
  },
  statusContainer: {
    flexDirection: "row",
    gap: dimensions.spacing.sm,
  },
  statusButton: {
    flex: 1,
    paddingVertical: dimensions.spacing.sm,
    paddingHorizontal: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: "center",
  },
  statusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusButtonText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.gray[600],
    fontWeight: "500",
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
});
