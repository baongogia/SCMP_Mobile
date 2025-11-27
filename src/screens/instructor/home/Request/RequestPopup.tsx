import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { PopupBase } from "../../../../components/custom/PopupBase/PopupBase";
import { ThemedText } from "@/src/components/base/ThemedText";
import { ThemedView } from "@/src/components/base/ThemedView";

export function RequestPopup() {
  const [requestType, setRequestType] = useState("leave");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const handleSubmit = () => {
    if (!reason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do");
      return;
    }

    if (requestType === "leave" && (!startDate.trim() || !endDate.trim())) {
      Alert.alert("Lỗi", "Vui lòng nhập ngày bắt đầu và kết thúc");
      return;
    }

    Alert.alert("Thành công", "Đơn của bạn đã được gửi");
    setReason("");
    setStartDate("");
    setEndDate("");
  };

  const renderRequestTypeSelector = () => (
    <View style={styles.formGroup}>
      <ThemedText style={styles.label}>Loại đơn:</ThemedText>
      <TouchableOpacity
        style={styles.selectContainer}
        onPress={() => setModalVisible(true)}
      >
        <ThemedText>
          {requestType === "leave" ? "Đơn xin nghỉ phép" : "Đơn khác"}
        </ThemedText>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setRequestType("leave");
                setModalVisible(false);
              }}
            >
              <ThemedText style={styles.optionText}>
                Đơn xin nghỉ phép
              </ThemedText>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setRequestType("other");
                setModalVisible(false);
              }}
            >
              <ThemedText style={styles.optionText}>Đơn khác</ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  return (
    <PopupBase
      title={requestType === "leave" ? "Đơn xin nghỉ phép" : "Đơn khác"}
    >
      <ThemedView style={styles.formContainer}>
        {renderRequestTypeSelector()}

        {requestType === "leave" && (
          <>
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Ngày bắt đầu:</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/YYYY"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Ngày kết thúc:</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/YYYY"
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </>
        )}

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Lý do:</ThemedText>
          <TextInput
            multiline
            numberOfLines={4}
            style={styles.textArea}
            placeholder="Nhập lý do..."
            value={reason}
            onChangeText={setReason}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <ThemedText style={styles.submitButtonText}>Gửi đơn</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </PopupBase>
  );
}

// For backward compatibility, we'll export the same component with different names
export const LeaveRequestPopup = RequestPopup;
export const OtherRequestPopup = RequestPopup;

const styles = StyleSheet.create({
  formContainer: {
    width: "100%",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  selectContainer: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    backgroundColor: "#f0f0f0",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 10,
    height: 120,
    textAlignVertical: "top",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 10,
    height: 40,
  },
  submitButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOption: {
    padding: 15,
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    width: "100%",
  },
});
