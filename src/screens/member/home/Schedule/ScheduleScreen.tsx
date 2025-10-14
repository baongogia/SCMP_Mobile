import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { getAllMemberSchedules } from "@/src/services/learning_process/schedules/scheduleServices";
import CalendarView, {
  CalendarEventItem,
} from "@/src/components/custom/calendar/CalendarView";

// Component để render chi tiết lịch học
const renderScheduleDetail = (event: CalendarEventItem) => {
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

  return (
    <ScrollView
      style={styles.detailContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header với thông tin chính */}
      <View style={styles.detailHeader}>
        <View style={styles.detailHeaderContent}>
          <View style={styles.detailHeaderIcon}>
            <Ionicons name="calendar" size={24} color={colors.white} />
          </View>
          <View style={styles.detailHeaderText}>
            <Text style={styles.detailHeaderTitle}>
              {event.slot?.title || event.classroom?.name || "Buổi học"}
            </Text>
            <Text style={styles.detailHeaderSubtitle}>
              {formatDate(event.date.toString())}
            </Text>
          </View>
        </View>
        <View style={styles.detailTimeBadge}>
          <Ionicons name="time" size={16} color={colors.primary} />
          <Text style={styles.detailTimeText}>
            {formatTime(
              event.slot?.start_time || 0,
              event.slot?.start_minute || 0
            )}{" "}
            -{" "}
            {formatTime(event.slot?.end_time || 0, event.slot?.end_minute || 0)}
          </Text>
        </View>
      </View>

      {/* Thông tin chi tiết */}
      <View style={styles.detailContent}>
        {/* Thông tin slot */}
        {event.slot && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIcon}>
                <Ionicons name="bookmark" size={20} color={colors.primary} />
              </View>
              <Text style={styles.detailCardTitle}>Thông tin slot</Text>
            </View>
            <View style={styles.detailCardContent}>
              <View style={styles.detailInfoItem}>
                <Text style={styles.detailInfoLabel}>Tên slot</Text>
                <Text style={styles.detailInfoValue}>
                  {event.slot.title || "Không có tên"}
                </Text>
              </View>
              {event.slot.duration && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Thời lượng</Text>
                  <Text style={styles.detailInfoValue}>
                    {event.slot.duration}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Thông tin lớp học */}
        {event.classroom && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIcon}>
                <Ionicons name="school" size={20} color={colors.primary} />
              </View>
              <Text style={styles.detailCardTitle}>Thông tin lớp học</Text>
            </View>
            <View style={styles.detailCardContent}>
              <View style={styles.detailInfoItem}>
                <Text style={styles.detailInfoLabel}>Tên lớp</Text>
                <Text style={styles.detailInfoValue}>
                  {event.classroom.name || "Không có tên"}
                </Text>
              </View>
              {event.classroom.course && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Khóa học</Text>
                  <Text style={styles.detailInfoValue}>
                    {event.classroom.course}
                  </Text>
                </View>
              )}
              {event.classroom.member && event.classroom.member.length > 0 && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Số thành viên</Text>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue}>
                      {event.classroom.member.length}
                    </Text>
                    <View style={styles.detailInfoBadge}>
                      <Ionicons
                        name="people"
                        size={12}
                        color={colors.primary}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Thông tin bể bơi */}
        {event.pool && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIcon}>
                <Ionicons name="water" size={20} color={colors.primary} />
              </View>
              <Text style={styles.detailCardTitle}>Thông tin bể bơi</Text>
            </View>
            <View style={styles.detailCardContent}>
              <View style={styles.detailInfoItem}>
                <Text style={styles.detailInfoLabel}>Tên bể</Text>
                <Text style={styles.detailInfoValue}>
                  {event.pool.title || "Không có tên"}
                </Text>
              </View>
              {event.pool.type && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Loại bể</Text>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue}>
                      {event.pool.type}
                    </Text>
                    <View
                      style={[
                        styles.detailInfoBadge,
                        styles.detailInfoBadgeType,
                      ]}
                    >
                      <Ionicons name="layers" size={12} color={colors.white} />
                    </View>
                  </View>
                </View>
              )}
              {event.pool.dimensions && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Kích thước</Text>
                  <Text style={styles.detailInfoValue}>
                    {event.pool.dimensions}
                  </Text>
                </View>
              )}
              {event.pool.depth && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Độ sâu</Text>
                  <Text style={styles.detailInfoValue}>{event.pool.depth}</Text>
                </View>
              )}
              {event.pool.capacity && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Sức chứa</Text>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue}>
                      {event.pool.capacity} người
                    </Text>
                    <View style={styles.detailInfoBadge}>
                      <Ionicons
                        name="people"
                        size={12}
                        color={colors.primary}
                      />
                    </View>
                  </View>
                </View>
              )}
              {event.pool.maintance_status && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Tình trạng bảo trì</Text>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue}>
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
                        size={12}
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
          event.created_at) && (
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailCardIcon}>
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.detailCardTitle}>Thông tin khác</Text>
            </View>
            <View style={styles.detailCardContent}>
              {event.instructor && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Huấn luyện viên</Text>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue}>
                      {event.instructor}
                    </Text>
                    <View style={styles.detailInfoBadge}>
                      <Ionicons
                        name="person"
                        size={12}
                        color={colors.primary}
                      />
                    </View>
                  </View>
                </View>
              )}
              {event.attendees && event.attendees.length > 0 && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Số người tham gia</Text>
                  <View style={styles.detailInfoValueContainer}>
                    <Text style={styles.detailInfoValue}>
                      {event.attendees.length}
                    </Text>
                    <View style={styles.detailInfoBadge}>
                      <Ionicons
                        name="people"
                        size={12}
                        color={colors.primary}
                      />
                    </View>
                  </View>
                </View>
              )}
              {event.created_at && (
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Ngày tạo</Text>
                  <Text style={styles.detailInfoValue}>
                    {new Date(event.created_at).toLocaleDateString("vi-VN")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default function ScheduleScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={28} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Thời khóa biểu</Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <CalendarView
        title="Thời khóa biểu"
        renderDetail={renderScheduleDetail}
        fetchRange={async (start, end) => {
          const res = await getAllMemberSchedules(start, end);
          const items: any[] = res?.data?.data || [];
          // normalize time fields for CalendarView
          const normalized: CalendarEventItem[] = items.map((it: any) => {
            const startMin = it?.slot?.start_minute;
            let start_time = it?.slot?.start_time;
            let start_minute = it?.slot?.start_minute;
            if (
              typeof startMin === "number" &&
              startMin > 59 &&
              start_time == null
            ) {
              start_time = Math.floor(startMin / 60);
              start_minute = startMin % 60;
            }
            return {
              ...it,
              date: it.date,
              slot: {
                ...it.slot,
                start_time,
                start_minute,
              },
            } as CalendarEventItem;
          });
          return normalized;
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  menuButton: {
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 0.5,
  },
  backButton: {
    padding: 4,
  },
  weekNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
  },
  weekInfo: {
    alignItems: "center",
  },
  monthYear: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  weekRange: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    marginTop: 2,
  },
  dayHeaderContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  dayHeader: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginHorizontal: 2,
    position: "relative",
  },
  selectedDayHeader: {
    backgroundColor: colors.primary,
  },
  todayDayHeader: {
    backgroundColor: "rgba(0, 119, 190, 0.1)",
  },
  dayName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    opacity: 0.7,
    marginBottom: 4,
  },
  selectedDayName: {
    color: colors.white,
    opacity: 1,
  },
  todayDayName: {
    color: colors.primary,
    opacity: 1,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  selectedDayNumber: {
    color: colors.white,
  },
  todayDayNumber: {
    color: colors.primary,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    position: "absolute",
    bottom: 4,
  },
  selectedDayDot: {
    backgroundColor: colors.white,
  },
  scheduleContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  scheduleList: {
    padding: 16,
    paddingBottom: 100,
  },
  daySection: {
    marginBottom: 18,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  daySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    backgroundColor: "#fdfefe",
  },
  dayHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 119, 190, 0.1)",
  },
  dateBubbleToday: {
    backgroundColor: colors.primary,
  },
  dateBubbleDay: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  dateBubbleDayToday: {
    color: colors.white,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  daySubtitle: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
    marginTop: 2,
  },
  todayChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  todayChipText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(0, 119, 190, 0.08)",
  },
  dayBadgeToday: {
    backgroundColor: colors.primary,
  },
  dayBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.2,
  },
  dayBadgeTextToday: {
    color: colors.white,
  },
  daySectionDate: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.65,
    fontWeight: "600",
  },
  dayEmptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dayEmptyText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
  },
  compactEmptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  compactEmptyText: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.6,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
  },
  sessionRowDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  timePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    borderRadius: 8,
    marginRight: 12,
  },
  timePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  sessionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  sessionMetaText: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.75,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#E6F5EC",
    borderRadius: 999,
    marginLeft: 10,
  },
  statusChipText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  scheduleCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  timeContainer: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  timeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 2,
  },
  durationText: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
  },
  scheduleContent: {
    padding: 16,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  slotTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  scheduleDetails: {
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.6,
    textAlign: "center",
    lineHeight: 24,
  },
  // Styles cho component renderDetail hiện đại
  detailContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  detailHeader: {
    backgroundColor: colors.primary,
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  detailHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  detailHeaderText: {
    flex: 1,
  },
  detailHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 4,
  },
  detailHeaderSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  detailTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  detailTimeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: 6,
  },
  detailContent: {
    padding: 16,
    paddingTop: 24,
  },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  detailCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  detailCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  detailCardContent: {
    padding: 16,
  },
  detailInfoItem: {
    marginBottom: 16,
  },
  detailInfoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    opacity: 0.7,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailInfoValue: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
    lineHeight: 20,
  },
  detailInfoValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailInfoBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 119, 190, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailInfoBadgeType: {
    backgroundColor: colors.primary,
  },
  detailInfoBadgeMaintenance: {
    backgroundColor: "#FF6B35",
  },
});
