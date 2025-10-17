import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/src/constants/colors";
import { useNavigation } from "@react-navigation/native";

interface SharedHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
  backgroundColor?: string;
  titleColor?: string;
}

export const SharedHeader: React.FC<SharedHeaderProps> = ({
  title,
  subtitle,
  showBackButton = true,
  rightComponent,
  onBackPress,
  backgroundColor = colors.primary,
  titleColor = colors.white,
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.headerContent}>
        {showBackButton ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color={titleColor} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: titleColor }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.rightContainer}>
          {rightComponent || <View style={styles.placeholder} />}
        </View>
      </View>
      {/* Rounded overlap onto page content */}
      <View style={styles.bottomCurve} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: colors.black,
    position: "relative",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingBottom: 20,
    minHeight: 40,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.8,
    marginTop: 2,
  },
  rightContainer: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    width: 20,
    height: 20,
  },
  bottomCurve: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -4,
    height: 18,
    backgroundColor: colors.mainBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
