import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import ViewShot from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import { showSuccessToast, showErrorToast } from "@/src/utils/errorHandler";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

type CertificateViewerRouteParams = {
  title?: string;
  html: string | null;
};

type CertificateViewerRouteProp = RouteProp<
  { CertificateViewer: CertificateViewerRouteParams },
  "CertificateViewer"
>;

export const CertificateViewer: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CertificateViewerRouteProp>();
  const { title = "Chứng chỉ", html = null } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  const injectedJavaScript = "";

  useEffect(() => {
    if (html) {
      setLoading(true);
    }
  }, [html]);

  const handleSaveImage = async () => {
    if (!html || !viewShotRef.current) {
      showErrorToast("Không thể lưu ảnh chứng chỉ");
      return;
    }

    try {
      setSaving(true);

      // Request media library permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        showErrorToast("Cần quyền truy cập thư viện ảnh để lưu chứng chỉ");
        setSaving(false);
        return;
      }

      // Capture the view as an image
      if (!viewShotRef.current?.capture) {
        showErrorToast("Không thể chụp ảnh chứng chỉ");
        setSaving(false);
        return;
      }
      const uri = await viewShotRef.current.capture();
      if (!uri) {
        showErrorToast("Không thể chụp ảnh chứng chỉ");
        setSaving(false);
        return;
      }

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(uri);

      // Try to save to album, but don't fail if album already exists
      try {
        await MediaLibrary.createAlbumAsync("Swim Mobile", asset, false);
      } catch {
        // Album might already exist, try to add to existing album
        const albums = await MediaLibrary.getAlbumsAsync();
        const existingAlbum = albums.find(
          (album) => album.title === "Swim Mobile"
        );
        if (existingAlbum) {
          await MediaLibrary.addAssetsToAlbumAsync(
            [asset],
            existingAlbum,
            false
          );
        }
      }

      showSuccessToast("Đã lưu ảnh chứng chỉ vào thư viện ảnh");
    } catch (error) {
      console.error("Error saving certificate:", error);
      showErrorToast("Không thể lưu ảnh chứng chỉ");
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!html) {
      showErrorToast("Không có nội dung để xuất PDF");
      return;
    }

    try {
      setExportingPdf(true);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      showErrorToast("Không thể xuất file PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView
          edges={["top"]}
          style={styles.safeAreaHeader}
          mode="padding"
        >
          <View style={styles.headerContent}>
            <View style={styles.titleGroup}>
              <View style={styles.iconBadge}>
                <Ionicons
                  name="ribbon-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <View>
                <Text style={styles.headerLabel}>
                  Chứng chỉ hoàn thành khoá học
                </Text>
                <Text style={styles.title}>{title}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.closeButton}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <SafeAreaView
        style={styles.contentContainer}
        edges={["bottom", "left", "right"]}
      >
        <View style={styles.content}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Đang tải chứng chỉ...</Text>
            </View>
          )}

          {html ? (
            <ViewShot
              ref={viewShotRef}
              style={styles.viewShot}
              options={{ format: "jpg", quality: 0.9 }}
            >
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
            </ViewShot>
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

          {html && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.pdfButton]}
                onPress={handleExportPDF}
                disabled={saving || loading || exportingPdf}
                activeOpacity={0.8}
              >
                {exportingPdf ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color={colors.white}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveImage}
                disabled={saving || loading || exportingPdf}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Ionicons
                    name="download-outline"
                    size={24}
                    color={colors.white}
                  />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    paddingTop: 40,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  safeAreaHeader: {
    backgroundColor: colors.primary,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  contentContainer: {
    flex: 1,
    marginTop: -25,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
    zIndex: 1,
    overflow: "hidden",
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
    marginTop: -70,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
  },
  closeButton: {
    backgroundColor: colors.white,
    display: "none",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginTop: -100,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  content: {
    flex: 1,
    padding: 12,
    paddingTop: 20,
    position: "relative",
    backgroundColor: colors.white,
  },
  viewShot: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  actionButtonsContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 10,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  pdfButton: {
    backgroundColor: colors.primary,
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
