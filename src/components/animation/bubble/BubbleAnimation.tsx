import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, useWindowDimensions, AppState } from "react-native";
import * as Animatable from "react-native-animatable";
import { colors } from "@/src/constants/colors";

interface BubbleProps {
  size: number;
  delay: number;
  duration: number;
  left: number;
  color: string;
  startY: number;
  paused?: boolean;
  driftX?: number;
}

const Bubble: React.FC<BubbleProps> = ({
  size,
  delay,
  duration,
  left,
  color,
  startY,
  paused,
  driftX = 0,
}) => {
  const keyframes = {
    0: {
      transform: [{ translateY: startY }, { translateX: 0 }, { scale: 0.8 }],
      opacity: 0.6,
    },
    0.5: {
      transform: [
        { translateY: startY * 0.4 },
        { translateX: driftX * 0.5 },
        { scale: 1.0 },
      ],
      opacity: 0.85,
    },
    1: {
      transform: [{ translateY: -200 }, { translateX: driftX }, { scale: 1.2 }],
      opacity: 0,
    },
  };

  return (
    <Animatable.View
      animation={paused ? undefined : keyframes}
      iterationCount="infinite"
      duration={duration}
      delay={delay}
      useNativeDriver
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          left,
          backgroundColor: color,
          borderRadius: size / 2,
          transform: [
            { translateY: startY },
            { translateX: 0 },
            { scale: 0.8 },
          ],
          overflow: "hidden",
        },
      ]}
    >
      <View
        style={{
          position: "absolute",
          top: size * 0.1,
          left: size * 0.1,
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: (size * 0.3) / 2,
          backgroundColor: "rgba(255, 255, 255, 0.4)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: size * 0.1,
          right: size * 0.1,
          width: size * 0.4,
          height: size * 0.4,
          borderRadius: (size * 0.4) / 2,
          backgroundColor: "rgba(0, 0, 0, 0.05)",
        }}
      />
    </Animatable.View>
  );
};

interface BubbleAnimationProps {
  bubbleCount?: number;
  paused?: boolean;
  colorsOverride?: string[];
}

const DEFAULT_COLORS = [
  "rgba(255,255,255,0.35)",
  "rgba(255,255,255,0.3)",
  "rgba(255,255,255,0.25)",
  "rgba(255,255,255,0.2)",
  "rgba(240,240,240,0.15)",
];
const BubbleAnimation: React.FC<BubbleAnimationProps> = ({
  bubbleCount = 10,
  paused = false,
  colorsOverride,
}) => {
  const { width, height } = useWindowDimensions();
  const palette = colorsOverride ?? DEFAULT_COLORS;

  const specs = useMemo(() => {
    const arr: Array<Omit<BubbleProps, "paused">> = [];
    for (let i = 0; i < bubbleCount; i++) {
      const size = Math.random() * 20 + 15;
      const delay = Math.random() * 1000 + 500;
      const duration = Math.random() * 9000 + 9000;
      const left = Math.random() * (width - size);
      const color = palette[Math.floor(Math.random() * palette.length)];
      const startY = height + 100 + Math.random() * 150;
      const driftX = Math.random() * 40 - 20;
      arr.push({ size, delay, duration, left, color, startY, driftX });
    }
    return arr;
  }, [bubbleCount, width, height, palette]);

  const appState = useRef(AppState.currentState);
  const [bgPaused, setBgPaused] = React.useState(false);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (
        appState.current.match(/active/) &&
        next.match(/inactive|background/)
      ) {
        setBgPaused(true);
      } else if (next === "active") {
        setBgPaused(false);
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {specs.map((s, idx) => (
        <Bubble key={idx} {...s} paused={paused || bgPaused} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  bubble: {
    position: "absolute",
    shadowColor: colors.white,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
});

export default BubbleAnimation;
