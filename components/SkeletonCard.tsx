import { useEffect, useState } from 'react';
import { Animated } from 'react-native';

/**
 * Loading placeholder matching EventCard dimensions exactly (~200px, full width) for a
 * seamless skeleton→card transition. A border-coloured (#2A2420) shimmer pulses its
 * opacity 0.3→0.6→0.3 over a 1.2s loop on top of the surface (#1C1814) background.
 */
export function SkeletonCard() {
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
    <Animated.View
      accessibilityLabel="Loading events"
      className="h-[200px] w-full overflow-hidden bg-surface"
    >
      <Animated.View
        importantForAccessibility="no"
        // Animated opacity is a runtime-driven value — the documented dynamic-style exception.
        style={{ opacity }}
        className="absolute inset-0 bg-border"
      />
    </Animated.View>
  );
}
