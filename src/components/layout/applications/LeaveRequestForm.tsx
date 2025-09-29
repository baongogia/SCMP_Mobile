import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { dimensions } from "@/src/constants/dimensions";
import { CustomDropdown } from "@/src/components/custom";
import Toast from "react-native-toast-message";

interface LeaveRequestFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const leaveTypes = [
  { label: "Nghỉ phép", value: "annual_leave", icon: "calendar-outline" },
  { label: "Nghỉ ốm", value: "sick_leave", icon: "medical-outline" },
  { label: "Nghỉ việc riêng", value: "personal_leave", icon: "person-outline" },
  { label: "Nghỉ thai sản", value: "maternity_leave", icon: "heart-outline" },
  {
    label: "Nghỉ khác",
    value: "other_leave",
    icon: "ellipsis-horizontal-outline",
  },
];

export default function LeaveRequestForm({
  visible,
  onClose,
  onSubmit,
}: LeaveRequestFormProps) {
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    contactInfo: "",
    urgent: false,
  });

  const handleSubmit = () => {
    if (
      !formData.leaveType ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.reason
    ) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
      return;
    }

    onSubmit({
      title: "Đơn xin nghỉ phép",
      content: `Loại nghỉ: ${
        leaveTypes.find((t) => t.value === formData.leaveType)?.label
      }
Ngày bắt đầu: ${formData.startDate}
Ngày kết thúc: ${formData.endDate}
Lý do: ${formData.reason}
Thông tin liên hệ: ${formData.contactInfo}
Khẩn cấp: ${formData.urgent ? "Có" : "Không"}`,
      type: "leave_request",
      data: formData,
    });

    onClose();
  };

  const resetForm = () => {
    setFormData({
      leaveType: "",
      startDate: "",
      endDate: "",
      reason: "",
      contactInfo: "",
      urgent: false,
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
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Đơn xin nghỉ phép</Text>
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
              <Text style={styles.sectionTitle}>Thông tin nghỉ phép</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Loại nghỉ phép *</Text>
                <CustomDropdown
                  items={leaveTypes}
                  selectedValue={formData.leaveType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, leaveType: value })
                  }
                  placeholder="Chọn loại nghỉ phép"
                  icon="calendar-outline"
                />
              </View>

              <View style={styles.dateRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Ngày bắt đầu *</Text>
                  <View style={styles.dateInput}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <TextInput
                      style={styles.dateTextInput}
                      placeholder="DD/MM/YYYY"
                      value={formData.startDate}
                      onChangeText={(text) =>
                        setFormData({ ...formData, startDate: text })
                      }
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Ngày kết thúc *</Text>
                  <View style={styles.dateInput}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <TextInput
                      style={styles.dateTextInput}
                      placeholder="DD/MM/YYYY"
                      value={formData.endDate}
                      onChangeText={(text) =>
                        setFormData({ ...formData, endDate: text })
                      }
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lý do nghỉ phép *</Text>
                <View style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Nhập lý do nghỉ phép..."
                    value={formData.reason}
                    onChangeText={(text) =>
                      setFormData({ ...formData, reason: text })
                    }
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Thông tin liên hệ khi nghỉ</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Số điện thoại hoặc email"
                    value={formData.contactInfo}
                    onChangeText={(text) =>
                      setFormData({ ...formData, contactInfo: text })
                    }
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() =>
                  setFormData({ ...formData, urgent: !formData.urgent })
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.urgent && styles.checkboxChecked,
                  ]}
                >
                  {formData.urgent && (
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Đây là trường hợp khẩn cấp
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <View style={styles.submitGradient}>
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
    backgroundColor: colors.primary,
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
  dateRow: {
    flexDirection: "row",
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[50],
    borderRadius: dimensions.borderRadius.lg,
    paddingHorizontal: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  dateTextInput: {
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
    minHeight: 100,
    fontSize: dimensions.fontSize.md,
    color: colors.text,
    padding: dimensions.spacing.md,
    textAlignVertical: "top",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: dimensions.spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray[400],
    justifyContent: "center",
    alignItems: "center",
    marginRight: dimensions.spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: dimensions.fontSize.md,
    color: colors.text,
    flex: 1,
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
    backgroundColor: colors.primary,
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
