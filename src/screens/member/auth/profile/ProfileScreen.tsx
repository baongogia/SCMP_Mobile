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
  Linking,
  FlatList,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  getMemberProfile,
  updateMemberProfile,
  changePassword,
  postMedia,
} from "@/src/services/auth/authService";
import { useUserInfo } from "@/src/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  tenantService,
  getCertificationFrame,
  getCertificate,
} from "@/src/services";
import * as ImagePicker from "expo-image-picker";
import { showErrorToast, showSuccessToast } from "@/src/utils/errorHandler";

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
  birthday?: string | null;
}

interface CertificateFrame {
  _id: string;
  title: string;
  html: string;
}

interface CertificateInfoDetail {
  title?: string;
  form_judge?: {
    items?: Record<string, any>;
  };
}

interface CertificateInfo {
  _id: string;
  name?: string;
  member_name?: string;
  member_full_name?: string;
  instructor_name?: string;
  instructor_full_name?: string;
  instructor?: any;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
  course?: {
    _id?: string;
    title?: string;
    description?: string;
    session_number?: number;
    session_number_duration?: string;
  };
  detail?: CertificateInfoDetail[];
  verify_url?: string;
  member?: any[];
  member_passed?: any[];
  schedule_plan?: any[];
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
  const [editData, setEditData] = useState({
    username: "",
    phone: "",
    birthday: "",
  });

  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: "",
  });

  // Logout modal states
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Edit Modal & Date Picker states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [modalAnimation] = useState(new Animated.Value(0));
  const [datePickerAnimation] = useState(new Animated.Value(0));

  // Certificate states
  const [certificates, setCertificates] = useState<CertificateInfo[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [certificateFrames, setCertificateFrames] = useState<
    CertificateFrame[]
  >([]);
  const [loadingCertificateFrames, setLoadingCertificateFrames] =
    useState(false);
  const [selectedCertificateFrame, setSelectedCertificateFrame] =
    useState<CertificateFrame | null>(null);
  const [selectedCertificateInfo, setSelectedCertificateInfo] =
    useState<CertificateInfo | null>(null);

  // Date management helpers
  const formatDateForDisplay = (dateOrString: Date | string) => {
    if (!dateOrString) return "Chưa cập nhật";
    let d: Date;
    if (typeof dateOrString === "string") {
      d = new Date(dateOrString);
    } else {
      d = dateOrString;
    }
    if (isNaN(d.getTime())) return "Chưa cập nhật";
    return d.toLocaleDateString("vi-VN");
  };

  const formatDateForAPI = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const showDatePickerModal = () => {
    setTempDate(selectedDate);
    setShowDatePicker(true);
    Animated.timing(datePickerAnimation, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleDateConfirm = () => {
    Animated.timing(datePickerAnimation, {
      toValue: 0,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSelectedDate(tempDate);
      setEditData({
        ...editData,
        birthday: formatDateForAPI(tempDate),
      });
      setShowDatePicker(false);
    });
  };

  const handleDateCancel = () => {
    Animated.timing(datePickerAnimation, {
      toValue: 0,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowDatePicker(false);
    });
  };

  useEffect(() => {
    if (showEditModal) {
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [showEditModal, modalAnimation]);

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
          birthday: profileData.birthday
            ? String(profileData.birthday).split("T")[0]
            : "",
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

  // Load certificates
  const loadCertificates = async () => {
    try {
      setLoadingCertificates(true);
      const response = await getCertificate();
      const payload = response.data?.data;
      let normalized: CertificateInfo[] = [];
      if (Array.isArray(payload)) {
        normalized = payload;
      } else if (Array.isArray(payload?.data)) {
        normalized = payload.data;
      } else if (Array.isArray(payload?.items)) {
        normalized = payload.items;
      } else if (Array.isArray(payload?.results)) {
        normalized = payload.results;
      }
      setCertificates(normalized);
      if (normalized.length > 0) {
        setSelectedCertificateInfo((prev) => prev || normalized[0]);
      } else {
        setSelectedCertificateInfo(null);
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải chứng chỉ",
        message: "Không thể tải danh sách chứng chỉ",
      });
    } finally {
      setLoadingCertificates(false);
    }
  };

  const loadCertificateFrames = async () => {
    try {
      setLoadingCertificateFrames(true);
      const response = await getCertificationFrame();
      const data = response.data?.data || [];
      const normalized = Array.isArray(data) ? data : [];
      setCertificateFrames(normalized);
      if (normalized.length > 0) {
        setSelectedCertificateFrame((prev) => prev || normalized[0]);
      } else {
        setSelectedCertificateFrame(null);
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải dữ liệu chứng chỉ",
        message: "Không thể tải thông tin chứng chỉ",
      });
    } finally {
      setLoadingCertificateFrames(false);
    }
  };

  // Replace placeholders in certificate HTML with actual data
  const replacePlaceholders = (
    html: string,
    info?: CertificateInfo | null
  ): string => {
    if (!html || !info) return html;

    const memberName =
      info.member_full_name ||
      info.member_name ||
      extractNameFromList(info.member_passed) ||
      extractNameFromList(info.member) ||
      profile?.username ||
      "Học viên";
    const courseTitle =
      info.course?.title || info.name || info.course?._id || "Khóa học";
    const courseDescription =
      info.course?.description || info.name || "Hoàn thành khóa học";
    const timeFinish =
      info.completed_at ||
      info.updated_at ||
      info.created_at ||
      new Date().toISOString();
    const instructorName = info.instructor.username;
    const verifyUrl = info.verify_url || "swimcourse.vn";
    const numberSessions =
      info.course?.session_number !== undefined &&
      info.course?.session_number !== null
        ? String(info.course.session_number)
        : Array.isArray(info.schedule_plan)
        ? String(info.schedule_plan.length)
        : "";
    const sessionDuration =
      info.course?.session_number_duration || deriveSessionDuration(info);

    let detailSummary =
      info.detail && info.detail.length > 0
        ? info.detail
            .map((d) => d.title)
            .filter(Boolean)
            .join(", ")
        : "";
    if (!detailSummary && info.course?.title) {
      detailSummary = `Thông tin khóa học: ${info.course.title}`;
    }
    if (!detailSummary) {
      detailSummary = "Chi tiết khóa học đang được cập nhật";
    }

    const dateString = timeFinish
      ? new Date(timeFinish).toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

    const mappings: Record<string, string> = {
      MEMBER_NAME: memberName,
      MEMBER_NAMES: memberName,
      COURSE_TITLE: courseTitle,
      COURSE_TITLES: courseTitle,
      COURSE_DESCRIPTION: courseDescription,
      COURSE_DESCRIPTIONS: courseDescription,
      COURSE_TITLE_DETAIL_OF_EACH_SESSION: detailSummary,
      COURSE_TITLE_DETAIL_OF_EACH_SESSIONS: detailSummary,
      NUMBER_SESSIONS: numberSessions,
      SESSION_NUMBER_DURATION: sessionDuration,
      TIME_FINISH: dateString,
      INSTRUCTOR_NAME: instructorName,
      INSTRUCTOR_NAMES: instructorName,
      URL_VERIFY_AT: verifyUrl,
    };

    let processedHtml = html;
    Object.entries(mappings).forEach(([key, value]) => {
      const regex = new RegExp(`\\$\\$${key}\\$\\$`, "g");
      processedHtml = processedHtml.replace(regex, value ?? "");
    });

    processedHtml = processedHtml.replace(/\$\$[A-Za-z0-9_]+\$\$/g, "");

    return processedHtml;
  };

  const extractNameFromList = (list?: any[]): string | undefined => {
    if (!Array.isArray(list)) return undefined;
    for (const item of list) {
      const name =
        item?.user?.full_name ||
        item?.user?.profile?.full_name ||
        item?.user?.username ||
        item?.full_name ||
        item?.name;
      if (name) return String(name);
    }
    return undefined;
  };

  const extractInstructorName = (info: CertificateInfo): string | undefined => {
    if (info.instructor && typeof info.instructor === "object") {
      return (
        info.instructor.full_name ||
        info.instructor.name ||
        info.instructor.username
      );
    }
    return undefined;
  };

  const deriveSessionDuration = (info: CertificateInfo): string => {
    if (info.course?.session_number_duration) {
      return info.course.session_number_duration;
    }
    if (Array.isArray(info.schedule_plan) && info.schedule_plan.length > 0) {
      const plan = info.schedule_plan[0];
      return (
        plan?.session_number_duration ||
        plan?.duration ||
        plan?.duration_text ||
        ""
      );
    }
    return "";
  };

  const findMatchingCertificateFrame = (
    info: CertificateInfo,
    frames: CertificateFrame[],
    fallbackIndex: number
  ): CertificateFrame | null => {
    if (!frames || frames.length === 0) {
      return null;
    }

    if (!info) {
      return frames[fallbackIndex] || frames[0] || null;
    }

    const byId = frames.find((frame) => frame._id === info._id);
    if (byId) {
      return byId;
    }

    const candidateTitles = [info.course?.title, info.name]
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => value.trim().toLowerCase());

    for (const candidate of candidateTitles) {
      const matched = frames.find((frame) => {
        const normalized = frame.title ? frame.title.trim().toLowerCase() : "";
        return normalized === candidate;
      });
      if (matched) {
        return matched;
      }
    }

    if (fallbackIndex >= 0 && fallbackIndex < frames.length) {
      return frames[fallbackIndex];
    }

    return frames[0] || null;
  };

  useEffect(() => {
    loadProfile();
    loadCertificateFrames();
    loadCertificates();
  }, []);

  useEffect(() => {
    if (certificates.length > 0 && !selectedCertificateInfo) {
      setSelectedCertificateInfo(certificates[0]);
    }
  }, [certificates, selectedCertificateInfo]);

  useEffect(() => {
    if (!selectedCertificateInfo) {
      if (certificateFrames.length > 0 && !selectedCertificateFrame) {
        setSelectedCertificateFrame(certificateFrames[0]);
      }
      return;
    }

    const index = certificates.findIndex(
      (item) => item._id === selectedCertificateInfo._id
    );
    const frame = findMatchingCertificateFrame(
      selectedCertificateInfo,
      certificateFrames,
      index
    );
    if (!frame) {
      if (selectedCertificateFrame) {
        setSelectedCertificateFrame(null);
      }
      return;
    }
    if (selectedCertificateFrame?._id !== frame._id) {
      setSelectedCertificateFrame(frame);
    }
  }, [
    certificates,
    certificateFrames,
    selectedCertificateFrame,
    selectedCertificateInfo,
  ]);

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
      // Validate birthday if present
      if (editData.birthday && editData.birthday.trim()) {
        const selected = new Date(editData.birthday);
        const now = new Date();
        if (isNaN(selected.getTime())) {
          Alert.alert("Lỗi", "Ngày sinh không hợp lệ");
          setUpdating(false);
          return;
        }
        if (selected > now) {
          Alert.alert("Lỗi", "Ngày sinh không thể là ngày trong tương lai");
          setUpdating(false);
          return;
        }
        const age = now.getFullYear() - selected.getFullYear();
        const m = now.getMonth() - selected.getMonth();
        let exactAge = age;
        if (m < 0 || (m === 0 && now.getDate() < selected.getDate())) {
          exactAge--;
        }

        if (exactAge < 3 || exactAge > 120) {
          Alert.alert("Lỗi", "Bạn phải từ 3 tuổi trở lên");
          setUpdating(false);
          return;
        }
      }

      // Ensure birthday is formatted consistently when updating
      const payload = { ...editData } as any;
      if (payload.birthday) {
        // If user provided YYYY-MM-DD, convert to ISO-like UTC date string
        const asDate = new Date(payload.birthday);
        if (!isNaN(asDate.getTime())) {
          // normalized to YYYY-MM-DDT00:00:00.000Z
          payload.birthday = asDate.toISOString();
        }
      }
      await updateMemberProfile(payload);
      showSuccessToast("Cập nhật thông tin hồ sơ thành công");
      setShowEditModal(false);
      loadProfile();
      loadUserInfo();
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
      const uploadRes = await postMedia({
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
    setShowLogoutModal(true);
  };

  // Handle logout confirmation
  const handleLogoutConfirm = async () => {
    try {
      setShowLogoutModal(false);
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowEditModal(false)}
    >
      <View style={styles.modalOverlayModern}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
        />
        <Animated.View
          style={[
            styles.modalContentModern,
            {
              opacity: modalAnimation,
              transform: [
                {
                  translateY: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
                {
                  scale: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.modalHeaderModern}>
            <View style={styles.modalHeaderLeft}>
              <View style={styles.modalIconContainerModern}>
                <Ionicons name="pencil" size={20} color={colors.white} />
              </View>
              <Text style={styles.modalTitleModern}>Chỉnh sửa hồ sơ</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowEditModal(false)}
              style={styles.closeButtonModern}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalFormContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formGroupModern}>
              <Text style={styles.labelModern}>Tên đăng nhập</Text>
              <View style={styles.inputWrapperModern}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.primary}
                  style={styles.inputIconModern}
                />
                <TextInput
                  style={styles.inputModern}
                  value={editData.username}
                  onChangeText={(text) =>
                    setEditData({ ...editData, username: text })
                  }
                  placeholder="Nhập tên đăng nhập"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
            </View>

            <View style={styles.formGroupModern}>
              <Text style={styles.labelModern}>Số điện thoại</Text>
              <View style={styles.inputWrapperModern}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={colors.primary}
                  style={styles.inputIconModern}
                />
                <TextInput
                  style={styles.inputModern}
                  value={editData.phone}
                  onChangeText={(text) =>
                    setEditData({ ...editData, phone: text })
                  }
                  placeholder="Nhập số điện thoại"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
            </View>

            <View style={styles.formGroupModern}>
              <Text style={styles.labelModern}>Ngày sinh</Text>
              <TouchableOpacity
                style={styles.datePickerTrigger}
                onPress={showDatePickerModal}
                activeOpacity={0.7}
              >
                <View style={styles.inputWrapperModern}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={colors.primary}
                    style={styles.inputIconModern}
                  />
                  <Text style={styles.datePickerTextModern}>
                    {editData.birthday
                      ? formatDateForDisplay(editData.birthday)
                      : "Chọn ngày sinh"}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.gray[400]}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalFooterModern}>
            <TouchableOpacity
              style={styles.modalCancelButtonModern}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.modalCancelTextModern}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalSaveButtonModern,
                updating && { opacity: 0.7 },
              ]}
              onPress={handleUpdateProfile}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.modalSaveTextModern}>Lưu thay đổi</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
        {renderDatePicker()}
      </View>
    </Modal>
  );

  const renderDatePicker = () => {
    if (!showDatePicker) return null;

    if (Platform.OS === "ios") {
      return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
          <Animated.View
            style={[
              styles.modalBackdrop,
              {
                backgroundColor: "rgba(0,0,0,0.5)",
                opacity: datePickerAnimation,
              },
            ]}
          >
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={handleDateCancel}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.datePickerModalModern,
              {
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                transform: [
                  {
                    translateY: datePickerAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.datePickerHeaderModern}>
              <TouchableOpacity onPress={handleDateCancel}>
                <Text style={styles.datePickerCancelTextModern}>Hủy</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitleModern}>Chọn ngày sinh</Text>
              <TouchableOpacity onPress={handleDateConfirm}>
                <Text style={styles.datePickerConfirmTextModern}>Xong</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.datePickerPickerContainerModern}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                themeVariant="light"
                textColor="black"
                onChange={(event: DateTimePickerEvent, date?: Date) => {
                  if (date) setTempDate(date);
                }}
                maximumDate={(() => {
                  const d = new Date();
                  d.setFullYear(d.getFullYear() - 3);
                  return d;
                })()}
                style={{ width: 320 }}
              />
            </View>
          </Animated.View>
        </View>
      );
    }

    return (
      <DateTimePicker
        value={tempDate}
        mode="date"
        display="calendar"
        onChange={(event: DateTimePickerEvent, date?: Date) => {
          if (event && (event as any).type === "set" && date) {
            setSelectedDate(date);
            setEditData({
              ...editData,
              birthday: formatDateForAPI(date),
            });
          }
          setShowDatePicker(false);
        }}
        maximumDate={(() => {
          const d = new Date();
          d.setFullYear(d.getFullYear() - 3);
          return d;
        })()}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
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
              blurRadius={10}
            />
            <LinearGradient
              colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0)"]}
              style={styles.coverTopShade}
            />
            <LinearGradient
              colors={["rgba(255,255,255,0)", "#ffffff"]}
              style={styles.coverBottomFade}
            />

            {/* Header buttons positioned on cover */}
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={colors.white} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  setEditData({
                    username: profile?.username || "",
                    phone: profile?.phone || "",
                    birthday: profile?.birthday
                      ? String(profile.birthday).split("T")[0]
                      : "",
                  });
                  if (profile?.birthday) {
                    const bDate = new Date(profile.birthday);
                    if (!isNaN(bDate.getTime())) {
                      setSelectedDate(bDate);
                    }
                  }
                  setShowEditModal(true);
                }}
              >
                <Ionicons name="pencil" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
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

          <View style={styles.infoCardModern}>
            {/* Username */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={styles.infoIconCircle}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabelNew}>Tên đăng nhập</Text>
                  <Text style={styles.infoValueNew}>
                    {profile?.username || "Chưa cập nhật"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Email */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={styles.infoIconCircle}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabelNew}>Email</Text>
                  <Text style={styles.infoValueNew}>{profile?.email}</Text>
                </View>
              </View>
            </View>

            {/* Phone */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={styles.infoIconCircle}>
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabelNew}>Số điện thoại</Text>
                  <Text style={styles.infoValueNew}>
                    {profile?.phone || "Chưa cập nhật"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Birthday & Age */}
            <View style={styles.infoCardModernc}>
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={styles.infoIconCircle}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.infoTexts}>
                    <Text style={styles.infoLabelNew}>Ngày sinh</Text>
                    <Text style={styles.infoValueNew}>
                      {profile?.birthday
                        ? formatDateForDisplay(profile.birthday)
                        : "Chưa cập nhật"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoRowLast}>
                <View style={styles.infoLeft}>
                  <View style={styles.infoIconCircle}>
                    <Ionicons
                      name="people-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.infoTexts}>
                    <Text style={styles.infoLabelNew}>Tuổi</Text>
                    <Text style={styles.infoValueNew}>
                      {profile?.birthday
                        ? (() => {
                            const birth = new Date(profile.birthday);
                            if (isNaN(birth.getTime())) return "-";
                            const now = new Date();
                            let age = now.getFullYear() - birth.getFullYear();
                            const m = now.getMonth() - birth.getMonth();
                            if (
                              m < 0 ||
                              (m === 0 && now.getDate() < birth.getDate())
                            ) {
                              age--;
                            }
                            return `${age} tuổi`;
                          })()
                        : "Chưa có"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Roles */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={styles.infoIconCircle}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabelNew}>Vai trò</Text>
                  <View style={styles.pillsRow}>
                    {(profile?.role_front && profile.role_front.length > 0
                      ? profile.role_front
                      : ["Chưa có"]
                    ).map((r, idx) => (
                      <View key={`${r}-${idx}`} style={styles.pill}>
                        <Text style={styles.pillText}>
                          {r === "instructor"
                            ? "Huấn luyện viên"
                            : r === "member"
                            ? "Học viên"
                            : r}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Created at */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={styles.infoIconCircle}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabelNew}>Ngày tạo</Text>
                  <Text style={styles.infoValueNew}>
                    {profile?.created_at
                      ? new Date(
                          new Date(profile.created_at).getTime() +
                            new Date().getTimezoneOffset() * 60000
                        ).toLocaleDateString("vi-VN", {
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
            </View>

            {/* Updated at */}
            <View style={styles.infoRowLast}>
              <View style={styles.infoLeft}>
                <View style={styles.infoIconCircle}>
                  <Ionicons
                    name="refresh-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabelNew}>Cập nhật lần cuối</Text>
                  <Text style={styles.infoValueNew}>
                    {profile?.updated_at
                      ? new Date(profile.updated_at).toLocaleDateString(
                          "vi-VN",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "UTC",
                          }
                        )
                      : "Chưa có thông tin"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Certificates Section */}
        <View style={styles.certificatesSection}>
          <Text style={styles.sectionTitle}>Chứng chỉ</Text>

          <TouchableOpacity
            style={styles.externalCertificateCard}
            onPress={() => {
              if (profile?._id) {
                Linking.openURL(
                  `https://admin-system-snowy.vercel.app/certificate?user=${profile._id}`
                );
              }
            }}
          >
            <LinearGradient
              colors={[colors.primary, "#4FC3F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.externalCertificateGradient}
            >
              <View style={styles.externalCertificateContent}>
                <View style={styles.externalCertificateIcon}>
                  <Ionicons name="globe-outline" size={24} color="#FFF" />
                </View>
                <View style={styles.externalCertificateTextContainer}>
                  <Text style={styles.externalCertificateTitle}>
                    Xem hồ sơ online
                  </Text>
                  <Text style={styles.externalCertificateSubtitle}>
                    Xem chi tiết trên hệ thống
                  </Text>
                </View>
                <Ionicons
                  name="open-outline"
                  size={20}
                  color="rgba(255,255,255,0.8)"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {loadingCertificates || loadingCertificateFrames ? (
            <View style={styles.certificatesLoadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.certificatesLoadingText}>
                Đang tải chứng chỉ...
              </Text>
            </View>
          ) : certificates.length > 0 ? (
            <View style={styles.certificatesList}>
              {certificates.map((cert, index) => (
                <TouchableOpacity
                  key={cert._id}
                  style={styles.certificateCard}
                  onPress={() => {
                    const frame = findMatchingCertificateFrame(
                      cert,
                      certificateFrames,
                      index
                    );
                    if (frame) {
                      const html = replacePlaceholders(frame.html, cert);
                      (navigation as any).navigate("CertificateViewer", {
                        title:
                          cert.course?.title ||
                          cert.name ||
                          frame.title ||
                          "Chứng chỉ",
                        html: html,
                      });
                    }
                  }}
                >
                  <View style={styles.certificateIcon}>
                    <Ionicons
                      name="ribbon-outline"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.certificateContent}>
                    <Text style={styles.certificateTitle}>
                      {cert.course?.title ||
                        cert.name ||
                        `Chứng chỉ ${index + 1}`}
                    </Text>
                    <Text style={styles.certificateSubtitle}>
                      Nhấn để xem chi tiết
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.text}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noCertificatesContainer}>
              <Ionicons
                name="ribbon-outline"
                size={48}
                color={colors.text}
                style={{ opacity: 0.3 }}
              />
              <Text style={styles.noCertificatesText}>
                Chưa có chứng chỉ nào
              </Text>
            </View>
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

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalContent}>
            <View style={styles.logoutModalIcon}>
              <Ionicons name="log-out-outline" size={48} color="#F44336" />
            </View>
            <Text style={styles.logoutModalTitle}>Đăng xuất</Text>
            <Text style={styles.logoutModalMessage}>
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?
            </Text>
            <View style={styles.logoutModalActions}>
              <TouchableOpacity
                style={styles.logoutModalCancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.logoutModalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutModalConfirmButton}
                onPress={handleLogoutConfirm}
              >
                <Text style={styles.logoutModalConfirmText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {renderEditModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  headerButtons: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: Platform.OS === "ios" ? 80 : 40,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    position: "relative",
    zIndex: 2,
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
    backgroundColor: colors.mainBackground,
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: 20,
    marginBottom: 20,
  },
  coverContainer: {
    width: "100%",
    height: 280,
    backgroundColor: colors.mainBackground,
    overflow: "hidden",
  },
  coverImage: {
    position: "absolute",
    left: 0,
    top: -30,
    width: "100%",
    height: 340,
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
    marginTop: -50,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 5,
    borderColor: colors.mainBackground,
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
    borderColor: colors.mainBackground,
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
    elevation: 2,
  },
  infoCardModern: {
    backgroundColor: colors.white,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: colors.black,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  infoCardModernc: {
    backgroundColor: colors.white,
    paddingVertical: 6,
    overflow: "hidden",
    shadowColor: colors.black,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  infoRowLast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F9FAFB",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 119, 190, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTexts: {
    flex: 1,
  },
  infoLabelNew: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  infoValueNew: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0, 119, 190, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 119, 190, 0.2)",
  },
  pillText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
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
    elevation: 2,
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
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoutModalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  logoutModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoutModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  logoutModalMessage: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  logoutModalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  logoutModalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  logoutModalCancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  logoutModalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#F44336",
    alignItems: "center",
  },
  logoutModalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  externalCertificateCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  externalCertificateGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  externalCertificateContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  externalCertificateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  externalCertificateTextContainer: {
    flex: 1,
  },
  externalCertificateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  externalCertificateSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
  },
  certificatesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  certificatesLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  certificatesLoadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  certificatesList: {
    gap: 12,
  },
  certificateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  certificateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  certificateContent: {
    flex: 1,
  },
  certificateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  certificateSubtitle: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
  },
  noCertificatesContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  noCertificatesText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
  },
  // Modern Edit Modal Styles
  modalOverlayModern: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  modalContentModern: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    width: "100%",
    maxHeight: "90%",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 25,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  modalHeaderModern: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalIconContainerModern: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalTitleModern: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  closeButtonModern: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalFormContainer: {
    padding: 24,
  },
  formGroupModern: {
    marginBottom: 20,
  },
  labelModern: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapperModern: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIconModern: {
    marginRight: 12,
  },
  inputModern: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    height: "100%",
  },
  datePickerTrigger: {
    width: "100%",
  },
  datePickerTextModern: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  modalFooterModern: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  modalCancelButtonModern: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelTextModern: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
  },
  modalSaveButtonModern: {
    flex: 2,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSaveTextModern: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
  },
  // Date Picker Modal Styles (Modern)
  datePickerModalModern: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  datePickerHeaderModern: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  datePickerCancelTextModern: {
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "500",
  },
  datePickerTitleModern: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  datePickerConfirmTextModern: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  datePickerPickerContainerModern: {
    alignItems: "center",
    paddingVertical: 10,
  },
});
