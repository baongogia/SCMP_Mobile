import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { Note } from "./types";
import { parseNoteContent, formatDate } from "./utils";

interface NoteItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  onShowEvaluation: (note: Note) => void;
  onImagePreview: (media: any[], startIndex?: number) => void;
}

export function NoteItem({
  note,
  onEdit,
  onDelete,
  onShowEvaluation,
  onImagePreview,
}: NoteItemProps) {
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(
    new Set()
  );

  return (
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <View style={styles.noteHeaderLeft}>
          {/* Avatar */}
          <View style={styles.noteAvatar}>
            {note.member?.featured_image?.path ? (
              <Image
                source={{ uri: note.member.featured_image.path }}
                style={styles.noteAvatarImage}
              />
            ) : (
              <Ionicons name="person" size={20} color={colors.gray[500]} />
            )}
          </View>

          {/* Member info */}
          <View style={styles.noteMemberInfo}>
            <Text style={styles.noteMemberName}>
              {note.member?.name || note.member?.username || "Học viên"}
            </Text>
            <Text style={styles.noteDate}>{formatDate(note.created_at)}</Text>
          </View>
        </View>

        <View style={styles.noteActions}>
          {/* Evaluation Info Button */}
          {parseNoteContent(note.note).isEvaluated && (
            <TouchableOpacity
              style={styles.noteActionButton}
              onPress={() => onShowEvaluation(note)}
            >
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.noteActionButton}
            onPress={() => onEdit(note)}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.noteActionButton}
            onPress={() => onDelete(note)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.noteContentContainer}>
        <Text style={styles.noteContent}>
          {parseNoteContent(note.note).text || "Nội dung ghi chú"}
        </Text>
      </View>

      {/* Media Display - Compact */}
      {note.media && note.media.length > 0 && (
        <View style={styles.mediaGrid}>
          {note.media.slice(0, 3).map((media: any, mediaIndex: number) => {
            return (
              <TouchableOpacity
                key={mediaIndex}
                onPress={() => onImagePreview(note.media || [], mediaIndex)}
                style={styles.mediaThumbnailContainer}
              >
                {imageLoadErrors.has(media.path) ? (
                  <View style={styles.mediaFallback}>
                    <Ionicons
                      name="image-outline"
                      size={24}
                      color={colors.gray[500]}
                    />
                    <Text style={styles.mediaFallbackText}>
                      {media.title || "Media"}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.mediaDebugContainer}>
                    <Image
                      source={{
                        uri: media.path,
                        cache: "reload", // Force reload to avoid cache issues
                      }}
                      style={styles.mediaThumbnail}
                      resizeMode="cover"
                      onError={(error) => {
                        console.log("❌ Image load error:", error);
                        console.log("❌ Failed URI:", media.path);
                        setImageLoadErrors(
                          (prev) => new Set([...prev, media.path])
                        );
                      }}
                      onLoad={() => {
                        console.log(
                          "✅ Image loaded successfully:",
                          media.path
                        );
                        console.log("🖼️ Image should be visible now!");
                      }}
                    />
                    <Text style={styles.mediaDebugText}>IMG</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          {note.media.length > 3 && (
            <TouchableOpacity
              style={styles.moreMediaIndicator}
              onPress={() => onImagePreview(note.media || [], 3)}
            >
              <Text style={styles.moreMediaText}>+{note.media.length - 3}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Schedule info if available */}
      {note.schedule && (
        <View style={styles.noteScheduleInfo}>
          <View style={styles.noteScheduleRow}>
            <Ionicons name="calendar" size={14} color={colors.gray[500]} />
            <Text style={styles.noteScheduleText}>
              Buổi học: {formatDate(note.schedule.date)}
            </Text>
          </View>
        </View>
      )}

      {note.updated_at !== note.created_at && (
        <Text style={styles.noteUpdated}>
          Cập nhật: {formatDate(note.updated_at)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  noteCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  noteHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  noteAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  noteAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  noteMemberInfo: {
    flex: 1,
  },
  noteMemberName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  noteDate: {
    fontSize: 12,
    color: colors.gray[500],
  },
  noteContentContainer: {
    marginTop: 8,
  },
  noteContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  noteScheduleInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  noteScheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  noteScheduleText: {
    fontSize: 12,
    color: colors.gray[600],
    marginLeft: 6,
  },
  noteUpdated: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 8,
    fontStyle: "italic",
  },
  noteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noteActionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.gray[100],
  },
  mediaGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  mediaThumbnailContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  mediaDebugContainer: {
    position: "relative",
    width: 50,
    height: 50,
  },
  mediaThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.gray[200],
    borderWidth: 2,
    borderColor: colors.primary, // Debug border to see if image is there
  },
  mediaDebugText: {
    position: "absolute",
    top: 2,
    right: 2,
    fontSize: 8,
    color: colors.white,
    backgroundColor: colors.primary,
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 2,
    fontWeight: "bold",
  },
  mediaFallback: {
    width: 50,
    height: 50,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  mediaFallbackText: {
    fontSize: 8,
    color: colors.gray[600],
    textAlign: "center",
  },
  moreMediaIndicator: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderStyle: "dashed",
  },
  moreMediaText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray[600],
  },
});
