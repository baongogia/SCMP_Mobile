import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { CalendarEventItem } from "@/src/components/custom/calendar/CalendarView";
import { styles } from "@/src/screens/member/home/Schedule/style";
interface MemberScheduleDetailProps {
  event: CalendarEventItem;
  disableScroll?: boolean;
}
export const MemberScheduleDetail = ({
  event,
  disableScroll,
}: MemberScheduleDetailProps) => {
  try {
    console.log("[ScheduleDetail] event =", JSON.stringify(event));
  } catch {
    console.log("[ScheduleDetail] event =", event);
  }
  const formatTime = (hour: number, minute: number) => {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  const isHttpUrl = (value?: string) =>
    typeof value === "string" && /^https?:\/\//i.test(value);
  const cleanEvalFieldName = (value: string) =>
    (value || "").replace(/^[0-9]+_/, "").trim();

  // Helper function để xác định trạng thái điểm danh
  const getAttendanceStatus = (event: CalendarEventItem) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const startTime = event.slot?.start_time || 0;
    const startMinute = event.slot?.start_minute || 0;
    const endTime = event.slot?.end_time || 0;
    const endMinute = event.slot?.end_minute || 0;

    // Tạo Date objects cho start và end time
    const startDateTime = new Date(eventDate);
    startDateTime.setHours(startTime, startMinute, 0, 0);

    const endDateTime = new Date(eventDate);
    endDateTime.setHours(endTime, endMinute, 0, 0);

    // Kiểm tra chưa học (trắng) - chưa đến thời gian học
    if (now < startDateTime) {
      return {
        status: "not_started",
        color: "#FFFFFF",
        icon: "time-outline",
        borderColor: "#E5E7EB",
      };
    }

    // Kiểm tra đang học (vàng) - đang trong thời gian học
    if (now >= startDateTime && now <= endDateTime) {
      return { status: "ongoing", color: "#FFB800", icon: "radio-button-on" };
    }

    // Đã qua thời gian học - kiểm tra trạng thái điểm danh
    // Kiểm tra đã điểm danh (xanh lá) - is_attended === true
    if (event.is_attended === true) {
      return { status: "attended", color: "#10B981", icon: "checkmark-circle" };
    }

    // Chưa điểm danh (đỏ) - is_attended === false hoặc null
    return { status: "not_attended", color: "#EF4444", icon: "close-circle" };
  };

  const content = (
    <>
      {!disableScroll && (
        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderContent}>
            <View style={styles.detailHeaderIcon}>
              <Ionicons name="calendar" size={24} color={colors.white} />
            </View>
            <View style={styles.detailHeaderText}>
              <Text style={styles.detailHeaderTitle}>
                {typeof event.slot?.title === "string"
                  ? event.slot.title
                  : typeof event.slot?.title === "object" &&
                    event.slot?.title &&
                    (event.slot.title as any)?.name
                  ? (event.slot.title as any).name
                  : typeof event.classroom?.name === "string"
                  ? event.classroom.name
                  : typeof event.classroom?.name === "object" &&
                    event.classroom?.name &&
                    (event.classroom.name as any)?.name
                  ? (event.classroom.name as any).name
                  : "Buổi học"}
              </Text>
              <Text style={styles.detailHeaderSubtitle}>
                {formatDate(event.date.toString())}
              </Text>
            </View>
          </View>
          <View style={styles.detailTimeBadge}>
            <Ionicons name="time" size={16} color={colors.white} />
            <Text style={styles.detailTimeText}>
              {formatTime(
                event.slot?.start_time || 0,
                event.slot?.start_minute || 0
              )}{" "}
              -{" "}
              {formatTime(
                event.slot?.end_time || 0,
                event.slot?.end_minute || 0
              )}
            </Text>
          </View>
        </View>
      )}

      {/* Thông tin chi tiết */}
      <View style={styles.detailContent}>
        {/* Thông tin slot */}
        {event.slot && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIconWrapper}>
                <View style={styles.detailCardIcon}>
                  <Ionicons name="bookmark" size={20} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.detailCardTitle}>Thông tin buổi học</Text>
            </View>
            <View style={styles.detailCardDivider} />
            <View style={styles.detailCardContent}>
              <View style={styles.detailInfoItem}>
                <View style={styles.detailInfoLabelRow}>
                  <Ionicons
                    name="document-text"
                    size={12}
                    color={colors.grayc}
                  />
                  <Text style={styles.detailInfoLabel}>Tên buổi học</Text>
                </View>
                <Text style={styles.detailInfoValue} numberOfLines={1}>
                  {event.slot.title || "Không có tên"}
                </Text>
              </View>
              {event.slot.duration && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="hourglass" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>Thời lượng</Text>
                  </View>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue}>
                      {event.slot.duration}
                    </Text>
                    <View style={styles.detailInfoBadge}>
                      <Ionicons name="time" size={18} color={colors.primary} />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Thông tin lớp học */}
        {event.classroom && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIconWrapper}>
                <View style={styles.detailCardIcon}>
                  <Ionicons name="school" size={20} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.detailCardTitle}>Thông tin lớp học</Text>
            </View>
            <View style={styles.detailCardDivider} />
            <View style={styles.detailCardContent}>
              <View style={styles.detailInfoItem}>
                <View style={styles.detailInfoLabelRow}>
                  <Ionicons name="library" size={12} color={colors.grayc} />
                  <Text style={styles.detailInfoLabel}>Tên lớp</Text>
                </View>
                <Text style={styles.detailInfoValue} numberOfLines={1}>
                  {event.classroom.name || "Không có tên"}
                </Text>
              </View>
              {event.classroom.course && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="book" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>Khóa học</Text>
                  </View>
                  <Text style={styles.detailInfoValue} numberOfLines={1}>
                    {typeof event.classroom.course === "object"
                      ? (event.classroom.course as any)?.title ||
                        (event.classroom.course as any)?.name ||
                        JSON.stringify(event.classroom.course)
                      : (event.classroom.course as unknown as string)}
                  </Text>
                </View>
              )}
              {event.classroom.member && event.classroom.member.length > 0 && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="people" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>Số học viên</Text>
                  </View>
                  <View style={styles.detailInfoValueContainer}>
                    <View style={styles.detailInfoValueBadge}>
                      <Text style={styles.detailInfoValueNumber}>
                        {event.classroom.member.length}
                      </Text>
                      <Text style={styles.detailInfoValueUnit}>học viên</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Nội dung học (detail) */}
        {(() => {
          const lessonDetails: any[] =
            (Array.isArray((event as any).detail)
              ? (event as any).detail
              : []) ||
            (Array.isArray((event.classroom as any)?.course?.detail)
              ? ((event.classroom as any)?.course?.detail as any[])
              : []);
          if (!lessonDetails || lessonDetails.length === 0) return null;
          return (
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <View style={styles.detailCardIconWrapper}>
                  <View style={styles.detailCardIcon}>
                    <Ionicons name="list" size={20} color={colors.primary} />
                  </View>
                </View>
                <Text style={styles.detailCardTitle}>Nội dung buổi học</Text>
              </View>
              <View style={styles.detailCardDivider} />
              <View style={styles.detailCardContent}>
                {lessonDetails.map((d, idx) => (
                  <View key={idx} style={styles.detailInfoItem}>
                    <View style={styles.detailInfoLabelRow}>
                      <Ionicons
                        name="checkmark-done"
                        size={12}
                        color={colors.grayc}
                      />
                      <Text style={styles.detailInfoLabel}>Mục tiêu</Text>
                    </View>
                    <Text style={styles.detailInfoValue} numberOfLines={2}>
                      {typeof d === "string" ? d : d?.title || "Nội dung"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })()}

        {/* Ghi chú huấn luyện viên */}
        {Array.isArray((event as any).instructor_note) &&
          (event as any).instructor_note.length > 0 && (
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <View style={styles.detailCardIconWrapper}>
                  <View style={styles.detailCardIcon}>
                    <Ionicons name="create" size={20} color={colors.primary} />
                  </View>
                </View>
                <Text style={styles.detailCardTitle}>
                  Đánh giá của huấn luyện viên
                </Text>
              </View>
              <View style={styles.detailCardDivider} />
              <View style={styles.detailCardContent}>
                {((event as any).instructor_note as any[]).map((n, idx) => {
                  // note có thể là JSON string; cố gắng parse để lấy text
                  let parsed: any = null;
                  if (typeof n?.note === "string") {
                    try {
                      parsed = JSON.parse(n.note);
                    } catch {
                      parsed = { text: n.note };
                    }
                  } else if (n?.note && typeof n.note === "object") {
                    parsed = n.note;
                  }
                  const text = parsed?.text || n?.text || "";
                  const mediaCount = Array.isArray(n?.media)
                    ? n.media.length
                    : 0;
                  return (
                    <View key={idx} style={{ marginBottom: 10 }}>
                      <View style={styles.detailInfoItem}>
                        <View style={styles.detailInfoLabelRow}>
                          <Ionicons
                            name="chatbox-ellipses"
                            size={12}
                            color={colors.grayc}
                          />
                          <Text style={styles.detailInfoLabel}>Nhận xét</Text>
                        </View>
                        <Text style={styles.detailInfoValue} numberOfLines={3}>
                          {text || "Không có"}
                        </Text>
                      </View>
                      {/* Các tiêu chí đánh giá */}
                      {parsed?.evaluation && (
                        <View>
                          {(() => {
                            const fields: string[] = Array.isArray(
                              parsed?.evaluationFields
                            )
                              ? parsed.evaluationFields
                              : Object.keys(parsed.evaluation || {});
                            return fields.map((field: string, fi: number) => {
                              const key1 = `${fi}_${field}`;
                              const raw =
                                parsed.evaluation?.[key1] ??
                                parsed.evaluation?.[field];
                              let display = "";
                              if (typeof raw === "boolean")
                                display = raw ? "Có" : "Không";
                              else if (raw === 1 || raw === 0)
                                display = Number(raw) === 1 ? "Có" : "Không";
                              else if (typeof raw === "string") display = raw;
                              else if (raw == null) display = "-";
                              else display = String(raw);
                              return (
                                <View
                                  key={`eval-${fi}`}
                                  style={styles.detailInfoItem}
                                >
                                  <View style={styles.detailInfoLabelRow}>
                                    <Ionicons
                                      name="checkmark-circle"
                                      size={12}
                                      color={colors.grayc}
                                    />
                                    <Text style={styles.detailInfoLabel}>
                                      {cleanEvalFieldName(field)}
                                    </Text>
                                  </View>
                                  {isHttpUrl(display) ? (
                                    <TouchableOpacity
                                      onPress={() => Linking.openURL(display)}
                                      activeOpacity={0.9}
                                    >
                                      <Image
                                        source={{ uri: display }}
                                        style={{
                                          width: 88,
                                          height: 88,
                                          borderRadius: 8,
                                        }}
                                      />
                                    </TouchableOpacity>
                                  ) : (
                                    <Text
                                      style={styles.detailInfoValue}
                                      numberOfLines={1}
                                    >
                                      {display}
                                    </Text>
                                  )}
                                </View>
                              );
                            });
                          })()}
                        </View>
                      )}
                      {mediaCount > 0 && (
                        <View style={styles.detailInfoItem}>
                          <View style={styles.detailInfoLabelRow}>
                            <Ionicons
                              name="images"
                              size={12}
                              color={colors.grayc}
                            />
                            <Text style={styles.detailInfoLabel}>
                              Tệp đính kèm
                            </Text>
                          </View>
                          <View style={styles.detailInfoValueContainer}>
                            <View style={styles.detailInfoValueBadge}>
                              <Text style={styles.detailInfoValueNumber}>
                                {mediaCount}
                              </Text>
                              <Text style={styles.detailInfoValueUnit}>
                                tệp
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

        {/* Thông tin bể bơi */}
        {event.pool && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIconWrapper}>
                <View style={styles.detailCardIcon}>
                  <Ionicons name="water" size={20} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.detailCardTitle}>Thông tin bể bơi</Text>
            </View>
            <View style={styles.detailCardDivider} />
            <View style={styles.detailCardContent}>
              <View style={styles.detailInfoItem}>
                <View style={styles.detailInfoLabelRow}>
                  <Ionicons name="location" size={12} color={colors.grayc} />
                  <Text style={styles.detailInfoLabel}>Tên bể</Text>
                </View>
                <Text style={styles.detailInfoValue} numberOfLines={1}>
                  {event.pool.title || "Không có tên"}
                </Text>
              </View>
              {event.pool.type && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="layers" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>Loại bể</Text>
                  </View>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue} numberOfLines={1}>
                      {typeof event.pool.type === "object"
                        ? (event.pool.type as any)?.title ||
                          (event.pool.type as any)?.name ||
                          JSON.stringify(event.pool.type)
                        : (event.pool.type as unknown as string)}
                    </Text>
                    <View
                      style={[
                        styles.detailInfoBadge,
                        styles.detailInfoBadgeType,
                      ]}
                    >
                      <Ionicons name="layers" size={10} color={colors.white} />
                    </View>
                  </View>
                </View>
              )}
              {event.pool.dimensions && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="resize" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>Kích thước</Text>
                  </View>
                  <Text style={styles.detailInfoValue} numberOfLines={1}>
                    {event.pool.dimensions}
                  </Text>
                </View>
              )}
              {event.pool.depth && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons
                      name="arrow-down"
                      size={12}
                      color={colors.grayc}
                    />
                    <Text style={styles.detailInfoLabel}>Độ sâu</Text>
                  </View>
                  <Text style={styles.detailInfoValue} numberOfLines={1}>
                    {event.pool.depth}
                  </Text>
                </View>
              )}
              {event.pool.capacity !== undefined &&
                event.pool.capacity !== null && (
                  <View style={styles.detailInfoItem}>
                    <View style={styles.detailInfoLabelRow}>
                      <Ionicons name="people" size={12} color={colors.grayc} />
                      <Text style={styles.detailInfoLabel}>Sức chứa</Text>
                    </View>
                    <View style={styles.detailInfoValueContainer}>
                      <View style={styles.detailInfoValueBadge}>
                        <Text style={styles.detailInfoValueNumber}>
                          {event.pool.capacity}
                        </Text>
                        <Text style={styles.detailInfoValueUnit}>người</Text>
                      </View>
                    </View>
                  </View>
                )}
              {event.pool.maintance_status && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="construct" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>
                      Tình trạng bảo trì
                    </Text>
                  </View>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue} numberOfLines={1}>
                      {event.pool.maintance_status}
                    </Text>
                    <View
                      style={[
                        styles.detailInfoBadge,
                        styles.detailInfoBadgeMaintenance,
                      ]}
                    >
                      <Ionicons
                        name="construct"
                        size={10}
                        color={colors.white}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Thông tin khác */}
        {(event.instructor ||
          (event.attendees && event.attendees.length > 0) ||
          event.created_at ||
          event.is_attended !== undefined) && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIconWrapper}>
                <View style={styles.detailCardIcon}>
                  <Ionicons
                    name="information-circle"
                    size={22}
                    color={colors.primary}
                  />
                </View>
              </View>
              <Text style={styles.detailCardTitle}>Thông tin khác</Text>
            </View>
            <View style={styles.detailCardDivider} />
            <View style={styles.detailCardContent}>
              {(() => {
                const attendanceStatus = getAttendanceStatus(event);
                if (attendanceStatus) {
                  let statusText = "";
                  if (attendanceStatus.status === "not_started") {
                    statusText = "Chưa học";
                  } else if (attendanceStatus.status === "ongoing") {
                    statusText = "Đang học";
                  } else if (attendanceStatus.status === "attended") {
                    statusText = "Đã điểm danh";
                  } else {
                    statusText = "Vắng mặt";
                  }

                  return (
                    <View style={styles.detailInfoItem}>
                      <View style={styles.detailInfoLabelRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={12}
                          color={colors.grayc}
                        />
                        <Text style={styles.detailInfoLabel}>
                          Trạng thái điểm danh
                        </Text>
                      </View>
                      <View style={styles.detailInfoValueContainer}>
                        <View
                          style={[
                            styles.detailAttendanceBadge,
                            {
                              backgroundColor: attendanceStatus.color,
                              borderWidth:
                                attendanceStatus.status === "not_started"
                                  ? 1.5
                                  : 0,
                              borderColor:
                                attendanceStatus.borderColor || "transparent",
                            },
                          ]}
                        >
                          <Ionicons
                            name={attendanceStatus.icon as any}
                            size={14}
                            color={
                              attendanceStatus.status === "not_started"
                                ? colors.gray[600]
                                : colors.white
                            }
                          />
                          <Text
                            style={[
                              styles.detailAttendanceText,
                              {
                                color:
                                  attendanceStatus.status === "not_started"
                                    ? colors.gray[600]
                                    : colors.white,
                              },
                            ]}
                          >
                            {statusText}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                }
                return null;
              })()}
              {event.instructor && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="person" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>Huấn luyện viên</Text>
                  </View>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue} numberOfLines={1}>
                      {event.instructor.username}
                    </Text>
                    <View style={styles.detailInfoBadge}>
                      <Ionicons
                        name="person"
                        size={10}
                        color={colors.primary}
                      />
                    </View>
                  </View>
                </View>
              )}
              {event.attendees && event.attendees.length > 0 && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons name="people" size={12} color={colors.grayc} />
                    <Text style={styles.detailInfoLabel}>
                      Số người tham gia
                    </Text>
                  </View>
                  <View style={styles.detailInfoValueContainer}>
                    <View style={styles.detailInfoValueBadge}>
                      <Text style={styles.detailInfoValueNumber}>
                        {event.attendees.length}
                      </Text>
                      <Text style={styles.detailInfoValueUnit}>người</Text>
                    </View>
                  </View>
                </View>
              )}
              {event.created_at && (
                <View style={styles.detailInfoItem}>
                  <View style={styles.detailInfoLabelRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color={colors.grayc}
                    />
                    <Text style={styles.detailInfoLabel}>Ngày tạo</Text>
                  </View>
                  <Text style={styles.detailInfoValue} numberOfLines={1}>
                    {new Date(event.created_at).toLocaleDateString("vi-VN")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </>
  );

  if (disableScroll) {
    return <View style={styles.detailContainer}>{content}</View>;
  }

  return (
    <ScrollView
      style={styles.detailContainer}
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
};
