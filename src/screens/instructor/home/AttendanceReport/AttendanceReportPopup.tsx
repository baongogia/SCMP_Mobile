import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { PopupBase } from "../PopupBase/PopupBase";
import { ThemedText } from "@/src/components/base/ThemedText";
import { ThemedView } from "@/src/components/base/ThemedView";

// Mock attendance data
const attendanceData = [
  {
    id: "1",
    date: "15/08/2023",
    dayOfWeek: "Thứ Ba",
    checkIn: "07:45",
    checkOut: "17:05",
    status: "Đúng giờ",
  },
  {
    id: "2",
    date: "16/08/2023",
    dayOfWeek: "Thứ Tư",
    checkIn: "07:55",
    checkOut: "17:10",
    status: "Đúng giờ",
  },
  {
    id: "3",
    date: "17/08/2023",
    dayOfWeek: "Thứ Năm",
    checkIn: "08:10",
    checkOut: "17:00",
    status: "Đi muộn",
  },
  {
    id: "4",
    date: "18/08/2023",
    dayOfWeek: "Thứ Sáu",
    checkIn: "07:30",
    checkOut: "16:45",
    status: "Đúng giờ",
  },
  {
    id: "5",
    date: "19/08/2023",
    dayOfWeek: "Thứ Bảy",
    checkIn: "--:--",
    checkOut: "--:--",
    status: "Nghỉ",
  },
  {
    id: "6",
    date: "20/08/2023",
    dayOfWeek: "Chủ Nhật",
    checkIn: "--:--",
    checkOut: "--:--",
    status: "Nghỉ",
  },
  {
    id: "7",
    date: "21/08/2023",
    dayOfWeek: "Thứ Hai",
    checkIn: "07:50",
    checkOut: "17:15",
    status: "Đúng giờ",
  },
];

