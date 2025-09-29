import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import {
  getMemberProfile,
  updateMemberProfile,
  changePassword,
  addImageToProfile,
} from "@/src/services/auth/authService";
import { useUserInfo } from "@/src/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { tenantService } from "@/src/services";
import * as ImagePicker from "expo-image-picker";

interface ProfileData {
  _id: string;
  email: string;
  username: string;
  role_system: string;
  role: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role_front: string[];
  parent_id: string[];
  featured_image: {
    _id: string;
    filename: string;
    path: string;
    size: number;
    mime: string;
  }[];
  phone?: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { loadUserInfo, updateUserInfo } = useUserInfo();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [tenants, setTenants] = useState<{ value: string; label: string }[]>(
    []
  );
  const [tenantModalVisible, setTenantModalVisible] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(false);

  // Edit states
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    username: "",
    phone: "",
  });

  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: "",
  });

  // Load profile data
  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getMemberProfile();

      if (response.data.data) {
        const apiData = response.data.data;
        const profileData = Array.isArray(apiData) ? apiData[0] : apiData;
        setProfile(profileData);
        setEditData({
          username: profileData.username || "",
          phone: profileData.phone || "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Handle update profile
  const handleUpdateProfile = async () => {
    if (!profile) return;

    try {
      setUpdating(true);
      const response = await updateMemberProfile({
        username: editData.username,
        phone: editData.phone,
      });

      if (response.data.success) {
        setProfile({ ...profile, ...editData });
        setEditMode(false);
        Alert.alert("Thành công", "Cập nhật thông tin thành công");
        await loadUserInfo();
      } else {
        Alert.alert("Lỗi", response.data.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Lỗi", "Không thể cập nhật thông tin");
    } finally {
      setUpdating(false);
    }
  };

  // Handle change password
  const handleChangePassword = async () => {
    if (!passwordData.password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu mới");
      return;
    }

    try {
      setUpdating(true);
      const response = await changePassword({
        password: passwordData.password,
      });

      if (response.data.success) {
        setShowPasswordModal(false);
        setPasswordData({ password: "" });
        Alert.alert("Thành công", "Đổi mật khẩu thành công");
      } else {
        Alert.alert("Lỗi", response.data.message || "Đổi mật khẩu thất bại");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      Alert.alert("Lỗi", "Không thể đổi mật khẩu");
    } finally {
      setUpdating(false);
    }
  };

  // Handle image picker
  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const formData = new FormData();
        formData.append("image", {
          uri: result.assets[0].uri,
          type: "image/jpeg",
          name: "profile.jpg",
        } as any);

        setUpdating(true);
        const response = await addImageToProfile(formData as any);

        if (response.data.success) {
          await loadProfile();
          await loadUserInfo();
          Alert.alert("Thành công", "Cập nhật ảnh đại diện thành công");
        } else {
          Alert.alert("Lỗi", response.data.message || "Cập nhật ảnh thất bại");
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện");
    } finally {
      setUpdating(false);
    }
  };

  // Load tenants
  const loadTenants = async () => {
    try {
      setLoadingTenants(true);
      const response = await tenantService.getAvailableTenants();
      if (response.data.data) {
        const tenantOptions = response.data.data.map((tenant: any) => ({
          value: tenant._id,
          label: tenant.title,
        }));
        setTenants(tenantOptions);
      }
    } catch (error) {
      console.error("Error loading tenants:", error);
    } finally {
      setLoadingTenants(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("tenant");
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "index" }],
              })
            );
          } catch (error) {
            console.error("Logout error:", error);
            await AsyncStorage.multiRemove(["loginToken", "user", "tenant"]);
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "index" }],
              })
            );
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditMode(!editMode)}
        >
          <Ionicons
            name={editMode ? "checkmark" : "create-outline"}
            size={24}
            color={colors.white}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileImageSection}>
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={handleImagePicker}
            disabled={updating}
          >
            <Image
              source={
                profile?.featured_image?.[0]?.path
                  ? { uri: profile.featured_image[0].path }
                  : require("@/assets/images/default-avatar.jpg")
              }
              style={styles.profileImage}
            />
            <View style={styles.imageEditOverlay}>
              <Ionicons name="camera" size={20} color={colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>
            {profile?.username || "Chưa có tên"}
          </Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tên đăng nhập</Text>
            {editMode ? (
              <TextInput
                style={styles.infoInput}
                value={editData.username}
                onChangeText={(text) =>
                  setEditData({ ...editData, username: text })
                }
                placeholder="Nhập tên đăng nhập"
              />
            ) : (
              <Text style={styles.infoValue}>
                {profile?.username || "Chưa có"}
              </Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.email}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Số điện thoại</Text>
            {editMode ? (
              <TextInput
                style={styles.infoInput}
                value={editData.phone}
                onChangeText={(text) =>
                  setEditData({ ...editData, phone: text })
                }
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.infoValue}>
                {profile?.phone || "Chưa có"}
              </Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Vai trò</Text>
            <Text style={styles.infoValue}>
              {profile?.role_front?.join(", ") || "Chưa có"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Trạng thái</Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: profile?.is_active
                      ? colors.success
                      : colors.error,
                  },
                ]}
              />
              <Text style={styles.infoValue}>
                {profile?.is_active ? "Hoạt động" : "Không hoạt động"}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowPasswordModal(true)}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.actionButtonText}>Đổi mật khẩu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setTenantModalVisible(true)}
          >
            <Ionicons
              name="business-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.actionButtonText}>Chuyển đổi tổ chức</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
              Đăng xuất
            </Text>
          </TouchableOpacity>
        </View>

        {/* Update Button */}
        {editMode && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdateProfile}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.updateButtonText}>Cập nhật thông tin</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            <TextInput
              style={styles.modalInput}
              value={passwordData.password}
              onChangeText={(text) =>
                setPasswordData({ ...passwordData, password: text })
              }
              placeholder="Nhập mật khẩu mới"
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ password: "" });
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleChangePassword}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>Xác nhận</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tenant Selection Modal */}
      <Modal
        visible={tenantModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTenantModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn tổ chức</Text>
            {loadingTenants ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <FlatList
                data={tenants}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.tenantItem}
                    onPress={() => {
                      setTenantModalVisible(false);
                      // Handle tenant selection logic here
                    }}
                  >
                    <Text style={styles.tenantItemText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setTenantModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
  },
  editButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  profileImageSection: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: colors.white,
    marginBottom: 10,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  imageEditOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  infoSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 20,
  },
  infoItem: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  infoInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  actionSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionButtonText: {
    marginLeft: 15,
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutButtonText: {
    color: colors.error,
  },
  updateButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  updateButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  tenantItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tenantItemText: {
    fontSize: 16,
    color: colors.text,
  },
});
