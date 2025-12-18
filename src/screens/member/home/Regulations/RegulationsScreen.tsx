import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import {
  RegulationsContent,
  RegulationItem,
} from "@/src/components/custom/regulations/RegulationsContent";
import { getPolicy } from "@/src/services/information/policy/policyServices";
import { SharedHeader } from "@/src/components/custom/header/SharedHeader";
import { showErrorToast } from "@/src/utils/errorHandler";

export default function RegulationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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
    } catch (error) {
      showErrorToast(error, {
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

  const onRefresh = () => {
    fetchPolicy(true);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải quy định...</Text>
        </View>
      );
    }

    if (error) {
      return (
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
      );
    }

    if (regulations.length === 0) {
      return (
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
      );
    }

    return (
      <RegulationsContent
        regulations={regulations}
        introText="Các quy định dành cho học viên khi tham gia khóa học bơi."
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <SharedHeader
        title="Các quy định"
        subtitle="Nội quy và điều khoản"
        bottomCurveColor="#F8F9FB"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
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
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
});
