import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { colors } from "@/src/constants/colors";

interface FireworkParticle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
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
  "#FFA07A", // Light Salmon
  "#98D8C8", // Mint
  "#F7DC6F", // Yellow
];

const FireworksAnimation: React.FC<FireworksAnimationProps> = ({
  visible,
  onComplete,
  position,
}) => {
  const [particles, setParticles] = useState<FireworkParticle[]>([]);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!visible) {
      // Reset particles when not visible
      setParticles([]);
      return;
    }

    // Create particles for fireworks
    const centerX = position?.x ?? SCREEN_WIDTH / 2;
    const centerY = position?.y ?? SCREEN_HEIGHT / 2 - 100;

    const particleCount = 30;
    const newParticles: FireworkParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const color =
        FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];

      newParticles.push({
        id: i,
        x: new Animated.Value(centerX),
        y: new Animated.Value(centerY),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(0.5),
        color,
      });
    }

    setParticles(newParticles);

    // Animate particles
    const animations = newParticles.map((particle, index) => {
      const angle = (Math.PI * 2 * index) / particleCount;
      const distance = 80 + Math.random() * 60;
      const targetX = centerX + Math.cos(angle) * distance;
      const targetY = centerY + Math.sin(angle) * distance;

      return Animated.parallel([
        Animated.timing(particle.x, {
          toValue: targetX,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: targetY,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(particle.scale, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0.8,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    animationRef.current = Animated.parallel(animations);
    animationRef.current.start(() => {
      if (onComplete) {
        onComplete();
      }
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [visible, position, onComplete]);

  if (!visible || particles.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              backgroundColor: particle.color,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  particle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default FireworksAnimation;
