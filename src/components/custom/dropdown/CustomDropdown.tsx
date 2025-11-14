import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";

interface DropdownItem {
  label: string;
  value: string;
  icon?: string;
}

interface CustomDropdownProps {
  items: DropdownItem[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  icon?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  items,
  selectedValue,
  onValueChange,
  placeholder = "Chọn...",
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [itemAnimations] = useState(() =>
    items.map(() => new Animated.Value(0))
  );

  const selectedItem = items.find((item) => item.value === selectedValue);

  const toggleDropdown = () => {
    if (isAnimating) return; // Prevent multiple animations

    if (isOpen) {
      // Close dropdown with faster, smoother animation
      setIsAnimating(true);
      Animated.parallel([
        Animated.timing(animation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        ...itemAnimations.map((anim) =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
          })
        ),
      ]).start(() => {
        // Only set isOpen to false after animation completes
        setIsOpen(false);
        setIsAnimating(false);
      });
    } else {
      // Open dropdown with spring animation
      setIsOpen(true);
      setIsAnimating(true);
      Animated.parallel([
        Animated.spring(animation, {
          toValue: 1,
          tension: 120,
          friction: 7,
          useNativeDriver: false,
        }),
        ...itemAnimations.map((anim, index) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 180,
            delay: index * 25,
            useNativeDriver: true,
          })
        ),
      ]).start(() => {
        setIsAnimating(false);
      });
    }
  };

  const handleItemSelect = (value: string) => {
    onValueChange(value);
    toggleDropdown();
  };

  const dropdownHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.min(items.length * 56, 280)], // Max height 280
  });

  const dropdownOpacity = animation.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.8, 1],
  });

  const dropdownScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1],
  });

  const arrowRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const buttonElevation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      {/* Main Dropdown Button */}
      <Animated.View style={{ elevation: buttonElevation }}>
        <Pressable
          style={({ pressed }) => [
            styles.dropdownButton,
            isOpen && styles.dropdownButtonOpen,
            pressed && styles.pressedButton,
          ]}
          onPress={toggleDropdown}
          android_ripple={{ color: "rgba(0, 0, 0, 0.1)", radius: 200 }}
        >
          <View style={styles.buttonContent}>
            {icon && (
              <View style={styles.iconContainer}>
                <Ionicons name={icon as any} size={18} color={colors.primary} />
              </View>
            )}
            <Text style={styles.buttonText}>
              {selectedItem ? selectedItem.label : placeholder}
            </Text>
            <Animated.View
              style={[
                styles.arrowContainer,
                { transform: [{ rotate: arrowRotation }] },
              ]}
            >
              <Ionicons
                name="chevron-down"
                size={18}
                color={colors.gray[500]}
              />
            </Animated.View>
          </View>
        </Pressable>
      </Animated.View>

      {/* Dropdown List */}
      {isOpen && (
        <Animated.View
          style={[
            styles.dropdownList,
            {
              height: dropdownHeight,
              opacity: dropdownOpacity,
              transform: [{ scale: dropdownScale }],
            },
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={styles.scrollContent}
          >
            {items.map((item, index) => {
              const itemAnimation = itemAnimations[index];
              const itemTranslateY = itemAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [15, 0],
              });
              const itemOpacity = itemAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.7, 1],
              });

              return (
                <Animated.View
                  key={item.value}
                  style={{
                    transform: [{ translateY: itemTranslateY }],
                    opacity: itemOpacity,
                  }}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      selectedValue === item.value && styles.selectedItem,
                      index === items.length - 1 && styles.lastItem,
                      pressed && styles.pressedItem,
                    ]}
                    onPress={() => handleItemSelect(item.value)}
                    android_ripple={{
                      color: "rgba(0, 0, 0, 0.1)",
                      radius: 200,
                    }}
                  >
                    <View style={styles.itemContent}>
                      {item.icon && (
                        <View
                          style={[
                            styles.itemIconContainer,
                            selectedValue === item.value &&
                              styles.selectedIconContainer,
                          ]}
                        >
                          <Ionicons
                            name={item.icon as any}
                            size={18}
                            color={
                              selectedValue === item.value
                                ? colors.primary
                                : colors.gray[600]
                            }
                          />
                        </View>
                      )}
                      <Text
                        style={[
                          styles.itemText,
                          selectedValue === item.value &&
                            styles.selectedItemText,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {selectedValue === item.value && (
                        <View style={styles.checkContainer}>
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color={colors.primary}
                          />
                        </View>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },
  dropdownButton: {
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.12)",
  },
  dropdownButtonOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderColor: "rgba(59, 130, 246, 0.4)",
    borderBottomColor: "transparent",
  },
  pressedButton: {
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    transform: [{ scale: 0.99 }],
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  buttonText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[900],
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  arrowContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownList: {
    position: "absolute",
    overflow: "hidden",
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.12)",
    borderTopWidth: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
    backgroundColor: "rgba(255, 255, 255, 1)",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  selectedItem: {
    backgroundColor: "rgba(59, 130, 246, 0.08)",
  },
  pressedItem: {
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    transform: [{ scale: 0.99 }],
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemIconContainer: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedIconContainer: {
    // No background for modern minimal design
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[800],
    fontWeight: "400",
    letterSpacing: 0.05,
  },
  selectedItemText: {
    color: colors.primary,
    fontWeight: "600",
  },
  checkContainer: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
