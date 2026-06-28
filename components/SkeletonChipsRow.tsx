import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

// Varied pill widths so the cold-load row reads as chips, not a single bar.
const PILL_WIDTHS = ['w-12', 'w-16', 'w-20', 'w-16', 'w-20'];

/**
 * Cold-load placeholder for ChipsRow: a row of rounded shimmer pills at chip height,
 * shown only on the initial feed load (Story 2.6 AC #5 — "chips also show skeleton
 * shimmer"). Reuses SkeletonCard's shimmer: a border-coloured (#2A2420) overlay pulses
 * opacity 0.3→0.6→0.3 over a 1.2s loop on top of the surface (#1C1814) pill background.
 */
export function SkeletonChipsRow() {
  // Lazy state init creates the Animated.Value once without reading a ref during render.
  const [opacity] = useState(() => new Animated.Value(0.3));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View accessibilityLabel="Loading filters" className="flex-row items-center">
      {PILL_WIDTHS.map((width, i) => (
        <View
          key={i}
          testID="skeleton-chip-pill"
          className={`mr-2 h-11 ${width} overflow-hidden rounded-full bg-surface`}
        >
          <Animated.View
            importantForAccessibility="no"
            // Animated opacity is a runtime-driven value — the documented dynamic-style exception.
            style={{ opacity }}
            className="absolute inset-0 bg-border"
          />
        </View>
      ))}
    </View>
  );
}
