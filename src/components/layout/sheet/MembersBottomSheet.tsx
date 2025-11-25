import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";

interface Member {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: "instructor" | "student" | "other";
}

interface MembersBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  members: Member[];
  className: string;
}

export function MembersBottomSheet({
  visible,
  onClose,
  members,
  className,
}: MembersBottomSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMembers, setFilteredMembers] = useState<Member[]>(members);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(
        (member) =>
          member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.phone?.includes(searchQuery)
      );
      setFilteredMembers(filtered);
    }
  }, [searchQuery, members]);

  const renderMemberItem = ({ item }: { item: Member }) => (
    <View style={styles.memberItem}>
      <View style={styles.memberInfo}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={18} color={colors.white} />
          </View>
        )}
        <View style={styles.memberDetails}>
          <View style={styles.memberHeader}>
            <Text style={styles.memberName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.role && (
              <View
                style={[
                  styles.roleBadge,
                  item.role === "instructor"
                    ? styles.roleInstructor
                    : item.role === "student"
                    ? styles.roleStudent
                    : styles.roleOther,
                ]}
              >
                <Text style={styles.roleBadgeText}>
                  {item.role === "instructor"
                    ? "HLV"
                    : item.role === "student"
                    ? "HV"
                    : "TV"}
                </Text>
              </View>
            )}
          </View>
          {(item.email || item.phone) && (
            <View style={styles.contactInfo}>
              {item.phone && (
                <View style={styles.contactItem}>
                  <Ionicons
                    name="call-outline"
                    size={12}
                    color={colors.grayc}
                    style={styles.contactIcon}
                  />
                  <Text style={styles.memberContact} numberOfLines={1}>
                    {item.phone}
                  </Text>
                </View>
              )}
              {item.email && (
                <View style={styles.contactItem}>
                  <Ionicons
                    name="mail-outline"
                    size={12}
                    color={colors.grayc}
                    style={styles.contactIcon}
                  />
                  <Text style={styles.memberContact} numberOfLines={1}>
                    {item.email}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thành viên lớp học</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Class Info */}
        <View style={styles.classInfo}>
          <Text style={styles.className}>{className}</Text>
          <Text style={styles.memberCount}>{members.length} thành viên</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={colors.grayc}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm thành viên..."
            placeholderTextColor={colors.grayc}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.grayc} />
            </TouchableOpacity>
          )}
        </View>

        {/* Members List */}
        <FlatList
          data={filteredMembers}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item._id}
          style={styles.membersList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.membersListContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="people-outline"
                size={28}
                color={colors.grayc}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyStateTitle}>Chưa có thành viên</Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery
                  ? "Không tìm thấy kết quả phù hợp với từ khóa."
                  : "Danh sách thành viên sẽ hiển thị khi có dữ liệu."}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 40,
  },
  classInfo: {
    backgroundColor: colors.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  className: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: colors.grayc,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    margin: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  membersList: {
    flex: 1,
  },
  membersListContent: {
    paddingBottom: 20,
  },
  memberItem: {
    backgroundColor: colors.white,
    marginHorizontal: 15,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.lightGray,
    overflow: "hidden",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  memberDetails: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  memberContact: {
    fontSize: 12,
    color: colors.grayc,
    flex: 1,
  },
  contactInfo: {
    marginTop: 2,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  contactIcon: {
    marginRight: 2,
  },
  roleBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 36,
    alignItems: "center",
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.3,
  },
  roleInstructor: {
    backgroundColor: colors.primary,
  },
  roleStudent: {
    backgroundColor: colors.primaryLight,
  },
  roleOther: {
    backgroundColor: colors.grayc,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.grayc,
    textAlign: "center",
    marginTop: 4,
  },
});