export function AttendanceReportPopup() {
  const [selectedMonth, setSelectedMonth] = useState("Tháng 8/2023");
  const [filterStatus, setFilterStatus] = useState("Tất cả");

  // Calculate attendance statistics
  const totalDays = attendanceData.length;
  const presentDays = attendanceData.filter(
    (item) => item.status !== "Nghỉ"
  ).length;
  const lateDays = attendanceData.filter(
    (item) => item.status === "Đi muộn"
  ).length;
  const attendanceRate = Math.round((presentDays / totalDays) * 100);

  // Filter data based on selected status
  const filteredData = attendanceData.filter(
    (item) => filterStatus === "Tất cả" || item.status === filterStatus
  );

  const renderAttendanceItem = ({ item }: any) => {
    const isAbsent = item.status === "Nghỉ";
    const isLate = item.status === "Đi muộn";

    return (
      <ThemedView style={styles.attendanceItem}>
        <View style={styles.dateContainer}>
          <ThemedText style={styles.date}>{item.date}</ThemedText>
          <ThemedText style={styles.dayOfWeek}>{item.dayOfWeek}</ThemedText>
        </View>

        <View style={styles.timeContainer}>
          <View style={styles.timeBlock}>
            <ThemedText style={styles.timeLabel}>Check In</ThemedText>
            <ThemedText
              style={[
                styles.timeValue,
                isAbsent && styles.absentTime,
                isLate && styles.lateTime,
              ]}
            >
              {item.checkIn}
            </ThemedText>
          </View>

          <View style={styles.timeBlock}>
            <ThemedText style={styles.timeLabel}>Check Out</ThemedText>
            <ThemedText
              style={[styles.timeValue, isAbsent && styles.absentTime]}
            >
              {item.checkOut}
            </ThemedText>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <ThemedText
            style={[
              styles.status,
              isAbsent && styles.absentStatus,
              isLate && styles.lateStatus,
            ]}
          >
            {item.status}
          </ThemedText>
        </View>
      </ThemedView>
    );
  };

  // Use ListHeaderComponent for FlatList to avoid nesting issues
  const renderHeader = () => (
    <>
      <ThemedText style={styles.title}>Báo cáo chấm công</ThemedText>

      {/* Month selector */}
      <View style={styles.selectorRow}>
        <TouchableOpacity style={styles.arrowButton}>
          <ThemedText style={styles.arrowButtonText}>←</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.monthText}>{selectedMonth}</ThemedText>
        <TouchableOpacity style={styles.arrowButton}>
          <ThemedText style={styles.arrowButtonText}>→</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Statistics summary */}
      <ThemedView style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryValue}>{totalDays}</ThemedText>
          <ThemedText style={styles.summaryLabel}>Tổng ngày</ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryValue}>{presentDays}</ThemedText>
          <ThemedText style={styles.summaryLabel}>Ngày làm việc</ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryValue}>{lateDays}</ThemedText>
          <ThemedText style={styles.summaryLabel}>Đi muộn</ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryValue}>{attendanceRate}%</ThemedText>
          <ThemedText style={styles.summaryLabel}>Tỷ lệ</ThemedText>
        </View>
      </ThemedView>

      {/* Filter options */}
      <View style={styles.filterContainer}>
        <ThemedText style={styles.filterLabel}>Hiển thị:</ThemedText>
        <View style={styles.filterOptions}>
          <TouchableOpacity
            style={[
              styles.filterOption,
              filterStatus === "Tất cả" && styles.activeFilter,
            ]}
            onPress={() => setFilterStatus("Tất cả")}
          >
            <ThemedText
              style={filterStatus === "Tất cả" ? styles.activeFilterText : {}}
            >
              Tất cả
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterOption,
              filterStatus === "Đi muộn" && styles.activeFilter,
            ]}
            onPress={() => setFilterStatus("Đi muộn")}
          >
            <ThemedText
              style={filterStatus === "Đi muộn" ? styles.activeFilterText : {}}
            >
              Đi muộn
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterOption,
              filterStatus === "Nghỉ" && styles.activeFilter,
            ]}
            onPress={() => setFilterStatus("Nghỉ")}
          >
            <ThemedText
              style={filterStatus === "Nghỉ" ? styles.activeFilterText : {}}
            >
              Nghỉ
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Table header */}
      <ThemedView style={styles.tableHeader}>
        <ThemedText style={[styles.headerText, { flex: 1.5 }]}>Ngày</ThemedText>
        <ThemedText style={[styles.headerText, { flex: 2 }]}>
          Giờ làm việc
        </ThemedText>
        <ThemedText style={[styles.headerText, { flex: 1 }]}>
          Trạng thái
        </ThemedText>
      </ThemedView>
    </>
  );

  const renderFooter = () => (
    <TouchableOpacity style={styles.downloadButton}>
      <ThemedText style={styles.downloadButtonText}>
        Tải xuống báo cáo
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <PopupBase useScrollView={false}>
      <View style={styles.container}>
        <FlatList
          data={filteredData}
          renderItem={renderAttendanceItem}
          keyExtractor={(item) => item.id}
          style={styles.attendanceList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.flatListContent}
        />
      </View>
    </PopupBase>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  selectorRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  arrowButton: {
    padding: 10,
  },
  arrowButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007BFF",
  },
  monthText: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 20,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007BFF",
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 5,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  filterLabel: {
    marginRight: 10,
    fontWeight: "bold",
  },
  filterOptions: {
    flexDirection: "row",
  },
  filterOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 5,
    backgroundColor: "#f0f0f0",
  },
  activeFilter: {
    backgroundColor: "#007BFF",
  },
  activeFilterText: {
    color: "white",
    fontWeight: "bold",
  },
  tableHeader: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 5,
  },
  headerText: {
    fontWeight: "bold",
  },
  attendanceList: {
    marginBottom: 16,
  },
  attendanceItem: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: "center",
  },
  dateContainer: {
    flex: 1.5,
  },
  date: {
    fontWeight: "bold",
  },
  dayOfWeek: {
    fontSize: 12,
    color: "#666",
  },
  timeContainer: {
    flex: 2,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeBlock: {
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 12,
    color: "#666",
  },
  timeValue: {
    fontWeight: "bold",
  },
  lateTime: {
    color: "orange",
  },
  absentTime: {
    color: "#ccc",
  },
  statusContainer: {
    flex: 1,
    alignItems: "center",
  },
  status: {
    fontWeight: "bold",
    color: "green",
  },
  lateStatus: {
    color: "orange",
  },
  absentStatus: {
    color: "#999",
  },
  downloadButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  downloadButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
