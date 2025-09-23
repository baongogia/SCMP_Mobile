import React from "react";
import { WebView } from "react-native-webview";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function WebViewCallScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url || "about:blank" }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
