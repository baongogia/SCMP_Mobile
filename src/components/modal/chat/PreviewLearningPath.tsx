import { colors } from "@/src/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { styles } from "@/src/screens/member/home/AI_agent/style";
import { getAllCourses } from "@/src/services/learning_process/course/courseService";
import { showErrorToast } from "@/src/utils/errorHandler";
import { CustomDropdown } from "@/src/components/custom/dropdown/CustomDropdown";

interface PreviewLearningPathProps {
  onCancelLearningPath: () => void;
  onConfirmLearningPath: (title?: string, process?: any[]) => void;
  setPreviewLP: (previewLP: any) => void;
  previewLP: any;
}

export default function PreviewLearningPath({
  onCancelLearningPath,
  onConfirmLearningPath,
  previewLP,
  setPreviewLP,
}: PreviewLearningPathProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(previewLP?.title || "");
  const [localProcess, setLocalProcess] = useState(previewLP?.process || []);
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseValue, setSelectedCourseValue] = useState("");

  // Load courses when component mounts
  useEffect(() => {
    loadCourses();
  }, []);

  // Sync local state when previewLP changes
  useEffect(() => {
    if (previewLP) {
      // Filter to only include items with valid course IDs
      const validProcess = (previewLP.process || []).filter(
        (item: any) => item.course && String(item.course).trim().length > 0
      );

      console.log("PreviewLearningPath - previewLP received:", {
        title: previewLP.title,
        originalProcessCount: previewLP.process?.length || 0,
        validProcessCount: validProcess.length,
        filteredOut: (previewLP.process?.length || 0) - validProcess.length,
        process: previewLP.process,
        validProcess: validProcess,
      });

      // Log if there's a mismatch
      if (validProcess.length !== (previewLP.process?.length || 0)) {
        console.warn(
          `⚠️ Filtered out ${
            (previewLP.process?.length || 0) - validProcess.length
          } items without valid course IDs`
        );
      }

      // Only update if values actually changed to avoid unnecessary re-renders
      const newTitle = previewLP.title || "";
      const processChanged =
        JSON.stringify(validProcess) !== JSON.stringify(localProcess);

      if (newTitle !== localTitle) {
        setLocalTitle(newTitle);
      }
      if (processChanged) {
        setLocalProcess(validProcess);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewLP]);

  // Update previewLP when local changes (but not when editing title to avoid infinite loop)
  useEffect(() => {
    if (
      previewLP &&
      !editingTitle && // Don't update while editing title
      (localTitle !== previewLP.title ||
        JSON.stringify(localProcess) !== JSON.stringify(previewLP.process))
    ) {
      setPreviewLP({
        ...previewLP,
        title: localTitle,
        process: localProcess,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localTitle, localProcess, editingTitle]);

  const loadCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await getAllCourses();
      console.log("getAllCourses response:", response?.data);
      if (response.data && response.data.data) {
        const courses = response.data.data;
        console.log("Setting available courses:", courses.length);
        setAvailableCourses(courses);
      } else if (response.data) {
        // Fallback if data structure is different
        const courses = Array.isArray(response.data) ? response.data : [];
        console.log("Setting available courses (fallback):", courses.length);
        setAvailableCourses(courses);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
      showErrorToast(error, {
        title: "Lỗi",
        message: "Không thể tải danh sách khóa học",
      });
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleEditTitle = () => {
    setEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (!localTitle.trim()) {
      Alert.alert("Lỗi", "Tiêu đề không được để trống");
      return;
    }
    setEditingTitle(false);
    // Update previewLP after saving title
    if (previewLP && localTitle !== previewLP.title) {
      setPreviewLP({
        ...previewLP,
        title: localTitle,
      });
    }
  };

  const handleDeleteCourse = (index: number) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa khóa học này khỏi lộ trình?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            const newProcess = localProcess.filter(
              (_: any, i: number) => i !== index
            );
            setLocalProcess(newProcess);
          },
        },
      ]
    );
  };

  const handleAddCourse = (courseId: string) => {
    const course = availableCourses.find(
      (c) => c._id === courseId || c.id === courseId
    );
    if (!course) return;

    // Check if course already exists
    const exists = localProcess.some(
      (p: any) => p.course === course._id || p.course === course.id
    );
    if (exists) {
      Alert.alert("Thông báo", "Khóa học này đã có trong lộ trình");
      setSelectedCourseValue(""); // Reset selection
      return;
    }

    const newStep = {
      title: course.title,
      course: course._id || course.id,
      courseTitle: course.title,
      courseDescription: course.description,
    };
    setLocalProcess([...localProcess, newStep]);
    setSelectedCourseValue(""); // Reset selection after adding
  };

  // Get dropdown items (only courses not already added)
  const getDropdownItems = () => {
    return availableCourses
      .filter((course) => {
        const courseId = course._id || course.id;
        return !localProcess.some((p: any) => p.course === courseId);
      })
      .map((course) => ({
        label: course.title,
        value: course._id || course.id,
      }));
  };

  const filteredCourses = availableCourses.filter((course) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      course.title?.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query)
    );
  });

  // Handle drag end - update order
  const handleDragEnd = ({ data }: { data: any[] }) => {
    setLocalProcess(data);
  };

  // Course Item Component for DraggableFlatList
  const renderCourseItem = ({
    item,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<any>) => {
    const index = getIndex?.() ?? 0;
    return (
      <ScaleDecorator>
        <TouchableOpacity
          style={[
            styles.previewStepContainer,
            isActive && styles.previewStepDragging,
          ]}
          onLongPress={drag}
          disabled={isActive}
          activeOpacity={0.7}
        >
          <View style={styles.previewStepContent}>
            <TouchableOpacity
              style={styles.previewStepDragHandle}
              onLongPress={drag}
              activeOpacity={0.7}
            >
              <Ionicons
                name="reorder-three-outline"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <View style={styles.previewStepIndex}>
              <Text style={styles.previewStepIndexText}>{index + 1}.</Text>
            </View>
            <View style={styles.previewStepInfo}>
              <Text style={styles.previewStepTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {item.course && (
                <Text style={styles.previewStepCourse} numberOfLines={1}>
                  {item.courseDescription || item.courseTitle || ""}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.previewStepDelete}
              onPress={() => {
                const currentIndex = localProcess.findIndex(
                  (p: any) => p.course === item.course
                );
                if (currentIndex !== -1) {
                  handleDeleteCourse(currentIndex);
                }
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={colors.error || "#FF3B30"}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  if (!previewLP) return null;

  return (
    <>
      <Modal
        visible={!!previewLP}
        transparent
        animationType="slide"
        onRequestClose={() => setPreviewLP(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setPreviewLP(null)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <View style={styles.previewIcon}>
                <Ionicons name="map" size={20} color={colors.primary} />
              </View>
              {editingTitle ? (
                <View style={styles.previewTitleInputContainer}>
                  <TextInput
                    style={styles.previewTitleInput}
                    value={localTitle}
                    onChangeText={setLocalTitle}
                    placeholder="Nhập tiêu đề lộ trình"
                    placeholderTextColor={colors.textSecondary}
                    autoFocus
                    onSubmitEditing={handleSaveTitle}
                    onBlur={handleSaveTitle}
                    maxLength={80}
                  />
                  <TouchableOpacity
                    onPress={handleSaveTitle}
                    style={styles.previewTitleSaveButton}
                  >
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.previewTitle} numberOfLines={2}>
                    {localTitle || "Lộ trình học tập"}
                  </Text>
                  <TouchableOpacity
                    onPress={handleEditTitle}
                    style={styles.previewTitleEditButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {localProcess.length === 0 ? (
              <View style={styles.previewEmptyState}>
                <Ionicons
                  name="book-outline"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.previewEmptyText}>
                  Chưa có khóa học nào
                </Text>
                <Text style={styles.previewEmptySubtext}>
                  Nhấn &quot;Thêm khóa học&quot; để bắt đầu
                </Text>
              </View>
            ) : (
              <GestureHandlerRootView style={styles.previewScrollView}>
                <DraggableFlatList
                  data={localProcess.filter((item: any) => {
                    // Only render items with valid course IDs
                    const hasValidCourse =
                      item.course && String(item.course).trim().length > 0;
                    if (!hasValidCourse && __DEV__) {
                      console.warn(
                        `⚠️ Skipping item without valid course ID:`,
                        item
                      );
                    }
                    return hasValidCourse;
                  })}
                  onDragEnd={handleDragEnd}
                  keyExtractor={(item, index) =>
                    `course-${item.course || index}`
                  }
                  renderItem={renderCourseItem}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                />
              </GestureHandlerRootView>
            )}

            <View style={{ marginTop: 12 }}>
              <CustomDropdown
                items={getDropdownItems()}
                selectedValue={selectedCourseValue}
                onValueChange={(value) => {
                  if (value) {
                    handleAddCourse(value);
                  }
                }}
                placeholder="Thêm khóa học"
                icon="add-circle-outline"
              />
            </View>

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.previewCancel}
                onPress={onCancelLearningPath}
              >
                <Text style={styles.previewCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.previewConfirm}
                onPress={() => {
                  // If editing title, save it first
                  if (editingTitle) {
                    if (!localTitle.trim()) {
                      Alert.alert("Lỗi", "Tiêu đề không được để trống");
                      return;
                    }
                    setEditingTitle(false);
                  }

                  // Update previewLP with latest values
                  if (previewLP) {
                    const updatedLP = {
                      ...previewLP,
                      title: localTitle,
                      process: localProcess,
                    };
                    setPreviewLP(updatedLP);
                  }

                  // Call onConfirmLearningPath with latest title and process directly
                  // This ensures we use the current localTitle and localProcess, not stale previewLP
                  onConfirmLearningPath(localTitle, localProcess);
                }}
              >
                <Text style={styles.previewConfirmText}>Xác nhận lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Course Picker Modal */}
      <Modal
        visible={showCoursePicker}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowCoursePicker(false);
          setSearchQuery("");
        }}
        presentationStyle="overFullScreen"
      >
        <TouchableOpacity
          style={styles.coursePickerOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowCoursePicker(false);
            setSearchQuery("");
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.coursePickerContainer}
          >
            <View style={styles.coursePickerHeader}>
              <Text style={styles.coursePickerTitle}>Chọn khóa học</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCoursePicker(false);
                  setSearchQuery("");
                }}
                style={styles.coursePickerCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.coursePickerSearchContainer}>
              <Ionicons
                name="search-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.coursePickerSearchIcon}
              />
              <TextInput
                style={styles.coursePickerSearchInput}
                placeholder="Tìm kiếm khóa học..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={styles.coursePickerClearButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {coursesLoading ? (
              <View style={styles.coursePickerLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <ScrollView style={styles.coursePickerList}>
                {filteredCourses.length === 0 ? (
                  <View style={styles.coursePickerEmpty}>
                    <Ionicons
                      name="search-outline"
                      size={48}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.coursePickerEmptyText}>
                      Không tìm thấy khóa học
                    </Text>
                  </View>
                ) : (
                  filteredCourses.map((course) => {
                    const isAdded = localProcess.some(
                      (p: any) =>
                        p.course === course._id || p.course === course.id
                    );
                    return (
                      <TouchableOpacity
                        key={course._id || course.id}
                        style={[
                          styles.coursePickerItem,
                          isAdded && styles.coursePickerItemAdded,
                        ]}
                        onPress={() => !isAdded && handleAddCourse(course)}
                        disabled={isAdded}
                      >
                        <View style={styles.coursePickerItemContent}>
                          <View style={styles.coursePickerItemInfo}>
                            <Text
                              style={styles.coursePickerItemTitle}
                              numberOfLines={2}
                            >
                              {course.title}
                            </Text>
                            {course.description && (
                              <Text
                                style={styles.coursePickerItemDescription}
                                numberOfLines={2}
                              >
                                {course.description}
                              </Text>
                            )}
                            {course.price && (
                              <Text style={styles.coursePickerItemPrice}>
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(course.price)}
                              </Text>
                            )}
                          </View>
                          {isAdded ? (
                            <View style={styles.coursePickerItemBadge}>
                              <Ionicons
                                name="checkmark-circle"
                                size={24}
                                color={colors.primary}
                              />
                            </View>
                          ) : (
                            <Ionicons
                              name="add-circle-outline"
                              size={24}
                              color={colors.primary}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
