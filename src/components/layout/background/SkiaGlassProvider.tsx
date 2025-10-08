import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import {
  Canvas,
  BackdropFilter,
  Blur,
  Image as SkiaImage,
  RoundedRect,
  useImage,
  Group,
  Paint,
} from "@shopify/react-native-skia";

type BlurRegion = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  opacity?: number;
  blur?: number;
  tint?: string;
  strokeColor?: string;
  strokeWidth?: number;
};

type SkiaGlassContextValue = {
  registerRegion: (region: Omit<BlurRegion, "id">) => string;
  updateRegion: (id: string, next: Partial<Omit<BlurRegion, "id">>) => void;
  unregisterRegion: (id: string) => void;
  rootOffset: { x: number; y: number };
  rootRef: React.MutableRefObject<View | null>;
};

const SkiaGlassContext = createContext<SkiaGlassContextValue | null>(null);

export function useSkiaGlass() {
  const ctx = useContext(SkiaGlassContext);
  if (!ctx)
    throw new Error("useSkiaGlass must be used within SkiaGlassProvider");
  return ctx;
}

export const SkiaGlassProvider: React.FC<{
  backgroundUri?: string;
  blurFallback?: number;
  backgroundBlur?: number;
  overlayTint?: string;
  backgroundEdgeStrokeColor?: string;
  backgroundEdgeStrokeWidth?: number;
  backgroundEdgeRadius?: number;
  children: React.ReactNode;
}> = ({
  backgroundUri,
  blurFallback = 10,
  backgroundBlur,
  overlayTint,
  backgroundEdgeStrokeColor,
  backgroundEdgeStrokeWidth = 1,
  backgroundEdgeRadius = 28,
  children,
}) => {
  const { width, height } = Dimensions.get("window");
  const image = useImage(backgroundUri || "");
  const idCounter = useRef(0);
  const [regions, setRegions] = useState<Record<string, BlurRegion>>({});
  const [rootOffset, setRootOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const containerRef = useRef<View | null>(null);

  const registerRegion = useCallback((region: Omit<BlurRegion, "id">) => {
    const id = `r_${idCounter.current++}`;
    setRegions((prev) => ({ ...prev, [id]: { id, ...region } }));
    return id;
  }, []);

  const updateRegion = useCallback(
    (id: string, next: Partial<Omit<BlurRegion, "id">>) => {
      setRegions((prev) =>
        prev[id] ? { ...prev, [id]: { ...prev[id], ...next } } : prev
      );
    },
    []
  );

  const unregisterRegion = useCallback((id: string) => {
    setRegions((prev) => {
      const clone = { ...prev };
      delete clone[id];
      return clone;
    });
  }, []);

  const value = useMemo(
    () => ({
      registerRegion,
      updateRegion,
      unregisterRegion,
      rootOffset,
      rootRef: containerRef,
    }),
    [registerRegion, unregisterRegion, updateRegion, rootOffset]
  );

  // Update root offset continuously
  useEffect(() => {
    const updateOffset = () => {
      containerRef.current?.measureInWindow((x, y) => {
        setRootOffset({ x, y });
      });
    };

    updateOffset();
    const interval = setInterval(updateOffset, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <SkiaGlassContext.Provider value={value}>
      <View style={styles.container}>
        {/* Background layer */}
        <View
          ref={containerRef}
          pointerEvents="none"
          style={styles.backgroundLayer}
          onLayout={() => {
            requestAnimationFrame(() => {
              containerRef.current?.measureInWindow((x, y) =>
                setRootOffset({ x, y })
              );
            });
          }}
        >
          <Canvas style={styles.canvas} pointerEvents="none">
            {/* Background image */}
            {image &&
              (backgroundBlur && backgroundBlur > 0 ? (
                <Group
                  layer={
                    <Paint>
                      <Blur blur={Math.max(0.5, backgroundBlur)} />
                    </Paint>
                  }
                >
                  <SkiaImage
                    image={image}
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    fit="cover"
                  />
                </Group>
              ) : (
                <SkiaImage
                  image={image}
                  x={0}
                  y={0}
                  width={width}
                  height={height}
                  fit="cover"
                />
              ))}

            {/* Overlay tint */}
            {overlayTint && (
              <RoundedRect
                x={0}
                y={0}
                width={width}
                height={height}
                r={0}
                color={overlayTint}
              />
            )}
          </Canvas>
        </View>

        {/* Glass effects layer */}
        <View pointerEvents="none" style={styles.glassLayer}>
          <Canvas style={styles.canvas} pointerEvents="none">
            {/* Glass regions with backdrop filter */}
            {Object.values(regions).map((r) => (
              <BackdropFilter
                key={r.id}
                filter={<Blur blur={r.blur ?? blurFallback} />}
              >
                <RoundedRect
                  x={r.x}
                  y={r.y}
                  width={r.width}
                  height={r.height}
                  r={r.radius ?? 20}
                  color={r.tint ?? "rgba(255,255,255,0.15)"}
                  opacity={r.opacity ?? 0.9}
                />
                {r.strokeColor && r.strokeWidth && (
                  <RoundedRect
                    x={r.x}
                    y={r.y}
                    width={r.width}
                    height={r.height}
                    r={r.radius ?? 20}
                    color={r.strokeColor}
                    style="stroke"
                    strokeWidth={r.strokeWidth}
                  />
                )}
              </BackdropFilter>
            ))}
          </Canvas>
        </View>

        {/* Content layer */}
        <View style={styles.contentLayer}>{children}</View>
      </View>
    </SkiaGlassContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  glassLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  contentLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
});
