import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import {
  getChildrenAccount,
  createChildrenAccount,
} from "@/src/services/information/children/childenServices";
import CustomToast from "@/src/components/custom/toast/CustomToast";
import { showErrorToast } from "@/src/utils/errorHandler";
import { SharedHeader } from "@/src/components/custom/header/SharedHeader";

interface ChildrenAccount {
  _id: string;
  username: string;
  email: string;
  role_front: string[];
  parent_id: string[];
  birthday: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  featured_image: string[];
}

interface CreateChildrenForm {
  username: string;
  email: string;
  password: string;
  birthday: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  birthday?: string;
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
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [modalAnimation] = useState(new Animated.Value(0));
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showCreateModal, modalAnimation]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const response = await getChildrenAccount();
      if (response.data && response.data.data) {
        setChildren(response.data.data.data);
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải tài khoản con",
        message: "Không thể tải danh sách tài khoản con",
      });
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

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!createForm.username.trim()) {
      errors.username = "Tên đăng nhập không được để trống";
    } else if (createForm.username.length < 3) {
      errors.username = "Tên đăng nhập phải có ít nhất 3 ký tự";
    }

    if (!createForm.email.trim()) {
      errors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errors.email = "Email không hợp lệ";
    }

    if (!createForm.password.trim()) {
      errors.password = "Mật khẩu không được để trống";
    } else if (createForm.password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!createForm.birthday.trim()) {
      errors.birthday = "Ngày sinh không được để trống";
    } else {
      const selectedDate = new Date(createForm.birthday);
      const today = new Date();
      const age = today.getFullYear() - selectedDate.getFullYear();

      if (selectedDate > today) {
        errors.birthday = "Ngày sinh không thể là ngày trong tương lai";
      } else if (age < 0 || age > 120) {
        errors.birthday = "Tuổi phải từ 0 đến 120";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateChildren = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);

      // Debug payload before sending
      console.log("Payload being sent to API:", createForm);
      console.log("Birthday format:", createForm.birthday);
      console.log("Birthday type:", typeof createForm.birthday);

      await createChildrenAccount(createForm);
      setToast({ message: "Tạo tài khoản con thành công", type: "success" });
      setShowCreateModal(false);
      setCreateForm({ username: "", email: "", password: "", birthday: "" });
      setFormErrors({});
      await loadChildren();
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tạo tài khoản con",
        message: "Không thể tạo tài khoản con",
      });
      setToast({ message: "Không thể tạo tài khoản con", type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString("vi-VN");
  };

  const formatDateForAPI = (date: Date) => {
    // Format as UTC date string (YYYY-MM-DD) for API
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const showDatePickerModal = () => {
    setTempDate(selectedDate);
    setShowDatePicker(true);
  };

  const handleDateConfirm = () => {
    setSelectedDate(tempDate);
    setCreateForm({
      ...createForm,
      birthday: formatDateForAPI(tempDate),
    });
    setShowDatePicker(false);
    if (formErrors.birthday) {
      setFormErrors({ ...formErrors, birthday: undefined });
    }
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year);
    }
    return years;
  };

  const generateMonthOptions = () => {
    return [
      { value: 0, label: "Tháng 1" },
      { value: 1, label: "Tháng 2" },
      { value: 2, label: "Tháng 3" },
      { value: 3, label: "Tháng 4" },
      { value: 4, label: "Tháng 5" },
      { value: 5, label: "Tháng 6" },
      { value: 6, label: "Tháng 7" },
      { value: 7, label: "Tháng 8" },
      { value: 8, label: "Tháng 9" },
      { value: 9, label: "Tháng 10" },
      { value: 10, label: "Tháng 11" },
      { value: 11, label: "Tháng 12" },
    ];
  };

  const generateDayOptions = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const renderChildrenItem = ({ item }: { item: ChildrenAccount }) => (
    <View style={styles.childrenCard}>
      <View style={styles.childrenCardHeader}>
        <View style={styles.childrenAvatar}>
          <Ionicons name="person" size={28} color={colors.white} />
        </View>
        <View style={styles.childrenInfo}>
          <View style={styles.childrenHeader}>
            <Text style={styles.childrenName}>{item.username}</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Hoạt động</Text>
            </View>
          </View>
          <View style={styles.childrenEmailContainer}>
            <Ionicons
              name="mail-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.childrenEmail}>{item.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.childrenCardDivider} />

      <View style={styles.childrenCardFooter}>
        <View style={styles.childrenMeta}>
          <View style={styles.metaItem}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.metaText}>{formatDate(item.birthday)}</Text>
          </View>
        </View>

        <View style={styles.childrenActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={() =>
              navigation.navigate("ChildrenSchedule", {
                childId: item._id,
                childName: item.username,
              })
            }
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.white} />
            <Text style={styles.primaryActionText}>Lịch học</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="settings-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.secondaryActionText}>Cài đặt</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}
        />
        <Animated.View
          style={[
            styles.modalContent,
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
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            {/* Header với gradient primary */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name="person-add" size={28} color={colors.white} />
                </View>
                <View style={[styles.modalTitleContainer, { marginLeft: 16 }]}>
                  <Text style={styles.modalTitle}>Tạo tài khoản con</Text>
                  <Text style={styles.modalSubtitle}>
                    Điền thông tin để tạo tài khoản cho con
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={colors.white} />
              </TouchableOpacity>
            </View>

            {/* Form Content */}
            <ScrollView
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContentContainer}
            >
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <View style={styles.labelIcon}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.label, { marginLeft: 10 }]}>
                    Tên đăng nhập
                  </Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      formErrors.username && styles.inputError,
                    ]}
                    value={createForm.username}
                    onChangeText={(text) => {
                      setCreateForm({ ...createForm, username: text });
                      if (formErrors.username) {
                        setFormErrors({ ...formErrors, username: undefined });
                      }
                    }}
                    placeholder="Nhập tên đăng nhập"
                    autoCapitalize="none"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
                {formErrors.username && (
                  <View style={styles.errorContainer}>
                    <Ionicons
                      name="alert-circle"
                      size={14}
                      color={colors.error}
                    />
                    <Text style={[styles.errorText, { marginLeft: 6 }]}>
                      {formErrors.username}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <View style={styles.labelIcon}>
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.label, { marginLeft: 10 }]}>Email</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      formErrors.email && styles.inputError,
                    ]}
                    value={createForm.email}
                    onChangeText={(text) => {
                      setCreateForm({ ...createForm, email: text });
                      if (formErrors.email) {
                        setFormErrors({ ...formErrors, email: undefined });
                      }
                    }}
                    placeholder="Nhập email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
                {formErrors.email && (
                  <View style={styles.errorContainer}>
                    <Ionicons
                      name="alert-circle"
                      size={14}
                      color={colors.error}
                    />
                    <Text style={[styles.errorText, { marginLeft: 6 }]}>
                      {formErrors.email}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <View style={styles.labelIcon}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.label, { marginLeft: 10 }]}>
                    Mật khẩu
                  </Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      formErrors.password && styles.inputError,
                    ]}
                    value={createForm.password}
                    onChangeText={(text) => {
                      setCreateForm({ ...createForm, password: text });
                      if (formErrors.password) {
                        setFormErrors({ ...formErrors, password: undefined });
                      }
                    }}
                    placeholder="Nhập mật khẩu"
                    secureTextEntry={!showPassword}
                    placeholderTextColor={colors.gray[400]}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.gray[500]}
                    />
                  </TouchableOpacity>
                </View>
                {formErrors.password && (
                  <View style={styles.errorContainer}>
                    <Ionicons
                      name="alert-circle"
                      size={14}
                      color={colors.error}
                    />
                    <Text style={[styles.errorText, { marginLeft: 6 }]}>
                      {formErrors.password}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <View style={styles.labelIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.label, { marginLeft: 10 }]}>
                    Ngày sinh
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.datePickerContainer}
                  onPress={showDatePickerModal}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.datePickerInput,
                      formErrors.birthday && styles.inputError,
                    ]}
                  >
                    <Text
                      style={[
                        styles.datePickerText,
                        !createForm.birthday && styles.placeholderText,
                      ]}
                    >
                      {createForm.birthday
                        ? formatDateForDisplay(new Date(createForm.birthday))
                        : "Chọn ngày sinh"}
                    </Text>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                </TouchableOpacity>
                {formErrors.birthday && (
                  <View style={styles.errorContainer}>
                    <Ionicons
                      name="alert-circle"
                      size={14}
                      color={colors.error}
                    />
                    <Text style={[styles.errorText, { marginLeft: 6 }]}>
                      {formErrors.birthday}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer với button primary */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.createButton,
                  creating && styles.createButtonDisabled,
                ]}
                onPress={handleCreateChildren}
                disabled={creating}
                activeOpacity={0.8}
              >
                {creating ? (
                  <View style={styles.buttonContent}>
                    <Ionicons
                      name="refresh"
                      size={20}
                      color={colors.white}
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.createButtonText}>Đang tạo...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.white}
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.createButtonText}>Tạo tài khoản</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>

      {showDatePicker && (
        <Modal visible={showDatePicker} transparent={true} animationType="fade">
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={handleDateCancel}>
                  <Text style={styles.datePickerCancelText}>Hủy</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>Chọn ngày sinh</Text>
                <TouchableOpacity onPress={handleDateConfirm}>
                  <Text style={styles.datePickerConfirmText}>Xong</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.datePickerContent}>
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Năm</Text>
                  <ScrollView
                    style={styles.datePickerScroll}
                    showsVerticalScrollIndicator={false}
                  >
                    {generateYearOptions().map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.datePickerOption,
                          tempDate.getFullYear() === year &&
                            styles.datePickerOptionSelected,
                        ]}
                        onPress={() =>
                          setTempDate(
                            new Date(
                              year,
                              tempDate.getMonth(),
                              tempDate.getDate()
                            )
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.datePickerOptionText,
                            tempDate.getFullYear() === year &&
                              styles.datePickerOptionTextSelected,
                          ]}
                        >
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Tháng</Text>
                  <ScrollView
                    style={styles.datePickerScroll}
                    showsVerticalScrollIndicator={false}
                  >
                    {generateMonthOptions().map((month) => (
                      <TouchableOpacity
                        key={month.value}
                        style={[
                          styles.datePickerOption,
                          tempDate.getMonth() === month.value &&
                            styles.datePickerOptionSelected,
                        ]}
                        onPress={() =>
                          setTempDate(
                            new Date(
                              tempDate.getFullYear(),
                              month.value,
                              tempDate.getDate()
                            )
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.datePickerOptionText,
                            tempDate.getMonth() === month.value &&
                              styles.datePickerOptionTextSelected,
                          ]}
                        >
                          {month.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Ngày</Text>
                  <ScrollView
                    style={styles.datePickerScroll}
                    showsVerticalScrollIndicator={false}
                  >
                    {generateDayOptions(
                      tempDate.getFullYear(),
                      tempDate.getMonth()
                    ).map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.datePickerOption,
                          tempDate.getDate() === day &&
                            styles.datePickerOptionSelected,
                        ]}
                        onPress={() =>
                          setTempDate(
                            new Date(
                              tempDate.getFullYear(),
                              tempDate.getMonth(),
                              day
                            )
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.datePickerOptionText,
                            tempDate.getDate() === day &&
                              styles.datePickerOptionTextSelected,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );

  return (
    <View style={styles.container}>
      <SharedHeader
        title="Con của tôi"
        subtitle="Quản lý tài khoản con"
        showBackButton={true}
        backgroundColor={colors.primary}
        titleColor={colors.white}
        bottomCurve={true}
        bottomCurveColor={colors.mainBackground}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <Ionicons
            name="refresh"
            size={32}
            color={colors.primary}
            style={styles.loadingIcon}
          />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : children.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="people-outline" size={80} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có tài khoản con</Text>
          <Text style={styles.emptySubtitle}>
            Tạo tài khoản con để quản lý lịch học và thông tin
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={styles.emptyButtonText}>Tạo tài khoản con</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={children}
          renderItem={renderChildrenItem}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button */}
      {children.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}

      {renderCreateModal()}
      {toast && (
        <CustomToast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.mainBackground,
  },
  loadingIcon: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: colors.mainBackground,
    paddingTop: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.lightPrimary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
    paddingTop: 24,
  },
  childrenCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  childrenCardHeader: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
  },
  childrenCardDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: 20,
  },
  childrenCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  childrenAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  childrenInfo: {
    flex: 1,
  },
  childrenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  childrenName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
    letterSpacing: -0.3,
  },
  childrenEmailContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  childrenEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  childrenMeta: {
    flexDirection: "row",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightPrimary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  statusBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  statusText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  childrenActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
    gap: 6,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    minWidth: 100,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryAction: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
    minWidth: 90,
  },
  primaryActionText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: "600",
  },
  secondaryActionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    minHeight: "73%",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    backgroundColor: colors.primary,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeaderContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  formContainer: {
    flex: 1,
  },
  formContentContainer: {
    padding: 24,
    paddingBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  labelIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lightPrimary,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.text,
    minHeight: 52,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: "#FFF5F5",
  },
  passwordToggle: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 4,
    zIndex: 1,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingLeft: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  modalFooter: {
    padding: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  createButtonDisabled: {
    backgroundColor: colors.gray[400],
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  datePickerContainer: {
    marginBottom: 8,
  },
  datePickerInput: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: colors.white,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 52,
  },
  datePickerText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  placeholderText: {
    color: colors.gray[400],
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  datePickerModal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  datePickerCancelText: {
    fontSize: 16,
    color: colors.gray as unknown as string,
    fontWeight: "500",
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  datePickerConfirmText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  datePickerContent: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  datePickerColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  datePickerScroll: {
    maxHeight: 200,
  },
  datePickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: "center",
  },
  datePickerOptionSelected: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  datePickerOptionText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  datePickerOptionTextSelected: {
    color: colors.white,
    fontWeight: "600",
  },
});
