import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/src/constants/colors";
import { dimensions } from "@/src/constants/dimensions";
import { getApplications } from "@/src/services/information/applications/applicationsServices";
import Toast from "react-native-toast-message";

const { width, height } = Dimensions.get("window");

interface ApplicationType {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: string[];
}

interface SentApplication {
  _id: string;
  title: string;
  content: string;
  reply_content?: string;
  status: string[] | string;
  created_at: string;
  created_by?: {
    username: string;
    email: string;
  };
}

interface ApplicationTypesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: ApplicationType) => void;
  onShowForm?: (formType: string) => void;
}

const applicationTypes: ApplicationType[] = [
  {
    id: "leave_request",
    title: "Đơn xin nghỉ phép",
    description: "Xin nghỉ phép, nghỉ ốm, nghỉ việc riêng",
    icon: "calendar-outline",
    color: colors.primary,
    gradient: [colors.primary, colors.primary],
  },
  {
    id: "schedule_change",
    title: "Đơn xin đổi lịch",
    description: "Yêu cầu thay đổi lịch dạy, ca dạy",
    icon: "time-outline",
    color: colors.secondary,
    gradient: [colors.secondary, colors.secondary],
  },
  {
    id: "equipment_request",
    title: "Đơn xin thiết bị",
    description: "Yêu cầu cung cấp thiết bị dạy học",
    icon: "hardware-chip-outline",
    color: colors.accent,
    gradient: [colors.accent, colors.accent],
  },
  {
    id: "training_request",
    title: "Đơn xin đào tạo",
    description: "Yêu cầu tham gia khóa đào tạo, nâng cao",
    icon: "school-outline",
    color: "#6B7280",
    gradient: ["#6B7280", "#6B7280"],
  },
  {
    id: "salary_inquiry",
    title: "Đơn thắc mắc lương",
    description: "Thắc mắc về lương, thưởng, phụ cấp",
    icon: "cash-outline",
    color: "#059669",
    gradient: ["#059669", "#059669"],
  },
  {
    id: "other_request",
    title: "Đơn khác",
    description: "Các yêu cầu khác không thuộc danh mục",
    icon: "document-text-outline",
    color: colors.gray[600],
    gradient: [colors.gray[600], colors.gray[600]],
  },
];

