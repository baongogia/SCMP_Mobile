import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/src/constants/colors";
import { SharedHeader } from "@/src/components/custom";

export default function FeedbackFacilitiesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <SharedHeader title="Ý kiến cơ sở vật chất" />
      <ScrollView style={styles.content}>
        <View style={styles.container}>
          <Text style={styles.title}>Ý kiến về cơ sở vật chất</Text>
          <Text style={styles.content}>
            Gửi ý kiến đóng góp về cơ sở vật chất của trường.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
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
    padding: 20,
  },
});
