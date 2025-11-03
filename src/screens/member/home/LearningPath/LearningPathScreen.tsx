import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { SharedHeader } from "@/src/components/custom";
import { CustomDropdown } from "@/src/components/custom/dropdown/CustomDropdown";
import {
  getLearningPath,
  createLearningPath,
  updateLearningPath,
  deleteLearningPath,
} from "@/src/services/learning_process/learning_path/learningPathServices";
import { getAllCourses } from "@/src/services/learning_process/course/courseService";
import { showErrorToast, showSuccessToast } from "@/src/utils/errorHandler";

interface Course {
  _id: string;
  title: string;
  description?: string;
  price?: number;
  session_number?: number;
  session_number_duration?: string;
  detail?: {
    title: string;
    form_judge?: any;
  }[];
}

interface Process {
  title: string;
  course?: Course | string;
}

interface LearningPath {
  _id: string;
  title: string;
  type: string[];
  process: Process[];
}

const LearningPathScreen = () => {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditStepModal, setShowEditStepModal] = useState(false);
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null);
  const [editingPathId, setEditingPathId] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [processSteps, setProcessSteps] = useState<
    { title: string; course: string }[]
  >([]);
  const [currentStepTitle, setCurrentStepTitle] = useState("");
  const [currentStepCourse, setCurrentStepCourse] = useState("");
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadLearningPaths = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getLearningPath();
      if (response.data && response.data.data) {
        setLearningPaths(response.data.data);
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải lộ trình học tập",
        message: "Không thể tải lộ trình học tập",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLearningPaths();
    setRefreshing(false);
  }, [loadLearningPaths]);

  const loadCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      const response = await getAllCourses();
      if (response.data && response.data.data) {
        setCourses(response.data.data);
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi tải danh sách khóa học",
        message: "Không thể tải danh sách khóa học",
      });
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLearningPaths();
  }, [loadLearningPaths]);

  const handleCreate = async () => {
    setEditingPath(null);
    setIsEditMode(false);
    setFormTitle("");
    setProcessSteps([]);
    setCurrentStepTitle("");
    setCurrentStepCourse("");
    await loadCourses();
    setShowCreateModal(true);
  };

  const handleEdit = async (path: LearningPath) => {
    // Mở modal sửa với danh sách steps hiện tại, cho phép thêm/xóa
    setIsEditMode(true);
    setEditingPath(path);
    setEditingPathId(path._id);
    setFormTitle(path.title || "");

    const formatted = (path.process || []).map((p) => ({
      title: p.title || "",
      course:
        typeof p.course === "string"
          ? p.course
          : p.course && (p.course as any)._id
          ? (p.course as any)._id
          : "",
    }));
    setProcessSteps(formatted);
    setCurrentStepTitle("");
    setCurrentStepCourse("");
    await loadCourses();
    setShowCreateModal(true);
  };

  const handleStepPress = async (
    path: LearningPath,
    stepIndex: number,
    process: Process
  ) => {
    if (editingPathId !== path._id) return;

    const course =
      typeof process.course === "object" && process.course !== null
        ? process.course._id
        : typeof process.course === "string"
        ? process.course
        : "";

    setEditingPath(path);
    setEditingStepIndex(stepIndex);
    setFormTitle(process.title);
    setCurrentStepCourse(course);
    await loadCourses();
    setShowEditStepModal(true);
  };

  const handleStepLongPress = async (
    path: LearningPath,
    stepIndex: number,
    process: Process
  ) => {
    await handleStepPress(path, stepIndex, process);
  };

  const handleDelete = (path: LearningPath) => {
    Alert.alert(
      "Xóa lộ trình học tập",
      `Bạn có chắc chắn muốn xóa lộ trình "${path.title}"?`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteLearningPath(path._id);
              showSuccessToast("Xóa lộ trình học tập thành công");
              loadLearningPaths();
            } catch (error) {
              showErrorToast(error, {
                title: "Lỗi xóa lộ trình",
                message: "Không thể xóa lộ trình học tập",
              });
            }
          },
        },
      ]
    );
  };

  const handleAddStep = () => {
    if (!currentStepTitle.trim() || !currentStepCourse.trim()) {
      showErrorToast(new Error("Vui lòng nhập đầy đủ thông tin"), {
        title: "Lỗi",
        message: "Tiêu đề và khóa học không được để trống",
      });
      return;
    }

    // Luôn thêm mới một bước (không thay thế bước cũ)
    setProcessSteps([
      ...processSteps,
      { title: currentStepTitle.trim(), course: currentStepCourse },
    ]);
    // Reset trạng thái sửa (nếu trước đó có chọn một bước để xem)
    if (editingStepIndex !== null) setEditingStepIndex(null);
    setCurrentStepTitle("");
    setCurrentStepCourse("");
  };

  const handleSubmitCreate = async () => {
    if (!formTitle.trim()) {
      showErrorToast(new Error("Vui lòng nhập tiêu đề"), {
        title: "Lỗi",
        message: "Tiêu đề không được để trống",
      });
      return;
    }

    if (processSteps.length === 0) {
      showErrorToast(new Error("Vui lòng thêm ít nhất một bước"), {
        title: "Lỗi",
        message: "Lộ trình cần có ít nhất một bước",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const data = {
        title: formTitle.trim(),
        process: processSteps.map((step) => ({
          title: step.title || "",
          course: step.course || "",
        })),
      };

      if (isEditMode && editingPath) {
        await updateLearningPath(editingPath._id, data);
        showSuccessToast("Cập nhật lộ trình học tập thành công");
      } else {
        await createLearningPath(data);
        showSuccessToast("Tạo lộ trình học tập thành công");
      }
      setShowCreateModal(false);
      setIsEditMode(false);
      setEditingPath(null);
      setEditingPathId(null);
      setFormTitle("");
      setProcessSteps([]);
      setCurrentStepTitle("");
      setCurrentStepCourse("");
      setEditingStepIndex(null);
      loadLearningPaths();
    } catch (error) {
      showErrorToast(error, {
        title: isEditMode ? "Lỗi cập nhật" : "Lỗi tạo",
        message: isEditMode
          ? "Không thể cập nhật lộ trình học tập"
          : "Không thể tạo lộ trình học tập",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEditStep = async () => {
    if (!formTitle.trim() || !currentStepCourse.trim()) {
      showErrorToast(new Error("Vui lòng nhập đầy đủ thông tin"), {
        title: "Lỗi",
        message: "Tiêu đề và khóa học không được để trống",
      });
      return;
    }

    if (!editingPath || editingStepIndex === null) return;

    try {
      setIsSubmitting(true);
      const updatedProcess = [...editingPath.process];
      updatedProcess[editingStepIndex] = {
        title: formTitle.trim(),
        course: currentStepCourse,
      };

      const data = {
        title: editingPath.title,
        process: updatedProcess.map((step) => {
          // Chỉ lấy title và course, loại bỏ tất cả các field khác như _id
          const courseValue =
            typeof step.course === "object" && step.course !== null
              ? step.course._id
              : typeof step.course === "string"
              ? step.course
              : "";

          return {
            title: step.title || "",
            course: courseValue,
          };
        }),
      };

      await updateLearningPath(editingPath._id, data);
      showSuccessToast("Cập nhật bước học tập thành công");
      setShowEditStepModal(false);
      setEditingPathId(null);
      setEditingStepIndex(null);
      loadLearningPaths();
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi cập nhật",
        message: "Không thể cập nhật bước học tập",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return "";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const renderProcessStep = (
    process: Process,
    index: number,
    totalSteps: number,
    path: LearningPath,
    processIndex: number
  ) => {
    const course =
      typeof process.course === "object" &&
      process.course !== null &&
      process.course.title
        ? process.course
        : null;

    // Chỉ hiển thị step nếu có course hợp lệ
    if (!course || !course.title) {
      return null;
    }

    const isCurrentLearning =
      (process as any)?.status === "in_progress" ||
      (course as any)?.status === "in_progress";

    return (
      <View key={index} style={styles.processStep}>
        {/* Circle indicator */}
        <View style={styles.circleIndicator}>
          {isCurrentLearning && <View style={styles.circleInner} />}
        </View>

        {/* Step content */}
        <View style={styles.stepContent}>
          <Text style={styles.processTitle}>{process.title}</Text>
          {course && (
            <TouchableOpacity
              style={[
                styles.courseInfo,
                editingPathId === path._id && styles.courseInfoEditable,
              ]}
              onPress={() => handleStepPress(path, processIndex, process)}
              onLongPress={() =>
                handleStepLongPress(path, processIndex, process)
              }
              activeOpacity={0.8}
            >
              <View style={styles.courseHeader}>
                <View style={styles.courseIconContainer}>
                  <Ionicons name="school" size={18} color={colors.primary} />
                </View>
                <Text style={styles.courseTitle}>{course.title}</Text>
              </View>

              {course.description && (
                <Text style={styles.courseDescription} numberOfLines={2}>
                  {course.description}
                </Text>
              )}

              <View style={styles.courseDetails}>
                {course.price && (
                  <View style={styles.courseDetailItem}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons
                        name="cash-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                    </View>
                    <Text style={styles.courseDetailText}>
                      {formatPrice(course.price)}
                    </Text>
                  </View>
                )}
                {course.session_number && (
                  <View style={styles.courseDetailItem}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                    </View>
                    <Text style={styles.courseDetailText}>
                      {course.session_number} buổi
                      {course.session_number_duration
                        ? ` • ${course.session_number_duration}`
                        : ""}
                    </Text>
                  </View>
                )}
              </View>

              {course.detail && course.detail.length > 0 && (
                <View style={styles.courseDetailsList}>
                  <Text style={styles.detailsLabel}>Nội dung:</Text>
                  {course.detail.slice(0, 3).map((detail, idx) => (
                    <View key={idx} style={styles.detailItem}>
                      <View style={styles.detailBullet} />
                      <Text style={styles.detailText}>{detail.title}</Text>
                    </View>
                  ))}
                  {course.detail.length > 3 && (
                    <Text style={styles.moreDetailsText}>
                      +{course.detail.length - 3} nội dung khác
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderLearningPathItem = ({ item: path }: { item: LearningPath }) => {
    // Lọc bỏ các process step trùng lặp (cùng title và không có course)
    const filteredProcess = (() => {
      if (!path.process || path.process.length === 0) return [];

      const seen = new Set<string>();
      const result: Process[] = [];

      for (const process of path.process) {
        const course =
          typeof process.course === "object" ? process.course : null;
        const key = process.title.toLowerCase();

        // Nếu có course thì luôn hiển thị, nếu không có course thì chỉ hiển thị nếu chưa thấy title này
        if (course || !seen.has(key)) {
          result.push(process);
          if (!course) {
            seen.add(key);
          }
        }
      }

      return result;
    })();

    const isEditing = editingPathId === path._id;

    return (
      <View style={styles.learningPathCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.pathIconContainer}>
              <Ionicons name="map" size={24} color={colors.primary} />
            </View>
            <View style={styles.pathTitleContainer}>
              <Text style={styles.pathTitle}>{path.title}</Text>

              {path.type && path.type.length > 0 && (
                <View style={styles.typeContainer}>
                  {path.type.map((type, idx) => (
                    <View key={idx} style={styles.typeBadge}>
                      <Text style={styles.typeText}>{type}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEdit(path)}
            >
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(path)}
            >
              <Ionicons name="trash" size={18} color={colors.error} />
            </TouchableOpacity>
            {isEditing && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setEditingPathId(null)}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {filteredProcess.length > 0 &&
          (() => {
            // Chỉ lấy các process có course hợp lệ
            const processesWithCourse = filteredProcess.filter(
              (p) =>
                typeof p.course === "object" &&
                p.course !== null &&
                p.course.title
            );

            return processesWithCourse.length > 0 ? (
              <View style={styles.processContainer}>
                {filteredProcess
                  .map((process, idx) => {
                    const course =
                      typeof process.course === "object" &&
                      process.course !== null &&
                      process.course.title
                        ? process.course
                        : null;
                    return course ? { process, originalIndex: idx } : null;
                  })
                  .filter(Boolean)
                  .map((item: any, index: number) =>
                    renderProcessStep(
                      item.process,
                      index,
                      processesWithCourse.length,
                      path,
                      item.originalIndex
                    )
                  )}
                {/* Circle với checkmark ở cuối thanh dọc */}
                <View style={styles.circleIndicatorLast}>
                  <Ionicons name="checkmark" size={10} color={colors.white} />
                </View>
              </View>
            ) : null;
          })()}

        <View style={styles.cardFooter}>
          <View style={styles.statsContainer}>
            <Ionicons name="layers" size={16} color={colors.textSecondary} />
            <Text style={styles.statsText}>
              {
                filteredProcess.filter(
                  (p) =>
                    typeof p.course === "object" &&
                    p.course !== null &&
                    p.course.title
                ).length
              }{" "}
              bước
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="map-outline" size={80} color={colors.gray[400]} />
      </View>
      <Text style={styles.emptyTitle}>Chưa có lộ trình học tập</Text>
      <Text style={styles.emptySubtitle}>
        Lộ trình học tập của bạn sẽ được hiển thị tại đây
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <SharedHeader title="Lộ trình học tập" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải lộ trình học tập...</Text>
        </View>
      ) : (
        <FlatList
          data={learningPaths}
          renderItem={renderLearningPathItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreate}>
        <Ionicons name="add" size={24} color={colors.white} />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? "Sửa lộ trình" : "Tạo lộ trình mới"}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowCreateModal(false);
                  setIsEditMode(false);
                  setEditingPath(null);
                  setEditingPathId(null);
                  setEditingStepIndex(null);
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Tiêu đề lộ trình</Text>
                <TextInput
                  style={styles.input}
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="Nhập tiêu đề lộ trình"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              {/* Danh sách steps đã thêm */}
              {processSteps.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    Các bước đã thêm ({processSteps.length})
                  </Text>
                  {processSteps.map((step, idx) => (
                    <View key={idx} style={styles.stepItem}>
                      <View style={styles.stepItemContent}>
                        <Text style={styles.stepItemNumber}>{idx + 1}.</Text>
                        <View style={styles.stepItemText}>
                          <Text style={styles.stepItemTitle}>{step.title}</Text>
                          <Text style={styles.stepItemCourse}>
                            {courses.find((c) => c._id === step.course)
                              ?.title || step.course}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.stepItemActions}>
                        <TouchableOpacity
                          style={styles.editStepButton}
                          onPress={() => {
                            setCurrentStepTitle(step.title);
                            setCurrentStepCourse(step.course);
                            setEditingStepIndex(idx);
                          }}
                        >
                          <Ionicons
                            name="pencil"
                            size={18}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.removeStepButton}
                          onPress={() => {
                            setProcessSteps(
                              processSteps.filter((_, i) => i !== idx)
                            );
                            if (editingStepIndex === idx) {
                              setEditingStepIndex(null);
                              setCurrentStepTitle("");
                              setCurrentStepCourse("");
                            } else if (
                              editingStepIndex !== null &&
                              editingStepIndex > idx
                            ) {
                              setEditingStepIndex(editingStepIndex - 1);
                            }
                          }}
                        >
                          <Ionicons
                            name="close-circle"
                            size={20}
                            color={colors.error}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Form thêm step */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  {processSteps.length > 0
                    ? "Thêm bước tiếp theo"
                    : "Bước đầu tiên"}
                </Text>
                <Text style={styles.subLabel}>Tiêu đề bước</Text>
                <TextInput
                  style={styles.input}
                  value={currentStepTitle}
                  onChangeText={setCurrentStepTitle}
                  placeholder="Nhập tiêu đề bước"
                  placeholderTextColor={colors.textTertiary}
                />
                <Text style={[styles.subLabel, { marginTop: 12 }]}>
                  Khóa học
                </Text>
                {coursesLoading ? (
                  <View style={styles.dropdownPlaceholder}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.dropdownPlaceholderText}>
                      Đang tải danh sách khóa học...
                    </Text>
                  </View>
                ) : (
                  <CustomDropdown
                    items={courses.map((course) => ({
                      label: course.title,
                      value: course._id,
                    }))}
                    selectedValue={currentStepCourse}
                    onValueChange={setCurrentStepCourse}
                    placeholder="Chọn khóa học"
                    icon="school"
                  />
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setFormTitle("");
                  setProcessSteps([]);
                  setCurrentStepTitle("");
                  setCurrentStepCourse("");
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.continueButton]}
                onPress={handleAddStep}
                disabled={!currentStepTitle.trim() || !currentStepCourse}
              >
                <Text style={styles.continueButtonText}>Thêm bước</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.submitButton,
                  processSteps.length === 0 && { opacity: 0.5 },
                ]}
                onPress={handleSubmitCreate}
                disabled={isSubmitting || processSteps.length === 0}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? "Cập nhật" : "Tạo"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Step Modal */}
      <Modal
        visible={showEditStepModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowEditStepModal(false);
          setEditingPathId(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sửa bước học tập</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowEditStepModal(false);
                  setEditingPathId(null);
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Tiêu đề bước</Text>
                <TextInput
                  style={styles.input}
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="Nhập tiêu đề bước"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Khóa học</Text>
                {coursesLoading ? (
                  <View style={styles.dropdownPlaceholder}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.dropdownPlaceholderText}>
                      Đang tải danh sách khóa học...
                    </Text>
                  </View>
                ) : (
                  <CustomDropdown
                    items={courses.map((course) => ({
                      label: course.title,
                      value: course._id,
                    }))}
                    selectedValue={currentStepCourse}
                    onValueChange={setCurrentStepCourse}
                    placeholder="Chọn khóa học"
                    icon="school"
                  />
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditStepModal(false);
                  setEditingPathId(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitEditStep}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Cập nhật</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  listContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  learningPathCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginBottom: 20,
    marginHorizontal: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  learningPathCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  cardHeader: {
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  pathIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.lightPrimary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pathTitleContainer: {
    flex: 1,
  },
  pathTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  selectedHint: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: "italic",
    marginBottom: 4,
  },
  editingHint: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: "italic",
    marginBottom: 4,
    fontWeight: "600",
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.white,
    textTransform: "capitalize",
  },
  processContainer: {
    marginLeft: 16,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    marginBottom: 16,
  },
  processStep: {
    position: "relative",
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineLine: {
    position: "absolute",
    left: -23,
    top: 28,
    width: 2,
    height: "100%",
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
  circleIndicator: {
    position: "absolute",
    left: -25,
    top: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  circleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  circleIndicatorLast: {
    position: "absolute",
    left: -9,
    bottom: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  connectorLine: {
    width: 8,
    height: 2,
    backgroundColor: colors.primary,
    marginTop: 10,
    marginRight: 8,
    opacity: 0.3,
  },
  stepIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  stepIndicatorFirst: {
    width: 40,
    height: 40,
    borderRadius: 10,
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
    elevation: 6,
  },
  menuIconContainer: {
    width: 20,
    height: 16,
    justifyContent: "space-between",
  },
  menuIconBar: {
    width: 20,
    height: 2,
    backgroundColor: colors.white,
    borderRadius: 1,
  },
  stepIndicatorInner: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    elevation: 6,
  },
  stepContent: {
    flex: 1,
    marginTop: 0,
  },
  processTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  courseInfo: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  courseInfoEditable: {
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 1.01 }],
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  courseIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.lightPrimary,
    justifyContent: "center",
    alignItems: "center",
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
    flex: 1,
    lineHeight: 20,
  },
  courseDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  courseDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 10,
    marginTop: 2,
  },
  courseDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailIconContainer: {
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  courseDetailText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  courseDetailsList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
    gap: 8,
  },
  detailBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    marginTop: 6,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 0.5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 0.5,
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  moreDetailsText: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: "italic",
    marginTop: 4,
    marginLeft: 14,
  },
  cardFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginLeft: -20,
    marginRight: -20,
    paddingLeft: 20,
    paddingRight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statsText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "55%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: "relative",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  modalCloseButton: {
    position: "absolute",
    right: 20,
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 600,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.gray[100],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  continueButton: {
    backgroundColor: colors.gray[200],
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  stepItemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editStepButton: {
    padding: 4,
  },
  stepItemNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginRight: 8,
    minWidth: 20,
  },
  stepItemText: {
    flex: 1,
  },
  stepItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  stepItemCourse: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  removeStepButton: {
    padding: 4,
  },
  dropdownPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    gap: 8,
  },
  dropdownPlaceholderText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default LearningPathScreen;
