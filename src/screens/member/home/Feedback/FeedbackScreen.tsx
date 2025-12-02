import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { SharedHeader } from "@/src/components/custom";
import { ThemedText } from "@/src/components/base/ThemedText";
import { ThemedView } from "@/src/components/base/ThemedView";
import { StyleSheet, View } from "react-native";
import { colors } from "@/src/constants/colors";

export default function FeedbackScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <SharedHeader title="Ý kiến khác" />

      <View style={styles.content}>
        <ThemedView style={styles.formContainer}>
          <ThemedText style={styles.title}>Gửi ý kiến</ThemedText>
          <ThemedText style={styles.subtitle}>
            Chia sẻ ý kiến của bạn để chúng tôi có thể cải thiện dịch vụ
          </ThemedText>
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
});
