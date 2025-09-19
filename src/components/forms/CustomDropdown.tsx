import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { dimensions } from "@/src/constants/dimensions";

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
  const [animation] = useState(new Animated.Value(0));

  const selectedItem = items.find((item) => item.value === selectedValue);

  const toggleDropdown = () => {
    if (isOpen) {
      // Close dropdown
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setIsOpen(false));
    } else {
      // Open dropdown
      setIsOpen(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleItemSelect = (value: string) => {
    onValueChange(value);
    toggleDropdown();
  };

  const dropdownHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.min(items.length * 60, 240)], // Max height 240
  });

  const dropdownOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const arrowRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={styles.container}>
      {/* Main Dropdown Button */}
      <TouchableOpacity
        style={[styles.dropdownButton, isOpen && styles.dropdownButtonOpen]}
        onPress={toggleDropdown}
        activeOpacity={0.8}
      >
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color={colors.primary}
            style={styles.buttonIcon}
          />
        )}
        <Text style={styles.buttonText}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
          <Ionicons name="chevron-down" size={20} color={colors.gray[600]} />
        </Animated.View>
      </TouchableOpacity>

      {/* Dropdown List */}
      {isOpen && (
        <Animated.View
          style={[
            styles.dropdownList,
            {
              height: dropdownHeight,
              opacity: dropdownOpacity,
            },
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {items.map((item, index) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.dropdownItem,
                  selectedValue === item.value && styles.selectedItem,
                  index === items.length - 1 && styles.lastItem,
                ]}
                onPress={() => handleItemSelect(item.value)}
                activeOpacity={0.7}
              >
                {item.icon && (
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={
                      selectedValue === item.value
                        ? colors.primary
                        : colors.gray[600]
                    }
                    style={styles.itemIcon}
                  />
                )}
                <Text
                  style={[
                    styles.itemText,
                    selectedValue === item.value && styles.selectedItemText,
                  ]}
                >
                  {item.label}
                </Text>
                {selectedValue === item.value && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={colors.primary}
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: dimensions.borderRadius.lg,
    paddingHorizontal: dimensions.spacing.md,
    height: dimensions.inputHeight.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownButtonOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowOpacity: 0.25,
  },
  buttonIcon: {
    marginRight: dimensions.spacing.sm,
  },
  buttonText: {
    flex: 1,
    fontSize: dimensions.fontSize.md,
    color: colors.gray[800],
    fontWeight: "500",
  },
  dropdownList: {
    position: "absolute",
    top: dimensions.inputHeight.lg,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomLeftRadius: dimensions.borderRadius.lg,
    borderBottomRightRadius: dimensions.borderRadius.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
    minHeight: 50,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  selectedItem: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  itemIcon: {
    marginRight: dimensions.spacing.sm,
  },
  itemText: {
    flex: 1,
    fontSize: dimensions.fontSize.md,
    color: colors.gray[700],
    fontWeight: "400",
  },
  selectedItemText: {
    color: colors.primary,
    fontWeight: "600",
  },
  checkIcon: {
    marginLeft: dimensions.spacing.sm,
  },
});
