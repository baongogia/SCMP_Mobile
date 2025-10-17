import React from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { ThemedText } from "@/src/components/base/ThemedText";
import { ThemedView } from "@/src/components/base/ThemedView";
import { SharedHeader } from "@/src/components/custom";

export function FeedbackFacilitiesScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <SharedHeader title="Ý kiến cơ sở vật chất" />

      {/* Content */}
      <View style={styles.content}>
        <ThemedView style={styles.formContainer}>
          <ThemedText style={styles.title}>Góp ý cơ sở vật chất</ThemedText>
          <ThemedText style={styles.subtitle}>
            Chia sẻ ý kiến về cơ sở vật chất để chúng tôi có thể cải thiện
          </ThemedText>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Loại cơ sở</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Bể bơi, Phòng thay đồ, Khu vực nghỉ ngơi..."
              placeholderTextColor={colors.text + "80"}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Mô tả vấn đề</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Mô tả chi tiết về vấn đề hoặc đề xuất cải thiện..."
              placeholderTextColor={colors.text + "80"}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={styles.submitButton}>
            <ThemedText style={styles.submitButtonText}>Gửi ý kiến</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 30,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});
