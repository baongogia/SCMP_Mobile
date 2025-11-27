import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/src/constants/colors";
import { SharedHeader } from "@/src/components/custom";
import { PopupBase } from "@/src/components/custom/PopupBase/PopupBase";
import { ModernLearningProgress, ThemedView } from "@/src/components";

export default function CourseInfoScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      {/* Header */}
      <SharedHeader title="Thông tin khóa học" />

      {/* Content */}
      <View style={styles.content}>
        <PopupBase title="" useScrollView={false}>
          <ThemedView style={styles.containerModal}>
            <ModernLearningProgress />
          </ThemedView>
        </PopupBase>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  containerModal: {
    width: "100%",
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  menuButton: {
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 0.5,
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 0,
    paddingHorizontal: 0,
  },
});
