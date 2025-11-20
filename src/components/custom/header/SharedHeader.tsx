import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/src/constants/colors";
import { useNavigation } from "@react-navigation/native";

interface SharedHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
  backgroundColor?: string;
  titleColor?: string;
  bottomCurve?: boolean;
  bottomCurveColor?: string;
  backgroundImageUrl?: string;
}

export const SharedHeader: React.FC<SharedHeaderProps> = ({
  title,
  subtitle,
  showBackButton = true,
  rightComponent,
  onBackPress,
  backgroundColor = colors.primary,
  titleColor = colors.white,
  bottomCurve = true,
  bottomCurveColor = colors.mainBackground,
  backgroundImageUrl,
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
      {backgroundImageUrl ? (
        <>
          <Image
            source={{ uri: backgroundImageUrl }}
            style={styles.headerBackgroundImage}
            resizeMode="cover"
          />
          {/* <View style={styles.headerOverlay} /> */}
        </>
      ) : null}

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
        {!rightComponent ? (
          <View style={styles.rightContainer}>
            <View style={styles.placeholder} />
          </View>
        ) : (
          <View>{rightComponent}</View>
        )}
      </View>
      {/* Rounded overlap onto page content */}
      {bottomCurve && (
        <View
          style={[styles.bottomCurve, { backgroundColor: bottomCurveColor }]}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: colors.black,
    position: "relative",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingBottom: 20,
    minHeight: 40,
    position: "relative",
    zIndex: 2,
  },
  headerBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  // headerOverlay: {
  //   ...StyleSheet.absoluteFillObject,
  //   backgroundColor: "rgba(0, 0, 0, 0.15)",
  //   zIndex: 1,
  // },
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