export default function ApplicationTypesModal({
  visible,
  onClose,
  onSelectType,
  onShowForm,
}: ApplicationTypesModalProps) {
  const [activeTab, setActiveTab] = useState<"types" | "sent">("types");
  const [sentApplications, setSentApplications] = useState<SentApplication[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && activeTab === "sent") {
      fetchSentApplications();
    }
  }, [visible, activeTab]);

  const fetchSentApplications = async () => {
    try {
      setLoading(true);
      const response = await getApplications();
      const applications = response.data.data[0][0].data || [];
      setSentApplications(applications);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi tải dữ liệu",
        text2: "Không thể tải danh sách đơn đã gửi",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string[] | string) => {
    if (!status) {
      return colors.gray[500];
    }

    // Handle both array and string formats
    let statusValue;
    if (Array.isArray(status)) {
      // If array is empty, return default color
      if (status.length === 0) {
        return colors.gray[500];
      }
      statusValue = status[0];
    } else {
      statusValue = status;
    }

    if (!statusValue || statusValue.trim() === "") {
      return colors.gray[500];
    }

    const statusStr = statusValue.toLowerCase();
    switch (statusStr) {
      case "accepted":
      case "approved":
        return colors.success;
      case "rejected":
        return colors.error;
      case "inprogress":
      case "pending":
        return colors.warning;
      default:
        return colors.gray[500];
    }
  };

  const getStatusText = (status: string[] | string) => {
    if (!status) {
      return "Không xác định";
    }

    // Handle both array and string formats
    let statusValue;
    if (Array.isArray(status)) {
      // If array is empty, return default text
      if (status.length === 0) {
        return "Không xác định";
      }
      statusValue = status[0];
    } else {
      statusValue = status;
    }

    if (!statusValue || statusValue.trim() === "") {
      return "Không xác định";
    }

    const statusStr = statusValue.toLowerCase();
    switch (statusStr) {
      case "accepted":
      case "approved":
        return "Đã duyệt";
      case "rejected":
        return "Từ chối";
      case "inprogress":
      case "pending":
        return "Đang xử lý";
      default:
        return "Không xác định";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return "Không xác định";
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Không xác định";
    }

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const renderApplicationTypes = () => (
    <ScrollView
      style={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.headerSection}>
        <Text style={styles.sectionTitle}>Chọn loại đơn</Text>
        <Text style={styles.sectionSubtitle}>
          Chọn loại đơn phù hợp với yêu cầu của bạn
        </Text>
      </View>

      <View style={styles.typesGrid}>
        {applicationTypes.map((type, index) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeCard,
              { marginBottom: index % 2 === 0 ? 16 : 0 },
            ]}
            onPress={() => {
              if (
                onShowForm &&
                (type.id === "leave_request" || type.id === "schedule_change")
              ) {
                onShowForm(type.id);
              } else {
                onSelectType(type);
              }
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={type.gradient as [string, string]}
              style={styles.typeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.typeIconContainer}>
                <Ionicons
                  name={type.icon as any}
                  size={28}
                  color={colors.white}
                />
              </View>
              <Text style={styles.typeTitle}>{type.title}</Text>
              <Text style={styles.typeDescription}>{type.description}</Text>
              <View style={styles.typeArrow}>
                <Ionicons name="arrow-forward" size={16} color={colors.white} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderSentApplications = () => (
    <ScrollView
      style={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.headerSection}>
        <Text style={styles.sectionTitle}>Đơn đã gửi</Text>
        <Text style={styles.sectionSubtitle}>
          {sentApplications.length} đơn đã gửi
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : sentApplications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="document-outline"
            size={60}
            color={colors.gray[400]}
          />
          <Text style={styles.emptyTitle}>Chưa có đơn nào</Text>
          <Text style={styles.emptySubtitle}>
            Bạn chưa gửi đơn nào. Hãy tạo đơn mới!
          </Text>
        </View>
      ) : (
        <View style={styles.applicationsList}>
          {sentApplications.map((app) => (
            <View key={app._id} style={styles.applicationCard}>
              <View style={styles.applicationHeader}>
                <View style={styles.applicationTitleContainer}>
                  <Text style={styles.applicationTitle}>{app.title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(app.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusText(app.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.applicationDate}>
                  {formatDate(app.created_at)}
                </Text>
              </View>

              <Text style={styles.applicationContent} numberOfLines={2}>
                {app.content}
              </Text>

              {app.reply_content && (
                <View style={styles.replyContainer}>
                  <Text style={styles.replyLabel}>Phản hồi:</Text>
                  <Text style={styles.replyContent}>{app.reply_content}</Text>
                </View>
              )}

              <View style={styles.applicationFooter}>
                <View style={styles.userInfo}>
                  <Ionicons
                    name="person-circle-outline"
                    size={16}
                    color={colors.gray[500]}
                  />
                  <Text style={styles.userName}>
                    {app.created_by?.username || "Không xác định"}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Gửi đơn</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "types" && styles.activeTab]}
              onPress={() => setActiveTab("types")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "types" && styles.activeTabText,
                ]}
              >
                Loại đơn
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "sent" && styles.activeTab]}
              onPress={() => setActiveTab("sent")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "sent" && styles.activeTabText,
                ]}
              >
                Đã gửi
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {activeTab === "types"
            ? renderApplicationTypes()
            : renderSentApplications()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: dimensions.fontSize.xl,
    fontWeight: "bold",
    color: colors.white,
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: dimensions.spacing.lg,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: dimensions.borderRadius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: dimensions.spacing.sm,
    alignItems: "center",
    borderRadius: dimensions.borderRadius.md,
  },
  activeTab: {
    backgroundColor: colors.white,
  },
  tabText: {
    fontSize: dimensions.fontSize.md,
    color: colors.white,
    fontWeight: "600",
  },
  activeTabText: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: dimensions.spacing.lg,
    paddingBottom: dimensions.spacing.xl,
  },
  headerSection: {
    marginBottom: dimensions.spacing.xl,
  },
  sectionTitle: {
    fontSize: dimensions.fontSize.xl,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: dimensions.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: dimensions.fontSize.md,
    color: colors.gray[600],
  },
  typesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  typeCard: {
    width: (width - dimensions.spacing.lg * 3) / 2,
    height: 140,
    borderRadius: dimensions.borderRadius.lg,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typeGradient: {
    flex: 1,
    padding: dimensions.spacing.md,
    justifyContent: "space-between",
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  typeTitle: {
    fontSize: dimensions.fontSize.sm,
    fontWeight: "600",
    color: colors.white,
    marginBottom: dimensions.spacing.xs,
  },
  typeDescription: {
    fontSize: dimensions.fontSize.xs,
    color: colors.white,
    opacity: 0.9,
    lineHeight: 16,
  },
  typeArrow: {
    alignSelf: "flex-end",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: dimensions.spacing.xxl,
  },
  loadingText: {
    marginTop: dimensions.spacing.md,
    fontSize: dimensions.fontSize.md,
    color: colors.gray[600],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: dimensions.spacing.xxl,
  },
  emptyTitle: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: "600",
    color: colors.gray[700],
    marginTop: dimensions.spacing.md,
    marginBottom: dimensions.spacing.xs,
  },
  emptySubtitle: {
    fontSize: dimensions.fontSize.md,
    color: colors.gray[500],
    textAlign: "center",
    paddingHorizontal: dimensions.spacing.lg,
  },
  applicationsList: {
    gap: dimensions.spacing.md,
  },
  applicationCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  applicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: dimensions.spacing.sm,
  },
  applicationTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: dimensions.spacing.sm,
  },
  applicationTitle: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: 4,
    borderRadius: dimensions.borderRadius.sm,
  },
  statusText: {
    fontSize: dimensions.fontSize.xs,
    color: colors.white,
    fontWeight: "600",
  },
  applicationDate: {
    fontSize: dimensions.fontSize.sm,
    color: colors.gray[500],
  },
  applicationContent: {
    fontSize: dimensions.fontSize.md,
    color: colors.gray[700],
    lineHeight: 20,
    marginBottom: dimensions.spacing.sm,
  },
  replyContainer: {
    backgroundColor: colors.gray[50],
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    marginBottom: dimensions.spacing.sm,
  },
  replyLabel: {
    fontSize: dimensions.fontSize.sm,
    fontWeight: "600",
    color: colors.gray[600],
    marginBottom: dimensions.spacing.xs,
  },
  replyContent: {
    fontSize: dimensions.fontSize.md,
    color: colors.gray[700],
    lineHeight: 18,
  },
  applicationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: dimensions.spacing.xs,
  },
  userName: {
    fontSize: dimensions.fontSize.sm,
    color: colors.gray[500],
  },
});
