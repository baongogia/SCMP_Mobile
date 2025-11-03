import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { SharedHeader } from "@/src/components/custom";
import { CustomDropdown } from "@/src/components/custom/dropdown/CustomDropdown";
import { useNavigation } from "@react-navigation/native";
import {
  getLearningPath,
  createLearningPath,
  updateLearningPath,
  deleteLearningPath,
} from "@/src/services/learning_process/learning_path/learningPathServices";
import { getAllCourses } from "@/src/services/learning_process/course/courseService";
import { showErrorToast, showSuccessToast } from "@/src/utils/errorHandler";
import { styles } from "./style";

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
  const navigation = useNavigation();
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pathToDelete, setPathToDelete] = useState<LearningPath | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    setPathToDelete(path);
    setShowDeleteModal(true);
  };

  const confirmDeletePath = async () => {
    if (!pathToDelete) return;
    try {
      setIsDeleting(true);
      await deleteLearningPath(pathToDelete._id);
      setShowDeleteModal(false);
      setPathToDelete(null);
      showSuccessToast("Xóa lộ trình học tập thành công");
      loadLearningPaths();
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi xóa lộ trình",
        message: "Không thể xóa lộ trình học tập",
      });
    } finally {
      setIsDeleting(false);
    }
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

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ paddingBottom: 200 }}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {/* AI Assistant Card */}
              {!isEditMode && (
                <View style={styles.aiAssistantCard}>
                  <View style={styles.aiHeader}>
                    <View style={styles.aiIconContainer}>
                      <Ionicons
                        name="sparkles"
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.aiTitle}>Tạo lộ trình với AI</Text>
                  </View>
                  <Text style={styles.aiSubtitle}>
                    Gợi ý lộ trình học cá nhân hóa theo mục tiêu và thời gian
                    của bạn.
                  </Text>
                  <TouchableOpacity
                    style={styles.aiCTAButton}
                    onPress={() => {
                      setShowCreateModal(false);
                      (navigation as any).navigate("CreateLearningPath", {
                        type: "learningPath",
                      });
                    }}
                  >
                    <Ionicons name="sparkles" size={16} color={colors.white} />
                    <Text style={styles.aiCTAButtonText}>Bắt đầu với AI</Text>
                  </TouchableOpacity>
                </View>
              )}

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

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ paddingBottom: 200 }}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
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

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContent}>
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <Ionicons name="warning" size={48} color={colors.error} />
              <Text style={styles.confirmTitle}>Xác nhận xóa</Text>
              <Text style={styles.confirmMessage}>
                {`Bạn có chắc chắn muốn xóa lộ trình "${
                  pathToDelete?.title ?? ""
                }"? Hành động này không thể hoàn tác.`}
              </Text>
            </View>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.confirmCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmDeleteButton,
                  isDeleting && styles.confirmDeleteButtonDisabled,
                ]}
                onPress={confirmDeletePath}
                disabled={isDeleting}
              >
                <Text style={styles.confirmDeleteText}>
                  {isDeleting ? "Đang xóa..." : "Xóa"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LearningPathScreen;
