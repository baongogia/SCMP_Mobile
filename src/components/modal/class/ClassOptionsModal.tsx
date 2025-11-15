import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { ClassItem } from "@/src/types/schedule";

interface ClassOptionsModalProps {
  visible: boolean;
  classItem: ClassItem | null;
  onClose: () => void;
  onSelectOption: (option: "detail" | "notes" | "updatePassed") => void;
}

export function ClassOptionsModal({
  visible,
  classItem,
  onClose,
  onSelectOption,
}: ClassOptionsModalProps) {
  const menuAnim = useRef(new Animated.Value(0)).current;
  const option1Anim = useRef(new Animated.Value(0)).current;
  const option2Anim = useRef(new Animated.Value(0)).current;
  const option3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && classItem) {
      // Reset animations
      option1Anim.setValue(0);
      option2Anim.setValue(0);
      option3Anim.setValue(0);

      // Open menu - smooth spring animation
      Animated.parallel([
        Animated.spring(menuAnim, {
          toValue: 1,
          tension: 120,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(30),
          Animated.spring(option1Anim, {
            toValue: 1,
            tension: 150,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(60),
          Animated.spring(option2Anim, {
            toValue: 1,
            tension: 150,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(90),
          Animated.spring(option3Anim, {
            toValue: 1,
            tension: 150,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Close menu - smooth fade out
      Animated.parallel([
        Animated.timing(menuAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(option1Anim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(option2Anim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(option3Anim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, classItem, menuAnim, option1Anim, option2Anim, option3Anim]);

  if (!visible || !classItem) return null;

  const translateY = menuAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-8, -2, 0],
  });

  const opacity = menuAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.8, 1],
  });

  const option1Opacity = option1Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.7, 1],
  });

  const option1TranslateX = option1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-15, 0],
  });

  const option2Opacity = option2Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.7, 1],
  });

  const option2TranslateX = option2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-15, 0],
  });

  const option3Opacity = option3Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.7, 1],
  });

  const option3TranslateX = option3Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-15, 0],
  });

  const dividerOpacity = menuAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  return (
    <Animated.View
      style={[
        styles.optionsMenu,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Animated.View
        style={{
          opacity: option1Opacity,
          transform: [{ translateX: option1TranslateX }],
        }}
        pointerEvents="auto"
      >
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => {
            onSelectOption("detail");
            onClose();
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.optionText}>Xem chi tiết</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={{
          opacity: dividerOpacity,
        }}
      >
        <View style={styles.optionDivider} />
      </Animated.View>

      <Animated.View
        style={{
          opacity: option2Opacity,
          transform: [{ translateX: option2TranslateX }],
        }}
        pointerEvents="auto"
      >
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => {
            onSelectOption("notes");
            onClose();
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="document-text-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.optionText}>Xem ghi chú</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={{
          opacity: dividerOpacity,
        }}
      >
        <View style={styles.optionDivider} />
      </Animated.View>

      <Animated.View
        style={{
          opacity: option3Opacity,
          transform: [{ translateX: option3TranslateX }],
        }}
        pointerEvents="auto"
      >
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => {
            onSelectOption("updatePassed");
            onClose();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="trophy-outline" size={20} color={colors.primary} />
          <Text style={styles.optionText}>Cập nhật học viên tốt nghiệp</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  optionsMenu: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: 4,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: colors.shadow || "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 300,
    zIndex: 1001,
    borderWidth: 1.5,
    borderColor: colors.gray[300] || colors.borderLight || "#E5E7EB",
    overflow: "hidden",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  optionText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "500",
    flex: 1,
  },
  optionDivider: {
    height: 1,
    backgroundColor: colors.borderLight || colors.gray[200],
    marginHorizontal: 8,
  },
});
