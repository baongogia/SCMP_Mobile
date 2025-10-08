import React, { useEffect, useMemo, useRef } from "react";
import {
  LayoutChangeEvent,
  StyleProp,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";
import { useSkiaGlass } from "./SkiaGlassProvider";

type GlassViewProps = ViewProps & {
  radius?: number;
  opacity?: number;
  blur?: number;
  tint?: string;
  strokeColor?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

export const GlassView: React.FC<GlassViewProps> = ({
  radius = 20,
  opacity = 0.9,
  blur,
  tint,
  strokeColor = "rgba(255,255,255,0.35)",
  strokeWidth = 1,
  style,
  onLayout,
  children,
  ...rest
}) => {
  const { registerRegion, updateRegion, unregisterRegion, rootOffset } =
    useSkiaGlass();
  const regionIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (regionIdRef.current) unregisterRegion(regionIdRef.current);
    };
  }, [unregisterRegion]);

  const mergedStyle = useMemo(
    () => [{ borderRadius: radius }, style],
    [radius, style]
  );

  const handleLayout = (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    const absX = x + rootOffset.x;
    const absY = y + rootOffset.y;
    if (!regionIdRef.current) {
      regionIdRef.current = registerRegion({
        x: absX,
        y: absY,
        width,
        height,
        radius,
        opacity,
        blur,
        tint,
        strokeColor,
        strokeWidth,
      });
    } else {
      updateRegion(regionIdRef.current, {
        x: absX,
        y: absY,
        width,
        height,
        radius,
        opacity,
        blur,
        tint,
        strokeColor,
        strokeWidth,
      });
    }
    onLayout?.(e);
  };

  return (
    <View style={mergedStyle} onLayout={handleLayout} {...rest}>
      {children}
    </View>
  );
};

export default GlassView;
