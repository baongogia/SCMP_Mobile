import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { getChildrenSchedule } from "@/src/services/information/children/childenServices";
import { CustomToast } from "@/src/components/custom/CustomToast";

interface ScheduleItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  status: "upcoming" | "completed" | "cancelled";
}

interface ChildrenScheduleScreenProps {
  route: {
    params: {
      childId: string;
      childName: string;
    };
  };
  navigation: any;
}

export default function ChildrenScheduleScreen({
  route,
  navigation,
}: ChildrenScheduleScreenProps) {
  const { childId, childName } = route.params;
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    loadSchedule();
  }, [childId, selectedDate]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const startDate = new Date(selectedDate);
      startDate.setDate(1);
      const endDate = new Date(selectedDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);

      const response = await getChildrenSchedule(
        childId,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );

      if (response.data && response.data.data) {
        setSchedules(response.data.data);
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
      setToast({ message: "Không thể tải lịch học", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedule();
    setRefreshing(false);
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

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return colors.primary;
      case "completed":
        return colors.success;
      case "cancelled":
        return colors.error;
      default:
        return colors.gray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming":
        return "Sắp diễn ra";
      case "completed":
        return "Đã hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  const renderScheduleItem = ({ item }: { item: ScheduleItem }) => (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleHeader}>
        <View style={styles.scheduleTime}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={styles.timeText}>{formatTime(item.time)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <Text style={styles.scheduleTitle}>{item.title}</Text>

      <View style={styles.scheduleDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.gray} />
          <Text style={styles.detailText}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color={colors.gray} />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color={colors.gray} />
          <Text style={styles.detailText}>{item.instructor}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={80} color={colors.gray} />
      <Text style={styles.emptyTitle}>Không có lịch học</Text>
      <Text style={styles.emptySubtitle}>
        {childName} chưa có lịch học nào trong tháng này
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Lịch học của {childName}</Text>
          <Text style={styles.headerSubtitle}>
            {selectedDate.toLocaleDateString("vi-VN", {
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải lịch học...</Text>
        </View>
      ) : schedules.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={schedules}
          renderItem={renderScheduleItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  filterButton: {
    padding: 8,
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
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
  },
  scheduleCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scheduleTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
  },
  scheduleDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.gray,
  },
});
