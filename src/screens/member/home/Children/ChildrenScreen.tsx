import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import {
  getChildrenAccount,
  createChildrenAccount,
} from "@/src/services/information/children/childenServices";
import { showErrorToast } from "@/src/utils/errorHandler";
import { SharedHeader } from "@/src/components/custom/header/SharedHeader";
import { authService } from "@/src/services/auth/authService";
import { styles } from "./style";

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
  const [switchingAccount, setSwitchingAccount] = useState<string | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null);
  const scaleAnims = useRef<Map<string, Animated.Value>>(new Map()).current;
  const menuAnims = useRef<Map<string, Animated.Value>>(new Map()).current;
  const optionAnims = useRef<Map<string, Animated.Value[]>>(new Map()).current;

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

  const loadChildren = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      const response = await getChildrenAccount();
      if (response.data && response.data.data) {
        setChildren(response.data.data.data);
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải tài khoản con",
        message: "Không thể tải danh sách tài khoản con",
      });
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChildren(true);
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
      setShowCreateModal(false);
      setCreateForm({ username: "", email: "", password: "", birthday: "" });
      setFormErrors({});
      await loadChildren();
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tạo tài khoản con",
        message: "Không thể tạo tài khoản con",
      });
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

  const handleSwitchToChild = async (childId: string, childName: string) => {
    try {
      setSwitchingAccount(childId);

      await authService.switchToChildAccount(childId, childName);

      // Navigate to home
      (navigation as any).navigate("BottomTabs", { screen: "Home" });
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi chuyển đổi tài khoản",
        message: "Không thể chuyển đổi tài khoản",
      });
    } finally {
      setSwitchingAccount(null);
    }
  };

  const renderChildrenItem = ({ item }: { item: ChildrenAccount }) => {
    const isSwitching = switchingAccount === item._id;
    const isMenuOpen = showOptionsMenu === item._id;

    if (!scaleAnims.has(item._id)) {
      scaleAnims.set(item._id, new Animated.Value(1));
    }
    const scaleAnim = scaleAnims.get(item._id)!;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    const handleOptionsPress = () => {
      if (!menuAnims.has(item._id)) {
        menuAnims.set(item._id, new Animated.Value(0));
        optionAnims.set(item._id, [
          new Animated.Value(0),
          new Animated.Value(0),
        ]);
      }
      const menuAnim = menuAnims.get(item._id)!;
      const opts = optionAnims.get(item._id)!;

      if (isMenuOpen) {
        // Close menu - smooth fade out
        Animated.parallel([
          Animated.timing(menuAnim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(opts[0], {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(opts[1], {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowOptionsMenu(null);
        });
      } else {
        // Open menu - smooth spring animation
        setShowOptionsMenu(item._id);
        // Reset option animations
        opts[0].setValue(0);
        opts[1].setValue(0);

        Animated.parallel([
          Animated.spring(menuAnim, {
            toValue: 1,
            tension: 120,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(30),
            Animated.spring(opts[0], {
              toValue: 1,
              tension: 150,
              friction: 8,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(60),
            Animated.spring(opts[1], {
              toValue: 1,
              tension: 150,
              friction: 8,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }
    };

    const handleOptionSelect = (option: string) => {
      // Close menu immediately
      setShowOptionsMenu(null);

      // Execute action immediately
      if (option === "access") {
        handleSwitchToChild(item._id, item.username);
      } else if (option === "schedule") {
        navigation.navigate("ChildrenSchedule", {
          childId: item._id,
          childName: item.username,
        });
      }
    };

    return (
      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.childrenCard,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isSwitching}
          >
            <View style={styles.childrenCardHeader}>
              <View style={styles.avatarWrapper}>
                <View style={styles.childrenAvatar}>
                  <Ionicons name="person" size={28} color={colors.white} />
                </View>
              </View>
              <View style={styles.childrenInfo}>
                <View style={styles.childrenHeader}>
                  <Text style={styles.childrenName} numberOfLines={1}>
                    {item.username}
                  </Text>
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
                  <Text style={styles.childrenEmail} numberOfLines={1}>
                    {item.email}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.childrenCardFooter}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.primary}
                />
                <Text style={styles.metaText}>{formatDate(item.birthday)}</Text>
              </View>

              <TouchableOpacity
                style={styles.optionsButton}
                onPress={handleOptionsPress}
                activeOpacity={0.7}
                disabled={isSwitching}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Options Menu */}
        {isMenuOpen &&
          (() => {
            const menuAnim = menuAnims.get(item._id) || new Animated.Value(0);
            const opts = optionAnims.get(item._id) || [
              new Animated.Value(0),
              new Animated.Value(0),
            ];

            const translateY = menuAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [-8, -2, 0],
            });

            const scale = menuAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.95, 1],
            });

            const opacity = menuAnim.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [0, 0.8, 1],
            });

            const option1Opacity = opts[0].interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.7, 1],
            });

            const option1TranslateX = opts[0].interpolate({
              inputRange: [0, 1],
              outputRange: [-15, 0],
            });

            const option1Scale = opts[0].interpolate({
              inputRange: [0, 1],
              outputRange: [0.98, 1],
            });

            const option2Opacity = opts[1].interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.7, 1],
            });

            const option2TranslateX = opts[1].interpolate({
              inputRange: [0, 1],
              outputRange: [-15, 0],
            });

            const option2Scale = opts[1].interpolate({
              inputRange: [0, 1],
              outputRange: [0.98, 1],
            });

            return (
              <Animated.View
                style={[
                  styles.optionsMenu,
                  {
                    opacity,
                    transform: [{ translateY }, { scale }],
                  },
                ]}
              >
                <Animated.View
                  style={{
                    opacity: option1Opacity,
                    transform: [
                      { translateX: option1TranslateX },
                      { scale: option1Scale },
                    ],
                  }}
                  pointerEvents="auto"
                >
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => {
                      console.log("Access pressed");
                      handleOptionSelect("access");
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="finger-print-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.optionText}>
                      Truy cập tài khoản con
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
                <Animated.View
                  style={{
                    opacity: menuAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 0.5, 1],
                    }),
                  }}
                >
                  <View style={styles.optionDivider} />
                </Animated.View>
                <Animated.View
                  style={{
                    opacity: option2Opacity,
                    transform: [
                      { translateX: option2TranslateX },
                      { scale: option2Scale },
                    ],
                  }}
                  pointerEvents="auto"
                >
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => {
                      console.log("Schedule pressed");
                      handleOptionSelect("schedule");
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.optionText}>Lịch học</Text>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            );
          })()}
      </View>
    );
  };

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
          <ActivityIndicator size="large" color={colors.primary} />
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
        <>
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
        </>
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
    </View>
  );
}
