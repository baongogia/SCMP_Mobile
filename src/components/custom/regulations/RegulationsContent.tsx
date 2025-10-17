import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "@/src/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
  FadeIn,
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
  introTitle = "Nội quy và quy định",
  introText = "Dưới đây là các quy định và nội quy cần tuân thủ",
  footerText,
}: RegulationsContentProps) {
  const TreeNode: React.FC<{
    item: RegulationItem;
    level: number;
    index?: number;
  }> = ({ item, level, index }) => {
    const [expanded, setExpanded] = React.useState<boolean>(level < 1); // auto expand top level

    // Use shared value to avoid Android parsing "[object Object]deg" in rotate
    const rotationDeg = useSharedValue(expanded ? 180 : 0);
    React.useEffect(() => {
      rotationDeg.value = withSpring(expanded ? 180 : 0);
    }, [expanded, rotationDeg]);

    const chevronStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotationDeg.value}deg` }],
    }));

    const cardStyle = useAnimatedStyle(() => ({
      transform: [
        {
          scale: withSpring(expanded ? 1.02 : 1, {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
    }));

    const getBadgeGradient = (): [string, string] => {
      if (level === 0) {
        return [colors.primary, colors.primaryDark];
      } else if (level === 1) {
        return [colors.secondary, colors.secondaryDark];
      } else {
        return [colors.accent, colors.accentDark];
      }
    };

    return (
      // Outer wrapper runs layout animation only
      <Animated.View
        entering={FadeInDown.delay(index ? index * 100 : 0)}
        layout={Layout.springify()}
        style={[
          level > 0 && {
            marginLeft: 12 * Math.min(level, 3),
            marginTop: 8,
          },
        ]}
      >
        {/* Inner wrapper applies transform (scale) and card styles */}
        <Animated.View
          style={[
            cardStyle,
            styles.regulationCard,
            level === 0 && styles.topLevelCard,
          ]}
        >
          <TouchableOpacity
            style={[
              styles.regulationHeader,
              level === 0 && styles.topLevelHeader,
            ]}
            activeOpacity={0.7}
            onPress={() => setExpanded((v) => !v)}
          >
            <LinearGradient
              colors={getBadgeGradient()}
              style={[styles.numberBadge, level === 0 && styles.topLevelBadge]}
            >
              {level === 0 ? (
                <Text style={[styles.numberText, styles.topLevelNumberText]}>
                  {(index || 0) + 1}
                </Text>
              ) : level === 1 ? (
                <Ionicons name="ellipse" size={8} color={colors.white} />
              ) : (
                <Ionicons name="remove" size={12} color={colors.white} />
              )}
            </LinearGradient>

            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.regulationTitle,
                  level === 0 && styles.topLevelTitle,
                  level === 1 && styles.secondLevelTitle,
                ]}
              >
                {item.title}
              </Text>
              {item.description && (
                <Text style={styles.regulationDescription}>
                  {item.description}
                </Text>
              )}
            </View>

            {item.children && item.children.length > 0 ? (
              <Animated.View style={chevronStyle}>
                <Ionicons
                  name="chevron-down"
                  size={level === 0 ? 24 : 20}
                  color={level === 0 ? colors.primary : colors.textSecondary}
                />
              </Animated.View>
            ) : null}
          </TouchableOpacity>

          {!!item.content && expanded && (
            <Animated.Text
              entering={FadeIn.delay(200)}
              style={[
                styles.regulationContent,
                level === 0 && styles.topLevelContent,
              ]}
            >
              {item.content}
            </Animated.Text>
          )}

          {item.children && item.children.length > 0 && expanded && (
            <Animated.View
              entering={FadeIn.delay(300)}
              style={[
                styles.childrenContainer,
                level === 0 && styles.topLevelChildrenContainer,
              ]}
            >
              {item.children.map((child, idx) => (
                <TreeNode
                  key={child.id}
                  item={child}
                  level={level + 1}
                  index={idx}
                />
              ))}
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
    );
  };

  const renderTree = (items: RegulationItem[], level = 0) => {
    return items.map((item, idx) => (
      <TreeNode key={item.id} item={item} level={level} index={idx} />
    ));
  };

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInDown.delay(100)}
        style={styles.introContainer}
      >
        <LinearGradient
          colors={[colors.primaryLight, colors.primary]}
          style={styles.introGradient}
        >
          <Ionicons name="document-text" size={32} color={colors.white} />
          <Text style={styles.introTitle}>{introTitle}</Text>
          <Text style={styles.introText}>{introText}</Text>
        </LinearGradient>
      </Animated.View>

      <View style={styles.regulationsContainer}>{renderTree(regulations)}</View>

      {footerText ? (
        <Animated.View
          entering={FadeInDown.delay(500)}
          style={styles.footerContainer}
        >
          <Text style={styles.footerText}>{footerText}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  introContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  introGradient: {
    padding: 16,
    alignItems: "center",
  },
  introTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
    marginTop: 8,
    marginBottom: 6,
    textAlign: "center",
  },
  introText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 18,
  },
  regulationsContainer: {
    paddingHorizontal: 16,
  },
  regulationCard: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: "hidden",
  },
  topLevelCard: {
    marginBottom: 12,
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  regulationHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingBottom: 8,
  },
  topLevelHeader: {
    paddingVertical: 16,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  topLevelBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 16,
  },
  numberText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  topLevelNumberText: {
    fontSize: 14,
    fontWeight: "800",
  },
  titleContainer: {
    flex: 1,
  },
  regulationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 20,
  },
  topLevelTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  secondLevelTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  regulationDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
    fontStyle: "italic",
  },
  regulationContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  topLevelContent: {
    fontSize: 13,
    color: colors.text,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  childrenContainer: {
    paddingBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    marginLeft: 12,
  },
  topLevelChildrenContainer: {
    borderLeftWidth: 0,
    marginLeft: 0,
    paddingBottom: 0,
  },
  footerContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.backgroundTertiary,
    alignItems: "center",
  },
  footerText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    fontStyle: "italic",
  },
});

export default RegulationsContent;
