import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { colors } from "@/src/constants/colors";
import { getAllMemberSchedules } from "@/src/services/learning_process/schedules/scheduleServices";
import CalendarView, {
  CalendarEventItem,
} from "@/src/components/custom/calendar/CalendarView";

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
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
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
});
