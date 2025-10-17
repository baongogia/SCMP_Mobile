import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { ThemedText } from "@/src/components/base/ThemedText";
import { ThemedView } from "@/src/components/base/ThemedView";
import { SharedHeader } from "@/src/components/custom";
import GenericApplicationForm from "@/src/components/layout/applications/GenericApplicationForm";
import ApplicationItem from "@/src/components/layout/applications/ApplicationItem";
import {
  getApplicationsType,
  getApplications,
} from "@/src/services/information/applications/applicationsServices";
import Toast from "react-native-toast-message";

// Fallback request types if API fails
const fallbackRequestTypes = [
  {
    id: "leave_request",
    title: "Đơn xin nghỉ phép",
    description: "Xin nghỉ phép, nghỉ ốm, nghỉ việc riêng",
    icon: "calendar-outline",
    color: "#FF6B6B",
  },
  {
    id: "schedule_change",
    title: "Đơn xin đổi lịch",
    description: "Xin đổi lịch dạy, thay đổi ca làm việc",
    icon: "time-outline",
    color: "#4ECDC4",
  },
  {
    id: "equipment_request",
    title: "Đơn xin thiết bị",
    description: "Xin cấp phát, sửa chữa thiết bị dạy học",
    icon: "construct-outline",
    color: "#45B7D1",
  },
  {
    id: "other_request",
    title: "Đơn khác",
    description: "Các loại đơn khác không thuộc danh mục trên",
    icon: "document-text-outline",
    color: "#96CEB4",
  },
];

export function RequestScreen() {
  const navigation = useNavigation();
  const [selectedRequestType, setSelectedRequestType] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [requestTypes, setRequestTypes] = useState(fallbackRequestTypes);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchApplications = async () => {
    try {
      setApplicationsLoading(true);
      const response = await getApplications();
      const apps = response.data.data?.data;
      setApplications(apps);
    } catch (error) {
      console.error("Error fetching applications:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi tải dữ liệu",
        text2: "Không thể tải danh sách đơn đã gửi",
      });
    } finally {
      setApplicationsLoading(false);
    }
  };

  const fetchApplicationTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getApplicationsType();
      const types = response.data.data || [];

      // Map API response to our format
      const mappedTypes = types.map((type: any) => ({
        id: type._id || type.id,
        title: type.name || type.title,
        description: type.description || "Mô tả không có sẵn",
        icon: getIconForType(type.name || type.title),
        color: getColorForType(type.name || type.title),
      }));

      if (mappedTypes.length > 0) {
        setRequestTypes(mappedTypes);
      }
    } catch (error) {
      console.error("Error fetching application types:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi tải dữ liệu",
        text2: "Sử dụng danh sách đơn mặc định",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchApplicationTypes(), fetchApplications()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchApplicationTypes();
    fetchApplications();
  }, [fetchApplicationTypes]);

  const getIconForType = (typeName: string) => {
    const name = typeName.toLowerCase();
    if (name.includes("nghỉ") || name.includes("leave"))
      return "calendar-outline";
    if (name.includes("lịch") || name.includes("schedule"))
      return "time-outline";
    if (name.includes("thiết bị") || name.includes("equipment"))
      return "construct-outline";
    return "document-text-outline";
  };

  const getColorForType = (typeName: string) => {
    const name = typeName.toLowerCase();
    if (name.includes("nghỉ") || name.includes("leave")) return "#FF6B6B";
    if (name.includes("lịch") || name.includes("schedule")) return "#4ECDC4";
    if (name.includes("thiết bị") || name.includes("equipment"))
      return "#45B7D1";
    return "#96CEB4";
  };

  const handleRequestTypePress = (typeId: string) => {
    const selectedType = requestTypes.find((type) => type.id === typeId);
    if (selectedType) {
      setSelectedRequestType(selectedType);
      setIsModalVisible(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedRequestType(null);
  };

  const handleSubmitApplication = (data: any) => {
    // Refresh applications list after submitting
    fetchApplications();
    // Close form and return to list
    setShowForm(false);
    console.log("Application submitted:", data);
  };

  const handleShowForm = () => {
    setShowForm(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <SharedHeader title={showForm ? "Gửi đơn" : "Đơn đã gửi"} />

      {/* Content */}
      {showForm ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.introContainer}>
            <ThemedText style={styles.introTitle}>Chọn loại đơn</ThemedText>
            <ThemedText style={styles.introText}>
              Vui lòng chọn loại đơn bạn muốn gửi
            </ThemedText>
          </ThemedView>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>
                Đang tải danh sách đơn...
              </ThemedText>
            </View>
          ) : (
            <View style={styles.requestTypesContainer}>
              {requestTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.requestTypeCard}
                  onPress={() => handleRequestTypePress(type.id)}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={type.icon as any}
                      size={32}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <ThemedText style={styles.requestTitle}>
                      {type.title}
                    </ThemedText>
                    <ThemedText style={styles.requestDescription}>
                      {type.description}
                    </ThemedText>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.text}
                    style={styles.chevron}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <ThemedView style={styles.infoContainer}>
            <Ionicons
              name="information-circle"
              size={20}
              color={colors.primary}
            />
            <ThemedText style={styles.infoText}>
              Đơn của bạn sẽ được xem xét và phản hồi trong vòng 2-3 ngày làm
              việc
            </ThemedText>
          </ThemedView>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <ThemedView style={styles.introContainer}>
            <ThemedText style={styles.introTitle}>Đơn đã gửi</ThemedText>
            <ThemedText style={styles.introText}>
              Danh sách các đơn bạn đã gửi và trạng thái xử lý
            </ThemedText>
          </ThemedView>

          {applicationsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>
                Đang tải danh sách đơn...
              </ThemedText>
            </View>
          ) : applications.length > 0 ? (
            <View style={styles.applicationsContainer}>
              {applications.map((application) => (
                <ApplicationItem
                  key={application._id}
                  application={application}
                  onPress={() => {
                    // Handle application detail view if needed
                    console.log("Application pressed:", application._id);
                  }}
                />
              ))}
            </View>
          ) : (
            <ThemedView style={styles.emptyContainer}>
              <Ionicons
                name="document-outline"
                size={64}
                color={colors.gray[400]}
              />
              <ThemedText style={styles.emptyTitle}>Chưa có đơn nào</ThemedText>
              <ThemedText style={styles.emptyText}>
                Bạn chưa gửi đơn nào. Nhấn nút + để tạo đơn mới.
              </ThemedText>
            </ThemedView>
          )}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      {!showForm && (
        <TouchableOpacity style={styles.fab} onPress={handleShowForm}>
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* Application Form Modal */}
      {selectedRequestType && (
        <GenericApplicationForm
          visible={isModalVisible}
          onClose={handleCloseModal}
          onSubmit={handleSubmitApplication}
          applicationType={selectedRequestType}
        />
      )}
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
  requestTypesContainer: {
    paddingHorizontal: 20,
  },
  requestTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    lineHeight: 20,
  },
  chevron: {
    marginLeft: 12,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0, 119, 190, 0.05)",
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  applicationsContainer: {
    paddingTop: 8,
    paddingBottom: 100, // Space for FAB
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 24,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
