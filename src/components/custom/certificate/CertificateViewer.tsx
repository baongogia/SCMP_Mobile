import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";

interface CertificateViewerProps {
  visible: boolean;
  title?: string;
  html: string | null;
  onClose: () => void;
}

export const CertificateViewer: React.FC<CertificateViewerProps> = ({
  visible,
  title = "Chứng chỉ",
  html,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);

  const injectedJavaScript = "";

  useEffect(() => {
    if (visible) {
      setLoading(true);
    }
  }, [visible, html]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Đang tải chứng chỉ...</Text>
            </View>
          )}

          {html ? (
            <WebView
              source={{ html }}
              style={styles.webView}
              javaScriptEnabled
              domStorageEnabled
              scalesPageToFit={false}
              automaticallyAdjustContentInsets={false}
              startInLoadingState
              showsVerticalScrollIndicator
              showsHorizontalScrollIndicator={false}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => setLoading(false)}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              injectedJavaScript={injectedJavaScript}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color="#9CA3AF"
              />
              <Text style={styles.emptyStateText}>
                Không có dữ liệu chứng chỉ
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    position: "relative",
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text,
    opacity: 0.6,
    textAlign: "center",
  },
});
