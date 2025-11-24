import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, Dimensions, Easing } from "react-native";
import { colors } from "@/src/constants/colors";

interface FireworkParticle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
}

interface FireworksAnimationProps {
  visible: boolean;
  onComplete?: () => void;
  position?: { x: number; y: number };
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const FIREWORK_COLORS = [
  colors.primary,
  "#FFD700", // Gold
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#F7DC6F", // Yellow
];

const FireworksAnimation: React.FC<FireworksAnimationProps> = ({
  visible,
  onComplete,
  position,
}) => {
  const [particles, setParticles] = useState<FireworkParticle[]>([]);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const burstCountRef = useRef(0);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    // Stop any running animation first
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    if (!visible) {
      setParticles([]);
      burstCountRef.current = 0;
      isAnimatingRef.current = false;
      return;
    }

    // Prevent multiple animations from running simultaneously
    if (isAnimatingRef.current) {
      return;
    }

    isAnimatingRef.current = true;

    const centerX = position?.x ?? SCREEN_WIDTH / 2;
    const centerY = position?.y ?? SCREEN_HEIGHT / 2 - 100;

    // First burst
    const firstBurstCount = 12;
    const secondBurstCount = 8;
    const newParticles: FireworkParticle[] = [];

    // First burst particles
    for (let i = 0; i < firstBurstCount; i++) {
      const color =
        FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
      const size = 6 + Math.random() * 3;

      newParticles.push({
        id: burstCountRef.current * 1000 + i,
        x: new Animated.Value(centerX),
        y: new Animated.Value(centerY),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(0),
        color,
        size,
      });
    }

    // Second burst particles (smaller, delayed)
    for (let i = 0; i < secondBurstCount; i++) {
      const color =
        FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
      const size = 5 + Math.random() * 2;

      newParticles.push({
        id: burstCountRef.current * 1000 + firstBurstCount + i,
        x: new Animated.Value(centerX),
        y: new Animated.Value(centerY),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(0),
        color,
        size,
      });
    }

    burstCountRef.current++;
    setParticles(newParticles);

    // Animation for particles
    const animations = newParticles.map((particle, index) => {
      const isSecondBurst = index >= firstBurstCount;
      const particleCount = isSecondBurst ? secondBurstCount : firstBurstCount;
      const particleIndex = isSecondBurst ? index - firstBurstCount : index;

      const angle = (Math.PI * 2 * particleIndex) / particleCount;
      const distance = isSecondBurst
        ? 80 + Math.random() * 40 // Second burst goes further
        : 60 + Math.random() * 30; // First burst
      const targetX = centerX + Math.cos(angle) * distance;
      const targetY = centerY + Math.sin(angle) * distance;
      const duration = isSecondBurst ? 500 : 600;
      const delay = isSecondBurst ? 200 : 0; // Second burst delayed

      return Animated.parallel([
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(particle.x, {
              toValue: targetX,
              duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(particle.y, {
              toValue: targetY,
              duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(particle.scale, {
            toValue: 1,
            duration: 100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0.5,
            duration: duration - 100,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(delay + duration * 0.5),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: duration * 0.5,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    animationRef.current = Animated.parallel(animations);
    animationRef.current.start((finished) => {
      isAnimatingRef.current = false;
      if (finished && onComplete) {
        setTimeout(() => {
          onComplete();
        }, 200);
      }
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      isAnimatingRef.current = false;
    };
  }, [visible, position, onComplete]);

  if (!visible || particles.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => {
        const offsetX = particle.size / 2;
        const offsetY = particle.size / 2;

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particleWrapper,
              {
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.particle,
                {
                  backgroundColor: particle.color,
                  width: particle.size,
                  height: particle.size,
                  borderRadius: particle.size / 2,
                  marginLeft: -offsetX,
                  marginTop: -offsetY,
                  transform: [{ scale: particle.scale }],
                  opacity: particle.opacity,
                },
              ]}
            />
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  particleWrapper: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  particle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default FireworksAnimation;
