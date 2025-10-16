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
            marginLeft: 16 * Math.min(level, 3),
            marginTop: 12,
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

            <Text
              style={[
                styles.regulationTitle,
                level === 0 && styles.topLevelTitle,
                level === 1 && styles.secondLevelTitle,
              ]}
            >
              {item.title}
            </Text>

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
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  introGradient: {
    padding: 24,
    alignItems: "center",
  },
  introTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.white,
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  introText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 24,
  },
  regulationsContainer: {
    paddingHorizontal: 20,
  },
  regulationCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: "hidden",
  },
  topLevelCard: {
    marginBottom: 20,
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  regulationHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  topLevelHeader: {
    paddingVertical: 24,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  topLevelBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 20,
  },
  numberText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  topLevelNumberText: {
    fontSize: 18,
    fontWeight: "800",
  },
  regulationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 22,
  },
  topLevelTitle: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  secondLevelTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  regulationContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  topLevelContent: {
    fontSize: 16,
    color: colors.text,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  childrenContainer: {
    paddingBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    marginLeft: 20,
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
