import { useCallback, useState } from 'react';
import { Animated, ScrollView, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { CATEGORY_VALUES } from '@/constants/categories';
import type { Category } from '@/types';

import { CategoryChip } from './CategoryChip';

type ChipsRowProps = {
  activeCategory: Category | null;
  onSelect: (category: Category | null) => void;
};

/**
 * Horizontal single-select filter row: a pinned "All" chip (never scrolls off) plus the
 * 8 category chips in a horizontal ScrollView. Controlled via activeCategory + onSelect.
 * On screen focus with an active category filter, the active chip plays a 200ms scale pulse.
 */
export function ChipsRow({ activeCategory, onSelect }: ChipsRowProps) {
  // Lazy init — never useRef(new Animated.Value()).current (react-hooks/refs).
  const [pulse] = useState(() => new Animated.Value(1));

  useFocusEffect(
    useCallback(() => {
      // Pulse the active filter chip when returning to the feed (e.g. from detail).
      if (activeCategory !== null) {
        // Cancel any prior run before restarting so overlapping sequences can't stutter.
        pulse.stopAnimation();
        pulse.setValue(1);
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.05, duration: 100, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
      }
      // Stop any in-flight pulse on blur/unmount so it never animates a detached node.
      return () => pulse.stopAnimation();
    }, [activeCategory, pulse]),
  );

  return (
    <View className="flex-row items-center">
      <View className="mr-2">
        <CategoryChip
          label="All"
          isActive={activeCategory === null}
          onPress={() => onSelect(null)}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        {CATEGORY_VALUES.map((category) => (
          <View key={category} className="mr-2">
            <CategoryChip
              label={category}
              isActive={activeCategory === category}
              onPress={() => onSelect(category)}
              pulseValue={activeCategory === category ? pulse : undefined}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
