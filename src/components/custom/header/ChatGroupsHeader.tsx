import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/src/constants/colors";

interface ChatGroup {
  id: string;
  groupName: string;
  lastMessage: string;
  lastMessageTime: Date;
  memberCount: number;
  unreadCount: number;
  isManager: boolean;
  conversationType: string[];
  classInfo?: {
    id: string;
    name: string;
    course: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ChatGroupsHeaderProps {
  groups: ChatGroup[];
  onSelectGroup: (group: ChatGroup) => void;
  maxVisibleGroups?: number;
  backgroundImageUrl?: string;
}

export const ChatGroupsHeader: React.FC<ChatGroupsHeaderProps> = ({
  groups = [],
  onSelectGroup,
  maxVisibleGroups = 5,
  backgroundImageUrl,
}) => {
  // Limit groups to maxVisibleGroups
  const displayGroups = (groups || []).slice(0, maxVisibleGroups);

  const getAvatarInitial = (groupName: string): string => {
    if (!groupName || groupName.length === 0) return "?";
    return groupName.charAt(0).toUpperCase();
  };

  const renderGroup = (group: ChatGroup, index: number, isLast: boolean) => {
    const initial = getAvatarInitial(group.groupName);
    return (
      <TouchableOpacity
        key={group.id}
        style={[styles.groupItem, isLast && styles.groupItemLast]}
        onPress={() => onSelectGroup(group)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: "transparent",
              },
            ]}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        </View>
        <Text style={styles.groupName} numberOfLines={1}>
          {group.groupName}
        </Text>
      </TouchableOpacity>
    );
  };

  if (displayGroups.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.primary }]}
        edges={["top", "left", "right"]}
      >
        {backgroundImageUrl ? (
          <>
            <Image
              source={{ uri: backgroundImageUrl }}
              style={styles.headerBackgroundImage}
              resizeMode="cover"
            />
            <View style={styles.headerOverlay} />
          </>
        ) : null}
        <View style={styles.emptyContainer}>
          {/* <Ionicons name="chatbubbles-outline" size={24} color={colors.white} />
          <Text style={styles.emptyText}>Chưa có nhóm chat</Text> */}
        </View>
        <View style={[styles.bottomCurve]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: "transparent" }]}
      edges={["top", "left", "right"]}
    >
      {backgroundImageUrl ? (
        <>
          <Image
            source={{ uri: backgroundImageUrl }}
            style={styles.headerBackgroundImage}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay} />
        </>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {displayGroups.map((group, index) =>
          renderGroup(group, index, index === displayGroups.length - 1)
        )}
      </ScrollView>
      <View style={[styles.bottomCurve]} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  headerBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    zIndex: 1,
  },
  scrollView: {
    flexGrow: 0,
    position: "relative",
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    alignItems: "center",
  },
  groupItem: {
    alignItems: "center",
    marginRight: 20,
    width: 70,
  },
  groupItemLast: {
    marginRight: 0,
  },
  avatarContainer: {
    marginBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 35,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.white,
    textAlign: "center",
  },
  groupName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.white,
    textAlign: "center",
    maxWidth: 70,
  },
  emptyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    minHeight: 80,
    gap: 8,
    position: "relative",
    zIndex: 2,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.white,
    opacity: 0.9,
  },
  bottomCurve: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -4,
    height: 28,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: colors.mainBackground,
    zIndex: 10,
  },
});
