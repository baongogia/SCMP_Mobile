import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { ClassItem } from "@/src/types/schedule";

type ClassCardVariant = "operational" | "analytical" | "progress";

export interface ClassEvaluationStats {
  evaluated: number;
  total: number;
}

interface ClassCardProps {
  item: ClassItem;
  variant?: ClassCardVariant;
  onPress?: (item: ClassItem) => void;
  style?: ViewStyle;
  stats?: ClassEvaluationStats;
  currentSession?: number;
  totalSession?: number;
}

export const ClassStatsCard: React.FC<ClassCardProps> = ({
  item,
  variant = "operational",
  onPress,
  style,
  stats,
  currentSession,
  totalSession,
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
    if (totalSession !== undefined) return totalSession;
    if (typeof item.course === "object" && item.course !== null) {
      return item.course.session_number || 0;
    }
    return 0;
  };

  // Logic to determine progress
  const getProgress = () => {
    const total = getSessionCount();
    if (currentSession !== undefined) {
        return { current: currentSession, total };
    }
    // Fallback if no specific progress provided (though should be avoided)
    return { current: 0, total };
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
      const { evaluated = 0, total = 0 } = stats || {};
      const percent = total > 0 ? (evaluated / total) * 100 : 0;
      const isComplete = evaluated === total && total > 0;

      return (
        <View style={styles.cardContentCompact}>
            <View style={styles.headerRow}>
                 <View style={[styles.analyticsIconBoxCompact, isComplete && styles.analyticsIconBoxSuccess]}>
                    <Ionicons
                        name={isComplete ? "checkmark-done" : "people"}
                        size={18}
                        color={isComplete ? colors.success : colors.primary}
                    />
                 </View>
                 <View style={styles.headerInfo}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                         <Text style={styles.titleAnCompact} numberOfLines={1}>{item.name}</Text>
                         {/* Badge moved here for compactness */}
                         <View style={[styles.badgeCompact, isComplete ? styles.badgeSuccess : styles.badgeWarning]}>
                            <Text style={[styles.badgeTextCompact, isComplete ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
                                {evaluated}/{total}
                            </Text>
                         </View>
                    </View>
                     <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 2, justifyContent: 'space-between'}}>
                         <Text style={styles.subTitleAnCompact}>{getCourseTitle()}</Text>
                     </View>
                 </View>
            </View>

            {/* Integrated Slim Progress Bar */}
            <View style={styles.barContainerCompact}>
                <View style={[styles.barFillNew, { width: `${percent}%`, backgroundColor: isComplete ? colors.success : colors.warning }]} />
            </View>
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
        style={[styles.container, variant === 'analytical' && styles.containerAnalytics, style]}
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
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  containerAnalytics: {
      padding: 12, // Reduced padding
      paddingVertical: 14,
      borderRadius: 16, // Slightly clearer curve
      marginBottom: 10,
      borderWidth: 0, // Clean look
      shadowColor: colors.primary,
      shadowOpacity: 0.08,
      shadowOffset: {width: 0, height: 4},
  },
  cardContent: {
      gap: 12,
  },
  cardContentCompact: {
      gap: 10,
  },
  headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  headerInfo: {
      flex: 1,
      justifyContent: 'center',
  },
  separator: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginVertical: 4,
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
      backgroundColor: colors.backgroundSecondary,
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

  // Analytical Styles (Modern & Compact)
  analyticsIconBoxCompact: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.lightPrimary + '50',
      alignItems: 'center',
      justifyContent: 'center',
  },
  analyticsIconBoxSuccess: {
      backgroundColor: colors.success + '15',
  },
  titleAnCompact: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      marginRight: 8,
  },
  subTitleAnCompact: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
  },
  badgeCompact: {
     paddingHorizontal: 8,
     paddingVertical: 2,
     borderRadius: 6,
  },
  badgeTextCompact: {
      fontSize: 11,
      fontWeight: '700',
  },
  badgeSuccess: {
     backgroundColor: colors.success + '15',
  },
  badgeWarning: {
     backgroundColor: colors.warning + '15',
  },
  badgeTextSuccess: {
      color: colors.success,
  },
  badgeTextWarning: {
      color: colors.warning,
  },
  barContainerCompact: {
      height: 4,
      backgroundColor: colors.gray[100],
      borderRadius: 2,
      overflow: 'hidden',
      marginTop: 2, // Slight separation from text
  },
  barFillNew: {
      height: '100%',
      borderRadius: 2,
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
