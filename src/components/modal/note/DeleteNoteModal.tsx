import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";

interface DeleteNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onDeleteConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteNoteModal({
  visible,
  onClose,
  onDeleteConfirm,
  isDeleting,
}: DeleteNoteModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.deleteModalOverlay}>
        <View style={styles.deleteModalContent}>
          <View style={styles.deleteModalHeader}>
            <Ionicons name="warning" size={48} color={colors.error} />
            <Text style={styles.deleteModalTitle}>Xác nhận xóa</Text>
            <Text style={styles.deleteModalMessage}>
              Bạn có chắc chắn muốn xóa ghi chú này không? Hành động này không
              thể hoàn tác.
            </Text>
          </View>

          <View style={styles.deleteModalActions}>
            <TouchableOpacity
              style={styles.deleteModalCancelButton}
              onPress={onClose}
            >
              <Text style={styles.deleteModalCancelText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteModalConfirmButton,
                isDeleting && styles.deleteModalConfirmButtonDisabled,
              ]}
              onPress={onDeleteConfirm}
              disabled={isDeleting}
            >
              <Text style={styles.deleteModalConfirmText}>
                {isDeleting ? "Đang xóa..." : "Xóa"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  deleteModalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteModalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  deleteModalMessage: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: "center",
    lineHeight: 20,
  },
  deleteModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
    alignItems: "center",
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.gray[700],
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: "center",
  },
  deleteModalConfirmButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
});
