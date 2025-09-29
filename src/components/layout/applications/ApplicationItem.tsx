import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";

interface ApplicationItemProps {
  application: {
    _id: string;
    title: string;
    content: string;
    status?: string[] | string;
    created_at: string;
    updated_at: string;
    reply_content?: string;
    created_by?:
      | string
      | {
          username: string;
          email: string;
        };
    updated_by?: string;
    tenant_id?: string;
    file?: any[];
    type?: {
      _id: string;
      title: string;
      type?: any[];
      created_at: string;
    };
  };
  onPress?: () => void;
}

export default function ApplicationItem({
  application,
  onPress,
}: ApplicationItemProps) {
  const getStatusColor = (status?: string[] | string) => {
    if (!status) return colors.warning; // Default to pending if no status

    let statusValue;
    if (Array.isArray(status)) {
      if (status.length === 0) return colors.warning;
      statusValue = status[0];
    } else {
      statusValue = status;
    }

    if (!statusValue || statusValue.trim() === "") return colors.warning;

    const statusStr = statusValue.toLowerCase();
    switch (statusStr) {
      case "accepted":
      case "approved":
        return colors.success;
      case "rejected":
        return colors.error;
      case "inprogress":
      case "pending":
        return colors.warning;
      default:
        return colors.warning;
    }
  };

  const getStatusText = (status?: string[] | string) => {
    if (!status) return "Chờ duyệt"; // Default status

    let statusValue;
    if (Array.isArray(status)) {
      if (status.length === 0) return "Chờ duyệt";
      statusValue = status[0];
    } else {
      statusValue = status;
    }

    if (!statusValue || statusValue.trim() === "") return "Chờ duyệt";

    const statusStr = statusValue.toLowerCase();
    switch (statusStr) {
      case "accepted":
      case "approved":
        return "Đã duyệt";
      case "rejected":
        return "Từ chối";
      case "inprogress":
        return "Đang xử lý";
      case "pending":
        return "Chờ duyệt";
      default:
        return statusValue;
    }
  };

  const getStatusIcon = (status?: string[] | string) => {
    if (!status) return "hourglass-outline"; // Default to pending icon

    let statusValue;
    if (Array.isArray(status)) {
      if (status.length === 0) return "hourglass-outline";
      statusValue = status[0];
    } else {
      statusValue = status;
    }

    if (!statusValue || statusValue.trim() === "") return "hourglass-outline";

    const statusStr = statusValue.toLowerCase();
    switch (statusStr) {
      case "accepted":
      case "approved":
        return "checkmark-circle";
      case "rejected":
        return "close-circle";
      case "inprogress":
        return "time";
      case "pending":
        return "hourglass-outline";
      default:
        return "hourglass-outline";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Không xác định";
    }
  };

  const statusColor = getStatusColor(application.status);
  const statusText = getStatusText(application.status);
  const statusIcon = getStatusIcon(application.status);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {application.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Ionicons name={statusIcon as any} size={10} color={colors.white} />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={12} color={colors.gray[500]} />
          <Text style={styles.date}>{formatDate(application.created_at)}</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.content} numberOfLines={2}>
        {application.content}
      </Text>

      {/* Type */}
      {application.type && (
        <View style={styles.typeContainer}>
          <Ionicons name="folder-outline" size={14} color={colors.primary} />
          <Text style={styles.typeText}>{application.type.title}</Text>
        </View>
      )}

      {/* Reply */}
      {application.reply_content && (
        <View style={styles.replyContainer}>
          <Text style={styles.replyLabel}>Phản hồi:</Text>
          <Text style={styles.replyContent} numberOfLines={2}>
            {application.reply_content}
          </Text>
        </View>
      )}

      {/* Chevron */}
      <View style={styles.chevron}>
        <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.white,
    marginLeft: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  date: {
    fontSize: 12,
    color: colors.gray[500],
    marginLeft: 4,
  },
  content: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  typeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
    marginLeft: 4,
  },
  replyContainer: {
    backgroundColor: colors.primary + "08",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
  },
  replyContent: {
    fontSize: 13,
    color: colors.gray[700],
    lineHeight: 18,
  },
  chevron: {
    alignItems: "flex-end",
  },
});
