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

  // status text removed; using icon/avatar only

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
      const d = new Date(dateString);
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const hh = pad(d.getHours());
      const mm = pad(d.getMinutes());
      const dd = pad(d.getDate());
      const mo = pad(d.getMonth() + 1);
      const yyyy = d.getFullYear();
      return `${hh}:${mm} ${dd}/${mo}/${yyyy}`;
    } catch {
      return "Không xác định";
    }
  };

  const statusColor = getStatusColor(application.status);
  const statusIcon = getStatusIcon(application.status);
  const replyText =
    (application as any).reply_content || (application as any).reply || "";
  const hasReply = typeof replyText === "string" && replyText.trim().length > 0;
  const filesCount = Array.isArray(application.file)
    ? application.file.length
    : 0;
  const authorText =
    typeof application.created_by === "object" && application.created_by
      ? application.created_by.username || application.created_by.email
      : undefined;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {/* Left cluster: avatar + title + meta */}
          <View style={styles.headerLeftCluster}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: statusColor + "1A" },
              ]}
            >
              <View
                style={[styles.avatarInner, { backgroundColor: statusColor }]}
              >
                <Ionicons
                  name={statusIcon as any}
                  size={10}
                  color={colors.white}
                />
              </View>
            </View>
            <View style={styles.headerLeftBody}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {application.title}
              </Text>
              <View style={styles.metaRow}>
                {application.type && (
                  <View style={styles.typeContainerHeader}>
                    <Ionicons
                      name="folder-outline"
                      size={12}
                      color={colors.primary}
                    />
                    <Text
                      style={styles.typeText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {application.type.title}
                    </Text>
                  </View>
                )}
                <View style={styles.dot} />
                <View style={styles.inlineRow}>
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color={colors.gray[500]}
                  />
                  <Text style={styles.date}>
                    {formatDate(application.created_at)}
                  </Text>
                </View>
                {authorText && (
                  <>
                    <View style={styles.dot} />
                    <View style={styles.inlineRow}>
                      <Ionicons
                        name="person-outline"
                        size={12}
                        color={colors.gray[500]}
                      />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {authorText}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
          {/* Right: chevron only */}
          <View style={styles.headerRightRow}>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.gray[400]}
            />
          </View>
        </View>
      </View>

      {/* Divider between header and content */}
      <View style={styles.divider} />

      {/* Content */}
      <Text style={styles.content} numberOfLines={2}>
        {application.content}
      </Text>

      {/* Attachments */}
      {filesCount > 0 && (
        <View style={styles.attachmentRow}>
          <Ionicons name="attach-outline" size={14} color={colors.gray[600]} />
          <Text style={styles.attachmentText}>{filesCount} tệp đính kèm</Text>
        </View>
      )}

      {/* Reply */}
      {hasReply ? (
        <View style={styles.replyContainer}>
          <View style={styles.replyHeaderRow}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={14}
              color={colors.primary}
            />
            <Text style={styles.replyLabel}>Phản hồi</Text>
          </View>
          <Text style={styles.replyContent} numberOfLines={2}>
            {replyText}
          </Text>
        </View>
      ) : (
        <View style={styles.replyEmptyRow}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={14}
            color={colors.gray[400]}
          />
          <Text style={styles.replyEmptyText}>Chưa có phản hồi</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  header: {
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  headerLeftCluster: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLeftBody: {
    flex: 1,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  headerRight: {
    alignItems: "flex-start",
  },
  headerRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    marginRight: 8,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray[300],
    marginHorizontal: 8,
  },
  statusBadge: {
    display: "none",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 2,
  },
  date: {
    fontSize: 11,
    color: colors.gray[500],
    marginLeft: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.gray[600],
    marginLeft: 4,
    maxWidth: 120,
  },
  divider: {
    height: 1,
    backgroundColor: colors.primary + "20",
    marginVertical: 8,
  },
  content: {
    fontSize: 13,
    color: colors.gray[700],
    lineHeight: 18,
    marginBottom: 8,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  attachmentText: {
    marginLeft: 6,
    fontSize: 12,
    color: colors.gray[700],
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[50],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  typeContainerHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 0,
    maxWidth: 160,
  },
  typeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: "500",
    marginLeft: 4,
    flexShrink: 1,
  },
  replyContainer: {
    backgroundColor: colors.primary + "0D",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 0,
    position: "relative",
  },
  replyCurve: {
    position: "absolute",
    left: 6,
    top: 6,
    bottom: 6,
    width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  replyContainerEmpty: {
    backgroundColor: colors.gray[50],
    borderLeftColor: colors.gray[200],
  },
  replyEmptyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 2,
    marginTop: 4,
  },
  replyEmptyText: {
    marginLeft: 6,
    fontSize: 12,
    color: colors.gray[500],
    fontStyle: "italic",
  },
  replyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: 6,
    marginBottom: 0,
  },
  replyLabelEmpty: {
    color: colors.gray[500],
  },
  replyContent: {
    fontSize: 12,
    color: colors.gray[700],
    lineHeight: 16,
  },
  replyContentEmpty: {
    color: colors.gray[500],
    fontStyle: "italic",
  },
  chevron: {
    alignItems: "flex-end",
    marginTop: 4,
  },
});
