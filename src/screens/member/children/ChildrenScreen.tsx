import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import {
  getChildrenAccount,
  createChildrenAccount,
} from "@/src/services/information/children/childenServices";
import { useUserInfo } from "@/src/hooks";
import { CustomToast } from "@/src/components/custom/CustomToast";

interface ChildrenAccount {
  id: string;
  username: string;
  email: string;
  birthday: string;
  created_at: string;
}

interface CreateChildrenForm {
  username: string;
  email: string;
  password: string;
  birthday: string;
}

interface ChildrenScreenProps {
  navigation: any;
}

export default function ChildrenScreen({ navigation }: ChildrenScreenProps) {
  const [children, setChildren] = useState<ChildrenAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateChildrenForm>({
    username: "",
    email: "",
    password: "",
    birthday: "",
  });
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const { userInfo } = useUserInfo();

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const response = await getChildrenAccount();
      if (response.data && response.data.data) {
        setChildren(response.data.data);
      }
    } catch (error) {
      console.error("Error loading children:", error);
      setToast({
        message: "Không thể tải danh sách tài khoản con",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChildren();
    setRefreshing(false);
  };

  const handleCreateChildren = async () => {
    if (
      !createForm.username ||
      !createForm.email ||
      !createForm.password ||
      !createForm.birthday
    ) {
      setToast({ message: "Vui lòng điền đầy đủ thông tin", type: "error" });
      return;
    }

    try {
      setCreating(true);
      await createChildrenAccount(createForm);
      setToast({ message: "Tạo tài khoản con thành công", type: "success" });
      setShowCreateModal(false);
      setCreateForm({ username: "", email: "", password: "", birthday: "" });
      await loadChildren();
    } catch (error) {
      console.error("Error creating children account:", error);
      setToast({ message: "Không thể tạo tài khoản con", type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const renderChildrenItem = ({ item }: { item: ChildrenAccount }) => (
    <View style={styles.childrenCard}>
      <View style={styles.childrenInfo}>
        <View style={styles.childrenHeader}>
          <Ionicons name="person-circle" size={40} color={colors.primary} />
          <View style={styles.childrenDetails}>
            <Text style={styles.childrenName}>{item.username}</Text>
            <Text style={styles.childrenEmail}>{item.email}</Text>
            <Text style={styles.childrenBirthday}>
              Sinh nhật: {formatDate(item.birthday)}
            </Text>
          </View>
        </View>
        <View style={styles.childrenActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate("ChildrenSchedule", {
                childId: item.id,
                childName: item.username,
              })
            }
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.actionText}>Lịch học</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons
              name="settings-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.actionText}>Cài đặt</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowCreateModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Tạo tài khoản con</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <TextInput
              style={styles.input}
              value={createForm.username}
              onChangeText={(text) =>
                setCreateForm({ ...createForm, username: text })
              }
              placeholder="Nhập tên đăng nhập"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={createForm.email}
              onChangeText={(text) =>
                setCreateForm({ ...createForm, email: text })
              }
              placeholder="Nhập email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              value={createForm.password}
              onChangeText={(text) =>
                setCreateForm({ ...createForm, password: text })
              }
              placeholder="Nhập mật khẩu"
              secureTextEntry
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ngày sinh</Text>
            <TextInput
              style={styles.input}
              value={createForm.birthday}
              onChangeText={(text) =>
                setCreateForm({ ...createForm, birthday: text })
              }
              placeholder="YYYY-MM-DD"
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[
              styles.createButton,
              creating && styles.createButtonDisabled,
            ]}
            onPress={handleCreateChildren}
            disabled={creating}
          >
            <Text style={styles.createButtonText}>
              {creating ? "Đang tạo..." : "Tạo tài khoản"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Con của tôi</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : children.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80} color={colors.gray} />
          <Text style={styles.emptyTitle}>Chưa có tài khoản con</Text>
          <Text style={styles.emptySubtitle}>
            Tạo tài khoản con để quản lý lịch học và thông tin
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.emptyButtonText}>Tạo tài khoản con</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={children}
          renderItem={renderChildrenItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      {renderCreateModal()}
      {toast && (
        <CustomToast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  childrenCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childrenInfo: {
    padding: 16,
  },
  childrenHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  childrenDetails: {
    flex: 1,
    marginLeft: 12,
  },
  childrenName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  childrenEmail: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 4,
  },
  childrenBirthday: {
    fontSize: 12,
    color: colors.gray,
  },
  childrenActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: "center",
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: colors.gray,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
