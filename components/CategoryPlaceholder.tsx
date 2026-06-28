import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { CATEGORY_PLACEHOLDERS, FALLBACK_PLACEHOLDER } from '@/constants/categories';
import type { Category } from '@/types';

/**
 * Full-bleed designed fallback for events without an image. Renders the
 * category-specific gradient + centred emoji from CATEGORY_PLACEHOLDERS.
 * Decorative only — the accessible label is carried by the parent Pressable
 * (EventCard, Story 2.2). Fills its parent (EventCard supplies the dimensions).
 */
export function CategoryPlaceholder({ category }: { category: Category }) {
  // `category` is type-safe at compile time, but event data originates from external
  // feeds — fall back to a neutral placeholder for any unmapped category at runtime.
  const { colors, emoji } = CATEGORY_PLACEHOLDERS[category] ?? FALLBACK_PLACEHOLDER;

  return (
    <LinearGradient
      colors={colors}
      accessible={false}
      className="absolute inset-0 items-center justify-center"
    >
      <Text accessible={false} className="text-[32px]">
        {emoji}
      </Text>
    </LinearGradient>
  );
}
