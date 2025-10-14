import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

interface BlurWrapperProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: "light" | "dark" | "default";
  backgroundColor?: string;
  style?: ViewStyle;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  padding?: number;
  margin?: number;
}

export const BlurWrapper: React.FC<BlurWrapperProps> = ({
  children,
  intensity = 35,
  tint = "light",
  backgroundColor = "rgba(255,255,255,0.08)",
  style,
  borderRadius = 0,
  borderWidth = 0,
  borderColor = "rgba(255, 255, 255, 0.2)",
  padding = 0,
  margin = 0,
}) => {
  return (
    <View 
      style={[
        styles.container,
        {
          borderRadius,
          borderWidth,
          borderColor,
          padding,
          margin,
        },
        style,
      ]}
    >
      {/* Blur Background */}
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[
          StyleSheet.absoluteFillObject,
          { borderRadius }
        ]}
      >
        {/* Optional translucent tint to increase contrast */}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor,
            borderRadius,
          }}
        />
      </BlurView>

      {/* Content */}
      <View style={[styles.content, { zIndex: 1 }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  content: {
    position: "relative",
  },
});

// Preset configurations for common use cases
export const BlurPresets = {
  // Header-like blur
  header: {
    intensity: 35,
    tint: "light" as const,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  
  // Card-like blur
  card: {
    intensity: 25,
    tint: "light" as const,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    padding: 16,
  },
  
  // Modal-like blur
  modal: {
    intensity: 50,
    tint: "dark" as const,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 20,
  },
  
  // Button-like blur
  button: {
    intensity: 20,
    tint: "light" as const,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    padding: 12,
  },
  
  // Dark theme blur
  dark: {
    intensity: 40,
    tint: "dark" as const,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
};

// Convenience components using presets
export const BlurCard: React.FC<Omit<BlurWrapperProps, 'intensity' | 'tint' | 'backgroundColor' | 'borderRadius' | 'borderWidth' | 'borderColor' | 'padding'> & { preset?: keyof typeof BlurPresets }> = ({ 
  children, 
  preset = 'card', 
  ...props 
}) => {
  return (
    <BlurWrapper {...BlurPresets[preset]} {...props}>
      {children}
    </BlurWrapper>
  );
};

export const BlurButton: React.FC<Omit<BlurWrapperProps, 'intensity' | 'tint' | 'backgroundColor' | 'borderRadius' | 'borderWidth' | 'borderColor' | 'padding'> & { preset?: keyof typeof BlurPresets }> = ({ 
  children, 
  preset = 'button', 
  ...props 
}) => {
  return (
    <BlurWrapper {...BlurPresets[preset]} {...props}>
      {children}
    </BlurWrapper>
  );
};

export const BlurModal: React.FC<Omit<BlurWrapperProps, 'intensity' | 'tint' | 'backgroundColor' | 'borderRadius' | 'borderWidth' | 'borderColor' | 'padding'> & { preset?: keyof typeof BlurPresets }> = ({ 
  children, 
  preset = 'modal', 
  ...props 
}) => {
  return (
    <BlurWrapper {...BlurPresets[preset]} {...props}>
      {children}
    </BlurWrapper>
  );
};
