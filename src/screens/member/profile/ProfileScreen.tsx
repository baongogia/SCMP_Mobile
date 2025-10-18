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
import { LinearGradient } from "expo-linear-gradient";
import { SharedHeader } from "@/src/components/custom";
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
import { showErrorToast } from "@/src/utils/errorHandler";

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
  const { loadUserInfo, updateUserInfo, clearUserInfo } = useUserInfo();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [tenants, setTenants] = useState<{ value: string; label: string }[]>(
    []
  );
  const [tenantModalVisible, setTenantModalVisible] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [accentColor, setAccentColor] = useState<string>(colors.text);

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
      showErrorToast(error, {
        title: "Lỗi tải hồ sơ",
        message: "Không thể tải thông tin hồ sơ",
      });
      Alert.alert("Lỗi", "Không thể tải thông tin hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Derive accent color deterministically from avatar path
  useEffect(() => {
    const fi: any = profile?.featured_image as any;
    const path = Array.isArray(fi) ? fi?.[0]?.path || null : fi?.path || null;
    if (!path) {
      setAccentColor(colors.text);
      return;
    }
    const toHslFromString = (input: string) => {
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        hash = input.charCodeAt(i) + ((hash << 5) - hash);
        hash |= 0;
      }
      const hue = Math.abs(hash) % 360;
      const saturation = 55; // vibrant but not too strong
      const lightness = 40; // readable on white
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };
    setAccentColor(toHslFromString(path));
  }, [profile]);

  // Handle update profile
  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      await updateMemberProfile(editData);
      Alert.alert("Thành công", "Cập nhật thông tin thành công", [
        {
          text: "OK",
          onPress: () => {
            setEditMode(false);
            loadProfile();
            loadUserInfo(); // Refresh user info in hook
          },
        },
      ]);
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi cập nhật hồ sơ",
        message: "Không thể cập nhật thông tin",
      });
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
      await changePassword({ password: passwordData.password });
      Alert.alert("Thành công", "Đổi mật khẩu thành công", [
        {
          text: "OK",
          onPress: () => {
            setShowPasswordModal(false);
            setPasswordData({ password: "" });
          },
        },
      ]);
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi đổi mật khẩu",
        message: "Không thể đổi mật khẩu",
      });
      Alert.alert("Lỗi", "Không thể đổi mật khẩu");
    } finally {
      setUpdating(false);
    }
  };

  // Handle pick and upload avatar
  const handlePickAndUploadAvatar = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Quyền truy cập", "Cần quyền truy cập thư viện ảnh");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const uri = asset.uri;
      const fileName = uri.split("/").pop() || `avatar_${Date.now()}.jpg`;
      const ext = (fileName.split(".").pop() || "jpg").toLowerCase();
      const mime =
        ext === "png"
          ? "image/png"
          : ext === "webp"
          ? "image/webp"
          : "image/jpeg";

      setUpdating(true);
      const uploadRes = await addImageToProfile({
        title: "Avatar",
        alt: "User avatar",
        file: {
          uri,
          type: mime,
          name: fileName,
        },
      });

      // Extract id/path from response and update profile (backend expects ObjectId)
      const d1 = (uploadRes as any)?.data;
      const d2 = d1?.data ?? d1; // some APIs nest under data
      const d3 = d2?.data ?? d2; // handle data.data pattern
      const fileObj = Array.isArray(d3) ? d3[0] : d3;
      const fileId = fileObj?._id || fileObj?.id || null;
      const filePath = fileObj?.path || null;

      try {
        if (fileId) {
          await updateMemberProfile({ featured_image: fileId });
        } else if (filePath) {
          await updateMemberProfile({ featured_image: filePath });
        }
      } catch (e) {
        console.warn("Update profile with featured_image failed", e);
      }

      // Refresh profile and broadcast user update so headers/drawers update immediately
      await loadProfile();
      try {
        const latest = await getMemberProfile();
        const apiData = latest.data?.data;
        const profileData = Array.isArray(apiData) ? apiData[0] : apiData;
        if (profileData) {
          await updateUserInfo(profileData);
        }
      } catch {}
      Alert.alert("Thành công", "Cập nhật ảnh đại diện thành công");
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi cập nhật ảnh",
        message: "Không thể cập nhật ảnh đại diện",
      });
      Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện");
    } finally {
      setUpdating(false);
    }
  };

  // Resolve avatar path from profile (supports object or array)
  const getAvatarPath = (): string | null => {
    const fi: any = profile?.featured_image as any;
    if (!fi) return null;
    if (Array.isArray(fi)) {
      return fi[0]?.path || null;
    }
    return fi?.path || null;
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            // Clear all stored data
            await AsyncStorage.multiRemove(["loginToken", "user", "tenant"]);

            // Clear user info from hook
            await clearUserInfo();

            // Navigate to login screen
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "index" }],
              })
            );
          } catch (error) {
            showErrorToast(error, {
              title: "Lỗi đăng xuất",
              message: "Có lỗi khi đăng xuất",
            });
            // Even if there's an error, still try to navigate to login
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

  // Handle switch facility (placeholder)
  const handleSwitchFacility = async () => {
    try {
      setTenantModalVisible(true);
      setLoadingTenants(true);
      const res = await tenantService.getAvailableTenants();
      const items = res.data?.data || [];
      const normalized = items.map((it: any) => ({
        value: it?.tenant_id?._id || it?._id || "",
        label: it?.tenant_id?.title || it?.title || "",
      }));
      setTenants(normalized);
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải cơ sở",
        message: "Không thể tải danh sách cơ sở",
      });
      Alert.alert("Lỗi", "Không thể tải danh sách cơ sở");
      setTenantModalVisible(false);
    } finally {
      setLoadingTenants(false);
    }
  };

  const handleSelectTenant = async (tenant: {
    value: string;
    label: string;
  }) => {
    try {
      const stored = { value: tenant.value, label: tenant.label };
      await AsyncStorage.setItem("tenant", JSON.stringify(stored));
      setTenantModalVisible(false);
      // Reload profile and any tenant-dependent info
      await loadProfile();
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi lưu cơ sở",
        message: "Không thể lưu cơ sở đã chọn",
      });
      Alert.alert("Lỗi", "Không thể lưu cơ sở đã chọn");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <SharedHeader title="Hồ sơ cá nhân" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <SharedHeader
        title="Hồ sơ cá nhân"
        rightComponent={
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditMode(!editMode)}
          >
            <Ionicons
              name={editMode ? "close" : "create-outline"}
              size={24}
              color={colors.white}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.coverContainer}>
            <Image
              source={
                getAvatarPath()
                  ? { uri: getAvatarPath() as string }
                  : require("@/assets/images/default-avatar.jpg")
              }
              style={styles.coverImage}
              blurRadius={20}
            />
            <LinearGradient
              colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0)"]}
              style={styles.coverTopShade}
            />
            <LinearGradient
              colors={["rgba(255,255,255,0)", "#ffffff"]}
              style={styles.coverBottomFade}
            />
          </View>
          <View style={styles.avatarContainer}>
            <Image
              source={
                getAvatarPath()
                  ? { uri: getAvatarPath() as string }
                  : require("@/assets/images/default-avatar.jpg")
              }
              style={styles.avatar}
              onError={() => {
                console.log("Avatar load error, using default");
              }}
            />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handlePickAndUploadAvatar}
            >
              <Ionicons name="camera" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.userName, { color: accentColor }]}>
            {profile?.username || "Người dùng"}
          </Text>
          <Text style={styles.userEmail}>{profile?.email}</Text>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.statusText}>
              {profile?.is_active ? "Đang hoạt động" : "Không hoạt động"}
            </Text>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tên đăng nhập</Text>
              {editMode ? (
                <TextInput
                  style={styles.textInput}
                  value={editData.username}
                  onChangeText={(text) =>
                    setEditData({ ...editData, username: text })
                  }
                  placeholder="Nhập tên đăng nhập"
                />
              ) : (
                <Text style={styles.infoValue}>{profile?.username}</Text>
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
                  style={styles.textInput}
                  value={editData.phone}
                  onChangeText={(text) =>
                    setEditData({ ...editData, phone: text })
                  }
                  placeholder="Nhập số điện thoại"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {profile?.phone || "Chưa cập nhật"}
                </Text>
              )}
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ngày tạo</Text>
              <Text style={styles.infoValue}>
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("vi-VN")
                  : "Chưa có thông tin"}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Cập nhật lần cuối</Text>
              <Text style={styles.infoValue}>
                {profile?.updated_at
                  ? new Date(profile.updated_at).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Chưa có thông tin"}
              </Text>
            </View>
          </View>

          {editMode && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateProfile}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons
                    name="save-outline"
                    size={20}
                    color={colors.white}
                  />
                  <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Hành động</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name="lock-closed-outline"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Đổi mật khẩu</Text>
              <Text style={styles.actionSubtitle}>
                Thay đổi mật khẩu đăng nhập
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSwitchFacility}
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name="business-outline"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Chuyển cơ sở</Text>
              <Text style={styles.actionSubtitle}>Thay đổi cơ sở học tập</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="log-out-outline" size={24} color="#F44336" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, styles.logoutText]}>
                Đăng xuất
              </Text>
              <Text style={styles.actionSubtitle}>Thoát khỏi tài khoản</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Mật khẩu mới</Text>
              <TextInput
                style={styles.modalInput}
                value={passwordData.password}
                onChangeText={(text) =>
                  setPasswordData({ ...passwordData, password: text })
                }
                placeholder="Nhập mật khẩu mới"
                secureTextEntry
                autoCapitalize="none"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowPasswordModal(false)}
                >
                  <Text style={styles.modalCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={handleChangePassword}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.modalConfirmText}>Xác nhận</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tenant Switch Modal */}
      <Modal
        visible={tenantModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTenantModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn cơ sở</Text>
              <TouchableOpacity
                onPress={() => setTenantModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {loadingTenants ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <FlatList
                  data={tenants}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.tenantItem}
                      onPress={() => handleSelectTenant(item)}
                    >
                      <Text style={styles.tenantName}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  editButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  profileHeader: {
    backgroundColor: colors.white,
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: 20,
    marginBottom: 20,
  },
  coverContainer: {
    width: "100%",
    height: 140,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  coverImage: {
    position: "absolute",
    left: 0,
    top: -30,
    width: "100%",
    height: 200,
    resizeMode: "cover",
    opacity: 0.9,
    transform: [{ scale: 1.2 }],
  },
  coverTopShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  coverBottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  avatarContainer: {
    position: "relative",
    marginTop: -40,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 5,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
    marginLeft: 6,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoItem: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 6,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  textInput: {
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  saveButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  actionsSection: {
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.2)",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
  },
  logoutText: {
    color: "#F44336",
  },
  bottomSpacing: {
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: "#f8f9fa",
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  tenantItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  tenantName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
});
