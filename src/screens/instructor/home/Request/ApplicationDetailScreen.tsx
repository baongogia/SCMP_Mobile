import React from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { ThemedText } from "@/src/components/base/ThemedText";
import { ThemedView } from "@/src/components/base/ThemedView";
import { SharedHeader } from "@/src/components/custom";

type ParamList = {
  ApplicationDetail: {
    application: any;
  };
};

export function ApplicationDetailScreen() {
  const route = useRoute<RouteProp<ParamList, "ApplicationDetail">>();
  const application = route.params?.application || {};

  const replyText = application.reply_content || application.reply || "";
  const hasReply = typeof replyText === "string" && replyText.trim().length > 0;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Không xác định";
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

  const statusValue = Array.isArray(application.status)
    ? application.status[0]
    : application.status;
  const statusLower = (statusValue || "").toString().toLowerCase();
  const statusMap: Record<
    string,
    { text: string; color: string; icon: string }
  > = {
    approved: {
      text: "Đã duyệt",
      color: colors.success,
      icon: "checkmark-circle",
    },
    accepted: {
      text: "Đã duyệt",
      color: colors.success,
      icon: "checkmark-circle",
    },
    rejected: { text: "Từ chối", color: colors.error, icon: "close-circle" },
    inprogress: { text: "Đang xử lý", color: colors.warning, icon: "time" },
    pending: {
      text: "Chờ duyệt",
      color: colors.warning,
      icon: "hourglass-outline",
    },
  };
  const statusMeta = statusMap[statusLower] || statusMap["pending"];

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <SharedHeader title="Chi tiết đơn" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero / Title + Content + Meta */}
        <View style={[styles.hero, { borderColor: statusMeta.color + "33" }]}>
          <View style={styles.heroTopRow}>
            <ThemedText
              style={styles.title}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {application.title || "—"}
            </ThemedText>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusMeta.color },
              ]}
            >
              <Ionicons
                name={statusMeta.icon as any}
                size={14}
                color={colors.white}
              />
              <Text style={styles.statusText}>{statusMeta.text}</Text>
            </View>
          </View>

          {/* Meta moved to compact footer; ID removed */}

          {application.type?.title && (
            <View style={styles.typePillsRow}>
              <View style={styles.typePill}>
                <Ionicons
                  name="folder-outline"
                  size={14}
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
            </View>
          )}
          {/* Body content within hero */}
          <View style={styles.divider} />
          <Text style={styles.body}>{application.content || "—"}</Text>

          {/* Attachments inline hint */}
          {Array.isArray(application.file) && application.file.length > 0 && (
            <View style={styles.inlineAttachmentRow}>
              <Ionicons
                name="attach-outline"
                size={14}
                color={colors.gray[600]}
              />
              <Text style={styles.inlineAttachmentText}>
                {application.file.length} tệp đính kèm
              </Text>
            </View>
          )}

          {/* Compact meta footer at bottom-left */}
          <View style={styles.metaFooterRow}>
            <Ionicons name="time-outline" size={13} color={colors.gray[500]} />
            <Text style={styles.metaFooterText}>
              {`Tạo ${formatDate(application.created_at)}`}
              {application.updated_at
                ? ` • Cập nhật ${formatDate(application.updated_at)}`
                : ""}
            </Text>
          </View>
        </View>

        {/* Reply */}
        <ThemedView style={[styles.section, !hasReply && styles.sectionMuted]}>
          <View style={styles.replyHeaderRow}>
            <Ionicons
              name="arrow-undo-outline"
              size={16}
              color={hasReply ? colors.primary : colors.gray[400]}
            />
            <ThemedText
              style={[styles.replyTitle, !hasReply && styles.mutedText]}
            >
              Phản hồi
            </ThemedText>
          </View>
          <View
            style={[styles.replyBubble, !hasReply && styles.replyBubbleEmpty]}
          >
            <View
              style={[
                styles.replyPointer,
                !hasReply && styles.replyPointerEmpty,
              ]}
            />
            <Text style={[styles.body, !hasReply && styles.mutedText]}>
              {hasReply ? replyText : "Chưa có phản hồi"}
            </Text>
          </View>
        </ThemedView>

        {/* Attachments (if any) */}
        {Array.isArray(application.file) && application.file.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Tệp đính kèm</ThemedText>
            {application.file.map((f: any, idx: number) => (
              <View key={idx} style={styles.attachmentRow}>
                <Ionicons
                  name="attach-outline"
                  size={16}
                  color={colors.gray[600]}
                />
                <Text style={styles.attachmentText} numberOfLines={1}>
                  {f?.name || f?.filename || "Tệp đính kèm"}
                </Text>
              </View>
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },
  content: {
    flex: 1,
  },
  hero: {
    margin: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[100],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  heroMetaGrid: {
    marginTop: 4,
  },
  metaCell: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  metaFooterRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  metaFooterText: {
    marginLeft: 6,
    fontSize: 12,
    color: colors.gray[600],
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionMuted: {
    backgroundColor: colors.gray[50],
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    marginRight: 12,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
    marginLeft: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.gray[600],
    marginLeft: 6,
  },
  typePill: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 220,
  },
  typePillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  typeText: {
    marginLeft: 6,
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    flexShrink: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray[700],
  },
  replyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  replyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginTop: 12,
    marginBottom: 8,
  },
  inlineAttachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  inlineAttachmentText: {
    marginLeft: 6,
    fontSize: 12,
    color: colors.gray[700],
  },
  mutedText: {
    color: colors.gray[500],
  },
  replyBubble: {
    marginTop: 6,
    backgroundColor: colors.primary + "0D",
    borderRadius: 10,
    padding: 12,
    position: "relative",
  },
  replyBubbleEmpty: {
    backgroundColor: colors.gray[50],
  },
  replyPointer: {
    position: "absolute",
    top: -6,
    left: 16,
    width: 12,
    height: 12,
    backgroundColor: colors.primary + "0D",
    transform: [{ rotate: "45deg" }],
    borderTopLeftRadius: 2,
  },
  replyPointerEmpty: {
    backgroundColor: colors.gray[50],
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  attachmentText: {
    marginLeft: 8,
    fontSize: 13,
    color: colors.gray[700],
  },
});
