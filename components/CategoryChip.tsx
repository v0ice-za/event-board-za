import { Animated, Pressable, Text } from 'react-native';

type CategoryChipProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
  /** Optional pulse scale driven by ChipsRow on screen focus (return-from-detail). */
  pulseValue?: Animated.Value;
};

/**
 * Single-select filter chip. Controlled — `isActive`/`onPress` are owned by ChipsRow.
 * Active: accent bg + dark text, no border. Inactive: surface bg + primary text + border.
 */
export function CategoryChip({ label, isActive, onPress, pulseValue }: CategoryChipProps) {
  const containerClass = isActive ? 'bg-accent' : 'bg-surface border border-border';
  const labelClass = isActive ? 'text-background' : 'text-text-primary';

  return (
    <Animated.View
      // Animated pulse transform — documented dynamic-style exception.
      style={pulseValue ? { transform: [{ scale: pulseValue }] } : undefined}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        // Press scale — documented dynamic-style exception (no opacity change).
        style={({ pressed }) => (pressed ? { transform: [{ scale: 0.95 }] } : undefined)}
        className={`min-h-[44px] items-center justify-center rounded-full px-4 ${containerClass}`}
      >
        <Text className={`text-[13px] font-inter-medium ${labelClass}`}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
