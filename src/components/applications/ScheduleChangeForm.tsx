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
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/src/constants/colors";
import { dimensions } from "@/src/constants/dimensions";
import { CustomDropdown } from "@/src/components/forms";
import Toast from "react-native-toast-message";

interface ScheduleChangeFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const changeTypes = [
  { label: "Đổi ca dạy", value: "shift_change", icon: "time-outline" },
  { label: "Đổi lịch dạy", value: "schedule_change", icon: "calendar-outline" },
  {
    label: "Nghỉ buổi dạy",
    value: "class_cancellation",
    icon: "close-circle-outline",
  },
  { label: "Thêm buổi dạy", value: "add_class", icon: "add-circle-outline" },
];

const timeSlots = [
  { label: "06:00 - 08:00", value: "06:00-08:00" },
  { label: "08:00 - 10:00", value: "08:00-10:00" },
  { label: "10:00 - 12:00", value: "10:00-12:00" },
  { label: "14:00 - 16:00", value: "14:00-16:00" },
  { label: "16:00 - 18:00", value: "16:00-18:00" },
  { label: "18:00 - 20:00", value: "18:00-20:00" },
];

export default function ScheduleChangeForm({
  visible,
  onClose,
  onSubmit,
}: ScheduleChangeFormProps) {
  const [formData, setFormData] = useState({
    changeType: "",
    currentDate: "",
    newDate: "",
    currentTime: "",
    newTime: "",
    reason: "",
    alternativeInstructor: "",
  });

  const handleSubmit = () => {
    if (!formData.changeType || !formData.reason) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
      return;
    }

    onSubmit({
      title: "Đơn xin đổi lịch",
      content: `Loại thay đổi: ${
        changeTypes.find((t) => t.value === formData.changeType)?.label
      }
Ngày hiện tại: ${formData.currentDate}
Ngày mới: ${formData.newDate}
Giờ hiện tại: ${formData.currentTime}
Giờ mới: ${formData.newTime}
Lý do: ${formData.reason}
Giảng viên thay thế: ${formData.alternativeInstructor}`,
      type: "schedule_change",
      data: formData,
    });

    onClose();
  };

  const resetForm = () => {
    setFormData({
      changeType: "",
      currentDate: "",
      newDate: "",
      currentTime: "",
      newTime: "",
      reason: "",
      alternativeInstructor: "",
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
            <Text style={styles.headerTitle}>Đơn xin đổi lịch</Text>
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
              <Text style={styles.sectionTitle}>Thông tin thay đổi lịch</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Loại thay đổi *</Text>
                <CustomDropdown
                  items={changeTypes}
                  selectedValue={formData.changeType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, changeType: value })
                  }
                  placeholder="Chọn loại thay đổi"
                  icon="time-outline"
                />
              </View>

              <View style={styles.dateRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Ngày hiện tại</Text>
                  <View style={styles.dateInput}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={colors.secondary}
                    />
                    <TextInput
                      style={styles.dateTextInput}
                      placeholder="DD/MM/YYYY"
                      value={formData.currentDate}
                      onChangeText={(text) =>
                        setFormData({ ...formData, currentDate: text })
                      }
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Ngày mới</Text>
                  <View style={styles.dateInput}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={colors.secondary}
                    />
                    <TextInput
                      style={styles.dateTextInput}
                      placeholder="DD/MM/YYYY"
                      value={formData.newDate}
                      onChangeText={(text) =>
                        setFormData({ ...formData, newDate: text })
                      }
                    />
                  </View>
                </View>
              </View>

              <View style={styles.timeRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Giờ hiện tại</Text>
                  <CustomDropdown
                    items={timeSlots}
                    selectedValue={formData.currentTime}
                    onValueChange={(value) =>
                      setFormData({ ...formData, currentTime: value })
                    }
                    placeholder="Chọn giờ"
                    icon="time-outline"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Giờ mới</Text>
                  <CustomDropdown
                    items={timeSlots}
                    selectedValue={formData.newTime}
                    onValueChange={(value) =>
                      setFormData({ ...formData, newTime: value })
                    }
                    placeholder="Chọn giờ"
                    icon="time-outline"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lý do thay đổi *</Text>
                <View style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Nhập lý do thay đổi lịch..."
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
                <Text style={styles.label}>Giảng viên thay thế (nếu có)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={colors.secondary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Tên giảng viên thay thế"
                    value={formData.alternativeInstructor}
                    onChangeText={(text) =>
                      setFormData({ ...formData, alternativeInstructor: text })
                    }
                  />
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
    backgroundColor: colors.secondary,
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
  timeRow: {
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
    backgroundColor: colors.secondary,
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
