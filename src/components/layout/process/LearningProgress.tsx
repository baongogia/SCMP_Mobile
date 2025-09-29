import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getMemberLearningProgress } from "@/src/services/learning_process/course/courseService";
import { colors } from "@/src/constants/colors";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from "react-native-reanimated";

interface ApiProgressResponse {
  _id: string;
  name: string;
  course: {
    _id: string;
    title: string;
    description: string;
    price: number;
    session_number: number;
    session_number_duration: string;
    category: string[];
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
    is_active: boolean;
    media: string;
    slug: string;
    tenant_id: string;
  };
  instructor: {
    _id: string;
    email: string;
    username: string;
    phone: string;
    address: string;
    birthday: string;
    cover: string[];
    featured_image: string[];
    is_active: boolean;
    parent_id: string[];
    password: string;
    role: string[];
    role_front: string[];
    role_system: string;
    created_at: string;
    updated_at: string;
    updated_by: string;
  };
  progress: {
    _id: string;
    totalSessions: number;
    firstDate: string;
    lastDate: string;
    allDates: string[];
    allSessions: {
      date: string;
      slot: string;
      _id: string;
    }[];
    pastSessions: number;
    futureSessions: number;
    currentDate: string;
    status: string;
    daysAttended: number;
    daysRemaining: number;
    progressPercentage: number;
    sessionsDetail: {
      date: string;
      slot: string;
      _id: string;
      isPast: boolean;
      isFuture: boolean;
    }[];
  };
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  tenant_id: string;
}

interface ModernLearningProgressProps {
  courseId?: string;
}

