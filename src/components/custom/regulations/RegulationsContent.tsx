import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/src/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
} from "react-native-reanimated";

export interface RegulationItem {
  id: number | string;
  title: string;
  description?: string;
  content?: string;
  children?: RegulationItem[];
}

interface RegulationsContentProps {
  regulations: RegulationItem[];
  introTitle?: string;
  introText?: string;
  footerText?: string;
}

export function RegulationsContent({
  regulations,
  introText = "Dưới đây là các quy định và nội quy cần tuân thủ",
  footerText,
}: RegulationsContentProps) {

  const RenderRuleItem = ({ item, index }: { item: RegulationItem, index: number }) => (
    <Animated.View
        entering={FadeInDown.delay(index * 150).springify().damping(15)}
        style={styles.cardContainer}
    >
        {/* Background Watermark (Big Number) */}
        <View style={styles.watermarkContainer}>
            <Text style={styles.watermarkText}>{(index + 1).toString().padStart(2, '0')}</Text>
        </View>

        {/* Content Layer */}
        <View style={styles.cardContent}>
            {/* Header: Icon + Title */}
            <View style={styles.headerRow}>
                 <LinearGradient
                    colors={[colors.primaryLight, colors.primary]}
                    start={{x:0, y:0}} end={{x:1, y:1}}
                    style={styles.floatingIcon}
                 >
                    <Ionicons name="shield-checkmark-outline" size={16} color={colors.white} />
                 </LinearGradient>

                 <View style={styles.titleWrapper}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                 </View>
            </View>

            {/* Description / Content - Now Full Width or Less Indented */}
            {(item.description || item.content) && (
                 <View style={styles.bodyContent}>
                    {item.description ? <Text style={styles.cardDescription}>{item.description}</Text> : null}
                    {item.content ? <Text style={styles.cardText}>{item.content}</Text> : null}
                 </View>
            )}

             {/* Children as sub-list */}
             {item.children && item.children.length > 0 && (
                <View style={styles.childrenList}>
                    {item.children.map(child => (
                        <View key={child.id} style={styles.childItem}>
                             <View style={styles.childDot} />
                             <View style={{flex: 1}}>
                                 <Text style={styles.childTitle}>{child.title}</Text>
                                 {child.description && <Text style={styles.childText}>{child.description}</Text>}
                                 {child.content && <Text style={styles.childText}>{child.content}</Text>}
                             </View>
                        </View>
                    ))}
                </View>
             )}
        </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Modern Header - Centered & Clean */}
      <View style={styles.headerSection}>
         <View style={styles.headerDecoration} />
         <Text style={styles.screenLabel}>POLICY</Text>
         <Text style={styles.screenTitle}>Nội quy & Quy định</Text>
         <Text style={styles.screenSubtitle}>{introText}</Text>
      </View>

      <View style={styles.listContainer}>
        {regulations.map((item, idx) => (
          <RenderRuleItem key={item.id} item={item} index={idx} />
        ))}
      </View>

      {footerText ? (
        <View style={styles.footerContainer}>
           <Text style={styles.footerText}>{footerText}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 60,
    backgroundColor: '#F8F9FB',
  },

  // Header
  headerSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 10,
  },
  headerDecoration: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.primary,
      marginBottom: 16,
      opacity: 0.3,
  },
  screenLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 2,
      marginBottom: 8,
  },
  screenTitle: {
      fontSize: 26,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
  },
  screenSubtitle: {
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: 'center',
      maxWidth: '80%',
      lineHeight: 20,
  },

  // List
  listContainer: {
      paddingHorizontal: 20,
  },

  // Card Styling
  cardContainer: {
     backgroundColor: colors.white,
     borderRadius: 24,
     marginBottom: 20,
     position: 'relative',
     overflow: 'hidden',
     shadowColor: colors.primary,
     shadowOffset: { width: 0, height: 8 },
     shadowOpacity: 0.08,
     shadowRadius: 16,
     elevation: 6,
     borderWidth: 1,
     borderColor: '#FFFFFF',
  },
  watermarkContainer: {
      position: 'absolute',
      right: -10,
      bottom: -20,
      zIndex: 0,
  },
  watermarkText: {
      fontSize: 120,
      fontWeight: '900',
      color: colors.primary,
      opacity: 0.04,
      fontStyle: 'italic',
  },
  cardContent: {
      zIndex: 1,
      padding: 24,
      paddingBottom: 28,
  },
  headerRow: {
      flexDirection: 'row',
      alignItems: 'center', // Centered vertically for better alignment
      marginBottom: 8, // Reduced gap (was 16)
  },
  floatingIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12, // Reduced gap
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
  },
  titleWrapper: {
      flex: 1,
  },
  cardTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      lineHeight: 24,
  },

  bodyContent: {
      // align with the text start, but less indented than before
      marginTop: 0,
  },
  cardDescription: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22, // Tighter line height
      marginBottom: 6,
      // Removed extensive left padding to allow full width for description if needed
      // Or keep it aligned with title but slightly offset
  },
  cardText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
  },

  // Children
  childrenList: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.03)',
  },
  childItem: {
      flexDirection: 'row',
      marginBottom: 10,
  },
  childDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primaryLight,
      marginTop: 8,
      marginRight: 10,
  },
  childTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
  },
  childText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
  },

  // Footer
  footerContainer: {
    marginTop: 10,
    paddingHorizontal: 40,
    alignItems: 'center',
    opacity: 0.6,
  },
  footerText: {
      textAlign: 'center',
      fontSize: 12,
      color: colors.textTertiary,
  }
});

export default RegulationsContent;
