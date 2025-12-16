import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { ClassItem } from "@/src/types/schedule";

type ClassCardVariant = "operational" | "analytical" | "progress";

interface ClassCardProps {
  item: ClassItem;
  variant?: ClassCardVariant;
  onPress?: (item: ClassItem) => void;
  style?: ViewStyle;
}

export const ClassStatsCard: React.FC<ClassCardProps> = ({
  item,
  variant = "operational",
  onPress,
  style,
}) => {
  const handlePress = () => {
    onPress?.(item);
  };

  // Helper to safely get course title
  const getCourseTitle = () => {
    if (typeof item.course === "object" && item.course !== null) {
      return item.course.title;
    }
    return "Khóa học";
  };

  const getSessionCount = () => {
    if (typeof item.course === "object" && item.course !== null) {
      return item.course.session_number || 0;
    }
    return 0;
  };

  // Mocked logical helpers
  const getProgress = () => {
    const total = getSessionCount();
    return { current: Math.max(0, total - 2), total };
  };

  const getRating = () => {
      // Mock data for Analytical view
      return { stars: 4.8, count: 12 };
  };

  const renderOperationalContent = () => {
    return (
    <View style={styles.cardContent}>
      <View style={styles.opHeader}>
           <View style={styles.opIconContainer}>
               <Ionicons name="calendar-clear" size={20} color={colors.primary} />
           </View>
           <View style={{flex: 1}}>
                 <Text style={styles.opClassTitle}>{getCourseTitle()}</Text>
                 <Text style={styles.opCourseTitle} numberOfLines={1}>{item.name}</Text>
           </View>
           <View style={styles.opArrow}>
                <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
           </View>
      </View>

      <View style={styles.opDivider} />

      <View style={styles.opFooter}>
          <View style={styles.opAvatars}>
               {Array.isArray(item.member) && item.member.slice(0, 4).map((m, i) => {
                   const avatarSource = (() => {
                       if (m.featured_image) {
                           if (Array.isArray(m.featured_image) && m.featured_image.length > 0) {
                               return { uri: m.featured_image[0].path };
                           }
                           if (typeof m.featured_image === 'object' && m.featured_image.path) {
                               return { uri: m.featured_image.path };
                           }
                           if (typeof m.featured_image === 'string') {
                               return { uri: m.featured_image };
                           }
                       }
                       if (m.avatar) return { uri: m.avatar };
                       return null;
                   })();

                   return (
                       <View key={i} style={[styles.opAvatarFrame, { marginLeft: i === 0 ? 0 : -10, zIndex: 4-i }]}>
                           {avatarSource ? (
                               <Image source={avatarSource} style={styles.opAvatarImg} />
                           ) : (
                               <View style={[styles.opAvatarImg, { backgroundColor: colors.gray[300], alignItems: 'center', justifyContent: 'center' }]}>
                                   <Text style={{fontSize: 10, fontWeight: '700', color: colors.white}}>{(m.username || m.name || 'U').charAt(0).toUpperCase()}</Text>
                               </View>
                           )}
                       </View>
                   );
               })}
               {Array.isArray(item.member) && item.member.length > 4 && (
                   <View style={[styles.opAvatarFrame, { marginLeft: -10, zIndex: 0 }]}>
                        <View style={[styles.opAvatarImg, { backgroundColor: colors.lightPrimary, alignItems: 'center', justifyContent: 'center' }]}>
                            <Text style={{fontSize: 10, fontWeight: '700', color: colors.primary}}>+{item.member.length - 4}</Text>
                        </View>
                   </View>
               )}
          </View>
          <View style={styles.opStatRight}>
               <View style={styles.opStatBadge}>
                    <Ionicons name="layers" size={12} color={colors.primary} />
                    <Text style={styles.opStatTextBadge}>{getSessionCount()} Buổi</Text>
               </View>
          </View>
      </View>
    </View>
  );
  };

  const renderAnalyticalContent = () => {
      const { stars, count } = getRating();
      return (
        <View style={styles.cardContent}>
            <View style={styles.headerRow}>
                 <View style={styles.analyticsScore}>
                    <Text style={styles.scoreText}>{stars}</Text>
                    <Ionicons name="star" size={12} color={colors.warning} />
                 </View>
                 <View style={styles.headerInfo}>
                    <Text style={styles.titleAn} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.reviewBadge}>
                        <Text style={styles.reviewText}>{count} review mới</Text>
                    </View>
                 </View>
            </View>
            <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${(stars/5)*100}%` }]} />
            </View>
             <Text style={styles.feedbackPreview} numberOfLines={1}>
                "Giáo viên nhiệt tình, dạy dễ hiểu..."
            </Text>
        </View>
      );
  };

  const renderProgressContent = () => {
      const { current, total } = getProgress();
      const percent = total > 0 ? (current / total) * 100 : 0;
      const isEndingSoon = percent >= 80;
      const isEnded = percent >= 100;

      let statusColor = colors.primary;
      let statusText = "Đang học";
      if (isEnded) { statusColor = colors.success; statusText = "Đã kết thúc"; }
      else if (isEndingSoon) { statusColor = colors.warning; statusText = "Sắp kết thúc"; }

      return (
          <View style={styles.cardContent}>
              <View style={styles.headerRow}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <View style={styles.headerInfo}>
                      <Text style={styles.titlePr} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                  </View>
                   <Text style={styles.progressText}>{current}/{total}</Text>
              </View>
              <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: statusColor }]} />
              </View>
          </View>
      );
  };

  return (
    <TouchableOpacity
        style={[styles.container, variant === 'analytical' && styles.containerCompact, style]}
        onPress={handlePress}
        activeOpacity={0.7}
    >
      {variant === "operational" && renderOperationalContent()}
      {variant === "analytical" && renderAnalyticalContent()}
      {variant === "progress" && renderProgressContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerCompact: {
      padding: 12,
      borderRadius: 12,
  },
  cardContent: {
      gap: 12,
  },
  headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  headerInfo: {
      flex: 1,
  },
  // Operational Styles
  opHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  opIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.lightPrimary,
      alignItems: 'center',
      justifyContent: 'center',
  },
  opCourseTitle: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textSecondary,
      marginBottom: 2,
  },
  opClassTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
  },
  opArrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
  },
  opDivider: {
      height: 1,
      backgroundColor: colors.border,
      opacity: 0.6,
  },
  opFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 4,
  },
  opAvatars: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 4,
  },
  opAvatarFrame: {
      padding: 1,
      backgroundColor: colors.white,
      borderRadius: 14,
  },
  opAvatarImg: {
      width: 26,
      height: 26,
      borderRadius: 13,
  },
  opStatRight: {
      flexDirection: 'row',
      gap: 8,
  },
  opStatBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.lightPrimary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
  },
  opStatTextBadge: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
  },

  // Analytical Styles
  analyticsScore: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      borderRadius: 8,
      width: 44,
      height: 44,
  },
  scoreText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
  },
  titleAn: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
  },
  reviewBadge: {
      backgroundColor: colors.lightPrimary,
      alignSelf: 'flex-start',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 2,
  },
  reviewText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: '600',
  },
  barContainer: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
  },
  barFill: {
      height: '100%',
      backgroundColor: colors.success,
  },
  feedbackPreview: {
      fontSize: 13,
      color: colors.textSecondary,
      fontStyle: 'italic',
  },

  // Progress Styles
  statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
  },
  titlePr: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
  },
  statusText: {
      fontSize: 12,
      fontWeight: '500',
  },
  progressText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
  },
  progressBarBg: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
  },
  progressBarFill: {
      height: '100%',
      borderRadius: 4,
  },
});