export const ModernLearningProgress: React.FC<ModernLearningProgressProps> = ({
  courseId,
}) => {
  const [progressData, setProgressData] = useState<ApiProgressResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Animation values
  const progressWidth = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const statsScale = useSharedValue(0.8);

  const fetchLearningProgress = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);

      const response = await getMemberLearningProgress();

      // Debug the response structure and normalize to component state shape
      console.log("[LearningProgress] raw response:", response);
      if (response?.data?.data?.data) {
        const arr = response.data.data.data;
        // Some backends return nested arrays, flatten them
        const flat: any[] = Array.isArray(arr[0]) ? arr.flat() : arr;

        if (flat.length === 0) {
          throw new Error("No progress data found in array");
        }

        // Prefer the item that contains detailed progress
        const withDetails = flat.find(
          (i) => i && (i.progress?.sessionsDetail?.length || i.progress)
        );
        const chosen = withDetails || flat[0];
        console.log("[LearningProgress] chosen item:", chosen);
        setProgressData(chosen as ApiProgressResponse);
      } else if (response?.data?.data) {
        console.log(
          "[LearningProgress] single data structure:",
          response.data.data
        );
        setProgressData(response.data.data as ApiProgressResponse);
      } else if (response?.data) {
        console.log("[LearningProgress] direct data structure:", response.data);
        setProgressData(response.data as ApiProgressResponse);
      } else {
        throw new Error("No data received from API");
      }
    } catch (err) {
      console.error("❌ Error fetching learning progress:", err);
      setError("Không thể tải tiến độ học tập");
    } finally {
      setLoading(false);
      if (refreshing) setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchLearningProgress();
  }, [courseId, fetchLearningProgress]);

  useEffect(() => {
    if (progressData) {
      // Animate progress bar
      const total = Number(progressData?.progress?.totalSessions ?? 0);
      const attended = Number(progressData?.progress?.daysAttended ?? 0);
      const explicit =
        typeof progressData?.progress?.progressPercentage === "number"
          ? progressData.progress.progressPercentage
          : undefined;
      const computed =
        typeof explicit === "number"
          ? explicit
          : total > 0
          ? Math.round((attended / total) * 100)
          : 0;

      progressWidth.value = withDelay(
        300,
        withTiming(computed / 100, {
          duration: 1200,
        })
      );

      // Animate cards
      cardOpacity.value = withDelay(100, withTiming(1, { duration: 800 }));

      // Animate stats
      statsScale.value = withDelay(500, withSpring(1, { damping: 15 }));
    }
  }, [progressData, progressWidth, cardOpacity, statsScale]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchLearningProgress();
    } finally {
      setRefreshing(false);
    }
  };

  const progressBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value * 100}%`,
    };
  });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [{ translateY: (1 - cardOpacity.value) * 20 }],
    };
  });

  const statsAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: statsScale.value }],
    };
  });

  const getStatusColor = (isPast: boolean, isFuture: boolean) => {
    if (isPast) return colors.success;
    if (isFuture) return colors.primary;
    return colors.gray[400];
  };

  const getStatusIcon = (isPast: boolean, isFuture: boolean) => {
    if (isPast) return "checkmark-circle";
    if (isFuture) return "time";
    return "help-circle";
  };

  const getStatusText = (isPast: boolean, isFuture: boolean) => {
    if (isPast) return "Đã học";
    if (isFuture) return "Sắp tới";
    return "Chưa xác định";
  };

  const getNextSession = (
    sessionDetails: ApiProgressResponse["progress"]["sessionsDetail"]
  ) => {
    const futureSessions = sessionDetails
      .filter((session) => session.isFuture)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return futureSessions.length > 0 ? futureSessions[0] : null;
  };

  const calculateAttendanceRate = (data: ApiProgressResponse) => {
    const total = Number(data?.progress?.totalSessions ?? 0);
    const attended = Number(data?.progress?.daysAttended ?? 0);
    if (!total || total <= 0) return 0;
    return Math.round((attended / total) * 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin khóa học...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchLearningProgress}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!progressData) return null;

  const data = progressData;
  const computedProgress =
    typeof data?.progress?.progressPercentage === "number"
      ? data.progress.progressPercentage
      : calculateAttendanceRate(data);
  const nextSession = data.progress?.sessionsDetail?.length
    ? getNextSession(data.progress.sessionsDetail)
    : null;
  const attendanceRate = calculateAttendanceRate(data);

  return (
    <>
      {/* Compact Course Card */}
      <Animated.View style={[cardAnimatedStyle]}>
        <TouchableOpacity
          style={styles.compactCard}
          onPress={() => setShowDetailModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.compactHeader}>
            <View style={styles.compactIconContainer}>
              <Ionicons name="school" size={24} color="#1E40AF" />
            </View>
            <View style={styles.compactInfo}>
              <Text style={styles.compactTitle} numberOfLines={1}>
                {data.course?.title || "Khóa học bơi lội"}
              </Text>
              <Text style={styles.compactSubtitle}>
                Lớp: {data.name || "Chưa có thông tin"}
              </Text>
            </View>
            <View style={styles.compactProgress}>
              <Text style={styles.progressPercentage}>
                {Math.round(computedProgress)}%
              </Text>
              <Text style={styles.progressLabel}>Hoàn thành</Text>
            </View>
          </View>

          <View style={styles.compactStats}>
            <View style={styles.compactStatItem}>
              <Ionicons name="checkmark-circle" size={16} color="#1E40AF" />
              <Text style={styles.compactStatText}>
                {data.progress?.daysAttended || 0}/
                {data.progress?.totalSessions || 0}
              </Text>
            </View>
            <View style={styles.compactStatItem}>
              <Ionicons name="person" size={16} color="#1E40AF" />
              <Text style={styles.compactStatText}>
                {data.instructor?.username || "Chưa phân công"}
              </Text>
            </View>
            <View style={styles.compactStatItem}>
              <Ionicons name="calendar" size={16} color="#1E40AF" />
              <Text style={styles.compactStatText}>
                {data.progress?.status || "N/A"}
              </Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[styles.progressBarFill, progressBarAnimatedStyle]}
              />
            </View>
          </View>

          <View style={styles.viewDetailButton}>
            <Text style={styles.viewDetailText}>Xem chi tiết tiến trình</Text>
            <Ionicons name="chevron-forward" size={16} color="#1E40AF" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chi tiết tiến trình khóa học</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Ionicons name="close" size={24} color="#1E40AF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {/* Course Header Card */}
            <Animated.View style={[cardAnimatedStyle]}>
              <View style={styles.courseCard}>
                <View style={styles.courseHeader}>
                  <View style={styles.courseIconContainer}>
                    <Ionicons name="school" size={32} color="#1E40AF" />
                  </View>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseName}>
                      {data.course?.title || "Khóa học bơi lội"}
                    </Text>
                    <Text style={styles.courseClass}>
                      Lớp: {data.name || "Chưa có thông tin"}
                    </Text>
                  </View>
                </View>

                <View style={styles.courseDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="person" size={14} color="#1E40AF" />
                      <Text style={styles.detailText}>
                        {data.instructor?.username || "Chưa phân công"}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="location" size={14} color="#1E40AF" />
                      <Text style={styles.detailText}>
                        {data.instructor?.address || "Chưa có địa chỉ"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar" size={14} color="#1E40AF" />
                      <Text style={styles.detailText}>
                        {data.progress?.firstDate && data.progress?.lastDate
                          ? `${new Date(
                              data.progress.firstDate
                            ).toLocaleDateString("vi-VN")} - ${new Date(
                              data.progress.lastDate
                            ).toLocaleDateString("vi-VN")}`
                          : "Chưa có lịch học"}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="cash" size={14} color="#1E40AF" />
                      <Text style={styles.detailText}>
                        {data.course?.price
                          ? `${data.course.price.toLocaleString("vi-VN")} đ`
                          : "Miễn phí"}
                      </Text>
                    </View>
                  </View>

                  {/* Header info grid */}
                  <View style={styles.infoGrid}>
                    {!!data.course?.slug && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Mã lớp</Text>
                        <Text style={styles.infoValue}>{data.course.slug}</Text>
                      </View>
                    )}
                    {!!data.course?.session_number && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Số buổi</Text>
                        <Text style={styles.infoValue}>
                          {data.course.session_number}
                        </Text>
                      </View>
                    )}
                    {!!data.course?.session_number_duration && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Thời lượng</Text>
                        <Text style={styles.infoValue}>
                          {data.course.session_number_duration}
                        </Text>
                      </View>
                    )}
                    {!!data.progress?.status && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Trạng thái</Text>
                        <Text style={styles.infoValue}>
                          {data.progress.status}
                        </Text>
                      </View>
                    )}
                    {!!data.course?.description && (
                      <View style={[styles.infoItem, { width: "100%" }]}>
                        <Text style={styles.infoLabel}>Mô tả</Text>
                        <Text style={styles.infoValue} numberOfLines={2}>
                          {data.course.description}
                        </Text>
                      </View>
                    )}
                    {!!data.instructor?.email && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Email HLV</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>
                          {data.instructor.email}
                        </Text>
                      </View>
                    )}
                    {!!data.instructor?.phone && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Điện thoại</Text>
                        <Text style={styles.infoValue}>
                          {data.instructor.phone}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Current date chip */}
                  {!!data.progress?.currentDate && (
                    <View style={styles.currentDateChip}>
                      <Ionicons name="flash" size={14} color="#1E40AF" />
                      <Text style={styles.currentDateText}>
                        Ngày hiện tại:{" "}
                        {new Date(data.progress.currentDate).toLocaleDateString(
                          "vi-VN"
                        )}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>

            {/* Progress Stats Horizontal List */}
            <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.statsScroll}
              >
                <View style={styles.statCard}>
                  <View style={styles.statGradient}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#1E40AF"
                    />
                    <Text style={styles.statValue}>
                      {data.progress?.daysAttended || 0}
                    </Text>
                    <Text style={styles.statLabel}>Đã học</Text>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statGradient}>
                    <Ionicons name="calendar" size={20} color="#1E40AF" />
                    <Text style={styles.statValue}>
                      {data.progress?.daysRemaining || 0}
                    </Text>
                    <Text style={styles.statLabel}>Còn lại</Text>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statGradient}>
                    <Ionicons name="trending-up" size={20} color="#1E40AF" />
                    <Text style={styles.statValue}>
                      {Math.round(computedProgress)}%
                    </Text>
                    <Text style={styles.statLabel}>Tiến độ</Text>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statGradient}>
                    <Ionicons name="trophy" size={20} color="#1E40AF" />
                    <Text style={styles.statValue}>{attendanceRate}%</Text>
                    <Text style={styles.statLabel}>Tham gia</Text>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statGradient}>
                    <Ionicons name="layers" size={20} color="#1E40AF" />
                    <Text style={styles.statValue}>
                      {data.progress?.totalSessions ?? 0}
                    </Text>
                    <Text style={styles.statLabel}>Tổng buổi</Text>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statGradient}>
                    <Ionicons name="time" size={20} color="#1E40AF" />
                    <Text style={styles.statValue}>
                      {data.progress?.pastSessions ?? 0}/
                      {data.progress?.futureSessions ?? 0}
                    </Text>
                    <Text style={styles.statLabel}>Qua/Tới</Text>
                  </View>
                </View>
              </ScrollView>
            </Animated.View>

            {/* Progress Bar Section */}
            <Animated.View style={[styles.progressSection, cardAnimatedStyle]}>
              <View style={styles.progressHeader}>
                <Ionicons name="analytics" size={20} color="#1E40AF" />
                <Text style={styles.sectionTitle}>Tiến độ tổng quan</Text>
              </View>

              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <Animated.View
                    style={[styles.progressBarFill, progressBarAnimatedStyle]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {data.progress?.daysAttended || 0} /{" "}
                  {data.progress?.totalSessions || 0} buổi học · Trạng thái:{" "}
                  {data.progress?.status || "N/A"}
                </Text>
              </View>
            </Animated.View>

            {/* Next Session Card */}
            {nextSession && (
              <Animated.View
                style={[styles.nextSessionCard, cardAnimatedStyle]}
              >
                <View style={styles.nextSessionHeader}>
                  <Ionicons name="time" size={20} color="#1E40AF" />
                  <Text style={styles.sectionTitle}>Buổi học tiếp theo</Text>
                </View>

                <View style={styles.nextSessionContent}>
                  <View style={styles.sessionRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.sessionText}>
                      {new Date(nextSession.date).toLocaleDateString("vi-VN")}
                    </Text>
                  </View>
                  <View style={styles.sessionRow}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.sessionText}>
                      Ca: {nextSession.slot}
                    </Text>
                  </View>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.primaryAction}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="information-circle"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.primaryActionText}>
                        Xem chi tiết lớp
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryAction}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call" size={16} color="#1E40AF" />
                      <Text style={styles.secondaryActionText}>
                        Liên hệ HLV
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Sessions Timeline */}
            <Animated.View style={[styles.timelineCard, cardAnimatedStyle]}>
              <View style={styles.timelineHeader}>
                <Ionicons name="list" size={20} color="#1E40AF" />
                <Text style={styles.sectionTitle}>Lịch sử học tập</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.timelineScroll}
              >
                {data.progress?.sessionsDetail &&
                data.progress.sessionsDetail.length > 0 ? (
                  data.progress.sessionsDetail
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    )
                    .map((session, index) => (
                      <View
                        key={session._id || index}
                        style={styles.timelineItem}
                      >
                        <View
                          style={[
                            styles.timelineIcon,
                            {
                              backgroundColor: getStatusColor(
                                session.isPast,
                                session.isFuture
                              ),
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              getStatusIcon(
                                session.isPast,
                                session.isFuture
                              ) as any
                            }
                            size={10}
                            color="#FFFFFF"
                          />
                        </View>

                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineTitle}>
                            Buổi {session.slot}
                          </Text>
                          <Text style={styles.timelineDate}>
                            {new Date(session.date).toLocaleDateString(
                              "vi-VN",
                              {
                                day: "2-digit",
                                month: "2-digit",
                              }
                            )}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  getStatusColor(
                                    session.isPast,
                                    session.isFuture
                                  ) + "20",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                {
                                  color: getStatusColor(
                                    session.isPast,
                                    session.isFuture
                                  ),
                                },
                              ]}
                            >
                              {getStatusText(session.isPast, session.isFuture)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="calendar-outline"
                      size={32}
                      color="#9CA3AF"
                    />
                    <Text style={styles.emptyText}>Chưa có lịch học</Text>
                  </View>
                )}
              </ScrollView>
            </Animated.View>

            {/* All scheduled sessions */}
            {data.progress?.allSessions &&
              data.progress.allSessions.length > 0 && (
                <Animated.View style={[styles.timelineCard, cardAnimatedStyle]}>
                  <View style={styles.timelineHeader}>
                    <Ionicons name="calendar" size={20} color="#1E40AF" />
                    <Text style={styles.sectionTitle}>Tất cả lịch đã xếp</Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.timelineScroll}
                  >
                    {data.progress.allSessions
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(a.date).getTime() -
                          new Date(b.date).getTime()
                      )
                      .map((s, idx) => (
                        <View key={s._id || idx} style={styles.sessionChip}>
                          <Ionicons
                            name="calendar-outline"
                            size={12}
                            color="#6B7280"
                          />
                          <Text style={styles.sessionChipText}>
                            {new Date(s.date).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </Text>
                          <Text style={styles.sessionSlot}>Ca {s.slot}</Text>
                        </View>
                      ))}
                  </ScrollView>
                </Animated.View>
              )}

            {/* System info footer */}
            <View style={styles.systemInfo}>
              <View style={styles.systemInfoRow}>
                <View style={styles.systemInfoItem}>
                  <Text style={styles.systemInfoLabel}>Trạng thái</Text>
                  <Text style={styles.systemInfoValue}>
                    {data.progress?.status || "N/A"}
                  </Text>
                </View>
                <View style={styles.systemInfoItem}>
                  <Text style={styles.systemInfoLabel}>Kích hoạt</Text>
                  <Text style={styles.systemInfoValue}>
                    {data.course?.is_active ? "Có" : "Không"}
                  </Text>
                </View>
              </View>
              <View style={styles.systemInfoRow}>
                <View style={styles.systemInfoItem}>
                  <Text style={styles.systemInfoLabel}>Tenant ID</Text>
                  <Text style={styles.systemInfoValue} numberOfLines={1}>
                    {data.tenant_id || "N/A"}
                  </Text>
                </View>
                <View style={styles.systemInfoItem}>
                  <Text style={styles.systemInfoLabel}>Cập nhật</Text>
                  <Text style={styles.systemInfoValue} numberOfLines={1}>
                    {data.updated_at
                      ? new Date(data.updated_at).toLocaleDateString("vi-VN")
                      : "N/A"}
                  </Text>
                </View>
              </View>
              {data.created_at && (
                <View style={styles.systemInfoRow}>
                  <View style={styles.systemInfoItem}>
                    <Text style={styles.systemInfoLabel}>Tạo lúc</Text>
                    <Text style={styles.systemInfoValue}>
                      {new Date(data.created_at).toLocaleDateString("vi-VN")}
                    </Text>
                  </View>
                  {data.updated_by && (
                    <View style={styles.systemInfoItem}>
                      <Text style={styles.systemInfoLabel}>Cập nhật bởi</Text>
                      <Text style={styles.systemInfoValue} numberOfLines={1}>
                        {data.updated_by}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 0,
  },
  // Compact Card Styles
  compactCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  compactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  compactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#1E40AF",
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    color: "#1E40AF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  compactSubtitle: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "500",
  },
  compactProgress: {
    alignItems: "center",
  },
  progressPercentage: {
    color: "#1E40AF",
    fontSize: 18,
    fontWeight: "800",
  },
  progressLabel: {
    color: "#6B7280",
    fontSize: 10,
    fontWeight: "600",
  },
  compactStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  compactStatItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  compactStatText: {
    color: "#374151",
    fontSize: 11,
    marginLeft: 4,
    fontWeight: "500",
  },
  viewDetailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 8,
  },
  viewDetailText: {
    color: "#1E40AF",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F8FAFC",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E40AF",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    marginVertical: 16,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: "#1E40AF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  courseCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  courseIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    borderWidth: 2,
    borderColor: "#1E40AF",
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    color: "#1E40AF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  courseClass: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  courseDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  detailText: {
    color: "#374151",
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
    fontWeight: "500",
  },
  statsContainer: {
    marginHorizontal: 0,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  statsScroll: {
    paddingHorizontal: 8,
  },
  statCard: {
    width: 120,
    marginRight: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statGradient: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 88,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statValue: {
    color: "#1E40AF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  statLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  progressSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#1E40AF",
    borderRadius: 6,
  },
  progressText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 10,
    fontWeight: "500",
  },
  nextSessionCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E40AF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 6,
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryActionText: {
    color: "#1E40AF",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 6,
  },
  nextSessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  nextSessionContent: {
    marginLeft: 28,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
    fontWeight: "500",
  },
  timelineCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoItem: {
    width: "50%",
    marginBottom: 12,
    paddingRight: 12,
  },
  infoLabel: {
    color: "#6B7280",
    fontSize: 10,
    fontWeight: "500",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    color: "#1E40AF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  currentDateChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#1E40AF",
  },
  currentDateText: {
    color: "#1E40AF",
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  sessionChip: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    minWidth: 78,
    borderWidth: 1,
    borderColor: "#1E40AF",
  },
  sessionChipText: {
    fontSize: 10,
    color: "#1E40AF",
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  sessionSlot: {
    fontSize: 8,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 2,
    textAlign: "center",
  },
  systemInfo: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 1,
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  systemInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  systemInfoItem: {
    flex: 1,
    marginRight: 8,
  },
  systemInfoLabel: {
    color: "#6B7280",
    fontSize: 10,
    fontWeight: "500",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  systemInfoValue: {
    color: "#1E40AF",
    fontSize: 12,
    fontWeight: "600",
  },
  timelineScroll: {
    paddingHorizontal: 16,
  },
  timelineItem: {
    alignItems: "center",
    marginRight: 16,
    width: 96,
  },
  timelineIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  timelineContent: {
    alignItems: "center",
  },
  timelineTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 2,
    textAlign: "center",
  },
  timelineDate: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "center",
  },
  statusText: {
    fontSize: 8,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
});
