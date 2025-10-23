import { ThemedText } from "@/src/components";
import React, { ReactNode } from "react";
import { View, StyleSheet, ScrollView } from "react-native";

interface PopupBaseProps {
  title?: string;
  content?: string;
  children?: ReactNode;
  useScrollView?: boolean;
}

export function PopupBase({
  title,
  content,
  children,
  useScrollView = true,
}: PopupBaseProps) {
  // Render content with header
  const renderContent = () => (
    <>
      {title && <ThemedText style={styles.title}>{title}</ThemedText>}
      {content && <ThemedText style={styles.content}>{content}</ThemedText>}
      {children}
    </>
  );

  // If we need to avoid ScrollView (for example when using FlatList),
  // render content directly in a View
  if (!useScrollView) {
    return <View style={styles.container}>{renderContent()}</View>;
  }

  // Default: use ScrollView for regular content
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
    >
      {renderContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
    width: "100%",
  },
  contentContainer: {
    padding: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
});
