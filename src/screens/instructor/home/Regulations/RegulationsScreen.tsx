import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SharedHeader } from "@/src/components/custom";
import { colors } from "@/src/constants/colors";
import {
  RegulationsContent,
  RegulationItem,
} from "@/src/components/custom/regulations/RegulationsContent";
import { getPolicy } from "@/src/services/information/policy/policyServices";
import { showErrorToast } from "@/src/utils/errorHandler";

export function RegulationsScreen() {
  const [regulations, setRegulations] = React.useState<RegulationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPolicy = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const raw = await getPolicy();
      const mapNode = (node: any): RegulationItem => ({
        id: node?._id || node?.id,
        title: node?.title || String(node?.name || ""),
        description: node?.description,
        content: node?.content,
        children: Array.isArray(node?.children)
          ? node.children.map(mapNode)
          : [],
      });
      setRegulations(Array.isArray(raw) ? raw.map(mapNode) : []);
    } catch (err) {
      showErrorToast(err, {
        title: "Lỗi tải quy định",
        message: "Không thể tải quy định. Vui lòng thử lại.",
      });
      setError("Không thể tải quy định. Vui lòng thử lại.");
      setRegulations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchPolicy();
  }, []);

  const onRefresh = () => fetchPolicy(true);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <SharedHeader title="Các quy định" subtitle="Nội quy và điều khoản"  bottomCurveColor="#F8F9FB" />

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải quy định...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={64}
              color={colors.error}
            />
            <Text style={styles.errorTitle}>Có lỗi xảy ra</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchPolicy()}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : regulations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={64}
              color={colors.gray[400]}
            />
            <Text style={styles.emptyTitle}>Chưa có quy định</Text>
            <Text style={styles.emptyText}>
              Hiện tại chưa có quy định nào được cập nhật.
            </Text>
          </View>
        ) : (
          <RegulationsContent
            regulations={regulations}
            introText="Dưới đây là các quy định và nội quy mà tất cả nhân viên cần tuân thủ"
            footerText="Mọi thắc mắc về quy định, vui lòng liên hệ với quản lý trực tiếp."
          />
        )}
      </ScrollView>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  introContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  introTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  introText: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 24,
  },
  regulationCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  regulationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  numberBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  numberText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  regulationTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  regulationContent: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.8,
    lineHeight: 24,
  },
  footerContainer: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 24,
  },
});
