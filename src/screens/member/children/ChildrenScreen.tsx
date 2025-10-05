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
import CustomToast from "@/src/components/custom/CustomToast";

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
          <Ionicons name="person" size={24} color={colors.white} />
        </View>
        <View style={styles.childrenInfo}>
          <View style={styles.childrenHeader}>
            <Text style={styles.childrenName}>{item.username}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Hoạt động</Text>
            </View>
          </View>
          <Text style={styles.childrenEmail}>{item.email}</Text>
        </View>
      </View>

      <View style={styles.childrenCardFooter}>
        <View style={styles.childrenMeta}>
          <View style={styles.metaItem}>
            <Ionicons
              name="calendar-outline"
              size={14}
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
          >
            <Ionicons name="calendar-outline" size={16} color={colors.white} />
            <Text style={styles.primaryActionText}>Lịch học</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction]}
          >
            <Ionicons
              name="settings-outline"
              size={16}
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
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: modalAnimation,
              transform: [
                {
                  translateY: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowCreateModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Tạo tài khoản con</Text>
              <Text style={styles.modalSubtitle}>
                Điền thông tin để tạo tài khoản cho con
              </Text>
            </View>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            style={styles.formContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formCard}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={colors.primary}
                  />{" "}
                  Tên đăng nhập
                </Text>
                <View style={styles.inputContainer}>
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
                    placeholderTextColor={colors.gray}
                  />
                </View>
                {formErrors.username && (
                  <Text style={styles.errorText}>{formErrors.username}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={colors.primary}
                  />{" "}
                  Email
                </Text>
                <View style={styles.inputContainer}>
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
                    placeholderTextColor={colors.gray}
                  />
                </View>
                {formErrors.email && (
                  <Text style={styles.errorText}>{formErrors.email}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={16}
                    color={colors.primary}
                  />{" "}
                  Mật khẩu
                </Text>
                <View style={styles.inputContainer}>
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
                    placeholderTextColor={colors.gray}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.gray}
                    />
                  </TouchableOpacity>
                </View>
                {formErrors.password && (
                  <Text style={styles.errorText}>{formErrors.password}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={colors.primary}
                  />{" "}
                  Ngày sinh
                </Text>
                <TouchableOpacity
                  style={styles.datePickerContainer}
                  onPress={showDatePickerModal}
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
                  <Text style={styles.errorText}>{formErrors.birthday}</Text>
                )}
              </View>
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
              <View style={styles.buttonContent}>
                {creating && (
                  <Ionicons
                    name="refresh"
                    size={20}
                    color={colors.white}
                    style={styles.buttonIcon}
                  />
                )}
                <Text style={styles.createButtonText}>
                  {creating ? "Đang tạo..." : "Tạo tài khoản"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>

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
          keyExtractor={(item) => item._id}
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
    paddingVertical: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E7FF",
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    letterSpacing: -0.5,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    backgroundColor: "#F8FAFC",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
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
  },
  childrenCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  childrenCardHeader: {
    flexDirection: "row",
    padding: 20,
    paddingBottom: 16,
    alignItems: "center",
  },
  childrenCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  childrenAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  childrenInfo: {
    flex: 1,
  },
  childrenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  childrenName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
  },
  childrenEmail: {
    fontSize: 14,
    color: colors.gray,
  },
  childrenMeta: {
    flexDirection: "row",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: "500",
  },
  statusBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: "600",
  },
  childrenActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    minWidth: 90,
  },
  secondaryAction: {
    backgroundColor: "#F0F4FF",
    borderWidth: 1,
    borderColor: colors.primary,
    minWidth: 80,
  },
  primaryActionText: {
    marginLeft: 6,
    fontSize: 13,
    color: colors.white,
    fontWeight: "600",
  },
  secondaryActionText: {
    marginLeft: 6,
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
  },
  modalContent: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.text,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: "#FF6B6B",
    backgroundColor: "#FFF5F5",
  },
  passwordToggle: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 4,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
  },
  modalFooter: {
    padding: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    backgroundColor: colors.gray,
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
    fontSize: 16,
    fontWeight: "600",
  },
  datePickerContainer: {
    marginBottom: 8,
  },
  datePickerInput: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  datePickerText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  placeholderText: {
    color: colors.gray,
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
    color: colors.gray,
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
